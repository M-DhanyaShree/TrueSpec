from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

import pandas as pd

from app.ingestion.normalization import build_seed_frames


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download/normalize Kaggle laptop seed data.")
    parser.add_argument("--dataset", default="", help="Kaggle dataset slug, e.g. owner/dataset")
    parser.add_argument("--filename", default="", help="Optional specific CSV filename from the dataset")
    parser.add_argument("--download", action="store_true", help="Download dataset via Kaggle CLI before processing")
    parser.add_argument("--input-csv", default="", help="Path to an existing raw CSV to process")
    return parser.parse_args()


def run_kaggle_download(dataset: str, raw_dir: Path, filename: str) -> None:
    if not dataset:
        raise ValueError("--dataset is required when --download is used")

    cmd = ["kaggle", "datasets", "download", "-d", dataset, "-p", str(raw_dir), "--unzip"]
    if filename:
        cmd.extend(["-f", filename])

    try:
        subprocess.run(cmd, check=True)
    except FileNotFoundError as exc:
        raise RuntimeError("Kaggle CLI not found. Install `kaggle` and configure credentials.") from exc
    except subprocess.CalledProcessError as exc:
        raise RuntimeError(
            "Kaggle download failed. Ensure KAGGLE_USERNAME/KAGGLE_KEY are set or ~/.kaggle/kaggle.json exists."
        ) from exc


def pick_input_csv(raw_dir: Path, explicit_path: str) -> Path:
    if explicit_path:
        path = Path(explicit_path).expanduser().resolve()
        if not path.exists():
            raise FileNotFoundError(f"Input CSV not found: {path}")
        return path

    csv_files = sorted(raw_dir.rglob("*.csv"), key=lambda p: p.stat().st_size, reverse=True)
    if not csv_files:
        raise FileNotFoundError(
            "No CSV found in data/raw/kaggle. Provide --input-csv or run with --download and --dataset."
        )
    return csv_files[0]


def main() -> int:
    args = parse_args()

    repo_root = Path(__file__).resolve().parents[2]
    raw_dir = repo_root / "data" / "raw" / "kaggle"
    processed_dir = repo_root / "data" / "processed"
    raw_dir.mkdir(parents=True, exist_ok=True)
    processed_dir.mkdir(parents=True, exist_ok=True)

    if args.download:
        run_kaggle_download(args.dataset, raw_dir, args.filename)

    input_csv = pick_input_csv(raw_dir, args.input_csv)
    df = pd.read_csv(input_csv)

    seed_frames = build_seed_frames(df)

    laptops_path = processed_dir / "laptops.csv"
    specs_path = processed_dir / "laptop_specs.csv"
    reviews_path = processed_dir / "reviews.csv"
    prices_path = processed_dir / "price_history.csv"
    manifest_path = processed_dir / "seed_manifest.json"

    seed_frames.laptops.to_csv(laptops_path, index=False)
    seed_frames.specs.to_csv(specs_path, index=False)
    seed_frames.reviews.to_csv(reviews_path, index=False)
    seed_frames.prices.to_csv(prices_path, index=False)

    manifest = {
        "raw_input": str(input_csv),
        "outputs": {
            "laptops": str(laptops_path),
            "specs": str(specs_path),
            "reviews": str(reviews_path),
            "prices": str(prices_path),
        },
        "counts": {
            "laptops": len(seed_frames.laptops.index),
            "specs": len(seed_frames.specs.index),
            "reviews": len(seed_frames.reviews.index),
            "prices": len(seed_frames.prices.index),
        },
    }

    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
