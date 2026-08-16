import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.enums import ReviewSource


class Review(Base):
    __tablename__ = "reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    laptop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("laptops.id", ondelete="CASCADE"), nullable=False)
    source: Mapped[ReviewSource] = mapped_column(SqlEnum(ReviewSource, name="review_source"), nullable=False)
    external_id: Mapped[str | None] = mapped_column(String(150), nullable=True)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    body_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_on_source_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_suspected_low_quality: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    low_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    sentiment_label: Mapped[str | None] = mapped_column(String(30), nullable=True)
    sentiment_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    laptop = relationship("Laptop", back_populates="reviews")
