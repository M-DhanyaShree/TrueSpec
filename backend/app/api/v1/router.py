from fastapi import APIRouter

from app.api.v1.routes import laptops
from app.api.v1.routes import recommendations

api_router = APIRouter()
api_router.include_router(laptops.router, prefix="/laptops", tags=["laptops"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
