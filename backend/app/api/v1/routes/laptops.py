from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.mappers import map_laptop_detail
from app.schemas.laptop import CompareOut, LaptopDetailOut, LaptopListItemOut, LaptopPriceHistoryOut, PricePointOut
from app.services.laptop_queries import get_laptop_by_id, get_laptops_by_ids, get_price_history, list_laptops

router = APIRouter()


@router.get("", response_model=list[LaptopListItemOut])
def list_laptops_endpoint(
    brand: str | None = Query(default=None),
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    include_prerelease: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[LaptopListItemOut]:
    rows = list_laptops(
        db=db,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        include_prerelease=include_prerelease,
        limit=limit,
        offset=offset,
    )
    return [
        LaptopListItemOut(
            id=row.id,
            sku=row.sku,
            brand=row.brand,
            model_name=row.model_name,
            release_year=row.release_year,
            is_prerelease=row.is_prerelease,
            launch_price=float(row.launch_price) if row.launch_price is not None else None,
            currency=row.currency,
            cpu=row.spec.cpu if row.spec else None,
            ram_gb=row.spec.ram_gb if row.spec else None,
            storage_gb=row.spec.storage_gb if row.spec else None,
        )
        for row in rows
    ]


@router.get("/{laptop_id}", response_model=LaptopDetailOut)
def get_laptop(laptop_id: UUID, db: Session = Depends(get_db)) -> LaptopDetailOut:
    row = get_laptop_by_id(db=db, laptop_id=laptop_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Laptop not found")
    return map_laptop_detail(row)


@router.get("/compare", response_model=CompareOut)
def compare_laptops(
    laptop_ids: list[UUID] = Query(..., min_length=2, max_length=4), db: Session = Depends(get_db)
) -> CompareOut:
    if len(set(laptop_ids)) != len(laptop_ids):
        raise HTTPException(status_code=400, detail="Duplicate laptop IDs are not allowed")

    rows = get_laptops_by_ids(db=db, laptop_ids=laptop_ids)
    if len(rows) != len(laptop_ids):
        found = {str(row.id) for row in rows}
        missing = [str(lid) for lid in laptop_ids if str(lid) not in found]
        raise HTTPException(status_code=404, detail={"message": "One or more laptops not found", "missing": missing})

    items: list[LaptopDetailOut] = [map_laptop_detail(row) for row in rows]
    return CompareOut(laptops=items)


@router.get("/{laptop_id}/price-history", response_model=LaptopPriceHistoryOut)
def laptop_price_history(laptop_id: UUID, db: Session = Depends(get_db)) -> LaptopPriceHistoryOut:
    row = get_laptop_by_id(db=db, laptop_id=laptop_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Laptop not found")

    points = [
        PricePointOut(
            observed_on=point.observed_on,
            price=float(point.price),
            currency=point.currency,
            source=point.source,
        )
        for point in get_price_history(db=db, laptop_id=laptop_id)
    ]
    return LaptopPriceHistoryOut(laptop_id=row.id, sku=row.sku, brand=row.brand, model_name=row.model_name, points=points)
