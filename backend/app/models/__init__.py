from app.models.laptop import Laptop
from app.models.manufacturer_pick import ManufacturerPick
from app.models.price_history import PriceHistory
from app.models.recommendation import RecommendationRequest, RecommendationResult
from app.models.review import Review
from app.models.spec import LaptopSpec

__all__ = [
    "Laptop",
    "LaptopSpec",
    "Review",
    "PriceHistory",
    "ManufacturerPick",
    "RecommendationRequest",
    "RecommendationResult",
]
