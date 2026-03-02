#!/usr/bin/env python3
"""
Seed a curated set of RYM-popular high-rated broad rock artists into MySQL.

Notes:
- Uses a curated list inspired by well-known RYM favorites in broad rock domains
  (progressive rock, post-rock, art rock, indie rock, alternative rock, etc.).
- Deduplicates by LOWER(TRIM(name)).
- Safe to run repeatedly.
"""

from __future__ import annotations

import argparse
import subprocess
from typing import Dict, List, Optional


MYSQL_HOST = "127.0.0.1"
MYSQL_PORT = "3306"
MYSQL_USER = "root"
MYSQL_PASS = "Huanzc304"
MYSQL_DB = "music_review"


RYM_ROCK_ARTISTS: List[Dict[str, Optional[object]]] = [
    {"name": "Radiohead", "country": "UK", "formed_year": 1985, "genre": "Alternative Rock", "member_count": 5, "status": "活跃"},
    {"name": "Pink Floyd", "country": "UK", "formed_year": 1965, "genre": "Progressive Rock", "member_count": 5, "status": "解散"},
    {"name": "King Crimson", "country": "UK", "formed_year": 1968, "genre": "Progressive Rock", "member_count": 4, "status": "活跃"},
    {"name": "Yes", "country": "UK", "formed_year": 1968, "genre": "Progressive Rock", "member_count": 5, "status": "活跃"},
    {"name": "Genesis", "country": "UK", "formed_year": 1967, "genre": "Progressive Rock", "member_count": 5, "status": "活跃"},
    {"name": "Rush", "country": "Canada", "formed_year": 1968, "genre": "Progressive Rock", "member_count": 3, "status": "解散"},
    {"name": "The Beatles", "country": "UK", "formed_year": 1960, "genre": "Rock", "member_count": 4, "status": "解散"},
    {"name": "The Beach Boys", "country": "US", "formed_year": 1961, "genre": "Rock", "member_count": 5, "status": "活跃"},
    {"name": "The Velvet Underground", "country": "US", "formed_year": 1964, "genre": "Art Rock", "member_count": 4, "status": "解散"},
    {"name": "Television", "country": "US", "formed_year": 1973, "genre": "Post Punk", "member_count": 4, "status": "活跃"},
    {"name": "Wire", "country": "UK", "formed_year": 1976, "genre": "Post Punk", "member_count": 4, "status": "活跃"},
    {"name": "Joy Division", "country": "UK", "formed_year": 1976, "genre": "Post Punk", "member_count": 4, "status": "解散"},
    {"name": "Talking Heads", "country": "US", "formed_year": 1975, "genre": "Art Rock", "member_count": 4, "status": "解散"},
    {"name": "Sonic Youth", "country": "US", "formed_year": 1981, "genre": "Alternative Rock", "member_count": 4, "status": "暂停"},
    {"name": "Pixies", "country": "US", "formed_year": 1986, "genre": "Alternative Rock", "member_count": 4, "status": "活跃"},
    {"name": "My Bloody Valentine", "country": "Ireland", "formed_year": 1983, "genre": "Alternative Rock", "member_count": 4, "status": "活跃"},
    {"name": "Slowdive", "country": "UK", "formed_year": 1989, "genre": "Alternative Rock", "member_count": 5, "status": "活跃"},
    {"name": "Swans", "country": "US", "formed_year": 1982, "genre": "Post Rock", "member_count": 6, "status": "活跃"},
    {"name": "Godspeed You! Black Emperor", "country": "Canada", "formed_year": 1994, "genre": "Post Rock", "member_count": 8, "status": "活跃"},
    {"name": "Mogwai", "country": "UK", "formed_year": 1995, "genre": "Post Rock", "member_count": 4, "status": "活跃"},
    {"name": "Sigur Ros", "country": "Iceland", "formed_year": 1994, "genre": "Post Rock", "member_count": 3, "status": "活跃"},
    {"name": "Slint", "country": "US", "formed_year": 1986, "genre": "Post Rock", "member_count": 4, "status": "活跃"},
    {"name": "Talk Talk", "country": "UK", "formed_year": 1981, "genre": "Art Rock", "member_count": 3, "status": "解散"},
    {"name": "Can", "country": "Germany", "formed_year": 1968, "genre": "Progressive Rock", "member_count": 5, "status": "解散"},
    {"name": "Neu!", "country": "Germany", "formed_year": 1971, "genre": "Rock", "member_count": 2, "status": "解散"},
    {"name": "The Strokes", "country": "US", "formed_year": 1998, "genre": "Indie Rock", "member_count": 5, "status": "活跃"},
    {"name": "Arcade Fire", "country": "Canada", "formed_year": 2001, "genre": "Indie Rock", "member_count": 6, "status": "活跃"},
    {"name": "The National", "country": "US", "formed_year": 1999, "genre": "Indie Rock", "member_count": 5, "status": "活跃"},
    {"name": "Interpol", "country": "US", "formed_year": 1997, "genre": "Post Punk", "member_count": 3, "status": "活跃"},
    {"name": "Black Country, New Road", "country": "UK", "formed_year": 2018, "genre": "Alternative Rock", "member_count": 6, "status": "活跃"},
]


def sql_quote(value: Optional[object]) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    text = str(value).replace("\\", "\\\\").replace("'", "''")
    return f"'{text}'"


def name_initial(name: str) -> str:
    if not name:
        return "#"
    first = name.strip()[:1].upper()
    return first if "A" <= first <= "Z" else "#"


def run_mysql(sql: str) -> str:
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
        sql,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or proc.stdout.strip())
    return proc.stdout.strip()


def build_insert_sql(artist: Dict[str, Optional[object]]) -> str:
    name = str(artist["name"]).strip()
    country = artist.get("country")
    formed_year = artist.get("formed_year")
    genre = artist.get("genre")
    member_count = artist.get("member_count")
    status = artist.get("status")
    description = f"Seeded from curated RYM high-rated/popular broad rock list: {genre or 'Rock'}"

    return f"""
INSERT INTO artists (name, name_initial, country, formed_year, genre, member_count, status, description, photo_url)
SELECT
  {sql_quote(name)},
  {sql_quote(name_initial(name))},
  {sql_quote(country)},
  {sql_quote(formed_year)},
  {sql_quote(genre)},
  {sql_quote(member_count)},
  {sql_quote(status)},
  {sql_quote(description)},
  NULL
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM artists WHERE LOWER(TRIM(name)) = LOWER(TRIM({sql_quote(name)}))
);
"""


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed curated RYM-like high-rated broad rock artists.")
    parser.add_argument("--dry-run", action="store_true", help="Preview which artists would be inserted.")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of artists to process")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    selected = RYM_ROCK_ARTISTS[: args.limit] if args.limit and args.limit > 0 else RYM_ROCK_ARTISTS

    if args.dry_run:
        print(f"Dry-run: total candidate artists = {len(selected)}")
        for row in selected:
            print(f"- {row['name']} ({row['country']}, {row['genre']})")
        return 0

    inserted = 0
    for artist in selected:
        sql = f"USE {MYSQL_DB};\n{build_insert_sql(artist)}"
        before = run_mysql(
            f"USE {MYSQL_DB}; SELECT COUNT(*) FROM artists WHERE LOWER(TRIM(name)) = LOWER(TRIM({sql_quote(artist['name'])}));"
        )
        run_mysql(sql)
        after = run_mysql(
            f"USE {MYSQL_DB}; SELECT COUNT(*) FROM artists WHERE LOWER(TRIM(name)) = LOWER(TRIM({sql_quote(artist['name'])}));"
        )
        if before.strip() == "0" and after.strip() != "0":
            inserted += 1

    print(f"Seed completed. Candidates: {len(selected)}, inserted: {inserted}, skipped(existing): {len(selected) - inserted}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
