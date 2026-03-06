#!/usr/bin/env python3
import argparse
import json
import os
import re
import subprocess
import time
import urllib.parse
import urllib.request


MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASS = os.getenv("MYSQL_PASS", "change_me")
MYSQL_DB = os.getenv("MYSQL_DB", "music_review")

NETEASE_SEARCH = "https://music.163.com/api/search/get"

HARD_BLOCK = ("greatest hits", "demo", "精选", "精选集", "合集")
SOFT_BLOCK = ("live", "现场")


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
        "-h", MYSQL_HOST,
        "-P", MYSQL_PORT,
        "-u", MYSQL_USER,
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


def normalize_text(text):
    return re.sub(r"[^a-z0-9\u4e00-\u9fa5]+", "", (text or "").lower())


def fetch_albums_from_netease(keyword, limit=30):
    params = urllib.parse.urlencode(
        {
            "s": keyword,
            "type": 10,  # album
            "offset": 0,
            "total": "true",
            "limit": limit,
        }
    )
    url = f"{NETEASE_SEARCH}?{params}"
    data = http_json(url)
    return data.get("result", {}).get("albums", []) or []


def get_artists_without_albums(limit):
    q = f"""
    USE {MYSQL_DB};
    SELECT a.id, a.name, COALESCE(a.genre, '')
    FROM artists a
    LEFT JOIN albums al ON al.artist_id = a.id
    GROUP BY a.id, a.name, a.genre
    HAVING COUNT(al.id) = 0
    ORDER BY a.name
    {f'LIMIT {int(limit)}' if limit else ''};
    """
    out = run_mysql(q)
    rows = []
    for line in out.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        rows.append({"id": int(parts[0]), "name": parts[1], "genre": parts[2] if len(parts) > 2 else ""})
    return rows


def get_existing_titles(artist_id):
    q = f"USE {MYSQL_DB}; SELECT LOWER(TRIM(title)) FROM albums WHERE artist_id={artist_id};"
    out = run_mysql(q)
    return {x.strip() for x in out.splitlines() if x.strip()}


def choose_two_albums(artist_name, albums, existing_titles):
    norm_artist = normalize_text(artist_name)
    strict = []
    soft = []
    seen = set()
    for a in albums:
        title = (a.get("name") or "").strip()
        if not title:
            continue
        lower_title = title.lower()
        if any(x in lower_title for x in HARD_BLOCK):
            continue
        norm_title = title.lower()
        if norm_title in seen or norm_title in existing_titles:
            continue
        seen.add(norm_title)

        artists = a.get("artists") or []
        artist_names = [x.get("name", "") for x in artists]
        names_norm = [normalize_text(x) for x in artist_names if x]
        has_artist_match = any(norm_artist and norm_artist in n for n in names_norm)

        item = (a.get("publishTime") or 0, a)
        if any(x in lower_title for x in SOFT_BLOCK):
            soft.append(item)
        elif has_artist_match:
            strict.append(item)
        else:
            soft.append(item)

    strict.sort(key=lambda x: x[0] or 0)
    soft.sort(key=lambda x: x[0] or 0)
    picked = [x[1] for x in strict[:2]]
    if len(picked) < 2:
        for _, a in soft:
            if len(picked) >= 2:
                break
            if a not in picked:
                picked.append(a)
    return picked


def ensure_genre(genre_name):
    if not genre_name:
        return
    q = f"""
    USE {MYSQL_DB};
    INSERT INTO genres (name, description)
    SELECT {sql_quote(genre_name)}, {sql_quote('同步自 artists.genre')}
    WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name={sql_quote(genre_name)});
    """
    run_mysql(q)


def title_initial(title):
    if not title:
        return "#"
    ch = title.strip()[:1].upper()
    return ch if "A" <= ch <= "Z" else "#"


def insert_album(artist_id, artist_genre, album):
    title = (album.get("name") or "").strip()
    if not title:
        return False
    pub_ms = album.get("publishTime")
    year = None
    if isinstance(pub_ms, int) and pub_ms > 0:
        year = int(time.gmtime(pub_ms / 1000).tm_year)
    cover = (album.get("picUrl") or "").strip()
    if cover.startswith("http://"):
        cover = "https://" + cover[len("http://") :]
    desc = f"Imported from NetEase album API (id: {album.get('id')})"

    ensure_genre(artist_genre)

    q = f"""
    USE {MYSQL_DB};
    START TRANSACTION;
    INSERT INTO albums (title, title_initial, artist_id, release_year, cover_url, description, created_by)
    VALUES (
      {sql_quote(title)},
      {sql_quote(title_initial(title))},
      {artist_id},
      {sql_quote(year)},
      {sql_quote(cover if cover else None)},
      {sql_quote(desc)},
      NULL
    );
    SET @new_album_id := LAST_INSERT_ID();
    """
    if artist_genre:
        q += f"""
        INSERT INTO album_genres (album_id, genre_id)
        SELECT @new_album_id, g.id
        FROM genres g
        WHERE g.name={sql_quote(artist_genre)}
          AND NOT EXISTS (
            SELECT 1 FROM album_genres ag
            WHERE ag.album_id=@new_album_id AND ag.genre_id=g.id
          );
        """
    q += "COMMIT;"
    run_mysql(q)
    return True


def get_albums_missing_cover(limit):
    q = f"""
    USE {MYSQL_DB};
    SELECT al.id, al.title, ar.name
    FROM albums al
    JOIN artists ar ON ar.id = al.artist_id
    WHERE al.cover_url IS NULL OR TRIM(al.cover_url)=''
    ORDER BY al.id
    {f'LIMIT {int(limit)}' if limit else ''};
    """
    out = run_mysql(q)
    rows = []
    for line in out.splitlines():
        if not line.strip():
            continue
        aid, title, artist = line.split("\t")
        rows.append({"id": int(aid), "title": title, "artist": artist})
    return rows


def pick_cover_for_album(album_title, artist_name):
    results = fetch_albums_from_netease(f"{artist_name} {album_title}", limit=12)
    if not results:
        return None
    nt = normalize_text(album_title)
    na = normalize_text(artist_name)

    best = None
    best_score = -1
    for a in results:
        title = a.get("name") or ""
        tnorm = normalize_text(title)
        artists = a.get("artists") or []
        anorms = [normalize_text(x.get("name", "")) for x in artists]
        score = 0
        if nt and nt == tnorm:
            score += 5
        elif nt and (nt in tnorm or tnorm in nt):
            score += 3
        if na and any(na in x or x in na for x in anorms if x):
            score += 4
        if any(x in title.lower() for x in HARD_BLOCK):
            score -= 8
        if any(x in title.lower() for x in SOFT_BLOCK):
            score -= 2
        if score > best_score:
            best_score = score
            best = a
    if best_score < 3:
        return None
    cover = (best.get("picUrl") or "").strip()
    if cover.startswith("http://"):
        cover = "https://" + cover[len("http://") :]
    return cover or None


def update_cover(album_id, cover_url):
    q = f"USE {MYSQL_DB}; UPDATE albums SET cover_url={sql_quote(cover_url)} WHERE id={album_id};"
    run_mysql(q)


def main():
    parser = argparse.ArgumentParser(description="Fill missing albums and covers from NetEase (CN-accessible source).")
    parser.add_argument("--per-artist", type=int, default=2)
    parser.add_argument("--max-artists", type=int, default=0)
    parser.add_argument("--cover-limit", type=int, default=0)
    parser.add_argument("--sleep", type=float, default=0.4)
    args = parser.parse_args()

    # Step 1: fill missing artists with 2 albums
    missing_artists = get_artists_without_albums(args.max_artists if args.max_artists > 0 else None)
    print(f"Missing artists: {len(missing_artists)}")
    filled_artists = 0
    inserted = 0
    failed = []

    for a in missing_artists:
        try:
            results = fetch_albums_from_netease(a["name"], limit=30)
            picks = choose_two_albums(a["name"], results, get_existing_titles(a["id"]))[: args.per_artist]
            ok = 0
            for album in picks:
                if insert_album(a["id"], a["genre"].strip(), album):
                    ok += 1
                    inserted += 1
                time.sleep(args.sleep)
            if ok > 0:
                filled_artists += 1
                print(f"[OK] {a['name']}: inserted {ok}")
            else:
                failed.append((a["name"], "no suitable albums"))
        except Exception as exc:
            failed.append((a["name"], str(exc)))

    # Step 2: fill covers for albums without cover
    no_cover = get_albums_missing_cover(args.cover_limit if args.cover_limit > 0 else None)
    print(f"\nAlbums missing cover: {len(no_cover)}")
    cover_updated = 0
    cover_failed = []
    for row in no_cover:
        try:
            cover = pick_cover_for_album(row["title"], row["artist"])
            if cover:
                update_cover(row["id"], cover)
                cover_updated += 1
            else:
                cover_failed.append(row["id"])
            time.sleep(args.sleep)
        except Exception:
            cover_failed.append(row["id"])

    print("\n==== Summary ====")
    print(f"Artists filled: {filled_artists}")
    print(f"Albums inserted: {inserted}")
    print(f"Artists failed/skipped: {len(failed)}")
    for name, reason in failed[:20]:
        print(f"- {name}: {reason}")
    print(f"Album covers updated: {cover_updated}")
    print(f"Album covers still missing (this run): {len(cover_failed)}")


if __name__ == "__main__":
    main()
