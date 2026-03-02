#!/usr/bin/env python3
"""
Fallback top-up for artists still below 3 albums using curated studio album lists.
Idempotent: deduplicate by (artist_id, normalized title).
"""

from __future__ import annotations

import subprocess
from typing import Dict, List, Optional, Tuple


MYSQL_HOST = "127.0.0.1"
MYSQL_PORT = "3306"
MYSQL_USER = "root"
MYSQL_PASS = "Huanzc304"
MYSQL_DB = "music_review"

CURATED: Dict[str, List[Tuple[str, int]]] = {
    "Dire Straits": [("Dire Straits", 1978), ("Communique", 1979), ("Making Movies", 1980)],
    "Sigur Ros": [("Agatis byrjun", 1999), ("()", 2002), ("Takk...", 2005)],
    "Creedence Clearwater Revival": [("Bayou Country", 1969), ("Green River", 1969), ("Willy and the Poor Boys", 1969)],
    "King Crimson": [("In the Court of the Crimson King", 1969), ("Red", 1974), ("Discipline", 1981)],
    "Led Zeppelin": [("Led Zeppelin", 1969), ("Led Zeppelin II", 1969), ("Led Zeppelin IV", 1971)],
    "Slint": [("Tweez", 1989), ("Spiderland", 1991), ("Slint", 1994)],
    "X Japan": [("Vanishing Vision", 1988), ("Blue Blood", 1989), ("Jealousy", 1991)],
}


def sql_quote(value: Optional[object]) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("\\", "\\\\").replace("'", "''") + "'"


def title_initial(title: str) -> str:
    if not title:
        return "#"
    c = title.strip()[:1].upper()
    return c if "A" <= c <= "Z" else "#"


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


def get_artist_id_and_count(name: str) -> Optional[Tuple[int, int]]:
    q = f"""
USE {MYSQL_DB};
SELECT a.id, COUNT(al.id)
FROM artists a
LEFT JOIN albums al ON al.artist_id = a.id
WHERE LOWER(TRIM(a.name)) = LOWER(TRIM({sql_quote(name)}))
GROUP BY a.id;
"""
    rows = run_mysql(q)
    if not rows:
        return None
    parts = rows[0].split("\t")
    return int(parts[0]), int(parts[1])


def has_album(artist_id: int, title: str) -> bool:
    q = f"""
USE {MYSQL_DB};
SELECT 1
FROM albums
WHERE artist_id = {artist_id}
  AND LOWER(TRIM(title)) = LOWER(TRIM({sql_quote(title)}))
LIMIT 1;
"""
    return bool(run_mysql(q))


def insert_album(artist_id: int, title: str, year: int) -> None:
    q = f"""
USE {MYSQL_DB};
INSERT INTO albums (title, title_initial, artist_id, release_year, cover_url, description, created_by)
VALUES (
  {sql_quote(title)},
  {sql_quote(title_initial(title))},
  {artist_id},
  {year},
  NULL,
  {sql_quote("Curated studio fallback top-up")},
  NULL
);
"""
    run_mysql(q)


def main() -> int:
    inserted = 0
    for artist_name, albums in CURATED.items():
        info = get_artist_id_and_count(artist_name)
        if not info:
            print(f"[SKIP] artist not found: {artist_name}")
            continue
        artist_id, count = info
        if count >= 3:
            print(f"[OK] {artist_name}: already {count}")
            continue
        for title, year in albums:
            if has_album(artist_id, title):
                continue
            insert_album(artist_id, title, year)
            inserted += 1
            count += 1
            print(f"[ADD] {artist_name} -> {title} ({year})")
            if count >= 3:
                break
        print(f"[DONE] {artist_name}: now {count}")
    print(f"Inserted albums: {inserted}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

