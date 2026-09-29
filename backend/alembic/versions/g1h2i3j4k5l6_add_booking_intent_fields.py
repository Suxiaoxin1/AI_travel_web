"""add booking intent fields

Revision ID: g1h2i3j4k5l6
Revises: d7e8f9a0b1c2
Create Date: 2026-09-10

"""
from alembic import op
import sqlalchemy as sa


revision = "g1h2i3j4k5l6"
down_revision = "d7e8f9a0b1c2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "bookings",
        sa.Column("kind", sa.String(length=20), nullable=False, server_default="intent"),
    )
    op.add_column("bookings", sa.Column("title", sa.String(length=255), nullable=True))
    op.add_column("bookings", sa.Column("note", sa.Text(), nullable=True))
    op.add_column("bookings", sa.Column("source_type", sa.String(length=20), nullable=True))
    op.add_column("bookings", sa.Column("source_name", sa.String(length=100), nullable=True))
    op.add_column("bookings", sa.Column("link_type", sa.String(length=20), nullable=True))
    op.add_column("bookings", sa.Column("updated_at", sa.DateTime(), nullable=True))
    op.create_index("ix_bookings_kind", "bookings", ["kind"], unique=False)

    # Backfill legacy rows as intent bookmarks; normalize Chinese platform labels.
    op.execute(
        """
        UPDATE bookings
        SET
          kind = 'intent',
          link_type = COALESCE(link_type, 'search'),
          source_type = COALESCE(source_type, CASE WHEN province IS NOT NULL AND province <> '' THEN 'province' ELSE NULL END),
          source_name = COALESCE(source_name, province),
          title = COALESCE(
            NULLIF(title, ''),
            CASE
              WHEN province IS NOT NULL AND province <> '' THEN province || ' · ' ||
                CASE
                  WHEN platform IN ('ctrip', '携程') THEN '携程'
                  WHEN platform IN ('fliggy', '飞猪') THEN '飞猪'
                  ELSE '第三方'
                END
              WHEN keyword IS NOT NULL AND keyword <> '' THEN keyword
              ELSE '旅行商品'
            END
          ),
          platform = CASE
            WHEN platform IN ('ctrip', '携程') THEN 'ctrip'
            WHEN platform IN ('fliggy', '飞猪') THEN 'fliggy'
            WHEN platform IS NULL OR platform = '' THEN 'other'
            ELSE platform
          END,
          updated_at = COALESCE(updated_at, created_at)
        """
    )


def downgrade() -> None:
    op.drop_index("ix_bookings_kind", table_name="bookings")
    op.drop_column("bookings", "updated_at")
    op.drop_column("bookings", "link_type")
    op.drop_column("bookings", "source_name")
    op.drop_column("bookings", "source_type")
    op.drop_column("bookings", "note")
    op.drop_column("bookings", "title")
    op.drop_column("bookings", "kind")
