from __future__ import annotations

from typing import Sequence
from uuid import UUID

from sqlalchemy import Select, select
from sqlalchemy.orm import Session, joinedload

from app.models.laptop import Laptop
from app.models.price_history import PriceHistory


def build_laptop_list_query(
    brand: str | None,
    min_price: float | None,
    max_price: float | None,
    include_prerelease: bool,
) -> Select[tuple[Laptop]]:
    stmt = select(Laptop).options(joinedload(Laptop.spec)).order_by(Laptop.brand.asc(), Laptop.model_name.asc())

    if brand:
        stmt = stmt.where(Laptop.brand.ilike(f"%{brand}%"))
    if min_price is not None:
        stmt = stmt.where(Laptop.launch_price >= min_price)
    if max_price is not None:
        stmt = stmt.where(Laptop.launch_price <= max_price)
    if not include_prerelease:
        stmt = stmt.where(Laptop.is_prerelease.is_(False))

    return stmt


def list_laptops(
    db: Session,
    brand: str | None,
    min_price: float | None,
    max_price: float | None,
    include_prerelease: bool,
    limit: int,
    offset: int,
) -> Sequence[Laptop]:
    stmt = build_laptop_list_query(brand, min_price, max_price, include_prerelease).limit(limit).offset(offset)
    return db.execute(stmt).unique().scalars().all()


def get_laptop_by_id(db: Session, laptop_id: UUID) -> Laptop | None:
    stmt = select(Laptop).options(joinedload(Laptop.spec)).where(Laptop.id == laptop_id)
    return db.execute(stmt).unique().scalar_one_or_none()


def get_laptops_by_ids(db: Session, laptop_ids: list[UUID]) -> Sequence[Laptop]:
    if not laptop_ids:
        return []
    stmt = select(Laptop).options(joinedload(Laptop.spec)).where(Laptop.id.in_(laptop_ids))
    records = db.execute(stmt).unique().scalars().all()
    by_id = {record.id: record for record in records}
    return [by_id[lid] for lid in laptop_ids if lid in by_id]


def get_price_history(db: Session, laptop_id: UUID) -> Sequence[PriceHistory]:
    stmt = (
        select(PriceHistory)
        .where(PriceHistory.laptop_id == laptop_id)
        .order_by(PriceHistory.observed_on.asc(), PriceHistory.created_at.asc())
    )
    return db.execute(stmt).scalars().all()
