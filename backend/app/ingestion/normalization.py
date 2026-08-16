import re
from dataclasses import dataclass
from typing import Iterable

import pandas as pd


COLUMN_ALIASES: dict[str, tuple[str, ...]] = {
    "brand": ("brand", "manufacturer", "company"),
    "model_name": ("model_name", "model", "product_name", "laptop_name", "name"),
    "sku": ("sku", "model_number", "product_id"),
    "release_year": ("release_year", "year", "launch_year"),
    "is_prerelease": ("is_prerelease", "prerelease"),
    "launch_price": ("launch_price", "price", "msrp"),
    "currency": ("currency",),
    "product_url": ("product_url", "url", "link"),
    "cpu": ("cpu", "processor"),
    "gpu": ("gpu", "graphics", "graphic_card"),
    "ram_gb": ("ram_gb", "ram", "memory"),
    "storage_gb": ("storage_gb", "storage", "ssd", "disk"),
    "display_size_in": ("display_size_in", "display_size", "screen_size"),
    "display_resolution": ("display_resolution", "resolution", "screen_resolution"),
    "battery_wh": ("battery_wh", "battery", "battery_capacity"),
    "weight_kg": ("weight_kg", "weight"),
    "review_source": ("review_source", "source"),
    "external_id": ("external_id", "review_id"),
    "rating": ("rating", "score", "stars"),
    "review_text": ("review_text", "review", "comment", "text"),
    "review_date": ("review_date", "date", "created_at"),
    "price_source": ("price_source", "vendor", "price_vendor"),
    "observed_on": ("observed_on", "price_date", "date"),
}


@dataclass
class SeedFrames:
    laptops: pd.DataFrame
    specs: pd.DataFrame
    reviews: pd.DataFrame
    prices: pd.DataFrame


def normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    lower_map = {col: col.strip().lower() for col in df.columns}
    out = df.rename(columns=lower_map).copy()

    for canonical, aliases in COLUMN_ALIASES.items():
        if canonical in out.columns:
            continue
        for alias in aliases:
            if alias in out.columns:
                out[canonical] = out[alias]
                break

    if "currency" not in out.columns:
        out["currency"] = "USD"

    return out


def parse_number(value: object) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    match = re.search(r"-?\d+(?:\.\d+)?", text.replace(",", ""))
    if not match:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


def parse_bool(value: object) -> bool:
    if value is None:
        return False
    text = str(value).strip().lower()
    return text in {"1", "true", "yes", "y"}


def coalesce(*values: object) -> str:
    for value in values:
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return "unknown"


def make_sku(row: pd.Series) -> str:
    if pd.notna(row.get("sku")) and str(row.get("sku")).strip():
        return str(row.get("sku")).strip()

    slug_base = "-".join(
        [
            coalesce(row.get("brand")),
            coalesce(row.get("model_name")),
            coalesce(row.get("cpu")),
            str(int(parse_number(row.get("ram_gb")) or 0)),
            str(int(parse_number(row.get("storage_gb")) or 0)),
        ]
    ).lower()
    return re.sub(r"[^a-z0-9]+", "-", slug_base).strip("-")


def _ensure_columns(df: pd.DataFrame, names: Iterable[str]) -> pd.DataFrame:
    out = df.copy()
    for name in names:
        if name not in out.columns:
            out[name] = None
    return out


def build_seed_frames(raw_df: pd.DataFrame) -> SeedFrames:
    df = normalize_columns(raw_df)
    df = _ensure_columns(
        df,
        [
            "brand",
            "model_name",
            "sku",
            "release_year",
            "is_prerelease",
            "launch_price",
            "currency",
            "product_url",
            "cpu",
            "gpu",
            "ram_gb",
            "storage_gb",
            "display_size_in",
            "display_resolution",
            "battery_wh",
            "weight_kg",
            "review_source",
            "external_id",
            "rating",
            "review_text",
            "review_date",
            "price_source",
            "observed_on",
        ],
    )

    df["sku"] = df.apply(make_sku, axis=1)
    df["launch_price"] = df["launch_price"].apply(parse_number)
    df["release_year"] = df["release_year"].apply(parse_number).apply(lambda x: int(x) if x else None)
    df["is_prerelease"] = df["is_prerelease"].apply(parse_bool)
    df["ram_gb"] = df["ram_gb"].apply(parse_number).apply(lambda x: int(x) if x else None)
    df["storage_gb"] = df["storage_gb"].apply(parse_number).apply(lambda x: int(x) if x else None)
    df["display_size_in"] = df["display_size_in"].apply(parse_number)
    df["battery_wh"] = df["battery_wh"].apply(parse_number)
    df["weight_kg"] = df["weight_kg"].apply(parse_number)
    df["rating"] = df["rating"].apply(parse_number)

    laptops = (
        df[
            [
                "sku",
                "brand",
                "model_name",
                "release_year",
                "is_prerelease",
                "launch_price",
                "currency",
                "product_url",
            ]
        ]
        .drop_duplicates(subset=["sku"])
        .fillna({"currency": "USD"})
    )

    specs = (
        df[
            [
                "sku",
                "cpu",
                "gpu",
                "ram_gb",
                "storage_gb",
                "display_size_in",
                "display_resolution",
                "battery_wh",
                "weight_kg",
            ]
        ]
        .drop_duplicates(subset=["sku"])
        .dropna(subset=["cpu", "ram_gb", "storage_gb"], how="any")
    )

    reviews = df[["sku", "review_source", "external_id", "rating", "review_text", "review_date"]].copy()
    reviews["review_source"] = reviews["review_source"].fillna("seed")
    reviews = reviews.dropna(subset=["review_text"])

    prices = df[["sku", "price_source", "observed_on", "launch_price", "currency"]].copy()
    prices = prices.rename(columns={"launch_price": "price", "price_source": "source"})
    prices["source"] = prices["source"].fillna("seed")
    prices["currency"] = prices["currency"].fillna("USD")
    prices = prices.dropna(subset=["price"])

    return SeedFrames(laptops=laptops, specs=specs, reviews=reviews, prices=prices)
