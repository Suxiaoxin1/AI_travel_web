"""程序化生成杂志排版专属贴纸 PNG（透明底，1080x1440 画布尺度下的原始像素尺寸）。

产出目录：public/journal/assets/stickers/magazine/
风格：编辑杂志 / 新闻纸——裁切角、页码标签、红线分隔、拍立得角、条形码、
      引号、栏目数字、图钉色块等，全部矢量绘制的透明 PNG。
"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = r"D:\ai-travel-homepage\public\journal\assets\stickers\magazine"
os.makedirs(OUT, exist_ok=True)

# 调色：编辑杂志常用——红 #C8281C、墨黑 #1A1A1A、暖灰 #8A8A8A、米白 #FAF1E1
RED = (200, 40, 28, 255)
INK = (26, 26, 26, 255)
GRAY = (138, 138, 138, 255)
CREAM = (250, 241, 225, 255)
WARM = (226, 213, 184, 255)


def _font(size):
    for name in ("georgiab.ttf", "timesbd.ttf", "arialbd.ttf", "arial.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            continue
    return ImageFont.load_default()


def save(img, name):
    img.save(os.path.join(OUT, name + ".png"))
    print(name, img.size)


def cut_corner(w=90, h=90, color=CREAM):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 纸张裁切角：整块米白，右上缺一角（表现撕口/裁角）
    d.polygon([(0, 0), (w - 26, 0), (w, 26), (w, h), (0, h)], fill=color)
    d.line([(w - 26, 0), (w, 26), (0, 26)], fill=(180, 168, 140, 255), width=2)
    save(img, "m_cut_corner")


def page_tag(w=150, h=60):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([1, 1, w - 2, h - 2], radius=8, fill=(255, 255, 255, 255), outline=INK, width=3)
    d.text((w * 0.22, h * 0.18), "02", font=_font(int(h * 0.55)), fill=INK)
    d.text((w * 0.55, h * 0.24), "/05", font=_font(int(h * 0.42)), fill=GRAY)
    save(img, "m_page_tag")


def red_rule(w=520, h=24):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, h // 2 - 3, w, h // 2 + 3], fill=RED)
    # 右端三角箭头
    d.polygon([(w - 20, h // 2 - 12), (w, h // 2), (w - 20, h // 2 + 12)], fill=RED)
    save(img, "m_red_rule")


def photo_corner(w=70, h=70):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 相册三角固定角（右下朝向）
    d.polygon([(0, h), (0, 0), (w, 0)], fill=(255, 255, 255, 235))
    d.line([(0, h), (0, 0), (w, 0)], fill=(200, 190, 170, 255), width=2)
    save(img, "m_photo_corner")


def barcode(w=180, h=70):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, h], fill=(255, 255, 255, 255))
    bars = [3, 1, 2, 5, 1, 2, 1, 4, 2, 1, 3, 2, 1, 1, 4, 2, 3, 1, 2, 1]
    x = 6
    for i, bw in enumerate(bars):
        if i % 2 == 0:
            d.rectangle([x, 8, x + bw, h - 16], fill=INK)
        x += bw + 2
        if x > w - 6:
            break
    d.text((w * 0.18, h - 13), "VOL.01  2026", font=_font(9), fill=INK)
    save(img, "m_barcode")


def big_quote(w=140, h=110):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = _font(int(h * 0.9))
    d.text((4, -8), "\u201C", font=f, fill=RED)
    save(img, "m_quote")


def section_no(w=90, h=90):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.ellipse([2, 2, w - 2, h - 2], fill=RED)
    txt = "01"
    f = _font(int(h * 0.5))
    bbox = d.textbbox((0, 0), txt, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    d.text(((w - tw) / 2 - bbox[0], (h - th) / 2 - bbox[1]), txt, font=f, fill=(255, 255, 255, 255))
    save(img, "m_section_no")


def film_strip(w=260, h=80):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 10, w, h - 10], fill=INK)
    # 齿孔
    for x in range(8, w - 8, 22):
        d.rectangle([x, 16, x + 10, 26], fill=(250, 241, 225, 255))
        d.rectangle([x, h - 26, x + 10, h - 16], fill=(250, 241, 225, 255))
    save(img, "m_film_strip")


def run_head(w=300, h=46):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, h], fill=INK)
    d.text((12, h * 0.2), "EDITORIAL", font=_font(int(h * 0.5)), fill=(250, 241, 225, 255))
    save(img, "m_run_head")


def star_mark(w=54, h=54):
    import math
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy, R, r = w / 2, h / 2, w * 0.46, w * 0.18
    pts = []
    for i in range(10):
        ang = -math.pi / 2 + i * math.pi / 5
        rad = R if i % 2 == 0 else r
        pts.append((cx + rad * math.cos(ang), cy + rad * math.sin(ang)))
    d.polygon(pts, fill=RED)
    save(img, "m_star_mark")


def dot_grid(w=120, h=120):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    step = 22
    for y in range(6, h, step):
        for x in range(6, w, step):
            d.ellipse([x, y, x + 5, y + 5], fill=(26, 26, 26, 160))
    save(img, "m_dot_grid")


def kraft_tag(w=110, h=180):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.polygon([(18, 24), (w - 12, 24), (w - 12, h - 6), (18, h - 6)], fill=WARM)
    d.ellipse([w / 2 - 8, 12, w / 2 + 8, 32], fill=(0, 0, 0, 0), outline=(120, 104, 78, 255), width=3)
    d.line([(30, 80), (w - 26, 80)], fill=(150, 130, 100, 255), width=2)
    d.line([(30, 104), (w - 40, 104)], fill=(150, 130, 100, 255), width=2)
    save(img, "m_kraft_tag")


cut_corner()
page_tag()
red_rule()
photo_corner()
barcode()
big_quote()
section_no()
film_strip()
run_head()
star_mark()
dot_grid()
kraft_tag()

# 生成 manifest（记录文件名与尺寸，供 diary-templates 引用）
import json
items = []
for fn in sorted(os.listdir(OUT)):
    if fn.endswith(".png"):
        with Image.open(os.path.join(OUT, fn)) as im:
            items.append({"file": fn[:-4], "w": im.size[0], "h": im.size[1]})
with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump({"count": len(items), "items": items}, f, ensure_ascii=False, indent=2)
print("TOTAL", len(items))
