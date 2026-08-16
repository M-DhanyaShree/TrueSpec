from __future__ import annotations

import re
from dataclasses import dataclass
from hashlib import sha1


PROMO_PATTERNS = (
    "buy now",
    "limited time",
    "discount",
    "affiliate",
    "sponsored",
    "promo",
    "referral",
)


@dataclass(frozen=True)
class ReviewQualityAssessment:
    is_low_quality: bool
    low_quality_score: float
    reasons: tuple[str, ...]


def _clean_text(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip())


def _token_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text.lower()))


def _uppercase_ratio(text: str) -> float:
    letters = [ch for ch in text if ch.isalpha()]
    if not letters:
        return 0.0
    upper = [ch for ch in letters if ch.isupper()]
    return len(upper) / len(letters)


def _punctuation_ratio(text: str) -> float:
    if not text:
        return 0.0
    punct = re.findall(r"[!?$*#@]{1}", text)
    return len(punct) / max(len(text), 1)


def _repetition_ratio(text: str) -> float:
    tokens = re.findall(r"\b\w+\b", text.lower())
    if not tokens:
        return 0.0
    unique = len(set(tokens))
    return 1.0 - (unique / len(tokens))


def normalized_hash(text: str) -> str:
    cleaned = _clean_text(text).lower()
    return sha1(cleaned.encode("utf-8")).hexdigest()


def assess_review_text(text: str, duplicate_count: int = 1) -> ReviewQualityAssessment:
    cleaned = _clean_text(text)
    lowered = cleaned.lower()

    score = 0.0
    reasons: list[str] = []

    if len(cleaned) < 25 or _token_count(cleaned) < 5:
        score += 0.4
        reasons.append("too_short")

    if re.search(r"https?://|www\.", lowered):
        score += 0.25
        reasons.append("contains_link")

    promo_hits = sum(1 for pattern in PROMO_PATTERNS if pattern in lowered)
    if promo_hits > 0:
        score += min(0.3, 0.1 * promo_hits)
        reasons.append("promotional_language")

    if _uppercase_ratio(cleaned) > 0.45:
        score += 0.2
        reasons.append("excessive_caps")

    if _punctuation_ratio(cleaned) > 0.08:
        score += 0.2
        reasons.append("excessive_punctuation")

    if _repetition_ratio(cleaned) > 0.52:
        score += 0.2
        reasons.append("high_repetition")

    if duplicate_count > 1:
        score += min(0.45, 0.15 * (duplicate_count - 1))
        reasons.append("duplicate_text")

    score = max(0.0, min(score, 1.0))
    is_low_quality = score >= 0.55
    return ReviewQualityAssessment(is_low_quality=is_low_quality, low_quality_score=round(score, 4), reasons=tuple(reasons))
