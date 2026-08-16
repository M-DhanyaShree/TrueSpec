# TrueSpec Backend (MVP Scaffold)

This service is a standalone FastAPI backend for the TrueSpec platform.

## Scope in this increment
- FastAPI app scaffold with versioned API prefix
- SQLAlchemy model definitions for core MVP entities
- Alembic migration setup and initial schema migration
- Basic health endpoint and laptop API skeleton

## Explicit MVP defaults adopted
These were applied as initial defaults and can be changed in the next increment:
- Recommendation roles: student, developer, creator, business, gaming, general
- Budget: max budget only (`budget_max`), canonical currency `USD`
- Daily usage: integer hours per recommendation request
- Portability/endurance preferences: separate inputs (`max_weight_kg`, `min_battery_hours`)
- Data granularity: one row per exact SKU/config variant
- Pre-release support: explicit `is_prerelease` flag on laptops
- API versioning: `/api/v1`

## Run locally
1. Create a Python environment.
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and adjust `DATABASE_URL`.
4. Run migrations:
   - `alembic upgrade head`
5. Start API:
   - `uvicorn app.main:app --reload --port 8000`

## Current endpoints
- `GET /health`
- `GET /api/v1/laptops`
- `GET /api/v1/laptops/{laptop_id}`
- `GET /api/v1/laptops/compare/{left_id}/{right_id}`
