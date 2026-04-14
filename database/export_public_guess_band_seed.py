#!/usr/bin/env python3
"""
Export public guess-band data to database/seed_public_guess_band.sql.

Included tables:
  - anonymized demo users for public banks
  - question_banks (PUBLIC only)
  - question_bank_items for exported banks

Excluded data:
  - private banks
  - guest localStorage banks
  - events, favorites, reviews, blog data, online room history
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
from pathlib import Path

import pymysql


DEMO_USER_ID_BASE = 900000000


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export public guess-band seed SQL for open-source bootstrap.")
    parser.add_argument("--db-host", default=os.getenv("DB_HOST", "127.0.0.1"))
    parser.add_argument("--db-port", type=int, default=int(os.getenv("DB_PORT", "3306")))
    parser.add_argument("--db-name", default=os.getenv("DB_NAME", "music_review"))
    parser.add_argument("--db-user", default=os.getenv("DB_USER", "music_review_app"))
    parser.add_argument("--db-pass", default=os.getenv("DB_PASS", ""))
    parser.add_argument(
        "--out",
        default=str(Path(__file__).resolve().parent / "seed_public_guess_band.sql"),
        help="Output SQL path",
    )
    parser.add_argument(
        "--include-empty",
        action="store_true",
        help="Include public banks with zero items.",
    )
    return parser.parse_args()


def sql_value(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, (dt.datetime, dt.date, dt.time)):
        value = value.isoformat(sep=" ")
    text = str(value)
    text = (
        text.replace("\\", "\\\\")
        .replace("'", "\\'")
        .replace("\r", "\\r")
        .replace("\n", "\\n")
    )
    return f"'{text}'"


def build_demo_user(owner_id: int, username: str, created_at, updated_at):
    demo_id = DEMO_USER_ID_BASE + owner_id
    safe_name = "".join(ch for ch in username if ch.isalnum()) or f"user{owner_id}"
    demo_username = f"demo_{safe_name[:32]}"
    demo_email = f"{demo_username}@example.invalid"
    return (
        demo_id,
        demo_username,
        demo_email,
        "OPEN_SOURCE_DEMO_NOT_FOR_LOGIN",
        "USER",
        created_at,
        updated_at,
    )


def main() -> int:
    args = parse_args()
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    conn = pymysql.connect(
        host=args.db_host,
        port=args.db_port,
        user=args.db_user,
        password=args.db_pass,
        database=args.db_name,
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True,
    )

    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    qb.id,
                    qb.name,
                    qb.visibility,
                    qb.share_token,
                    qb.owner_user_id,
                    qb.created_at,
                    qb.updated_at,
                    u.username AS owner_username,
                    COUNT(qbi.id) AS item_count
                FROM question_banks qb
                JOIN users u ON u.id = qb.owner_user_id
                LEFT JOIN question_bank_items qbi ON qbi.question_bank_id = qb.id
                WHERE qb.visibility = 'PUBLIC'
                GROUP BY
                    qb.id, qb.name, qb.visibility, qb.share_token,
                    qb.owner_user_id, qb.created_at, qb.updated_at, u.username
                ORDER BY qb.id
                """
            )
            banks = list(cur.fetchall())

            if not args.include_empty:
                banks = [bank for bank in banks if int(bank["item_count"] or 0) > 0]

            bank_ids = [int(bank["id"]) for bank in banks]
            items_by_bank = {bank_id: [] for bank_id in bank_ids}
            if bank_ids:
                placeholders = ", ".join(["%s"] * len(bank_ids))
                cur.execute(
                    f"""
                    SELECT question_bank_id, artist_id, created_at
                    FROM question_bank_items
                    WHERE question_bank_id IN ({placeholders})
                    ORDER BY question_bank_id, id
                    """,
                    bank_ids,
                )
                for row in cur.fetchall():
                    items_by_bank[int(row["question_bank_id"])].append(row)

        owners = {}
        for bank in banks:
            owner_id = int(bank["owner_user_id"])
            if owner_id not in owners:
                owners[owner_id] = build_demo_user(
                    owner_id,
                    bank["owner_username"],
                    bank["created_at"],
                    bank["updated_at"],
                )

        with out_path.open("w", encoding="utf-8") as f:
            f.write("-- Public guess-band seed dataset (anonymized)\n")
            f.write("-- Generated by database/export_public_guess_band_seed.py\n\n")
            f.write("USE music_review;\n")
            f.write("SET NAMES utf8mb4;\n")
            f.write("SET FOREIGN_KEY_CHECKS=0;\n\n")

            if bank_ids:
                bank_id_sql = ", ".join(str(bank_id) for bank_id in bank_ids)
                demo_user_id_sql = ", ".join(str(row[0]) for row in owners.values())
                f.write(f"DELETE FROM question_bank_items WHERE question_bank_id IN ({bank_id_sql});\n")
                f.write(f"DELETE FROM question_banks WHERE id IN ({bank_id_sql});\n")
                f.write(f"DELETE FROM users WHERE id IN ({demo_user_id_sql});\n\n")

            for demo_user in owners.values():
                f.write(
                    "INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `created_at`, `updated_at`) "
                    f"VALUES ({', '.join(sql_value(v) for v in demo_user)});\n"
                )
            if owners:
                f.write("\n")

            for bank in banks:
                demo_owner_id = DEMO_USER_ID_BASE + int(bank["owner_user_id"])
                row = (
                    int(bank["id"]),
                    bank["name"],
                    bank["visibility"],
                    bank["share_token"],
                    demo_owner_id,
                    bank["created_at"],
                    bank["updated_at"],
                )
                f.write(
                    "INSERT INTO `question_banks` (`id`, `name`, `visibility`, `share_token`, `owner_user_id`, `created_at`, `updated_at`) "
                    f"VALUES ({', '.join(sql_value(v) for v in row)});\n"
                )
                for item in items_by_bank[int(bank["id"])]:
                    item_row = (
                        int(item["question_bank_id"]),
                        int(item["artist_id"]),
                        item["created_at"],
                    )
                    f.write(
                        "INSERT INTO `question_bank_items` (`question_bank_id`, `artist_id`, `created_at`) "
                        f"VALUES ({', '.join(sql_value(v) for v in item_row)});\n"
                    )
                f.write("\n")

            f.write("SET FOREIGN_KEY_CHECKS=1;\n")
    finally:
        conn.close()

    print(f"Wrote {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
