#!/usr/bin/env python3
import argparse
import json
import os
import re
import subprocess
import time
import urllib.parse
import urllib.request
from pathlib import Path


MYSQL_HOST = "127.0.0.1"
MYSQL_PORT = "3306"
MYSQL_USER = "root"
MYSQL_PASS = "Huanzc304"
MYSQL_DB = "music_review"

NETEASE_SEARCH = "https://music.163.com/api/search/get"
UPLOAD_DIR = Path("/opt/music-review/uploads/avatars")
PUBLIC_URL_PREFIX = "/api/files/avatars"


def sql_quote(value):
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value).replace("\\", "\\\\").replace("'", "''")
    return f"'{s}'"


def run_mysql(query):
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
    return proc.stdout.strip()


def normalize_text(text):
    return re.sub(r"[^a-z0-9\u4e00-\u9fa5]+", "", (text or "").lower())


def http_json(url):
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "Referer": "https://music.163.com/",
            "User-Agent": "Mozilla/5.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def search_artist_candidates(name, limit=10):
    params = urllib.parse.urlencode(
        {
            "s": name,
            "type": 100,  # artist
            "offset": 0,
            "total": "true",
            "limit": limit,
        }
    )
    url = f"{NETEASE_SEARCH}?{params}"
    data = http_json(url)
    return data.get("result", {}).get("artists", []) or []


def pick_best_artist(name, candidates):
    if not candidates:
        return None
    target = normalize_text(name)
    best = None
    best_score = -1
    for item in candidates:
        cname = item.get("name") or ""
        c_alias = " ".join(item.get("alias") or [])
        cnorm = normalize_text(cname)
        anorm = normalize_text(c_alias)
        score = 0
        if target and cnorm == target:
            score += 8
        elif target and (target in cnorm or cnorm in target):
            score += 5
        if target and anorm and (target in anorm or anorm in target):
            score += 2
        if item.get("picUrl"):
            score += 1
        if score > best_score:
            best_score = score
            best = item
    if best_score < 5:
        return None
    return best


def file_extension_from_url(url):
    path = urllib.parse.urlparse(url).path.lower()
    if path.endswith(".png"):
        return ".png"
    if path.endswith(".webp"):
        return ".webp"
    if path.endswith(".gif"):
        return ".gif"
    return ".jpg"


def download_image(url, artist_id):
    if not url:
        return None
    if url.startswith("http://"):
        url = "https://" + url[len("http://") :]
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    ext = file_extension_from_url(url)
    filename = f"artist_{artist_id}{ext}"
    filepath = UPLOAD_DIR / filename

    req = urllib.request.Request(
        url,
        headers={
            "Referer": "https://music.163.com/",
            "User-Agent": "Mozilla/5.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = resp.read()
    if not data:
        return None
    with open(filepath, "wb") as f:
        f.write(data)
    return filename


def get_artists(limit=None, only_missing=True):
    where_sql = "WHERE a.photo_url IS NULL OR TRIM(a.photo_url)=''" if only_missing else ""
    limit_sql = f"LIMIT {int(limit)}" if limit else ""
    q = f"""
    USE {MYSQL_DB};
    SELECT a.id, a.name, COALESCE(a.photo_url, '')
    FROM artists a
    {where_sql}
    ORDER BY a.id
    {limit_sql};
    """
    out = run_mysql(q)
    rows = []
    for line in out.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        artist_id = parts[0]
        name = parts[1]
        photo_url = parts[2] if len(parts) > 2 else ""
        rows.append({"id": int(artist_id), "name": name, "photo_url": photo_url})
    return rows


def update_artist_photo(artist_id, photo_url):
    q = f"USE {MYSQL_DB}; UPDATE artists SET photo_url={sql_quote(photo_url)} WHERE id={artist_id};"
    run_mysql(q)


def main():
    parser = argparse.ArgumentParser(
        description="Fetch artist member photos from NetEase (CN-accessible) and upload to local server storage."
    )
    parser.add_argument("--limit", type=int, default=0, help="Max artists to process (0 means all).")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite artists that already have photo_url.")
    parser.add_argument("--sleep", type=float, default=0.35, help="Sleep seconds between requests.")
    parser.add_argument("--dry-run", action="store_true", help="Only print matches, do not download or update DB.")
    args = parser.parse_args()

    artists = get_artists(limit=args.limit if args.limit > 0 else None, only_missing=not args.overwrite)
    print(f"Artists to process: {len(artists)}")

    ok = 0
    failed = []
    skipped = []

    for artist in artists:
        try:
            candidates = search_artist_candidates(artist["name"], limit=10)
            best = pick_best_artist(artist["name"], candidates)
            if not best:
                skipped.append((artist["name"], "no high-confidence match"))
                continue

            pic_url = (best.get("picUrl") or "").strip()
            if not pic_url:
                skipped.append((artist["name"], "matched but no picUrl"))
                continue

            if args.dry_run:
                print(f"[DRY] {artist['name']} -> {pic_url}")
                ok += 1
                continue

            filename = download_image(pic_url, artist["id"])
            if not filename:
                failed.append((artist["name"], "download failed"))
                continue

            local_url = f"{PUBLIC_URL_PREFIX}/{filename}"
            update_artist_photo(artist["id"], local_url)
            ok += 1
            print(f"[OK] {artist['name']} -> {local_url}")
        except Exception as exc:
            failed.append((artist["name"], str(exc)))
        finally:
            time.sleep(args.sleep)

    print("\n==== Summary ====")
    print(f"Updated: {ok}")
    print(f"Skipped: {len(skipped)}")
    for name, reason in skipped[:30]:
        print(f"- {name}: {reason}")
    print(f"Failed: {len(failed)}")
    for name, reason in failed[:30]:
        print(f"- {name}: {reason}")


if __name__ == "__main__":
    main()
