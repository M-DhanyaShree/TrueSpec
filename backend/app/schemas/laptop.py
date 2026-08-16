from datetime import date
from uuid import UUID

from pydantic import BaseModel


class LaptopSpecOut(BaseModel):
    cpu: str
    gpu: str | None
    ram_gb: int
    storage_gb: int
    display_size_in: float | None
    display_resolution: str | None
    battery_wh: float | None
    weight_kg: float | None


class LaptopListItemOut(BaseModel):
    id: UUID
    sku: str
    brand: str
    model_name: str
    release_year: int | None
    is_prerelease: bool
    launch_price: float | None
    currency: str
    cpu: str | None
    ram_gb: int | None
    storage_gb: int | None


class LaptopDetailOut(BaseModel):
    id: UUID
    sku: str
    brand: str
    model_name: str
    release_year: int | None
    is_prerelease: bool
    launch_price: float | None
    currency: str
    product_url: str | None
    spec: LaptopSpecOut | None


class PricePointOut(BaseModel):
    observed_on: date
    price: float
    currency: str
    source: str


class LaptopPriceHistoryOut(BaseModel):
    laptop_id: UUID
    sku: str
    brand: str
    model_name: str
    points: list[PricePointOut]


class CompareOut(BaseModel):
    laptops: list[LaptopDetailOut]
