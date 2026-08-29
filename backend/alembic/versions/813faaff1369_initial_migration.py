"""initial migration

Revision ID: 813faaff1369
Revises: 
Create Date: 2026-07-19 10:45:26.218178

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '813faaff1369'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Keep this revision as the schema before the two later additive migrations:
    # 2879b972dd79 adds routes.title; a5a5ce9cd3f8 adds booking order fields;
    # 4c2b7f8a91d4 adds journals.layout_json.
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("phone", sa.String(length=20), nullable=True, unique=True),
        sa.Column("email", sa.String(length=255), nullable=True, unique=True),
        sa.Column("nickname", sa.String(length=100), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("avatar_bg", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_users_id", "users", ["id"])

    op.create_table(
        "favorites",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.Text(), nullable=True),
        sa.Column("plan_json", sa.JSON(), nullable=True),
        sa.Column("external_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_favorites_id", "favorites", ["id"])

    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("province", sa.String(length=100), nullable=True),
        sa.Column("keyword", sa.String(length=255), nullable=True),
        sa.Column("platform", sa.String(length=50), nullable=True),
        sa.Column("url", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_bookings_id", "bookings", ["id"])

    op.create_table(
        "travel_plans",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("preference_text", sa.Text(), nullable=True),
        sa.Column("content_json", sa.JSON(), nullable=False),
        sa.Column("input_text", sa.Text(), nullable=True),
        sa.Column("input_images", sa.ARRAY(sa.Text()), nullable=True),
        sa.Column("style", sa.String(length=50), nullable=True),
        sa.Column("people", sa.String(length=50), nullable=True),
        sa.Column("budget", sa.String(length=50), nullable=True),
        sa.Column("days", sa.Integer(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_travel_plans_id", "travel_plans", ["id"])

    op.create_table(
        "routes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("plan_id", sa.Integer(), sa.ForeignKey("travel_plans.id", ondelete="SET NULL"), nullable=True),
        sa.Column("strategy", sa.String(length=50), nullable=True),
        sa.Column("days_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_routes_id", "routes", ["id"])

    op.create_table(
        "posts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("images", sa.ARRAY(sa.Text()), nullable=True),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("tags", sa.ARRAY(sa.String(length=100)), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("likes_count", sa.Integer(), nullable=True),
        sa.Column("comments_count", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_posts_id", "posts", ["id"])

    op.create_table(
        "comments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_comments_id", "comments", ["id"])

    op.create_table(
        "likes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("post_id", sa.Integer(), sa.ForeignKey("posts.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_likes_id", "likes", ["id"])

    op.create_table(
        "journals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("style", sa.String(length=50), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("travel_date", sa.Date(), nullable=True),
        sa.Column("mood", sa.Text(), nullable=True),
        sa.Column("photos", sa.ARRAY(sa.Text()), nullable=True),
        sa.Column("content_html", sa.Text(), nullable=True),
        sa.Column("video_url", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_journals_id", "journals", ["id"])


def downgrade() -> None:
    for table_name in ("journals", "likes", "comments", "posts", "routes", "travel_plans", "bookings", "favorites", "users"):
        op.drop_table(table_name)
