"""add content operations console

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-08-30
"""
from alembic import op
import sqlalchemy as sa


revision = "a7b8c9d0e1f2"
down_revision = "f6a7b8c9d0e1"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "attractions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("province", sa.String(length=80), nullable=False),
        sa.Column("city", sa.String(length=80), nullable=True),
        sa.Column("short_desc", sa.Text(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cover_image_url", sa.Text(), nullable=True),
        sa.Column("images", sa.ARRAY(sa.Text()), nullable=True),
        sa.Column("tags", sa.ARRAY(sa.String(length=100)), nullable=True),
        sa.Column("rating", sa.Float(), nullable=True),
        sa.Column("best_season", sa.String(length=120), nullable=True),
        sa.Column("recommended_duration", sa.String(length=60), nullable=True),
        sa.Column("opening_hours", sa.String(length=255), nullable=True),
        sa.Column("ticket_hint", sa.String(length=255), nullable=True),
        sa.Column("longitude", sa.Float(), nullable=True),
        sa.Column("latitude", sa.Float(), nullable=True),
        sa.Column("amap_poi_id", sa.String(length=120), nullable=True, unique=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_hot", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("updated_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_attractions_name", "attractions", ["name"])
    op.create_index("ix_attractions_province", "attractions", ["province"])
    op.create_index("ix_attractions_city", "attractions", ["city"])
    op.create_index("ix_attractions_status", "attractions", ["status"])
    # 将既有首页热门目的地转入可运营的景点库。后续由后台维护，不再依赖前端静态数据。
    attractions = [
        ("故宫博物院", "北京", 4.9, "春秋两季"), ("慕田峪长城", "北京", 4.8, "春秋两季"),
        ("天津之眼", "天津", 4.5, "全年"), ("古文化街", "天津", 4.4, "全年"),
        ("承德避暑山庄", "河北", 4.7, "全年"), ("山海关", "河北", 4.5, "全年"),
        ("平遥古城", "山西", 4.7, "全年"), ("云冈石窟", "山西", 4.7, "全年"),
        ("沈阳故宫", "辽宁", 4.7, "全年"), ("大连金石滩", "辽宁", 4.5, "全年"),
        ("长白山天池", "吉林", 4.8, "全年"), ("长春净月潭国家森林公园", "吉林", 4.5, "全年"),
        ("圣索菲亚大教堂", "黑龙江", 4.6, "全年"), ("中央大街", "黑龙江", 4.5, "全年"),
        ("外滩", "上海", 4.9, "春秋两季"), ("上海迪士尼度假区", "上海", 4.7, "春秋两季"),
        ("苏州园林（拙政园）", "江苏", 4.8, "全年"), ("南京夫子庙-秦淮河风光带", "江苏", 4.6, "全年"),
        ("西湖风景区", "浙江", 4.9, "春秋两季"), ("乌镇", "浙江", 4.7, "春秋两季"),
        ("黄山风景区", "安徽", 5.0, "全年"), ("宏村", "安徽", 4.8, "全年"),
        ("武夷山", "福建", 4.8, "春秋两季"), ("鼓浪屿", "福建", 4.7, "春秋两季"),
        ("庐山", "江西", 4.8, "全年"), ("三清山", "江西", 4.8, "全年"),
        ("泰山", "山东", 4.9, "全年"), ("趵突泉", "山东", 4.5, "全年"),
        ("龙门石窟", "河南", 4.9, "全年"), ("少林寺", "河南", 4.7, "全年"),
        ("黄鹤楼", "湖北", 4.6, "全年"), ("三峡大坝", "湖北", 4.7, "全年"),
        ("张家界国家森林公园", "湖南", 4.9, "全年"), ("武陵源", "湖南", 4.9, "全年"),
        ("广州塔（小蛮腰）", "广东", 4.5, "秋冬"), ("长隆旅游度假区", "广东", 4.6, "秋冬"),
        ("漓江风景区", "广西", 4.9, "全年"), ("阳朔十里画廊", "广西", 4.7, "全年"),
        ("亚龙湾", "海南", 4.7, "11月-次年4月"), ("蜈支洲岛", "海南", 4.6, "11月-次年4月"),
        ("洪崖洞", "重庆", 4.7, "全年"), ("解放碑", "重庆", 4.5, "全年"),
        ("九寨沟风景名胜区", "四川", 4.9, "春秋两季"), ("稻城亚丁", "四川", 4.8, "春秋两季"),
        ("黄果树瀑布", "贵州", 4.7, "全年"), ("西江千户苗寨", "贵州", 4.5, "全年"),
        ("丽江古城", "云南", 4.5, "全年"), ("玉龙雪山", "云南", 4.7, "全年"),
        ("布达拉宫", "西藏", 4.9, "全年"), ("大昭寺", "西藏", 4.7, "全年"),
        ("大雁塔", "陕西", 4.5, "春秋两季"), ("大唐不夜城", "陕西", 4.5, "春秋两季"),
        ("敦煌莫高窟", "甘肃", 4.9, "全年"), ("麦积山石窟", "甘肃", 4.6, "全年"),
        ("青海湖", "青海", 4.8, "全年"), ("茶卡盐湖", "青海", 4.7, "全年"),
        ("西夏陵", "宁夏", 4.4, "全年"), ("镇北堡西部影城", "宁夏", 4.5, "全年"),
        ("喀纳斯湖", "新疆", 4.9, "6月-10月"), ("吐鲁番火焰山", "新疆", 4.3, "6月-10月"),
    ]
    attraction_table = sa.table(
        "attractions",
        sa.column("name", sa.String()), sa.column("province", sa.String()), sa.column("short_desc", sa.Text()),
        sa.column("rating", sa.Float()), sa.column("best_season", sa.String()), sa.column("sort_order", sa.Integer()),
        sa.column("is_hot", sa.Boolean()), sa.column("status", sa.String()),
    )
    op.bulk_insert(attraction_table, [
        {"name": name, "province": province, "short_desc": f"{province}热门旅行目的地，运营人员可在后台补充详细介绍与图片。",
         "rating": rating, "best_season": season, "sort_order": index, "is_hot": True, "status": "published"}
        for index, (name, province, rating, season) in enumerate(attractions, start=1)
    ])

    for table in ("posts", "comments"):
        op.add_column(table, sa.Column("status", sa.String(length=20), nullable=False, server_default="published"))
        op.add_column(table, sa.Column("moderated_by", sa.Integer(), nullable=True))
        op.add_column(table, sa.Column("moderated_at", sa.DateTime(), nullable=True))
        op.add_column(table, sa.Column("moderation_reason", sa.String(length=300), nullable=True))
        op.add_column(table, sa.Column("deleted_at", sa.DateTime(), nullable=True))
        op.create_foreign_key(f"fk_{table}_moderated_by_users", table, "users", ["moderated_by"], ["id"], ondelete="SET NULL")
        op.create_index(f"ix_{table}_status", table, ["status"])

    op.add_column("admin_audit_logs", sa.Column("target_type", sa.String(length=50), nullable=True))
    op.add_column("admin_audit_logs", sa.Column("target_id", sa.Integer(), nullable=True))
    op.create_index("ix_admin_audit_logs_target_type", "admin_audit_logs", ["target_type"])
    op.create_index("ix_admin_audit_logs_target_id", "admin_audit_logs", ["target_id"])


def downgrade() -> None:
    op.drop_index("ix_admin_audit_logs_target_id", table_name="admin_audit_logs")
    op.drop_index("ix_admin_audit_logs_target_type", table_name="admin_audit_logs")
    op.drop_column("admin_audit_logs", "target_id")
    op.drop_column("admin_audit_logs", "target_type")

    for table in ("comments", "posts"):
        op.drop_index(f"ix_{table}_status", table_name=table)
        op.drop_constraint(f"fk_{table}_moderated_by_users", table, type_="foreignkey")
        op.drop_column(table, "deleted_at")
        op.drop_column(table, "moderation_reason")
        op.drop_column(table, "moderated_at")
        op.drop_column(table, "moderated_by")
        op.drop_column(table, "status")

    op.drop_index("ix_attractions_status", table_name="attractions")
    op.drop_index("ix_attractions_city", table_name="attractions")
    op.drop_index("ix_attractions_province", table_name="attractions")
    op.drop_index("ix_attractions_name", table_name="attractions")
    op.drop_table("attractions")
