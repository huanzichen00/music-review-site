#!/usr/bin/env python3
"""
Seed notable metalcore artists into MySQL (idempotent by artist name).
"""

from __future__ import annotations

import os
import subprocess
from typing import Dict, List, Optional


MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASS = os.getenv("MYSQL_PASS", "change_me")
MYSQL_DB = os.getenv("MYSQL_DB", "music_review")


METALCORE_ARTISTS: List[Dict[str, Optional[object]]] = [
    {"name": "Architects", "country": "UK", "formed_year": 2004, "genre": "Metalcore", "member_count": 4, "status": "活跃"},
    {"name": "ERRA", "country": "US", "formed_year": 2009, "genre": "Metalcore", "member_count": 5, "status": "活跃"},
    {"name": "While She Sleeps", "country": "UK", "formed_year": 2006, "genre": "Metalcore", "member_count": 5, "status": "活跃"},
    {"name": "Bring Me the Horizon", "country": "UK", "formed_year": 2004, "genre": "Metalcore", "member_count": 5, "status": "活跃"},
    {"name": "Killswitch Engage", "country": "US", "formed_year": 1999, "genre": "Metalcore", "member_count": 5, "status": "活跃"},
    {"name": "As I Lay Dying", "country": "US", "formed_year": 2000, "genre": "Metalcore", "member_count": 5, "status": "活跃"},
    {"name": "Parkway Drive", "country": "Australia", "formed_year": 2003, "genre": "Metalcore", "member_count": 5, "status": "活跃"},
    {"name": "August Burns Red", "country": "US", "formed_year": 2003, "genre": "Metalcore", "member_count": 5, "status": "活跃"},
    {"name": "The Devil Wears Prada", "country": "US", "formed_year": 2005, "genre": "Metalcore", "member_count": 5, "status": "活跃"},
    {"name": "Polaris", "country": "Australia", "formed_year": 2012, "genre": "Metalcore", "member_count": 5, "status": "活跃"},
    {"name": "Currents", "country": "US", "formed_year": 2011, "genre": "Metalcore", "member_count": 5, "status": "活跃"},
    {"name": "Invent Animate", "country": "US", "formed_year": 2011, "genre": "Metalcore", "member_count": 4, "status": "活跃"},
    {"name": "Northlane", "country": "Australia", "formed_year": 2009, "genre": "Metalcore", "member_count": 5, "status": "活跃"},
    {"name": "Bury Tomorrow", "country": "UK", "formed_year": 2006, "genre": "Metalcore", "member_count": 6, "status": "活跃"},
    {"name": "Bleed From Within", "country": "UK", "formed_year": 2005, "genre": "Metalcore", "member_count": 5, "status": "活跃"},
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


def main() -> int:
    inserted = 0
    for artist in METALCORE_ARTISTS:
        name = str(artist["name"]).strip()
        q = f"""
USE {MYSQL_DB};
INSERT INTO artists (name, name_initial, country, formed_year, genre, member_count, status, description, photo_url)
SELECT
  {sql_quote(name)},
  {sql_quote(name_initial(name))},
  {sql_quote(artist.get("country"))},
  {sql_quote(artist.get("formed_year"))},
  {sql_quote(artist.get("genre"))},
  {sql_quote(artist.get("member_count"))},
  {sql_quote(artist.get("status"))},
  {sql_quote("Seeded notable metalcore artists")},
  NULL
FROM DUAL
WHERE NOT EXISTS (
  SELECT 1 FROM artists WHERE LOWER(TRIM(name)) = LOWER(TRIM({sql_quote(name)}))
);
SELECT ROW_COUNT();
"""
        out = run_mysql(q).splitlines()
        # ROW_COUNT result is last line: 1 inserted, 0 skipped.
        if out and out[-1].strip() == "1":
            inserted += 1

    total = len(METALCORE_ARTISTS)
    print(f"Seed completed. Candidates: {total}, inserted: {inserted}, skipped(existing): {total - inserted}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
