#!/usr/bin/env python3
import argparse
import json
import os
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import re


MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASS = os.getenv("MYSQL_PASS", "change_me")
MYSQL_DB = os.getenv("MYSQL_DB", "music_review")

IMPORT_BASE = "http://127.0.0.1:8080/api/import"


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


def http_get_json(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def artist_query_variants(name):
    variants = []
    raw = (name or "").strip()
    if raw:
        variants.append(raw)
    alnum = re.sub(r"[^A-Za-z0-9\u4e00-\u9fa5 ]+", " ", raw)
    alnum = re.sub(r"\s+", " ", alnum).strip()
    if alnum and alnum not in variants:
        variants.append(alnum)
    amp = raw.replace("&", "and")
    amp = re.sub(r"\s+", " ", amp).strip()
    if amp and amp not in variants:
        variants.append(amp)
    if raw.lower().startswith("the "):
        no_the = raw[4:].strip()
        if no_the and no_the not in variants:
            variants.append(no_the)
    return variants[:4]


def title_initial(title):
    if not title:
        return "#"
    ch = title.strip()[:1].upper()
    return ch if "A" <= ch <= "Z" else "#"


def get_missing_artists(limit):
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
    artists = []
    for line in out.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        artists.append(
            {
                "id": int(parts[0]),
                "name": parts[1],
                "genre": parts[2].strip() if len(parts) > 2 else "",
            }
        )
    return artists


def existing_album_titles(artist_id):
    q = f"""
    USE {MYSQL_DB};
    SELECT LOWER(TRIM(title)) FROM albums WHERE artist_id = {artist_id};
    """
    out = run_mysql(q)
    return {line.strip() for line in out.splitlines() if line.strip()}


def pick_albums(search_results, existing_titles, per_artist):
    hard_block = ("greatest hits", "demo")
    soft_block = ("live",)

    candidates = []
    soft_candidates = []
    seen = set()
    for row in search_results:
        album_type = str(row.get("type") or "").lower()
        status = str(row.get("status") or "").lower()
        title = (row.get("title") or "").strip()
        if not title:
            continue
        lower_title = title.lower()
        if any(word in lower_title for word in hard_block):
            continue
        norm = title.lower()
        if norm in seen or norm in existing_titles:
            continue
        seen.add(norm)
        date = row.get("date") or ""
        if album_type and album_type != "album":
            continue
        if status and status != "official":
            continue
        if any(word in lower_title for word in soft_block):
            soft_candidates.append((date, row))
        else:
            candidates.append((date, row))

    # First pick non-live albums; if insufficient, append live albums as fallback.
    candidates.sort(key=lambda x: x[0] or "9999-99-99")
    soft_candidates.sort(key=lambda x: x[0] or "9999-99-99")
    merged = candidates + soft_candidates
    return [row for _, row in merged[:per_artist]]


def ensure_genre_sql(genre_name):
    if not genre_name:
        return ""
    return (
        "INSERT INTO genres (name, description) "
        f"SELECT {sql_quote(genre_name)}, {sql_quote('Auto-synced from artists.genre')} "
        "WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = "
        f"{sql_quote(genre_name)});"
    )


def write_album(artist, genre_name, detail):
    title = (detail.get("title") or "").strip()
    if not title:
        return False
    release_year = detail.get("releaseYear")
    if not isinstance(release_year, int):
        release_year = None
    tracks = detail.get("tracks") or []
    desc = f"Imported from MusicBrainz (MBID: {detail.get('mbid', '')})"

    statements = [f"USE {MYSQL_DB};", "START TRANSACTION;"]
    if genre_name:
        statements.append(ensure_genre_sql(genre_name))

    statements.append(
        "INSERT INTO albums (title, title_initial, artist_id, release_year, cover_url, description, created_by) VALUES ("
        f"{sql_quote(title)}, {sql_quote(title_initial(title))}, {artist['id']}, "
        f"{sql_quote(release_year)}, NULL, {sql_quote(desc)}, NULL"
        ");"
    )
    statements.append("SET @new_album_id := LAST_INSERT_ID();")

    for t in tracks:
        tn = t.get("trackNumber")
        tt = (t.get("title") or "").strip()
        dur = t.get("duration")
        if not isinstance(tn, int) or not tt:
            continue
        dur_sql = str(int(dur)) if isinstance(dur, int) else "NULL"
        statements.append(
            "INSERT INTO tracks (album_id, track_number, title, duration) VALUES ("
            f"@new_album_id, {tn}, {sql_quote(tt)}, {dur_sql}"
            ");"
        )

    if genre_name:
        statements.append(
            "INSERT INTO album_genres (album_id, genre_id) "
            "SELECT @new_album_id, g.id FROM genres g WHERE g.name = "
            f"{sql_quote(genre_name)} "
            "AND NOT EXISTS (SELECT 1 FROM album_genres ag WHERE ag.album_id = @new_album_id AND ag.genre_id = g.id);"
        )

    statements.append("COMMIT;")
    sql = "\n".join(statements)
    run_mysql(sql)
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Auto import 2 albums for artists that currently have no albums."
    )
    parser.add_argument("--per-artist", type=int, default=2, help="Albums to import per artist (default: 2)")
    parser.add_argument("--max-artists", type=int, default=0, help="Limit artists to process (default: all)")
    parser.add_argument("--sleep", type=float, default=1.0, help="Seconds to sleep between API calls")
    args = parser.parse_args()

    artists = get_missing_artists(args.max_artists if args.max_artists > 0 else None)
    if not artists:
        print("No artists without albums found.")
        return 0

    print(f"Found {len(artists)} artists without albums.")
    inserted_albums = 0
    processed_artists = 0
    failed_artists = []

    for artist in artists:
        name = artist["name"]
        genre_name = artist["genre"].strip()
        try:
            results = []
            seen_mbid = set()
            for v in artist_query_variants(name):
                query = urllib.parse.urlencode({"artist": v, "limit": 60})
                search_url = f"{IMPORT_BASE}/search?{query}"
                search = http_get_json(search_url)
                part = search.get("results") or []
                for row in part:
                    mbid = row.get("mbid")
                    key = mbid or (row.get("title"), row.get("date"))
                    if key in seen_mbid:
                        continue
                    seen_mbid.add(key)
                    results.append(row)
                time.sleep(0.2)
            picks = pick_albums(results, existing_album_titles(artist["id"]), args.per_artist)

            if not picks:
                failed_artists.append((name, "no suitable albums"))
                continue

            ok_count = 0
            for row in picks:
                mbid = row.get("mbid")
                if not mbid:
                    continue
                detail_url = f"{IMPORT_BASE}/album/{urllib.parse.quote(mbid)}"
                detail = http_get_json(detail_url)
                if write_album(artist, genre_name, detail):
                    ok_count += 1
                    inserted_albums += 1
                time.sleep(args.sleep)

            if ok_count > 0:
                processed_artists += 1
                print(f"[OK] {name}: inserted {ok_count} album(s)")
            else:
                failed_artists.append((name, "all inserts skipped/failed"))
        except Exception as exc:
            failed_artists.append((name, str(exc)))

    print("\n==== Summary ====")
    print(f"Artists processed: {processed_artists}")
    print(f"Albums inserted: {inserted_albums}")
    print(f"Artists failed/skipped: {len(failed_artists)}")
    if failed_artists:
        for item in failed_artists[:20]:
            print(f"- {item[0]}: {item[1]}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
