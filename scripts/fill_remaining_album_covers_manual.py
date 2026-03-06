#!/usr/bin/env python3
"""
Fill remaining difficult album covers with targeted alias matching.
Priority: NetEase URL first, then iTunes URL fallback.
Writes remote URL directly to albums.cover_url.
"""

from __future__ import annotations

import json
import os
import re
import subprocess
import urllib.parse
import urllib.request
from typing import Dict, List, Optional, Tuple


MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASS = os.getenv("MYSQL_PASS", "change_me")
MYSQL_DB = os.getenv("MYSQL_DB", "music_review")

NETEASE_SEARCH = "https://music.163.com/api/search/get"


ALIASES: Dict[int, List[str]] = {
    320: ["Wheels of Fire", "Wheels of Fire In the Studio"],
    359: ["Peace Sells... but Who's Buying?", "Peace Sells but Who's Buying"],
    379: ["Introducing The Beatles"],
    383: ["Outlandos d'Amour", "Outlandos dAmour"],
    392: ["改变你的生活"],
    404: ["Father More Ghana"],
    412: ["Ege Bamyasi", "Ege Bamyası"],
    453: ["Agætis byrjun", "Agaetis byrjun", "Agatis byrjun"],
    454: ["()", "Untitled", "Sigur Ros"],
    480: ["First New Tomorrow", "First New Btomorrow"],
    483: ["La Tierra Sin Ti"],
}


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


def norm(text: str) -> str:
    return re.sub(r"[^a-z0-9\u4e00-\u9fa5]+", "", (text or "").lower())


def get_targets() -> List[Tuple[int, str, str, str]]:
    q = f"""
USE {MYSQL_DB};
SELECT al.id, al.title, ar.name, COALESCE(al.cover_url,'')
FROM albums al
JOIN artists ar ON ar.id = al.artist_id
WHERE al.cover_url IS NULL
   OR TRIM(al.cover_url) = ''
   OR al.cover_url LIKE '/api/files/album-covers/%'
ORDER BY al.id;
"""
    rows = run_mysql(q)
    out = []
    for row in rows:
        p = row.split("\t")
        if len(p) < 4:
            continue
        out.append((int(p[0]), p[1], p[2], p[3]))
    return out


def netease_search(term: str) -> List[Dict]:
    params = urllib.parse.urlencode(
        {"s": term, "type": 10, "offset": 0, "total": "true", "limit": 30}
    )
    req = urllib.request.Request(
        f"{NETEASE_SEARCH}?{params}",
        headers={
            "Accept": "application/json",
            "Referer": "https://music.163.com/",
            "User-Agent": "Mozilla/5.0",
        },
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return (data.get("result") or {}).get("albums") or []


def pick_netease(artist: str, title: str, rows: List[Dict]) -> Optional[str]:
    ta, tt = norm(artist), norm(title)
    best_url, best_score = None, -1
    for row in rows:
        name = norm(str(row.get("name") or ""))
        aname = norm(str((row.get("artist") or {}).get("name") or ""))
        url = str(row.get("picUrl") or "").strip()
        if not url:
            continue
        score = 0
        if tt and name == tt:
            score += 10
        elif tt and (tt in name or name in tt):
            score += 6
        if ta and aname == ta:
            score += 8
        elif ta and (ta in aname or aname in ta):
            score += 4
        if score > best_score:
            best_score = score
            best_url = url
    if best_url and best_url.startswith("http://"):
        best_url = "https://" + best_url[len("http://") :]
    return best_url if best_score >= 7 else None


def itunes_search(artist: str, title: str) -> Optional[str]:
    q = urllib.parse.urlencode(
        {"term": f"{artist} {title}", "entity": "album", "limit": 20, "country": "US"}
    )
    req = urllib.request.Request(
        f"https://itunes.apple.com/search?{q}",
        headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=25) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    ta, tt = norm(artist), norm(title)
    best_url, best_score = None, -1
    for row in data.get("results") or []:
        aname = norm(str(row.get("artistName") or ""))
        cname = norm(str(row.get("collectionName") or ""))
        art = str(row.get("artworkUrl100") or "").strip()
        if not art:
            continue
        score = 0
        if tt and cname == tt:
            score += 8
        elif tt and (tt in cname or cname in tt):
            score += 4
        if ta and aname == ta:
            score += 6
        elif ta and (ta in aname or aname in ta):
            score += 3
        if score > best_score:
            best_score = score
            best_url = art.replace("100x100bb", "1000x1000bb")
    return best_url if best_score >= 6 else None


def update_cover(album_id: int, cover_url: str) -> None:
    safe = cover_url.replace("\\", "\\\\").replace("'", "''")
    q = f"USE {MYSQL_DB}; UPDATE albums SET cover_url='{safe}' WHERE id={album_id};"
    run_mysql(q)


def main() -> int:
    targets = get_targets()
    print(f"Targets: {len(targets)}")
    changed = 0
    remain = []
    for album_id, title, artist, old_cover in targets:
        aliases = [title] + ALIASES.get(album_id, [])
        url = None
        # 1) NetEase priority
        for alias in aliases:
            try:
                rows = netease_search(f"{artist} {alias}")
                url = pick_netease(artist, alias, rows)
                if url:
                    break
            except Exception:
                pass
        # 2) iTunes fallback
        if not url:
            for alias in aliases:
                try:
                    url = itunes_search(artist, alias)
                    if url:
                        break
                except Exception:
                    pass
        if url:
            update_cover(album_id, url)
            changed += 1
            print(f"[OK] {album_id} {artist} - {title} -> {url}")
        else:
            remain.append((album_id, artist, title, old_cover))
            print(f"[MISS] {album_id} {artist} - {title}")
    print(f"\nChanged: {changed}")
    print(f"Remaining: {len(remain)}")
    for row in remain:
        print(f"- {row[0]}\t{row[1]}\t{row[2]}\t{row[3]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
