#!/usr/bin/env python3
"""
Auto-fetch and write band albums into local MySQL using MusicBrainz data.

What it does:
1) Read artists from MySQL (optionally only artists with zero albums).
2) Search albums from MusicBrainz for each artist.
3) Fetch tracklists for selected releases.
4) Insert albums + tracks + album_genres into your schema.

Notes:
- Requires `mysql` CLI available on PATH.
- Uses MusicBrainz public API. Keep rate low (default 1.1s/request).
- Idempotent inserts by (artist_id, title) for albums and (album_id, track_number) for tracks.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple


MB_BASE = "https://musicbrainz.org/ws/2"
USER_AGENT = "MusicReviewSiteSeeder/1.0 (music-review-site)"


@dataclass
class ArtistRow:
    artist_id: int
    name: str
    genre: Optional[str]


@dataclass
class AlbumSeed:
    title: str
    release_year: Optional[int]
    description: str
    tracklist: List[Tuple[int, str, Optional[int]]]
    genre_name: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Sync albums from MusicBrainz into MySQL.")
    parser.add_argument("--host", required=True, help="MySQL host")
    parser.add_argument("--port", type=int, default=3306, help="MySQL port")
    parser.add_argument("--user", required=True, help="MySQL user")
    parser.add_argument("--password", default=None, help="MySQL password (optional)")
    parser.add_argument("--database", required=True, help="Database name")
    parser.add_argument("--per-artist", type=int, default=2, help="Albums to import per artist")
    parser.add_argument(
        "--only-no-albums",
        action="store_true",
        help="Only import for artists that currently have zero albums",
    )
    parser.add_argument(
        "--artist-like",
        default=None,
        help="Only process artists where name LIKE this pattern (e.g. '%%Metal%%')",
    )
    parser.add_argument("--sleep", type=float, default=1.1, help="Sleep seconds between MB API calls")
    parser.add_argument("--dry-run", action="store_true", help="Print actions, do not write DB")
    return parser.parse_args()


def sql_quote(value: Optional[str]) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("\\", "\\\\").replace("'", "''") + "'"


def mysql_cmd(args: argparse.Namespace) -> Tuple[List[str], Dict[str, str]]:
    cmd = [
        "mysql",
        "-h",
        args.host,
        "-P",
        str(args.port),
        "-u",
        args.user,
        args.database,
    ]
    env = os.environ.copy()
    if args.password:
        env["MYSQL_PWD"] = args.password
    return cmd, env


def run_mysql_query(args: argparse.Namespace, query: str) -> List[str]:
    cmd, env = mysql_cmd(args)
    proc = subprocess.run(
        cmd + ["-N", "-B", "-e", query],
        env=env,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(f"MySQL query failed: {proc.stderr.strip()}")
    lines = [line for line in proc.stdout.splitlines() if line.strip()]
    return lines


def run_mysql_sql(args: argparse.Namespace, sql: str) -> None:
    cmd, env = mysql_cmd(args)
    proc = subprocess.run(cmd, env=env, input=sql, text=True, capture_output=True)
    if proc.returncode != 0:
        raise RuntimeError(f"MySQL execute failed: {proc.stderr.strip()}")


def mb_get_json(path: str, query: Dict[str, str]) -> Dict:
    q = urllib.parse.urlencode(query)
    url = f"{MB_BASE}{path}?{q}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def extract_year(date_str: Optional[str]) -> Optional[int]:
    if not date_str:
        return None
    m = re.match(r"^(\d{4})", date_str)
    return int(m.group(1)) if m else None


def normalize_title_key(title: str) -> str:
    return re.sub(r"\s+", " ", title.strip().lower())


def map_artist_genre_to_db(artist_genre: Optional[str]) -> str:
    if not artist_genre:
        return "Rock"
    g = artist_genre.lower()
    if "progressive metal" in g:
        return "Progressive Metal"
    if "progressive rock" in g:
        return "Progressive Rock"
    if "thrash" in g:
        return "Thrash Metal"
    if "death" in g:
        return "Death Metal"
    if "black" in g:
        return "Black Metal"
    if "power" in g:
        return "Power Metal"
    if "hard rock" in g:
        return "Hard Rock"
    if "alternative" in g:
        return "Alternative Rock"
    if "indie" in g:
        return "Indie Rock"
    if "punk" in g:
        return "Punk Rock"
    if "new wave" in g:
        return "New Wave"
    if "metal" in g:
        return "Metal"
    return "Rock"


def fetch_albums_for_artist(artist_name: str, artist_genre: Optional[str], per_artist: int, sleep_sec: float) -> List[AlbumSeed]:
    # Search releases (album-like) by artist
    query = f'artist:"{artist_name}" AND primarytype:album'
    result = mb_get_json("/release", {"query": query, "fmt": "json", "limit": "20"})
    releases = result.get("releases", []) or []

    seen = set()
    seeds: List[AlbumSeed] = []
    mapped_genre = map_artist_genre_to_db(artist_genre)

    for rel in releases:
        title = (rel.get("title") or "").strip()
        if not title:
            continue
        key = normalize_title_key(title)
        if key in seen:
            continue
        seen.add(key)

        release_id = rel.get("id")
        if not release_id:
            continue

        # Pull tracklist from release detail
        time.sleep(sleep_sec)
        detail = mb_get_json(f"/release/{release_id}", {"inc": "recordings", "fmt": "json"})

        tracklist: List[Tuple[int, str, Optional[int]]] = []
        media = detail.get("media", []) or []
        track_no = 1
        for medium in media:
            tracks = medium.get("tracks", []) or []
            for track in tracks:
                t_title = (track.get("title") or "").strip()
                if not t_title:
                    continue
                length_ms = track.get("length")
                duration = int(length_ms / 1000) if isinstance(length_ms, (int, float)) else None
                tracklist.append((track_no, t_title, duration))
                track_no += 1

        if not tracklist:
            continue

        year = extract_year(rel.get("date")) or extract_year(detail.get("date"))
        description = f"自动导入（MusicBrainz）：{artist_name} - {title}"
        seeds.append(
            AlbumSeed(
                title=title,
                release_year=year,
                description=description,
                tracklist=tracklist,
                genre_name=mapped_genre,
            )
        )
        if len(seeds) >= per_artist:
            break

    return seeds


def read_artists(args: argparse.Namespace) -> List[ArtistRow]:
    where_clauses = []
    if args.only_no_albums:
        where_clauses.append("al.id IS NULL")
    if args.artist_like:
        where_clauses.append(f"a.name LIKE {sql_quote(args.artist_like)}")

    where_sql = "WHERE " + " AND ".join(where_clauses) if where_clauses else ""
    query = f"""
SELECT a.id, a.name, a.genre
FROM artists a
LEFT JOIN albums al ON al.artist_id = a.id
{where_sql}
GROUP BY a.id, a.name, a.genre
ORDER BY a.name;
""".strip()

    rows = run_mysql_query(args, query)
    result = []
    for row in rows:
        cols = row.split("\t")
        artist_id = int(cols[0])
        name = cols[1]
        genre = cols[2] if len(cols) > 2 and cols[2] != "NULL" else None
        result.append(ArtistRow(artist_id=artist_id, name=name, genre=genre))
    return result


def generate_insert_sql(artist: ArtistRow, albums: List[AlbumSeed]) -> str:
    stmts: List[str] = []
    for album in albums:
        title_initial = album.title[0].upper() if album.title and album.title[0].isalpha() else "#"

        stmts.append(
            f"""
INSERT INTO albums (title, title_initial, artist_id, release_year, cover_url, description, created_by)
SELECT {sql_quote(album.title)}, {sql_quote(title_initial)}, {artist.artist_id}, {album.release_year if album.release_year is not None else 'NULL'}, NULL, {sql_quote(album.description)}, NULL
WHERE NOT EXISTS (
  SELECT 1 FROM albums
  WHERE artist_id = {artist.artist_id}
    AND LOWER(TRIM(title)) = LOWER(TRIM({sql_quote(album.title)}))
);
""".strip()
        )

        stmts.append(
            f"""
SET @album_id := (
  SELECT id FROM albums
  WHERE artist_id = {artist.artist_id}
    AND LOWER(TRIM(title)) = LOWER(TRIM({sql_quote(album.title)}))
  ORDER BY id ASC
  LIMIT 1
);
""".strip()
        )

        # Link primary genre
        stmts.append(
            f"""
INSERT INTO album_genres (album_id, genre_id)
SELECT @album_id, g.id
FROM genres g
WHERE g.name = {sql_quote(album.genre_name)}
  AND @album_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM album_genres ag WHERE ag.album_id = @album_id AND ag.genre_id = g.id
  );
""".strip()
        )

        for track_no, track_title, duration in album.tracklist:
            stmts.append(
                f"""
INSERT INTO tracks (album_id, track_number, title, duration)
SELECT @album_id, {track_no}, {sql_quote(track_title)}, {duration if duration is not None else 'NULL'}
WHERE @album_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM tracks t WHERE t.album_id = @album_id AND t.track_number = {track_no}
  );
""".strip()
            )

    return "\n\n".join(stmts)


def ensure_genres(args: argparse.Namespace) -> None:
    sql = """
INSERT IGNORE INTO genres (name, description) VALUES
('Rock','摇滚'),
('Hard Rock','硬摇滚'),
('Alternative Rock','另类摇滚'),
('Indie Rock','独立摇滚'),
('Progressive Rock','前卫摇滚'),
('Progressive Metal','前卫金属'),
('Thrash Metal','激流金属'),
('Death Metal','死亡金属'),
('Black Metal','黑金属'),
('Power Metal','力量金属'),
('Metal','金属'),
('Punk Rock','朋克摇滚'),
('New Wave','新浪潮');
"""
    if args.dry_run:
        return
    run_mysql_sql(args, sql)


def main() -> int:
    args = parse_args()
    artists = read_artists(args)
    print(f"[sync] artists selected: {len(artists)}")
    if not artists:
        return 0

    ensure_genres(args)
    total_albums = 0

    for idx, artist in enumerate(artists, start=1):
        print(f"[sync] ({idx}/{len(artists)}) {artist.name}")
        try:
            seeds = fetch_albums_for_artist(
                artist_name=artist.name,
                artist_genre=artist.genre,
                per_artist=args.per_artist,
                sleep_sec=args.sleep,
            )
        except Exception as exc:
            print(f"[sync]   skip (fetch failed): {exc}")
            continue

        if not seeds:
            print("[sync]   no album candidates found")
            continue

        sql = generate_insert_sql(artist, seeds)
        total_albums += len(seeds)

        if args.dry_run:
            print(f"[sync]   would insert up to {len(seeds)} albums")
            continue

        try:
            run_mysql_sql(args, sql)
            print(f"[sync]   inserted/updated: {len(seeds)} albums")
        except Exception as exc:
            print(f"[sync]   write failed: {exc}")

        time.sleep(args.sleep)

    print(f"[sync] done. attempted album imports: {total_albums}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
