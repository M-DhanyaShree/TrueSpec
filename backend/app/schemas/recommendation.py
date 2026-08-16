from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import ConfidenceLabel, RecommendationStatus, UsageRole
from app.schemas.laptop import LaptopDetailOut


class RecommendationInput(BaseModel):
    budget_max: float = Field(gt=0)
    currency: str = Field(default="USD", min_length=3, max_length=3)
    usage_role: UsageRole
    daily_usage_hours: int = Field(ge=1, le=24)
    max_weight_kg: float | None = Field(default=None, gt=0)
    min_battery_hours: float | None = Field(default=None, gt=0)
    top_n: int = Field(default=3, ge=1, le=4)


class ManufacturerPickOut(BaseModel):
    brand: str
    model_name: str
    suggested_config_text: str
    budget_max: float
    currency: str
    source_url: str | None


class RecommendationItemOut(BaseModel):
    laptop: LaptopDetailOut
    score: float
    explanation: str
    status: RecommendationStatus
    sentiment_wilson_lb: float | None
    confidence_label: ConfidenceLabel
    usable_review_count: int


class RecommendationResponse(BaseModel):
    request_id: UUID
    assumptions: list[str]
    manufacturer_pick: ManufacturerPickOut | None
    recommendations: list[RecommendationItemOut]
