from fastapi import APIRouter

from app.api.v1.routes import laptops

api_router = APIRouter()
api_router.include_router(laptops.router, prefix="/laptops", tags=["laptops"])
