#!/usr/bin/env python3
"""
Generate album cover WebP thumbnails for frontend-first static serving.

Outputs:
  /var/www/music-review/covers/{album_id}_300.webp
  /var/www/music-review/covers/{album_id}_600.webp

Idempotent:
  Existing target files are skipped unless --force is set.
"""

from __future__ import annotations

import argparse
import io
import os
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

import pymysql
import requests
from PIL import Image, UnidentifiedImageError


TARGET_SIZES = (300, 600)
LANCZOS = getattr(getattr(Image, "Resampling", Image), "LANCZOS", Image.LANCZOS)


@dataclass
class AlbumCoverRow:
    album_id: int
    cover_url: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate 300/600 WebP album covers.")
    parser.add_argument("--db-host", default=os.getenv("DB_HOST", "127.0.0.1"))
    parser.add_argument("--db-port", type=int, default=int(os.getenv("DB_PORT", "3306")))
    parser.add_argument("--db-name", default=os.getenv("DB_NAME", "music_review"))
    parser.add_argument("--db-user", default=os.getenv("DB_USER", "music_review_app"))
    parser.add_argument("--db-pass", default=os.getenv("DB_PASS", "music_review_app_2026!"))
    parser.add_argument("--covers-dir", default=os.getenv("COVERS_DIR", "/var/www/music-review/covers"))
    parser.add_argument("--upload-dir", default=os.getenv("UPLOAD_DIR", "/opt/music-review/uploads/album-covers"))
    parser.add_argument("--quality", type=int, default=75)
    parser.add_argument("--limit", type=int, default=0, help="Only process first N rows (0 = all).")
    parser.add_argument("--sleep", type=float, default=0.08, help="Seconds between rows to keep low load.")
    parser.add_argument("--timeout", type=float, default=12.0, help="HTTP timeout in seconds.")
    parser.add_argument("--force", action="store_true", help="Regenerate files even if already present.")
    parser.add_argument("--dry-run", action="store_true", help="Print actions but do not write files.")
    return parser.parse_args()


def db_rows(args: argparse.Namespace) -> Iterable[AlbumCoverRow]:
    sql = """
        SELECT id, cover_url
        FROM albums
        WHERE cover_url IS NOT NULL
          AND cover_url <> ''
        ORDER BY id ASC
    """
    if args.limit and args.limit > 0:
        sql += f" LIMIT {int(args.limit)}"
    conn = pymysql.connect(
        host=args.db_host,
        port=args.db_port,
        user=args.db_user,
        password=args.db_pass,
        database=args.db_name,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.Cursor,
        autocommit=True,
    )
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
            for album_id, cover_url in cur.fetchall():
                if album_id is None or not cover_url:
                    continue
                yield AlbumCoverRow(int(album_id), str(cover_url).strip())
    finally:
        conn.close()


def read_source_bytes(row: AlbumCoverRow, upload_dir: Path, timeout: float) -> Optional[bytes]:
    url = row.cover_url
    if url.startswith("http://") or url.startswith("https://"):
        resp = requests.get(url, timeout=timeout)
        if resp.status_code != 200:
            return None
        return resp.content
    if url.startswith("/api/files/album-covers/"):
        filename = url.split("/")[-1]
        path = upload_dir / filename
        if not path.exists():
            return None
        return path.read_bytes()
    if url.startswith("/covers/"):
        # Already static cover URL in another deployment mode.
        return None
    return None


def save_variants(raw: bytes, out_base: Path, quality: int, force: bool, dry_run: bool) -> bool:
    out_files = [out_base.with_name(f"{out_base.name}_{edge}.webp") for edge in TARGET_SIZES]
    if not force and all(p.exists() for p in out_files):
        return False
    try:
        with Image.open(io.BytesIO(raw)) as img:
            src = img.convert("RGB")
            for edge, out_path in zip(TARGET_SIZES, out_files):
                if not force and out_path.exists():
                    continue
                thumb = src.copy()
                thumb.thumbnail((edge, edge), LANCZOS)
                if dry_run:
                    continue
                thumb.save(out_path, format="WEBP", quality=quality, method=6)
    except (UnidentifiedImageError, OSError, ValueError):
        return False
    return True


def main() -> int:
    args = parse_args()
    covers_dir = Path(args.covers_dir)
    upload_dir = Path(args.upload_dir)
    if not args.dry_run:
        covers_dir.mkdir(parents=True, exist_ok=True)

    processed = 0
    generated = 0
    skipped = 0
    failed = 0

    for row in db_rows(args):
        processed += 1
        out_base = covers_dir / str(row.album_id)
        raw = read_source_bytes(row, upload_dir, args.timeout)
        if not raw:
            skipped += 1
            continue
        changed = save_variants(raw, out_base, args.quality, args.force, args.dry_run)
        if changed:
            generated += 1
        else:
            skipped += 1
        if args.sleep > 0:
            time.sleep(args.sleep)

    print(f"processed={processed} generated={generated} skipped={skipped} failed={failed} dry_run={args.dry_run}")
    print(f"covers_dir={covers_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
