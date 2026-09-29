"""add phone auth foundation

Revision ID: c9d2f4a7b1e3
Revises: 4c2b7f8a91d4
Create Date: 2026-08-29 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "c9d2f4a7b1e3"
down_revision = "4c2b7f8a91d4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("avatar_url", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("bio", sa.String(length=300), nullable=True))
    op.add_column("users", sa.Column("home_city", sa.String(length=100), nullable=True))
    op.add_column("users", sa.Column("phone_verified_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("last_login_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("status", sa.String(length=20), nullable=False, server_default="active"))
    op.alter_column("users", "hashed_password", existing_type=sa.String(length=255), nullable=True)

    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("refresh_jti_hash", sa.String(length=64), nullable=False, unique=True),
        sa.Column("device_id", sa.String(length=128), nullable=True),
        sa.Column("user_agent", sa.String(length=512), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])
    op.create_table(
        "auth_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("subject_hash", sa.String(length=64), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_auth_events_user_id", "auth_events", ["user_id"])
    op.create_index("ix_auth_events_subject_hash", "auth_events", ["subject_hash"])


def downgrade() -> None:
    op.drop_index("ix_auth_events_subject_hash", table_name="auth_events")
    op.drop_index("ix_auth_events_user_id", table_name="auth_events")
    op.drop_table("auth_events")
    op.drop_index("ix_auth_sessions_user_id", table_name="auth_sessions")
    op.drop_table("auth_sessions")
    op.alter_column("users", "hashed_password", existing_type=sa.String(length=255), nullable=False)
    op.drop_column("users", "status")
    op.drop_column("users", "last_login_at")
    op.drop_column("users", "phone_verified_at")
    op.drop_column("users", "home_city")
    op.drop_column("users", "bio")
    op.drop_column("users", "avatar_url")
