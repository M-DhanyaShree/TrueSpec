from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.mappers import map_laptop_detail
from app.schemas.recommendation import ManufacturerPickOut, RecommendationInput, RecommendationItemOut, RecommendationResponse
from app.services.recommendation_engine import generate_recommendations

router = APIRouter()


@router.post("", response_model=RecommendationResponse)
def create_recommendation(payload: RecommendationInput, db: Session = Depends(get_db)) -> RecommendationResponse:
    request_row, scored, manufacturer_pick = generate_recommendations(
        db=db,
        budget_max=payload.budget_max,
        currency=payload.currency.upper(),
        usage_role=payload.usage_role,
        daily_usage_hours=payload.daily_usage_hours,
        max_weight_kg=payload.max_weight_kg,
        min_battery_hours=payload.min_battery_hours,
        top_n=payload.top_n,
    )

    assumptions = [
        "Confidence label uses Wilson score lower bound on low-quality-filtered reviews.",
        "Laptops with no usable review data are labeled spec_only.",
        "Battery suitability estimates use battery_wh relative to requested usage hours.",
    ]

    manufacturer_out = None
    if manufacturer_pick is not None:
        manufacturer_out = ManufacturerPickOut(
            brand=manufacturer_pick.brand,
            model_name=manufacturer_pick.model_name,
            suggested_config_text=manufacturer_pick.suggested_config_text,
            budget_max=float(manufacturer_pick.budget_max),
            currency=manufacturer_pick.currency,
            source_url=manufacturer_pick.source_url,
        )

    items = [
        RecommendationItemOut(
            laptop=map_laptop_detail(item.laptop),
            score=item.score,
            explanation=item.explanation,
            status=item.status,
            sentiment_wilson_lb=item.sentiment_wilson_lb,
            confidence_label=item.confidence_label,
            usable_review_count=item.usable_review_count,
        )
        for item in scored
    ]

    return RecommendationResponse(
        request_id=request_row.id,
        assumptions=assumptions,
        manufacturer_pick=manufacturer_out,
        recommendations=items,
    )
