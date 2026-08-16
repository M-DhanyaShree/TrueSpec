from app.models.laptop import Laptop
from app.schemas.laptop import LaptopDetailOut, LaptopSpecOut


def map_laptop_detail(row: Laptop) -> LaptopDetailOut:
    spec = None
    if row.spec:
        spec = LaptopSpecOut(
            cpu=row.spec.cpu,
            gpu=row.spec.gpu,
            ram_gb=row.spec.ram_gb,
            storage_gb=row.spec.storage_gb,
            display_size_in=row.spec.display_size_in,
            display_resolution=row.spec.display_resolution,
            battery_wh=row.spec.battery_wh,
            weight_kg=row.spec.weight_kg,
        )

    return LaptopDetailOut(
        id=row.id,
        sku=row.sku,
        brand=row.brand,
        model_name=row.model_name,
        release_year=row.release_year,
        is_prerelease=row.is_prerelease,
        launch_price=float(row.launch_price) if row.launch_price is not None else None,
        currency=row.currency,
        product_url=row.product_url,
        spec=spec,
    )
