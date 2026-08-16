from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import Any

import pandas as pd
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert

from app.db.session import SessionLocal
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


def main() -> int:
    args = parse_args()
    repo_root = Path(__file__).resolve().parents[2]
    processed_dir = Path(args.processed_dir).resolve() if args.processed_dir else repo_root / "data" / "processed"

    laptops_df = _read_csv(processed_dir / "laptops.csv")
    specs_df = _read_csv(processed_dir / "laptop_specs.csv")
    reviews_df = _read_csv(processed_dir / "reviews.csv")
    prices_df = _read_csv(processed_dir / "price_history.csv")

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
        print(
            f"Loaded {len(laptops_df.index)} laptops, {len(specs_df.index)} specs, "
            f"{len(reviews_df.index)} reviews, {len(prices_df.index)} prices from {processed_dir}."
        )
        return 0
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    sys.exit(main())
