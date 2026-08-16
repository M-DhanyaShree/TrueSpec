from __future__ import annotations

import argparse
import sys
from collections import Counter
from pathlib import Path
from typing import Any

import pandas as pd
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert

from app.db.session import SessionLocal
from app.ingestion.review_quality import assess_review_text, normalized_hash
from app.models.laptop import Laptop
from app.models.price_history import PriceHistory
from app.models.review import Review
from app.models.spec import LaptopSpec


def _nullable(value: Any) -> Any:
    if value is None:
        return None
    if pd.isna(value):
        return None
    return value


def _records(df: pd.DataFrame) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for row in df.to_dict(orient="records"):
        out.append({k: _nullable(v) for k, v in row.items()})
    return out


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Load processed seed CSV files into PostgreSQL.")
    parser.add_argument("--processed-dir", default="", help="Path to processed CSV directory")
    return parser.parse_args()


def _read_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Missing required seed file: {path}")
    return pd.read_csv(path)


def _upsert_laptop(session, row: dict) -> str:
    stmt = (
        insert(Laptop)
        .values(
            sku=row["sku"],
            brand=row["brand"],
            model_name=row["model_name"],
            release_year=row.get("release_year"),
            is_prerelease=bool(row.get("is_prerelease", False)),
            launch_price=row.get("launch_price"),
            currency=row.get("currency") or "USD",
            product_url=row.get("product_url"),
        )
        .on_conflict_do_update(
            index_elements=[Laptop.sku],
            set_={
                "brand": row["brand"],
                "model_name": row["model_name"],
                "release_year": row.get("release_year"),
                "is_prerelease": bool(row.get("is_prerelease", False)),
                "launch_price": row.get("launch_price"),
                "currency": row.get("currency") or "USD",
                "product_url": row.get("product_url"),
            },
        )
        .returning(Laptop.id)
    )
    result = session.execute(stmt).scalar_one()
    return str(result)


def _build_review_quality_report(reviews_df: pd.DataFrame, report_path: Path) -> pd.DataFrame:
    review_records = _records(reviews_df)
    hashes = [normalized_hash(str(row.get("review_text") or "")) for row in review_records]
    hash_counts = Counter(hashes)

    rows: list[dict[str, Any]] = []
    for row, text_hash in zip(review_records, hashes):
        review_text = str(row.get("review_text") or "").strip()
        assessment = assess_review_text(review_text, duplicate_count=hash_counts[text_hash])
        rows.append(
            {
                "sku": row.get("sku"),
                "review_source": row.get("review_source") or "seed",
                "external_id": row.get("external_id"),
                "review_date": row.get("review_date"),
                "is_suspected_low_quality": assessment.is_low_quality,
                "low_quality_score": assessment.low_quality_score,
                "quality_reasons": "|".join(assessment.reasons),
            }
        )

    report_df = pd.DataFrame(rows)
    report_df.to_csv(report_path, index=False)
    return report_df


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[2]
    processed_dir = Path(args.processed_dir).resolve() if args.processed_dir else repo_root / "data" / "processed"

    laptops_df = _read_csv(processed_dir / "laptops.csv")
    specs_df = _read_csv(processed_dir / "laptop_specs.csv")
    reviews_df = _read_csv(processed_dir / "reviews.csv")
    prices_df = _read_csv(processed_dir / "price_history.csv")
    quality_report_path = processed_dir / "review_quality_report.csv"
    quality_report_df = _build_review_quality_report(reviews_df, quality_report_path)

    quality_lookup = {
        (
            str(record.get("sku") or ""),
            str(record.get("review_source") or "seed"),
            str(record.get("external_id") or ""),
            str(record.get("review_date") or ""),
        ): record
        for record in _records(quality_report_df)
    }

    session = SessionLocal()
    try:
        sku_to_id: dict[str, str] = {}

        for row in _records(laptops_df):
            laptop_id = _upsert_laptop(session, row)
            sku_to_id[row["sku"]] = laptop_id

        for row in _records(specs_df):
            laptop_id = sku_to_id.get(row["sku"])
            if not laptop_id:
                continue
            stmt = (
                insert(LaptopSpec)
                .values(
                    laptop_id=laptop_id,
                    cpu=row["cpu"],
                    gpu=row.get("gpu"),
                    ram_gb=int(row["ram_gb"]),
                    storage_gb=int(row["storage_gb"]),
                    display_size_in=row.get("display_size_in"),
                    display_resolution=row.get("display_resolution"),
                    battery_wh=row.get("battery_wh"),
                    weight_kg=row.get("weight_kg"),
                )
                .on_conflict_do_update(
                    index_elements=[LaptopSpec.laptop_id],
                    set_={
                        "cpu": row["cpu"],
                        "gpu": row.get("gpu"),
                        "ram_gb": int(row["ram_gb"]),
                        "storage_gb": int(row["storage_gb"]),
                        "display_size_in": row.get("display_size_in"),
                        "display_resolution": row.get("display_resolution"),
                        "battery_wh": row.get("battery_wh"),
                        "weight_kg": row.get("weight_kg"),
                    },
                )
            )
            session.execute(stmt)

        session.execute(delete(Review).where(Review.source == "seed"))
        session.execute(delete(PriceHistory).where(PriceHistory.source == "seed"))

        for row in _records(reviews_df):
            laptop_id = sku_to_id.get(row["sku"])
            if not laptop_id or not row.get("review_text"):
                continue
            key = (
                str(row.get("sku") or ""),
                str(row.get("review_source") or "seed"),
                str(row.get("external_id") or ""),
                str(row.get("review_date") or ""),
            )
            quality_row = quality_lookup.get(key, {})
            review_dt = pd.to_datetime(row.get("review_date"), errors="coerce")
            created_at = None if pd.isna(review_dt) else review_dt.to_pydatetime()
            session.execute(
                insert(Review).values(
                    laptop_id=laptop_id,
                    source=(row.get("review_source") or "seed"),
                    external_id=row.get("external_id"),
                    rating=row.get("rating"),
                    body_text=row["review_text"],
                    created_on_source_at=created_at,
                    is_suspected_low_quality=bool(quality_row.get("is_suspected_low_quality", False)),
                    low_quality_score=quality_row.get("low_quality_score"),
                )
            )

        for row in _records(prices_df):
            laptop_id = sku_to_id.get(row["sku"])
            if not laptop_id:
                continue
            observed_on = pd.to_datetime(row.get("observed_on"), errors="coerce")
            if pd.isna(observed_on):
                observed_on = pd.Timestamp.now().date()
            else:
                observed_on = observed_on.date()
            session.execute(
                insert(PriceHistory).values(
                    laptop_id=laptop_id,
                    source=(row.get("source") or "seed"),
                    observed_on=observed_on,
                    price=row["price"],
                    currency=(row.get("currency") or "USD"),
                )
            )

        session.commit()
        low_quality_count = int(quality_report_df["is_suspected_low_quality"].sum()) if not quality_report_df.empty else 0
        print(
            f"Loaded {len(laptops_df.index)} laptops, {len(specs_df.index)} specs, "
            f"{len(reviews_df.index)} reviews ({low_quality_count} flagged low-quality), "
            f"{len(prices_df.index)} prices from {processed_dir}."
        )
        print(f"Review quality report: {quality_report_path}")
        return 0
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    sys.exit(main())
