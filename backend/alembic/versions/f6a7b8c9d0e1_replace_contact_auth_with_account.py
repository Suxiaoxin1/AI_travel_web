"""replace contact authentication with account authentication

Revision ID: f6a7b8c9d0e1
Revises: e3f4a5b6c7d8
Create Date: 2026-08-29
"""
from alembic import op
import sqlalchemy as sa


revision = "f6a7b8c9d0e1"
down_revision = "e3f4a5b6c7d8"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("account", sa.String(length=24), nullable=True))
    op.execute("""
        DO $$
        BEGIN
            IF EXISTS (SELECT 1 FROM users) THEN
                RAISE EXCEPTION 'Legacy users must be cleared before the account authentication migration.';
            END IF;
        END $$;
    """)
    op.alter_column("users", "account", existing_type=sa.String(length=24), nullable=False)
    op.create_unique_constraint("uq_users_account", "users", ["account"])
    op.create_index("ix_users_account", "users", ["account"])
    op.drop_column("users", "phone_verified_at")
    op.drop_column("users", "email_verified_at")
    op.drop_column("users", "phone")
    op.drop_column("users", "email")


def downgrade() -> None:
    op.add_column("users", sa.Column("email", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(length=20), nullable=True))
    op.add_column("users", sa.Column("email_verified_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("phone_verified_at", sa.DateTime(), nullable=True))
    op.drop_index("ix_users_account", table_name="users")
    op.drop_constraint("uq_users_account", "users", type_="unique")
    op.drop_column("users", "account")
