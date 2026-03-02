#!/usr/bin/env python3
"""
Try replacing existing album covers with NetEase (126) covers where confident matches exist.

Behavior:
- Iterate albums in DB.
- Skip albums already tagged as NetEase local cover (*_126.*).
- Search NetEase album API by "artist + album title".
- If confidence is high enough, download image to local disk and update cover_url.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import time
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Dict, List, Optional


MYSQL_HOST = "127.0.0.1"
MYSQL_PORT = "3306"
MYSQL_USER = "root"
MYSQL_PASS = "Huanzc304"
MYSQL_DB = "music_review"

NETEASE_SEARCH = "https://music.163.com/api/search/get"
UPLOAD_DIR = Path("/opt/music-review/uploads/album-covers")
PUBLIC_PREFIX = "/api/files/album-covers"


def sql_quote(value: Optional[object]) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value).replace("\\", "\\\\").replace("'", "''")
    return f"'{s}'"


def run_mysql(query: str) -> List[str]:
    cmd = [
        "mysql",
        "-h",
        MYSQL_HOST,
        "-P",
        MYSQL_PORT,
        "-u",
        MYSQL_USER,
        f"-p{MYSQL_PASS}",
        "-N",
        "-B",
        "-e",
        query,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip())
    return [line for line in proc.stdout.splitlines() if line.strip()]


def normalize(text: str) -> str:
    return re.sub(r"[^a-z0-9\u4e00-\u9fa5]+", "", (text or "").lower())


def get_albums(limit: int = 0) -> List[Dict[str, object]]:
    limit_sql = f"LIMIT {int(limit)}" if limit and limit > 0 else ""
    q = f"""
USE {MYSQL_DB};
SELECT al.id, al.title, ar.name, COALESCE(al.cover_url, '')
FROM albums al
JOIN artists ar ON ar.id = al.artist_id
ORDER BY al.id
{limit_sql};
"""
    rows = run_mysql(q)
    out = []
    for row in rows:
        parts = row.split("\t")
        if len(parts) < 4:
            continue
        out.append(
            {
                "id": int(parts[0]),
                "title": parts[1],
                "artist": parts[2],
                "cover_url": parts[3],
            }
        )
    return out


def is_already_netease_local(url: str) -> bool:
    return bool(url) and "_126." in url and url.startswith(f"{PUBLIC_PREFIX}/")


def is_already_netease_remote(url: str) -> bool:
    u = (url or "").strip().lower()
    return u.startswith("http") and ("music.126.net" in u or "music.126." in u)


def netease_album_search(artist: str, album: str, timeout: float = 30.0) -> List[Dict]:
    params = urllib.parse.urlencode(
        {
            "s": f"{artist} {album}",
            "type": 10,
            "offset": 0,
            "total": "true",
            "limit": 20,
        }
    )
    req = urllib.request.Request(
        f"{NETEASE_SEARCH}?{params}",
        headers={
            "Accept": "application/json",
            "Referer": "https://music.163.com/",
            "User-Agent": "Mozilla/5.0",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return (data.get("result") or {}).get("albums") or []


def pick_best_netease_cover(artist: str, title: str, items: List[Dict]) -> Optional[str]:
    ta = normalize(artist)
    tt = normalize(title)
    best_url = None
    best_score = -1
    for row in items:
        name = normalize(str(row.get("name") or ""))
        artist_obj = row.get("artist") or {}
        aname = normalize(str(artist_obj.get("name") or ""))
        pic = str(row.get("picUrl") or "").strip()
        if not pic:
            continue

        score = 0
        if tt and name == tt:
            score += 9
        elif tt and (tt in name or name in tt):
            score += 5

        if ta and aname == ta:
            score += 8
        elif ta and (ta in aname or aname in ta):
            score += 4

        if score > best_score:
            best_score = score
            best_url = pic

    # Need at least one strong dimension match.
    if best_score < 8:
        return None
    if best_url and best_url.startswith("http://"):
        return "https://" + best_url[len("http://") :]
    return best_url


def ext_from_content_type(ct: str) -> str:
    c = (ct or "").lower()
    if "png" in c:
        return ".png"
    if "webp" in c:
        return ".webp"
    if "gif" in c:
        return ".gif"
    return ".jpg"


def download_to_local(album_id: int, remote_url: str, timeout: float = 30.0) -> Optional[str]:
    req = urllib.request.Request(
        remote_url,
        headers={"Referer": "https://music.163.com/", "User-Agent": "Mozilla/5.0"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        content = resp.read()
        if not content:
            return None
        ext = ext_from_content_type(resp.headers.get("Content-Type", ""))

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"album_{album_id}_126{ext}"
    path = UPLOAD_DIR / filename
    with open(path, "wb") as f:
        f.write(content)
    return f"{PUBLIC_PREFIX}/{filename}"


def update_cover(album_id: int, cover_url: str) -> None:
    q = f"USE {MYSQL_DB}; UPDATE albums SET cover_url={sql_quote(cover_url)} WHERE id={album_id};"
    run_mysql(q)


def main() -> int:
    parser = argparse.ArgumentParser(description="Replace album covers with NetEase (126) covers when possible.")
    parser.add_argument("--limit", type=int, default=0, help="Max albums to process (0 = all)")
    parser.add_argument("--sleep", type=float, default=0.12, help="Sleep seconds between albums")
    parser.add_argument(
        "--write-mode",
        choices=["local", "remote-url"],
        default="local",
        help="Cover write mode: local file URL or direct NetEase remote URL",
    )
    parser.add_argument("--dry-run", action="store_true", help="Only print planned changes")
    args = parser.parse_args()

    albums = get_albums(limit=args.limit)
    print(f"Albums loaded: {len(albums)}")

    changed = 0
    skipped = 0
    failed = 0
    no_match = 0

    for idx, row in enumerate(albums, start=1):
        album_id = int(row["id"])
        title = str(row["title"])
        artist = str(row["artist"])
        cover_url = str(row.get("cover_url") or "")

        if args.write_mode == "local" and is_already_netease_local(cover_url):
            skipped += 1
            continue
        if args.write_mode == "remote-url" and is_already_netease_remote(cover_url):
            skipped += 1
            continue

        try:
            candidates = netease_album_search(artist, title)
            url = pick_best_netease_cover(artist, title, candidates)
            if not url:
                no_match += 1
            else:
                if args.dry_run:
                    changed += 1
                else:
                    if args.write_mode == "remote-url":
                        update_cover(album_id, url)
                        changed += 1
                    else:
                        local = download_to_local(album_id, url)
                        if local:
                            update_cover(album_id, local)
                            changed += 1
                        else:
                            failed += 1
            if idx % 50 == 0:
                print(f"progress {idx}/{len(albums)} changed={changed} no_match={no_match} failed={failed}")
        except Exception:
            failed += 1
        finally:
            time.sleep(args.sleep)

    print("\n==== Summary ====")
    print(f"Changed: {changed}")
    print(f"No match: {no_match}")
    print(f"Failed: {failed}")
    print(f"Skipped(already_126_{args.write_mode}): {skipped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
