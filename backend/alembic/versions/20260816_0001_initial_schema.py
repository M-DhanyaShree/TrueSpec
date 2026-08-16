"""Initial TrueSpec schema

Revision ID: 20260816_0001
Revises:
Create Date: 2026-08-16 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260816_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

review_source = sa.Enum("seed", "reddit", "youtube", "manufacturer", name="review_source")
usage_role = sa.Enum("student", "developer", "creator", "business", "gaming", "general", name="usage_role")
recommendation_status = sa.Enum("spec_only", "with_reviews", name="recommendation_status")
confidence_label = sa.Enum("high", "medium", "low", name="confidence_label")


def upgrade() -> None:
    bind = op.get_bind()
    review_source.create(bind, checkfirst=True)
    usage_role.create(bind, checkfirst=True)
    recommendation_status.create(bind, checkfirst=True)
    confidence_label.create(bind, checkfirst=True)

    op.create_table(
        "laptops",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("brand", sa.String(length=100), nullable=False),
        sa.Column("model_name", sa.String(length=150), nullable=False),
        sa.Column("sku", sa.String(length=120), nullable=False),
        sa.Column("release_year", sa.Integer(), nullable=True),
        sa.Column("is_prerelease", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("launch_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="USD"),
        sa.Column("product_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("sku"),
    )

    op.create_table(
        "manufacturer_picks",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("usage_role", usage_role, nullable=False),
        sa.Column("budget_max", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="USD"),
        sa.Column("brand", sa.String(length=100), nullable=False),
        sa.Column("model_name", sa.String(length=150), nullable=False),
        sa.Column("suggested_config_text", sa.Text(), nullable=False),
        sa.Column("source_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "recommendation_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("budget_max", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="USD"),
        sa.Column("usage_role", usage_role, nullable=False),
        sa.Column("daily_usage_hours", sa.Integer(), nullable=False),
        sa.Column("max_weight_kg", sa.Float(), nullable=True),
        sa.Column("min_battery_hours", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "laptop_specs",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("laptop_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("cpu", sa.String(length=150), nullable=False),
        sa.Column("gpu", sa.String(length=150), nullable=True),
        sa.Column("ram_gb", sa.Integer(), nullable=False),
        sa.Column("storage_gb", sa.Integer(), nullable=False),
        sa.Column("display_size_in", sa.Float(), nullable=True),
        sa.Column("display_resolution", sa.String(length=30), nullable=True),
        sa.Column("battery_wh", sa.Float(), nullable=True),
        sa.Column("weight_kg", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["laptop_id"], ["laptops.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("laptop_id"),
    )

    op.create_table(
        "price_history",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("laptop_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source", sa.String(length=80), nullable=False, server_default="seed"),
        sa.Column("observed_on", sa.Date(), nullable=False),
        sa.Column("price", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False, server_default="USD"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["laptop_id"], ["laptops.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "reviews",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("laptop_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("source", review_source, nullable=False),
        sa.Column("external_id", sa.String(length=150), nullable=True),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column("body_text", sa.Text(), nullable=False),
        sa.Column("created_on_source_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_suspected_low_quality", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("low_quality_score", sa.Float(), nullable=True),
        sa.Column("sentiment_label", sa.String(length=30), nullable=True),
        sa.Column("sentiment_score", sa.Float(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["laptop_id"], ["laptops.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "recommendation_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("request_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("laptop_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("status", recommendation_status, nullable=False),
        sa.Column("sentiment_wilson_lb", sa.Float(), nullable=True),
        sa.Column("confidence_label", confidence_label, nullable=False, server_default="low"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["laptop_id"], ["laptops.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["request_id"], ["recommendation_requests.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_reviews_laptop_id", "reviews", ["laptop_id"])
    op.create_index("ix_price_history_laptop_id", "price_history", ["laptop_id"])
    op.create_index("ix_recommendation_results_request_id", "recommendation_results", ["request_id"])


def downgrade() -> None:
    op.drop_index("ix_recommendation_results_request_id", table_name="recommendation_results")
    op.drop_index("ix_price_history_laptop_id", table_name="price_history")
    op.drop_index("ix_reviews_laptop_id", table_name="reviews")

    op.drop_table("recommendation_results")
    op.drop_table("reviews")
    op.drop_table("price_history")
    op.drop_table("laptop_specs")
    op.drop_table("recommendation_requests")
    op.drop_table("manufacturer_picks")
    op.drop_table("laptops")

    bind = op.get_bind()
    confidence_label.drop(bind, checkfirst=True)
    recommendation_status.drop(bind, checkfirst=True)
    usage_role.drop(bind, checkfirst=True)
    review_source.drop(bind, checkfirst=True)
