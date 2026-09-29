"""add app_settings for admin model keys

Revision ID: h2i3j4k5l6m7
Revises: g1h2i3j4k5l6
Create Date: 2026-09-20

"""
from alembic import op
import sqlalchemy as sa


revision = "h2i3j4k5l6m7"
down_revision = "g1h2i3j4k5l6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "app_settings",
        sa.Column("key", sa.String(length=80), primary_key=True, nullable=False),
        sa.Column("value", sa.Text(), nullable=False, server_default=""),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("app_settings")
