from __future__ import annotations

from dataclasses import dataclass
from math import sqrt
from typing import Any
from uuid import UUID

from sqlalchemy import Select, case, func, select
from sqlalchemy.orm import Session, joinedload

from app.models.enums import ConfidenceLabel, RecommendationStatus, UsageRole
from app.models.laptop import Laptop
from app.models.manufacturer_pick import ManufacturerPick
from app.models.recommendation import RecommendationRequest, RecommendationResult
from app.models.review import Review


@dataclass
class ScoredLaptop:
    laptop: Laptop
    score: float
    explanation: str
    status: RecommendationStatus
    sentiment_wilson_lb: float | None
    confidence_label: ConfidenceLabel
    usable_review_count: int


ROLE_WEIGHTS: dict[UsageRole, dict[str, float]] = {
    UsageRole.student: {"performance": 0.33, "budget": 0.3, "battery": 0.2, "portability": 0.1, "reviews": 0.07},
    UsageRole.developer: {"performance": 0.42, "budget": 0.2, "battery": 0.16, "portability": 0.08, "reviews": 0.14},
    UsageRole.creator: {"performance": 0.5, "budget": 0.15, "battery": 0.13, "portability": 0.07, "reviews": 0.15},
    UsageRole.business: {"performance": 0.28, "budget": 0.25, "battery": 0.24, "portability": 0.1, "reviews": 0.13},
    UsageRole.gaming: {"performance": 0.56, "budget": 0.12, "battery": 0.08, "portability": 0.04, "reviews": 0.2},
    UsageRole.general: {"performance": 0.3, "budget": 0.3, "battery": 0.2, "portability": 0.08, "reviews": 0.12},
}


def cpu_tier_score(cpu: str | None) -> float:
    if not cpu:
        return 0.45
    text = cpu.lower()
    if "ultra 9" in text or "i9" in text or "ryzen 9" in text:
        return 1.0
    if "ultra 7" in text or "i7" in text or "ryzen 7" in text:
        return 0.85
    if "ultra 5" in text or "i5" in text or "ryzen 5" in text:
        return 0.72
    if "i3" in text or "ryzen 3" in text:
        return 0.5
    return 0.62


def normalize(value: float | None, lo: float, hi: float) -> float:
    if value is None:
        return 0.0
    if hi <= lo:
        return 0.5
    clamped = min(max(value, lo), hi)
    return (clamped - lo) / (hi - lo)


def wilson_lower_bound(positive: int, total: int, z: float = 1.96) -> float:
    if total <= 0:
        return 0.0
    phat = positive / total
    denom = 1 + z * z / total
    numerator = phat + z * z / (2 * total) - z * sqrt((phat * (1 - phat) + z * z / (4 * total)) / total)
    return max(0.0, numerator / denom)


def confidence_from_wilson(wilson_lb: float, review_count: int) -> ConfidenceLabel:
    if review_count >= 100 and wilson_lb >= 0.65:
        return ConfidenceLabel.high
    if review_count >= 30 and wilson_lb >= 0.5:
        return ConfidenceLabel.medium
    return ConfidenceLabel.low


def build_laptop_candidate_query(budget_max: float, include_prerelease: bool) -> Select[tuple[Laptop]]:
    stmt = select(Laptop).options(joinedload(Laptop.spec)).where(Laptop.launch_price.is_not(None))
    if not include_prerelease:
        stmt = stmt.where(Laptop.is_prerelease.is_(False))
    stmt = stmt.where(Laptop.launch_price <= budget_max)
    return stmt.order_by(Laptop.launch_price.asc())


def review_aggregates(db: Session, laptop_ids: list[UUID]) -> dict[UUID, dict[str, Any]]:
    if not laptop_ids:
        return {}

    positive_case = case(
        (
            (Review.sentiment_label == "positive")
            | ((Review.sentiment_label.is_(None)) & (Review.rating.is_not(None)) & (Review.rating >= 4.0)),
            1,
        ),
        else_=0,
    )

    stmt = (
        select(
            Review.laptop_id,
            func.count(Review.id).label("review_count"),
            func.sum(positive_case).label("positive_count"),
        )
        .where(Review.laptop_id.in_(laptop_ids))
        .where(Review.is_suspected_low_quality.is_(False))
        .group_by(Review.laptop_id)
    )

    result: dict[UUID, dict[str, Any]] = {}
    for laptop_id, review_count, positive_count in db.execute(stmt).all():
        count = int(review_count or 0)
        pos = int(positive_count or 0)
        wl = wilson_lower_bound(pos, count)
        result[laptop_id] = {
            "review_count": count,
            "positive_count": pos,
            "wilson_lb": wl,
            "confidence_label": confidence_from_wilson(wl, count),
        }
    return result


def performance_component(laptop: Laptop, usage_role: UsageRole) -> float:
    spec = laptop.spec
    if spec is None:
        return 0.2

    ram_score = normalize(float(spec.ram_gb), 8, 64)
    storage_score = normalize(float(spec.storage_gb), 256, 2048)
    cpu_score = cpu_tier_score(spec.cpu)
    gpu_bonus = 0.15 if spec.gpu else 0.0

    base = 0.45 * cpu_score + 0.3 * ram_score + 0.2 * storage_score + gpu_bonus
    if usage_role == UsageRole.gaming or usage_role == UsageRole.creator:
        base += 0.1 if spec.gpu else -0.12
    return max(0.0, min(base, 1.0))


def budget_component(price: float | None, budget_max: float) -> float:
    if price is None or budget_max <= 0:
        return 0.0
    if price > budget_max:
        return max(0.0, 1.0 - ((price - budget_max) / budget_max) * 2.0)
    utilization = price / budget_max
    return 1.0 - abs(utilization - 0.85) * 0.9


def battery_component(laptop: Laptop, daily_usage_hours: int, min_battery_hours: float | None) -> float:
    if laptop.spec is None or laptop.spec.battery_wh is None:
        return 0.35

    required_hours = max(float(daily_usage_hours), float(min_battery_hours or 0.0))
    target_wh = max(35.0, required_hours * 8.0)
    return max(0.0, min(float(laptop.spec.battery_wh) / target_wh, 1.0))


def portability_component(laptop: Laptop, max_weight_kg: float | None) -> float:
    if laptop.spec is None or laptop.spec.weight_kg is None:
        return 0.4
    weight = float(laptop.spec.weight_kg)
    if max_weight_kg is None:
        return max(0.0, min((2.5 - weight) / 1.4, 1.0))
    if weight <= max_weight_kg:
        return 1.0
    overflow = (weight - max_weight_kg) / max_weight_kg
    return max(0.0, 1.0 - overflow * 2.5)


def manufacturer_pick_for_request(db: Session, usage_role: UsageRole, budget_max: float) -> ManufacturerPick | None:
    stmt = (
        select(ManufacturerPick)
        .where(ManufacturerPick.usage_role == usage_role)
        .where(ManufacturerPick.budget_max >= budget_max)
        .order_by(ManufacturerPick.budget_max.asc())
        .limit(1)
    )
    row = db.execute(stmt).scalar_one_or_none()
    if row is not None:
        return row

    fallback = (
        select(ManufacturerPick)
        .where(ManufacturerPick.usage_role == usage_role)
        .order_by(ManufacturerPick.budget_max.desc())
        .limit(1)
    )
    return db.execute(fallback).scalar_one_or_none()


def generate_recommendations(
    db: Session,
    budget_max: float,
    currency: str,
    usage_role: UsageRole,
    daily_usage_hours: int,
    max_weight_kg: float | None,
    min_battery_hours: float | None,
    top_n: int,
) -> tuple[RecommendationRequest, list[ScoredLaptop], ManufacturerPick | None]:
    try:
        request_row = RecommendationRequest(
            budget_max=budget_max,
            currency=currency,
            usage_role=usage_role,
            daily_usage_hours=daily_usage_hours,
            max_weight_kg=max_weight_kg,
            min_battery_hours=min_battery_hours,
        )
        db.add(request_row)
        db.flush()

        candidates = db.execute(build_laptop_candidate_query(budget_max=budget_max, include_prerelease=True)).unique().scalars().all()
        if not candidates:
            fallback_stmt = (
                select(Laptop)
                .options(joinedload(Laptop.spec))
                .where(Laptop.launch_price.is_not(None))
                .order_by(Laptop.launch_price.asc())
                .limit(top_n)
            )
            candidates = db.execute(fallback_stmt).unique().scalars().all()

        ids = [row.id for row in candidates]
        agg = review_aggregates(db, ids)
        weights = ROLE_WEIGHTS[usage_role]

        scored: list[ScoredLaptop] = []
        for row in candidates:
            price = float(row.launch_price) if row.launch_price is not None else None
            perf = performance_component(row, usage_role)
            bgt = budget_component(price, budget_max)
            bat = battery_component(row, daily_usage_hours=daily_usage_hours, min_battery_hours=min_battery_hours)
            port = portability_component(row, max_weight_kg=max_weight_kg)

            review_info = agg.get(
                row.id,
                {
                    "review_count": 0,
                    "positive_count": 0,
                    "wilson_lb": 0.0,
                    "confidence_label": ConfidenceLabel.low,
                },
            )

            review_count = int(review_info["review_count"])
            wl = float(review_info["wilson_lb"])
            review_score = wl
            status = RecommendationStatus.with_reviews if review_count > 0 else RecommendationStatus.spec_only

            score = (
                perf * weights["performance"]
                + bgt * weights["budget"]
                + bat * weights["battery"]
                + port * weights["portability"]
                + review_score * weights["reviews"]
            )

            explanation = (
                f"perf={perf:.2f}, budget={bgt:.2f}, battery={bat:.2f}, portability={port:.2f}, "
                f"reviews={review_score:.2f} (n={review_count}, wilson={wl:.2f})"
            )

            scored.append(
                ScoredLaptop(
                    laptop=row,
                    score=round(score, 4),
                    explanation=explanation,
                    status=status,
                    sentiment_wilson_lb=(wl if review_count > 0 else None),
                    confidence_label=review_info["confidence_label"],
                    usable_review_count=review_count,
                )
            )

        scored.sort(key=lambda item: item.score, reverse=True)
        selected = scored[:top_n]

        for item in selected:
            db.add(
                RecommendationResult(
                    request_id=request_row.id,
                    laptop_id=item.laptop.id,
                    score=item.score,
                    explanation=item.explanation,
                    status=item.status,
                    sentiment_wilson_lb=item.sentiment_wilson_lb,
                    confidence_label=item.confidence_label,
                )
            )

        manufacturer_pick = manufacturer_pick_for_request(db=db, usage_role=usage_role, budget_max=budget_max)
        db.commit()
        db.refresh(request_row)
        return request_row, selected, manufacturer_pick
    except Exception:
        db.rollback()
        raise
