"""add journal layout json

Revision ID: 4c2b7f8a91d4
Revises: 2879b972dd79
Create Date: 2026-07-26

"""
from alembic import op
import sqlalchemy as sa


revision = "4c2b7f8a91d4"
down_revision = "a5a5ce9cd3f8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("journals", sa.Column("layout_json", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("journals", "layout_json")
