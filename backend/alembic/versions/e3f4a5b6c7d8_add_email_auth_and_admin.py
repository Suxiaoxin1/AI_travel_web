"""add email auth and admin foundation

Revision ID: e3f4a5b6c7d8
Revises: c9d2f4a7b1e3
Create Date: 2026-08-29
"""
from alembic import op
import sqlalchemy as sa


revision = "e3f4a5b6c7d8"
down_revision = "c9d2f4a7b1e3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_verified_at", sa.DateTime(), nullable=True))

    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("key", sa.String(length=50), nullable=False, unique=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_table(
        "user_roles",
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("role_id", sa.Integer(), sa.ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_table(
        "admin_audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("actor_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("target_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_admin_audit_logs_id", "admin_audit_logs", ["id"])
    op.create_index("ix_admin_audit_logs_actor_id", "admin_audit_logs", ["actor_id"])
    op.create_index("ix_admin_audit_logs_target_user_id", "admin_audit_logs", ["target_user_id"])
    op.execute("INSERT INTO roles (key, name) VALUES ('admin', '管理员')")


def downgrade() -> None:
    op.drop_index("ix_admin_audit_logs_target_user_id", table_name="admin_audit_logs")
    op.drop_index("ix_admin_audit_logs_actor_id", table_name="admin_audit_logs")
    op.drop_index("ix_admin_audit_logs_id", table_name="admin_audit_logs")
    op.drop_table("admin_audit_logs")
    op.drop_table("user_roles")
    op.drop_table("roles")
    op.drop_column("users", "email_verified_at")
