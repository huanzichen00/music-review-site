#!/usr/bin/env python3
"""
Fill studio albums for artists using MusicBrainz.

Default behavior:
- Process artists whose current album count is less than 3
- Top up each artist to 3 albums
- Only import studio albums (primary type Album; exclude secondary types like live/compilation/ep/remix/demo)
- Deduplicate by (artist_id, normalized title) before inserting
- Optional DB-level duplicate cleanup after run
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
from dataclasses import dataclass
from typing import Dict, List, Optional, Sequence, Tuple


MB_BASE = "https://musicbrainz.org/ws/2"
USER_AGENT = "MusicReviewStudioSeeder/1.0 (music-review-site)"

# Project-local defaults (aligned with existing scripts in this repo)
MYSQL_HOST = "127.0.0.1"
MYSQL_PORT = 3306
MYSQL_USER = "root"
MYSQL_PASS = "Huanzc304"
MYSQL_DB = "music_review"

BLOCKED_SECONDARY_TYPES = {
    "live",
    "compilation",
    "ep",
    "single",
    "soundtrack",
    "remix",
    "dj-mix",
    "mixtape/street",
    "mixtape",
    "demo",
    "interview",
    "audiobook",
    "spokenword",
}

BLOCKED_TITLE_KEYWORDS = (
    "greatest hits",
    "best of",
    "anthology",
    "collection",
    "live",
    "demo",
    "karaoke",
    "instrumental",
    "re-recorded",
    "remix",
)


@dataclass
class ArtistRow:
    artist_id: int
    name: str
    genre: str
    album_count: int


@dataclass
class AlbumCandidate:
    title: str
    mb_release_id: str
    mb_release_group_id: str
    year: Optional[int]
    description: str
    cover_url: Optional[str]
    tracks: List[Tuple[int, str, Optional[int]]]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Top up each artist to N studio albums from MusicBrainz (default N=3)."
    )
    parser.add_argument("--target-per-artist", type=int, default=3, help="Target album count per artist (default: 3)")
    parser.add_argument("--max-artists", type=int, default=0, help="Limit artists to process (0 means all)")
    parser.add_argument("--artist-like", default=None, help="Only process artists with name LIKE pattern")
    parser.add_argument("--sleep", type=float, default=1.1, help="Seconds between MusicBrainz requests")
    parser.add_argument("--dry-run", action="store_true", help="Print actions without writing DB")
    parser.add_argument("--no-dedup-cleanup", action="store_true", help="Skip final DB duplicate cleanup")
    parser.add_argument("--host", default=MYSQL_HOST, help="MySQL host")
    parser.add_argument("--port", type=int, default=MYSQL_PORT, help="MySQL port")
    parser.add_argument("--user", default=MYSQL_USER, help="MySQL user")
    parser.add_argument("--password", default=MYSQL_PASS, help="MySQL password")
    parser.add_argument("--database", default=MYSQL_DB, help="MySQL database")
    return parser.parse_args()


def sql_quote(value: Optional[object]) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value).replace("\\", "\\\\").replace("'", "''")
    return f"'{s}'"


def title_initial(title: str) -> str:
    if not title:
        return "#"
    first = title.strip()[:1].upper()
    return first if "A" <= first <= "Z" else "#"


def normalize_title(title: str) -> str:
    return re.sub(r"\s+", " ", (title or "").strip().lower())


def artist_query_variants(name: str) -> List[str]:
    raw = (name or "").strip()
    out: List[str] = []
    if raw:
        out.append(raw)
    simplified = re.sub(r"[^A-Za-z0-9\u4e00-\u9fa5 ]+", " ", raw)
    simplified = re.sub(r"\s+", " ", simplified).strip()
    if simplified and simplified not in out:
        out.append(simplified)
    if raw.lower().startswith("the "):
        no_the = raw[4:].strip()
        if no_the and no_the not in out:
            out.append(no_the)
    return out[:4]


def mysql_base_cmd(args: argparse.Namespace) -> List[str]:
    return [
        "mysql",
        "-h",
        args.host,
        "-P",
        str(args.port),
        "-u",
        args.user,
        f"-p{args.password}",
        "-N",
        "-B",
    ]


def run_mysql_query(args: argparse.Namespace, query: str) -> List[str]:
    cmd = mysql_base_cmd(args) + ["-e", query]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip())
    return [line for line in proc.stdout.splitlines() if line.strip()]


def run_mysql_sql(args: argparse.Namespace, sql: str) -> None:
    cmd = mysql_base_cmd(args)
    proc = subprocess.run(cmd, input=sql, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip())


def mb_get_json(path: str, query: Dict[str, str]) -> Dict:
    url = f"{MB_BASE}{path}?{urllib.parse.urlencode(query)}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=45) as resp:
        return json.loads(resp.read().decode("utf-8"))


def extract_year(date_text: Optional[str]) -> Optional[int]:
    if not date_text:
        return None
    match = re.match(r"^(\d{4})", date_text)
    if not match:
        return None
    return int(match.group(1))


def map_artist_genre_to_db(artist_genre: str) -> str:
    g = (artist_genre or "").lower()
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


def is_studio_release_group(group: Dict) -> bool:
    primary = (group.get("primary-type") or "").strip().lower()
    if primary != "album":
        return False
    secondary = [str(item).strip().lower() for item in (group.get("secondary-types") or [])]
    if any(item in BLOCKED_SECONDARY_TYPES for item in secondary):
        return False
    title = (group.get("title") or "").lower()
    if any(word in title for word in BLOCKED_TITLE_KEYWORDS):
        return False
    return True


def get_artists_to_process(args: argparse.Namespace) -> List[ArtistRow]:
    limit_sql = f"LIMIT {int(args.max_artists)}" if args.max_artists and args.max_artists > 0 else ""
    artist_like_sql = f"AND a.name LIKE {sql_quote(args.artist_like)}" if args.artist_like else ""
    q = f"""
USE {args.database};
SELECT a.id, a.name, COALESCE(a.genre, ''), COUNT(al.id) AS album_count
FROM artists a
LEFT JOIN albums al ON al.artist_id = a.id
WHERE 1=1
{artist_like_sql}
GROUP BY a.id, a.name, a.genre
HAVING COUNT(al.id) < {int(args.target_per_artist)}
ORDER BY a.name
{limit_sql};
"""
    rows = run_mysql_query(args, q)
    artists: List[ArtistRow] = []
    for row in rows:
        parts = row.split("\t")
        artists.append(
            ArtistRow(
                artist_id=int(parts[0]),
                name=parts[1],
                genre=parts[2] if len(parts) > 2 else "",
                album_count=int(parts[3]) if len(parts) > 3 else 0,
            )
        )
    return artists


def get_existing_titles(args: argparse.Namespace, artist_id: int) -> set[str]:
    q = f"""
USE {args.database};
SELECT LOWER(TRIM(title))
FROM albums
WHERE artist_id = {artist_id};
"""
    return {line.strip() for line in run_mysql_query(args, q) if line.strip()}


def choose_best_release_for_group(group_id: str, sleep_sec: float) -> Optional[Dict]:
    time.sleep(sleep_sec)
    data = mb_get_json(
        "/release",
        {
            "release-group": group_id,
            "fmt": "json",
            "limit": "25",
            "status": "official",
        },
    )
    releases = data.get("releases") or []
    if not releases:
        return None

    def sort_key(release: Dict) -> Tuple[str, str]:
        date_text = str(release.get("date") or "9999-99-99")
        country = str(release.get("country") or "ZZ")
        return (date_text, country)

    releases.sort(key=sort_key)
    return releases[0]


def fetch_tracks_for_release(release_id: str, sleep_sec: float) -> List[Tuple[int, str, Optional[int]]]:
    time.sleep(sleep_sec)
    detail = mb_get_json(f"/release/{urllib.parse.quote(release_id)}", {"inc": "recordings", "fmt": "json"})
    tracks: List[Tuple[int, str, Optional[int]]] = []
    track_no = 1
    for medium in detail.get("media") or []:
        for row in medium.get("tracks") or []:
            title = (row.get("title") or "").strip()
            if not title:
                continue
            ms = row.get("length")
            duration = int(ms / 1000) if isinstance(ms, (int, float)) else None
            tracks.append((track_no, title, duration))
            track_no += 1
    return tracks


def build_cover_url(release_group_id: str) -> str:
    return f"https://coverartarchive.org/release-group/{urllib.parse.quote(release_group_id)}/front-250"


def fetch_studio_candidates_for_artist(
    artist_name: str,
    artist_genre: str,
    needed: int,
    existing_titles: set[str],
    sleep_sec: float,
) -> List[AlbumCandidate]:
    gathered: List[Dict] = []
    seen_group_ids: set[str] = set()

    for keyword in artist_query_variants(artist_name):
        time.sleep(sleep_sec)
        data = mb_get_json(
            "/release-group",
            {
                "query": f'artist:"{keyword}" AND primarytype:album',
                "fmt": "json",
                "limit": "100",
            },
        )
        for group in data.get("release-groups") or []:
            group_id = group.get("id")
            if not group_id or group_id in seen_group_ids:
                continue
            seen_group_ids.add(group_id)
            if not is_studio_release_group(group):
                continue
            gathered.append(group)

    def group_sort_key(group: Dict) -> str:
        return str(group.get("first-release-date") or "9999-99-99")

    gathered.sort(key=group_sort_key)

    candidates: List[AlbumCandidate] = []
    seen_titles: set[str] = set(existing_titles)
    mapped_genre = map_artist_genre_to_db(artist_genre)

    for group in gathered:
        title = (group.get("title") or "").strip()
        if not title:
            continue
        normalized = normalize_title(title)
        if not normalized or normalized in seen_titles:
            continue

        group_id = str(group.get("id") or "").strip()
        if not group_id:
            continue
        chosen_release = choose_best_release_for_group(group_id, sleep_sec)
        if not chosen_release or not chosen_release.get("id"):
            continue
        release_id = str(chosen_release["id"])
        tracks = fetch_tracks_for_release(release_id, sleep_sec)
        if not tracks:
            continue

        year = extract_year(chosen_release.get("date")) or extract_year(group.get("first-release-date"))
        description = (
            f"Imported studio album from MusicBrainz "
            f"(release-group: {group_id}, release: {release_id}, genre: {mapped_genre})"
        )
        candidates.append(
            AlbumCandidate(
                title=title,
                mb_release_id=release_id,
                mb_release_group_id=group_id,
                year=year,
                description=description,
                cover_url=build_cover_url(group_id),
                tracks=tracks,
            )
        )
        seen_titles.add(normalized)
        if len(candidates) >= needed:
            break

    return candidates


def ensure_genre_sql(genre_name: str) -> str:
    return (
        "INSERT INTO genres (name, description) "
        f"SELECT {sql_quote(genre_name)}, {sql_quote('Auto-synced from artists.genre')} "
        "WHERE NOT EXISTS (SELECT 1 FROM genres WHERE name = "
        f"{sql_quote(genre_name)});"
    )


def insert_albums_for_artist(
    args: argparse.Namespace,
    artist: ArtistRow,
    genre_name: str,
    candidates: Sequence[AlbumCandidate],
) -> int:
    inserted = 0
    for album in candidates:
        sql_parts = [
            f"USE {args.database};",
            "START TRANSACTION;",
            ensure_genre_sql(genre_name),
            (
                "INSERT INTO albums (title, title_initial, artist_id, release_year, cover_url, description, created_by) "
                "SELECT "
                f"{sql_quote(album.title)}, {sql_quote(title_initial(album.title))}, {artist.artist_id}, "
                f"{sql_quote(album.year)}, {sql_quote(album.cover_url)}, {sql_quote(album.description)}, NULL "
                "FROM DUAL "
                "WHERE NOT EXISTS ("
                "SELECT 1 FROM albums "
                f"WHERE artist_id = {artist.artist_id} "
                f"AND LOWER(TRIM(title)) = LOWER(TRIM({sql_quote(album.title)}))"
                ");"
            ),
            (
                "SET @album_id := ("
                "SELECT id FROM albums "
                f"WHERE artist_id = {artist.artist_id} "
                f"AND LOWER(TRIM(title)) = LOWER(TRIM({sql_quote(album.title)})) "
                "ORDER BY id ASC LIMIT 1"
                ");"
            ),
            (
                "INSERT INTO album_genres (album_id, genre_id) "
                "SELECT @album_id, g.id "
                "FROM genres g "
                f"WHERE g.name = {sql_quote(genre_name)} "
                "AND @album_id IS NOT NULL "
                "AND NOT EXISTS ("
                "SELECT 1 FROM album_genres ag WHERE ag.album_id = @album_id AND ag.genre_id = g.id"
                ");"
            ),
        ]

        for track_no, title, duration in album.tracks:
            sql_parts.append(
                "INSERT INTO tracks (album_id, track_number, title, duration) "
                "SELECT "
                f"@album_id, {int(track_no)}, {sql_quote(title)}, {sql_quote(duration)} "
                "FROM DUAL "
                "WHERE @album_id IS NOT NULL "
                "AND NOT EXISTS ("
                "SELECT 1 FROM tracks t "
                "WHERE t.album_id = @album_id "
                f"AND LOWER(TRIM(t.title)) = LOWER(TRIM({sql_quote(title)}))"
                ");"
            )

        sql_parts.append("COMMIT;")
        sql = "\n".join(sql_parts)
        if args.dry_run:
            inserted += 1
            continue
        run_mysql_sql(args, sql)
        inserted += 1
    return inserted


def dedup_albums_sql(database: str) -> str:
    return f"""
USE {database};
DELETE a1
FROM albums a1
JOIN albums a2
  ON a1.artist_id = a2.artist_id
 AND LOWER(TRIM(a1.title)) = LOWER(TRIM(a2.title))
 AND a1.id > a2.id;
"""


def main() -> int:
    args = parse_args()
    artists = get_artists_to_process(args)
    if not artists:
        print("No artists need studio album top-up.")
        return 0

    print(f"Artists to process: {len(artists)} (target={args.target_per_artist})")
    total_inserted = 0
    failed: List[Tuple[str, str]] = []

    for idx, artist in enumerate(artists, start=1):
        try:
            needed = max(0, int(args.target_per_artist) - int(artist.album_count))
            if needed <= 0:
                continue
            existing = get_existing_titles(args, artist.artist_id)
            candidates = fetch_studio_candidates_for_artist(
                artist_name=artist.name,
                artist_genre=artist.genre,
                needed=needed,
                existing_titles=existing,
                sleep_sec=args.sleep,
            )
            if not candidates:
                print(f"[{idx}/{len(artists)}] {artist.name}: no suitable studio albums found")
                continue

            mapped_genre = map_artist_genre_to_db(artist.genre)
            inserted = insert_albums_for_artist(args, artist, mapped_genre, candidates)
            total_inserted += inserted
            print(f"[{idx}/{len(artists)}] {artist.name}: inserted {inserted}/{needed}")
        except Exception as exc:
            failed.append((artist.name, str(exc)))
            print(f"[{idx}/{len(artists)}] {artist.name}: failed ({exc})")

    if not args.no_dedup_cleanup:
        if args.dry_run:
            print("Dry-run: skip DB dedup cleanup.")
        else:
            run_mysql_sql(args, dedup_albums_sql(args.database))
            print("DB-level duplicate cleanup completed.")

    print("\n==== Summary ====")
    print(f"Artists processed: {len(artists)}")
    print(f"Albums inserted: {total_inserted}")
    print(f"Artists failed: {len(failed)}")
    for name, reason in failed[:20]:
        print(f"- {name}: {reason}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
