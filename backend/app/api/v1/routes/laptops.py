from fastapi import APIRouter

router = APIRouter()


@router.get("")
def list_laptops() -> dict[str, list]:
    return {"items": []}


@router.get("/{laptop_id}")
def get_laptop(laptop_id: str) -> dict[str, str]:
    return {"id": laptop_id, "message": "detail endpoint scaffold"}


@router.get("/compare/{left_id}/{right_id}")
def compare_laptops(left_id: str, right_id: str) -> dict[str, list[str]]:
    return {"compare": [left_id, right_id]}
