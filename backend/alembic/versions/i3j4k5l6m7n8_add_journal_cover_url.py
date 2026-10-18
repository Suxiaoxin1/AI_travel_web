"""add journals.cover_url for shelf cover images

Revision ID: i3j4k5l6m7n8
Revises: h2i3j4k5l6m7
Create Date: 2026-10-18

"""
from alembic import op
import sqlalchemy as sa


revision = "i3j4k5l6m7n8"
down_revision = "h2i3j4k5l6m7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("journals", sa.Column("cover_url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("journals", "cover_url")
