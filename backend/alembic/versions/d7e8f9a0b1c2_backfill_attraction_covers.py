"""backfill attraction cover images from frontend landmark assets

Revision ID: d7e8f9a0b1c2
Revises: b1c2d3e4f5a6
Create Date: 2026-09-05
"""
from pathlib import Path
import json

from alembic import op
import sqlalchemy as sa


revision = "d7e8f9a0b1c2"
down_revision = "b1c2d3e4f5a6"
branch_labels = None
depends_on = None


def _load_covers() -> dict[str, str]:
    path = Path(__file__).resolve().parents[2] / "app" / "data" / "attraction_covers.json"
    return json.loads(path.read_text(encoding="utf-8"))


def upgrade() -> None:
    covers = _load_covers()
    if not covers:
        return
    bind = op.get_bind()
    for name, url in covers.items():
        bind.execute(
            sa.text(
                "UPDATE attractions "
                "SET cover_image_url = :url "
                "WHERE name = :name "
                "AND (cover_image_url IS NULL OR cover_image_url = '')"
            ),
            {"name": name, "url": url},
        )


def downgrade() -> None:
    covers = _load_covers()
    if not covers:
        return
    bind = op.get_bind()
    for name, url in covers.items():
        bind.execute(
            sa.text(
                "UPDATE attractions "
                "SET cover_image_url = NULL "
                "WHERE name = :name AND cover_image_url = :url"
            ),
            {"name": name, "url": url},
        )
