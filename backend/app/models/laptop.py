import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Laptop(Base):
    __tablename__ = "laptops"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand: Mapped[str] = mapped_column(String(100), nullable=False)
    model_name: Mapped[str] = mapped_column(String(150), nullable=False)
    sku: Mapped[str] = mapped_column(String(120), nullable=False, unique=True)
    release_year: Mapped[int | None] = mapped_column(nullable=True)
    is_prerelease: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    launch_price: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="USD")
    product_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    spec = relationship("LaptopSpec", back_populates="laptop", uselist=False, cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="laptop", cascade="all, delete-orphan")
    price_points = relationship("PriceHistory", back_populates="laptop", cascade="all, delete-orphan")
