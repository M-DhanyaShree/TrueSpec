import uuid

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class LaptopSpec(Base):
    __tablename__ = "laptop_specs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    laptop_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("laptops.id", ondelete="CASCADE"), unique=True)
    cpu: Mapped[str] = mapped_column(String(150), nullable=False)
    gpu: Mapped[str | None] = mapped_column(String(150), nullable=True)
    ram_gb: Mapped[int] = mapped_column(Integer, nullable=False)
    storage_gb: Mapped[int] = mapped_column(Integer, nullable=False)
    display_size_in: Mapped[float | None] = mapped_column(Float, nullable=True)
    display_resolution: Mapped[str | None] = mapped_column(String(30), nullable=True)
    battery_wh: Mapped[float | None] = mapped_column(Float, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)

    laptop = relationship("Laptop", back_populates="spec")
