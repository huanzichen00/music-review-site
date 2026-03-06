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
import hashlib
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
NETEASE_SEARCH = "https://music.163.com/api/search/get"

# Project-local defaults (non-secret defaults; override via env vars)
MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASS = os.getenv("MYSQL_PASS", "change_me")
MYSQL_DB = os.getenv("MYSQL_DB", "music_review")

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
    remote_cover_url: Optional[str]
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
    parser.add_argument(
        "--upload-dir",
        default="/opt/music-review/uploads",
        help="Backend upload root dir for local covers (default: /opt/music-review/uploads)",
    )
    parser.add_argument("--cover-timeout", type=float, default=12.0, help="Cover download timeout seconds (default: 12)")
    parser.add_argument(
        "--localize-existing-only",
        action="store_true",
        help="Only replace existing coverartarchive URLs with local cover URLs, then exit",
    )
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


def clamp_text(value: Optional[str], max_len: int) -> str:
    text = (value or "").strip()
    if len(text) <= max_len:
        return text
    return text[:max_len]


def title_initial(title: str) -> str:
    if not title:
        return "#"
    first = title.strip()[:1].upper()
    return first if "A" <= first <= "Z" else "#"


def normalize_title(title: str) -> str:
    return re.sub(r"\s+", " ", (title or "").strip().lower())


def normalize_artist_key(name: str) -> str:
    lowered = (name or "").strip().lower()
    lowered = re.sub(r"^the\s+", "", lowered)
    lowered = re.sub(r"[^a-z0-9\u4e00-\u9fa5]+", "", lowered)
    return lowered


def normalize_text_key(value: str) -> str:
    text = (value or "").strip().lower()
    text = re.sub(r"\s+", " ", text)
    return re.sub(r"[^a-z0-9\u4e00-\u9fa5]+", "", text)


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


def group_belongs_to_artist(group: Dict, artist_name: str) -> bool:
    expected_keys = {normalize_artist_key(v) for v in artist_query_variants(artist_name)}
    expected_keys = {key for key in expected_keys if key}
    if not expected_keys:
        return True

    credits = group.get("artist-credit") or []
    found_keys: set[str] = set()
    for item in credits:
        if not isinstance(item, dict):
            continue
        display_name = item.get("name")
        artist_obj = item.get("artist") or {}
        artist_name_field = artist_obj.get("name")
        sort_name_field = artist_obj.get("sort-name")
        for candidate in (display_name, artist_name_field, sort_name_field):
            key = normalize_artist_key(str(candidate or ""))
            if key:
                found_keys.add(key)

    # If MB did not return artist-credit details, keep old behavior.
    if not found_keys:
        return True
    return bool(found_keys & expected_keys)


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


def file_ext_from_content_type(content_type: str) -> str:
    ct = (content_type or "").lower()
    if "png" in ct:
        return ".png"
    if "webp" in ct:
        return ".webp"
    if "gif" in ct:
        return ".gif"
    return ".jpg"


def ensure_cover_dir(upload_root: str) -> str:
    cover_dir = os.path.join(upload_root, "album-covers")
    os.makedirs(cover_dir, exist_ok=True)
    return cover_dir


def fetch_image_bytes(remote_url: str, timeout_sec: float) -> Tuple[Optional[bytes], Optional[str]]:
    req = urllib.request.Request(
        remote_url,
        headers={"User-Agent": USER_AGENT, "Accept": "image/*,*/*;q=0.8"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            content = resp.read()
            if not content:
                return None, None
            return content, file_ext_from_content_type(resp.headers.get("Content-Type", ""))
    except Exception:
        return None, None


def search_itunes_cover_url(artist_name: str, album_title: str, timeout_sec: float) -> Optional[str]:
    query = urllib.parse.urlencode(
        {
            "term": f"{artist_name} {album_title}",
            "entity": "album",
            "limit": "8",
            "country": "US",
        }
    )
    url = f"https://itunes.apple.com/search?{query}"
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None

    expected_artist = normalize_text_key(artist_name)
    expected_album = normalize_text_key(album_title)
    results = data.get("results") or []
    for row in results:
        artist = normalize_text_key(str(row.get("artistName") or ""))
        album = normalize_text_key(str(row.get("collectionName") or ""))
        if expected_artist and artist != expected_artist:
            continue
        if expected_album and expected_album not in album and album not in expected_album:
            continue
        artwork = str(row.get("artworkUrl100") or "").strip()
        if artwork:
            return artwork.replace("100x100bb", "1000x1000bb")

    for row in results:
        artwork = str(row.get("artworkUrl100") or "").strip()
        if artwork:
            return artwork.replace("100x100bb", "1000x1000bb")
    return None


def search_netease_cover_url(artist_name: str, album_title: str, timeout_sec: float) -> Optional[str]:
    query = urllib.parse.urlencode(
        {
            "s": f"{artist_name} {album_title}",
            "type": 10,  # album
            "offset": 0,
            "total": "true",
            "limit": 20,
        }
    )
    url = f"{NETEASE_SEARCH}?{query}"
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": USER_AGENT,
            "Accept": "application/json",
            "Referer": "https://music.163.com/",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        return None

    expected_artist = normalize_text_key(artist_name)
    expected_album = normalize_text_key(album_title)
    albums = (data.get("result") or {}).get("albums") or []
    best_url = None
    best_score = -1
    for row in albums:
        title = normalize_text_key(str(row.get("name") or ""))
        artist_obj = row.get("artist") or {}
        artist = normalize_text_key(str(artist_obj.get("name") or ""))
        pic = str(row.get("picUrl") or "").strip()
        if not pic:
            continue
        score = 0
        if expected_album and title == expected_album:
            score += 8
        elif expected_album and (expected_album in title or title in expected_album):
            score += 5
        if expected_artist and artist == expected_artist:
            score += 7
        elif expected_artist and (expected_artist in artist or artist in expected_artist):
            score += 3
        if score > best_score:
            best_score = score
            best_url = pic
    if not best_url:
        return None
    if best_url.startswith("http://"):
        best_url = "https://" + best_url[len("http://") :]
    return best_url


def download_cover_to_local(
    upload_root: str,
    remote_url: Optional[str],
    stable_key: str,
    timeout_sec: float,
    artist_name: str = "",
    album_title: str = "",
) -> Optional[str]:
    primary = (remote_url or "").strip()
    netease_fallback = (
        search_netease_cover_url(artist_name, album_title, timeout_sec) if artist_name or album_title else None
    )
    itunes_fallback = (
        search_itunes_cover_url(artist_name, album_title, timeout_sec) if artist_name or album_title else None
    )
    candidate_urls = [u for u in [netease_fallback, primary, itunes_fallback] if u]
    if not candidate_urls:
        return None

    cover_dir = ensure_cover_dir(upload_root)
    content = None
    ext = None
    for url in candidate_urls:
        content, ext = fetch_image_bytes(url, timeout_sec)
        if content:
            break
    if not content:
        return None

    filename = hashlib.sha1(stable_key.encode("utf-8")).hexdigest()[:32] + ext
    full_path = os.path.join(cover_dir, filename)
    if not os.path.exists(full_path):
        with open(full_path, "wb") as f:
            f.write(content)
    return f"/api/files/album-covers/{filename}"


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
            if not group_belongs_to_artist(group, artist_name):
                continue
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
                remote_cover_url=build_cover_url(group_id),
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
        safe_album_title = clamp_text(album.title, 200)
        local_cover_url = None
        if not args.dry_run:
            local_cover_url = download_cover_to_local(
                upload_root=args.upload_dir,
                remote_url=album.remote_cover_url,
                stable_key=f"{artist.artist_id}:{normalize_title(safe_album_title)}:{album.mb_release_group_id}",
                timeout_sec=args.cover_timeout,
                artist_name=artist.name,
                album_title=safe_album_title,
            )

        sql_parts = [
            f"USE {args.database};",
            "START TRANSACTION;",
            ensure_genre_sql(genre_name),
            (
                "INSERT INTO albums (title, title_initial, artist_id, release_year, cover_url, description, created_by) "
                "SELECT "
                f"{sql_quote(safe_album_title)}, {sql_quote(title_initial(safe_album_title))}, {artist.artist_id}, "
                f"{sql_quote(album.year)}, {sql_quote(local_cover_url)}, {sql_quote(album.description)}, NULL "
                "FROM DUAL "
                "WHERE NOT EXISTS ("
                "SELECT 1 FROM albums "
                f"WHERE artist_id = {artist.artist_id} "
                f"AND LOWER(TRIM(title)) = LOWER(TRIM({sql_quote(safe_album_title)}))"
                ");"
            ),
            (
                "SET @album_id := ("
                "SELECT id FROM albums "
                f"WHERE artist_id = {artist.artist_id} "
                f"AND LOWER(TRIM(title)) = LOWER(TRIM({sql_quote(safe_album_title)})) "
                "ORDER BY id ASC LIMIT 1"
                ");"
            ),
            (
                "UPDATE albums "
                f"SET cover_url = {sql_quote(local_cover_url)} "
                "WHERE id = @album_id "
                f"AND {sql_quote(local_cover_url)} IS NOT NULL "
                "AND (cover_url IS NULL OR cover_url = '' OR cover_url LIKE 'https://coverartarchive.org/%');"
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
            safe_track_title = clamp_text(title, 200)
            sql_parts.append(
                "INSERT INTO tracks (album_id, track_number, title, duration) "
                "SELECT "
                f"@album_id, {int(track_no)}, {sql_quote(safe_track_title)}, {sql_quote(duration)} "
                "FROM DUAL "
                "WHERE @album_id IS NOT NULL "
                "AND NOT EXISTS ("
                "SELECT 1 FROM tracks t "
                "WHERE t.album_id = @album_id "
                f"AND LOWER(TRIM(t.title)) = LOWER(TRIM({sql_quote(safe_track_title)}))"
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


def get_albums_with_caa_cover(args: argparse.Namespace) -> List[Tuple[int, str, int, str, str]]:
    q = f"""
USE {args.database};
SELECT al.id, al.title, al.artist_id, ar.name, al.cover_url
FROM albums al
JOIN artists ar ON ar.id = al.artist_id
WHERE cover_url LIKE 'https://coverartarchive.org/%'
ORDER BY al.id;
"""
    rows = run_mysql_query(args, q)
    out: List[Tuple[int, str, int, str, str]] = []
    for row in rows:
        parts = row.split("\t")
        if len(parts) < 5:
            continue
        out.append((int(parts[0]), parts[1], int(parts[2]), parts[3], parts[4]))
    return out


def localize_existing_cover_urls(args: argparse.Namespace) -> Tuple[int, int]:
    rows = get_albums_with_caa_cover(args)
    if not rows:
        print("No existing coverartarchive URLs need localization.")
        return 0, 0

    print(f"Localizing existing cover URLs: {len(rows)}")
    ok = 0
    failed = 0
    for idx, (album_id, title, artist_id, artist_name, remote_url) in enumerate(rows, start=1):
        try:
            local = None
            if not args.dry_run:
                local = download_cover_to_local(
                    upload_root=args.upload_dir,
                    remote_url=remote_url,
                    stable_key=f"album:{album_id}:{artist_id}:{normalize_title(title)}",
                    timeout_sec=args.cover_timeout,
                    artist_name=artist_name,
                    album_title=title,
                )
            if args.dry_run:
                ok += 1
            elif local:
                sql = f"""
USE {args.database};
UPDATE albums
SET cover_url = {sql_quote(local)}
WHERE id = {album_id}
  AND cover_url LIKE 'https://coverartarchive.org/%';
"""
                run_mysql_sql(args, sql)
                ok += 1
            else:
                failed += 1
            if idx % 5 == 0:
                print(f"  progress: {idx}/{len(rows)} (ok={ok}, failed={failed})")
        except Exception:
            failed += 1
        time.sleep(max(0.05, args.sleep / 4))

    print(f"Localized cover URLs: success={ok}, failed={failed}")
    return ok, failed


def main() -> int:
    args = parse_args()
    if args.localize_existing_only:
        localize_existing_cover_urls(args)
        return 0

    localize_existing_cover_urls(args)
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
