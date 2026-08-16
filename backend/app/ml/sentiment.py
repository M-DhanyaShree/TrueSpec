from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Any

import joblib


@dataclass(frozen=True)
class SentimentPrediction:
    label: str
    score: float


class SentimentPredictor:
    def __init__(self, pipeline: Any, classes: list[str]) -> None:
        self.pipeline = pipeline
        self.classes = classes

    @classmethod
    def load(cls, model_path: Path) -> "SentimentPredictor":
        payload = joblib.load(model_path)
        if isinstance(payload, dict):
            pipeline = payload.get("pipeline")
            metadata = payload.get("metadata", {})
            classes = list(metadata.get("classes") or [])
        else:
            pipeline = payload
            classes = list(getattr(pipeline, "classes_", []))

        if pipeline is None:
            raise ValueError(f"Invalid sentiment model payload: {model_path}")

        if not classes and hasattr(pipeline, "classes_"):
            classes = [str(value) for value in pipeline.classes_]

        return cls(pipeline=pipeline, classes=[str(value) for value in classes])

    def predict(self, text: str) -> SentimentPrediction:
        cleaned = (text or "").strip()
        if not cleaned:
            return SentimentPrediction(label="neutral", score=0.0)

        label = str(self.pipeline.predict([cleaned])[0])
        score = 0.5

        if hasattr(self.pipeline, "predict_proba"):
            probs = self.pipeline.predict_proba([cleaned])[0]
            try:
                idx = self.classes.index(label)
                score = float(probs[idx])
            except ValueError:
                score = float(max(probs))

        return SentimentPrediction(label=label, score=round(score, 4))


def rating_fallback_sentiment(rating: float | None) -> SentimentPrediction:
    if rating is None:
        return SentimentPrediction(label="neutral", score=0.5)
    if rating >= 4.0:
        return SentimentPrediction(label="positive", score=min(1.0, rating / 5.0))
    if rating <= 2.0:
        return SentimentPrediction(label="negative", score=min(1.0, (6.0 - rating) / 5.0))
    return SentimentPrediction(label="neutral", score=0.5)
