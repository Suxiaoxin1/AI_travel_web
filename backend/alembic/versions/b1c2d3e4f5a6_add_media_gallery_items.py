"""add media gallery for tag image cache

Revision ID: b1c2d3e4f5a6
Revises: a7b8c9d0e1f2
Create Date: 2026-09-03
"""
from alembic import op
import sqlalchemy as sa


revision = "b1c2d3e4f5a6"
down_revision = "a7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "media_gallery_items",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("cache_key", sa.String(length=255), nullable=False),
        sa.Column("label", sa.String(length=160), nullable=False),
        sa.Column("tag_type", sa.String(length=40), nullable=False, server_default="experience"),
        sa.Column("city", sa.String(length=80), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=False),
        sa.Column("source", sa.String(length=40), nullable=False, server_default="remote"),
        sa.Column("source_page", sa.Text(), nullable=True),
        sa.Column("attribution", sa.String(length=255), nullable=True),
        sa.Column("hit_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("cache_key", name="uq_media_gallery_cache_key"),
    )
    op.create_index("ix_media_gallery_items_cache_key", "media_gallery_items", ["cache_key"])


def downgrade() -> None:
    op.drop_index("ix_media_gallery_items_cache_key", table_name="media_gallery_items")
    op.drop_table("media_gallery_items")
