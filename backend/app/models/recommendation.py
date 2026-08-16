import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base
from app.models.enums import ConfidenceLabel, RecommendationStatus, UsageRole


class RecommendationRequest(Base):
    __tablename__ = "recommendation_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    budget_max: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    usage_role: Mapped[UsageRole] = mapped_column(SqlEnum(UsageRole, name="usage_role"), nullable=False)
    daily_usage_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    max_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    min_battery_hours: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class RecommendationResult(Base):
    __tablename__ = "recommendation_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recommendation_requests.id", ondelete="CASCADE"), nullable=False
    )
    laptop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("laptops.id", ondelete="CASCADE"), nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[RecommendationStatus] = mapped_column(
        SqlEnum(RecommendationStatus, name="recommendation_status"), nullable=False
    )
    sentiment_wilson_lb: Mapped[float | None] = mapped_column(Float, nullable=True)
    confidence_label: Mapped[ConfidenceLabel] = mapped_column(
        SqlEnum(ConfidenceLabel, name="confidence_label"), nullable=False, default=ConfidenceLabel.low
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
