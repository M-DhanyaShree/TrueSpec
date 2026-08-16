from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

LABEL_MAP = {
    "pos": "positive",
    "positive": "positive",
    "neg": "negative",
    "negative": "negative",
    "neu": "neutral",
    "neutral": "neutral",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train sentiment model for laptop reviews.")
    parser.add_argument("--input-csv", required=True, help="Path to labeled review CSV")
    parser.add_argument("--text-col", default="review_text", help="Column containing review text")
    parser.add_argument("--label-col", default="sentiment_label", help="Column containing sentiment labels")
    parser.add_argument("--rating-col", default="rating", help="Optional fallback rating column for labels")
    parser.add_argument("--output-model", default="", help="Output model path (joblib)")
    parser.add_argument("--output-metrics", default="", help="Output metrics json path")
    parser.add_argument("--test-size", type=float, default=0.2, help="Evaluation split fraction")
    parser.add_argument("--min-samples", type=int, default=100, help="Minimum labeled rows required")
    return parser.parse_args()


def normalize_label(value: object) -> str | None:
    if value is None:
        return None
    key = str(value).strip().lower()
    return LABEL_MAP.get(key)


def label_from_rating(value: object) -> str | None:
    try:
        rating = float(value)
    except (TypeError, ValueError):
        return None

    if rating >= 4.0:
        return "positive"
    if rating <= 2.0:
        return "negative"
    return "neutral"


def main() -> int:
    args = parse_args()
    backend_dir = Path(__file__).resolve().parents[1]
    model_dir = backend_dir / "models"
    model_dir.mkdir(parents=True, exist_ok=True)

    output_model = Path(args.output_model).resolve() if args.output_model else model_dir / "sentiment_pipeline.pkl"
    output_metrics = Path(args.output_metrics).resolve() if args.output_metrics else model_dir / "sentiment_metrics.json"

    df = pd.read_csv(Path(args.input_csv).resolve())
    if args.text_col not in df.columns:
        raise ValueError(f"Missing required text column: {args.text_col}")

    labels = []
    for _, row in df.iterrows():
        label = None
        if args.label_col in df.columns:
            label = normalize_label(row.get(args.label_col))
        if label is None and args.rating_col in df.columns:
            label = label_from_rating(row.get(args.rating_col))
        labels.append(label)

    train_df = pd.DataFrame({"text": df[args.text_col].fillna("").astype(str), "label": labels})
    train_df = train_df[(train_df["text"].str.strip() != "") & (train_df["label"].notna())]

    if len(train_df.index) < args.min_samples:
        raise ValueError(f"Not enough labeled samples ({len(train_df.index)}). Need at least {args.min_samples}.")

    x_train, x_test, y_train, y_test = train_test_split(
        train_df["text"],
        train_df["label"],
        test_size=args.test_size,
        random_state=42,
        stratify=train_df["label"],
    )

    pipeline = Pipeline(
        steps=[
            (
                "vectorizer",
                TfidfVectorizer(
                    lowercase=True,
                    strip_accents="unicode",
                    ngram_range=(1, 2),
                    min_df=2,
                    max_features=10000,
                ),
            ),
            ("classifier", LogisticRegression(max_iter=1200, class_weight="balanced", random_state=42)),
        ]
    )

    pipeline.fit(x_train, y_train)
    preds = pipeline.predict(x_test)

    metrics = {
        "accuracy": float(accuracy_score(y_test, preds)),
        "report": classification_report(y_test, preds, output_dict=True, zero_division=0),
        "sample_count": int(len(train_df.index)),
        "train_count": int(len(x_train.index)),
        "test_count": int(len(x_test.index)),
        "classes": [str(value) for value in sorted(train_df["label"].unique().tolist())],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    payload = {
        "pipeline": pipeline,
        "metadata": {
            "classes": metrics["classes"],
            "text_column": args.text_col,
            "label_column": args.label_col,
            "rating_column": args.rating_col,
            "created_at": metrics["created_at"],
        },
    }

    joblib.dump(payload, output_model)
    output_metrics.write_text(json.dumps(metrics, indent=2), encoding="utf-8")

    print(json.dumps({"model_path": str(output_model), "metrics_path": str(output_metrics), "accuracy": metrics["accuracy"]}, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
