"""标签悬停图片：本地图库优先，缺失时图搜并落地。"""
from __future__ import annotations

import hashlib
import logging
import re
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.config import settings
from app.database import get_db
from app.storage import generate_key, upload_file

router = APIRouter()
logger = logging.getLogger(__name__)

USER_AGENT = "StarwalkTravelBot/1.0 (tag-preview; educational travel app)"
# 国内云主机访问部分海外图源较慢/不可达，使用短超时避免悬停接口被拖死。
HTTP_TIMEOUT = httpx.Timeout(6.0, connect=3.0)
DOWNLOAD_TIMEOUT = httpx.Timeout(8.0, connect=3.0)


def public_media_url(image_url: Optional[str]) -> str:
    """把本站 uploads 绝对地址改成相对路径，避免 HTTPS 页 Mixed Content。"""
    url = (image_url or "").strip()
    if not url:
        return ""
    # http://host:port/uploads/... 或 https://host/uploads/...
    m = re.match(r"^https?://[^/]+(/uploads/.+)$", url, flags=re.IGNORECASE)
    if m:
        return m.group(1)
    # 兼容错误写成 /upload/xxx 的旧数据
    m2 = re.match(r"^https?://[^/]+(/upload/.+)$", url, flags=re.IGNORECASE)
    if m2:
        return "/uploads/" + m2.group(1).split("/upload/", 1)[-1]
    return url


def _normalize_key_part(value: Optional[str]) -> str:
    text = re.sub(r"\s+", "", (value or "").strip().lower())
    return text[:80]


def build_cache_key(label: str, tag_type: str, city: Optional[str] = None) -> str:
    # v4：景点检索更具体 + 排除通用城市风景兜底，刷新旧错配缓存
    raw = f"v4:{tag_type}:{_normalize_key_part(label)}:{_normalize_key_part(city)}"
    return hashlib.sha1(raw.encode("utf-8")).hexdigest()


# 中文标签 → 英文检索词（按长度优先匹配更具体的词）
_CN_EN_LEXICON = [
    ("过桥米线", "crossing bridge rice noodles"),
    ("小笼包", "xiaolongbao soup dumpling"),
    ("烤全羊", "roast whole lamb"),
    ("酥油茶", "tibetan butter tea"),
    ("牦牛肉火锅", "tibetan hot pot"),
    ("牦牛肉", "yak beef dish"),
    ("牦牛", "yak beef"),
    ("火锅", "chinese hot pot soup"),
    ("腊排骨", "ribs stew"),
    ("乳扇", "dali rushan cheese"),
    ("米线", "yunnan rice noodles"),
    ("饵块", "yunnan rice cake"),
    ("烤肉", "barbecue grill"),
    ("烧烤", "barbecue skewer"),
    ("烤鸭", "peking duck"),
    ("牛肉面", "beef noodles"),
    ("拉面", "lamian noodles"),
    ("饺子", "chinese dumpling"),
    ("包子", "baozi steamed bun"),
    ("藏餐", "tibetan cuisine"),
    ("青稞", "highland barley"),
    ("糌粑", "tsampa barley"),
    ("甜茶", "tibetan sweet tea"),
    ("布达拉宫", "potala palace lhasa"),
    ("大昭寺", "jokhang temple"),
    ("罗布林卡", "norbulingka"),
    ("纳木错", "namtso lake tibet"),
    ("羊卓雍措", "yamdrok lake"),
    ("虎跳峡", "tiger leaping gorge"),
    ("丽江古城", "lijiang old town"),
    ("大理古城", "dali ancient town yunnan"),
    ("南诏风情岛", "nanzhao folk island erhai dali"),
    ("双廊古镇", "shuanglang ancient town erhai"),
    ("崇圣寺三塔", "three pagodas chongsheng temple dali"),
    ("三塔", "three pagodas dali"),
    ("喜洲古镇", "xizhou ancient town dali"),
    ("才村码头", "caicun pier erhai dali"),
    ("才村", "caicun pier erhai"),
    ("玉几岛", "yuji island erhai dali"),
    ("五华楼", "wuhua tower dali ancient town"),
    ("洋人街", "foreigner street dali"),
    ("感通索道", "gantong cableway cangshan"),
    ("海舌生态公园", "haitong park erhai"),
    ("普达措", "potatso national park shangri-la"),
    ("松赞林寺", "songzanlin monastery shangri-la"),
    ("独克宗古城", "dukezong ancient town shangri-la"),
    ("纳帕海", "napa hai lake shangri-la"),
    ("厦门大学", "xiamen university campus"),
    ("厦大", "xiamen university campus"),
    ("南普陀寺", "nanputuo temple xiamen"),
    ("南普陀", "nanputuo temple xiamen"),
    ("鼓浪屿", "gulangyu island xiamen"),
    ("曾厝垵", "zengcuoan village xiamen"),
    ("环岛路", "xiamen island ring road"),
    ("中山路", "zhongshan road xiamen"),
    ("洱海", "erhai lake dali"),
    ("苍山", "cangshan mountain dali"),
    ("高铁", "high speed train china"),
    ("索道", "cable car mountain"),
    ("徒步", "hiking trek trail"),
    ("古乐", "traditional chinese music"),
]

_CITY_EN = {
    "拉萨": "lhasa tibet",
    "西藏": "tibet",
    "日喀则": "shigatse tibet",
    "林芝": "nyingchi tibet",
    "大理": "dali yunnan",
    "丽江": "lijiang yunnan",
    "昆明": "kunming yunnan",
    "香格里拉": "shangri-la yunnan",
    "成都": "chengdu sichuan",
    "重庆": "chongqing",
    "西安": "xian china",
    "北京": "beijing",
    "上海": "shanghai",
    "广州": "guangzhou",
    "云南": "yunnan china",
    "四川": "sichuan china",
    "厦门": "xiamen fujian",
    "福建": "fujian china",
}

# 已入库的本地封面（部署在前端 public/），国内直出、不依赖海外图搜
_CURATED_LOCAL_COVERS = [
    ("厦门大学", "/images/landmarks/xiamen_01_xida.jpg"),
    ("厦大", "/images/landmarks/xiamen_01_xida.jpg"),
    ("南普陀寺", "/images/landmarks/xiamen_02_nanputuo.jpg"),
    ("南普陀", "/images/landmarks/xiamen_02_nanputuo.jpg"),
    ("厦门中山路", "/images/landmarks/xiamen_03_zhongshan.jpg"),
    ("中山路", "/images/landmarks/xiamen_03_zhongshan.jpg"),
    ("鼓浪屿", "/images/landmarks/fujian_02_gulangyu.jpg"),
]


def resolve_curated_local_cover(label: str) -> Optional[str]:
    text = (label or "").strip()
    if not text:
        return None
    # 精确优先，再按最长子串
    for cn, path in _CURATED_LOCAL_COVERS:
        if cn == text:
            return path
    best = ""
    best_path = None
    for cn, path in _CURATED_LOCAL_COVERS:
        if cn in text or text in cn:
            if len(cn) > len(best):
                best = cn
                best_path = path
    return best_path


def _city_en(city: Optional[str]) -> str:
    text = (city or "").strip()
    if not text:
        return ""
    for cn, en in _CITY_EN.items():
        if cn in text:
            return en
    return text


def _label_en_terms(label: str) -> list[str]:
    text = (label or "").strip()
    if not text:
        return []
    hits: list[str] = []
    # 长词优先，避免「牦牛肉火锅」只命中「火锅」
    for cn, en in sorted(_CN_EN_LEXICON, key=lambda x: len(x[0]), reverse=True):
        if cn in text and en not in hits:
            hits.append(en)
            text = text.replace(cn, "")
    return hits


def _type_en_hint(tag_type: str) -> str:
    return {
        "food": "food dish cuisine",
        "culture": "temple culture landmark",
        "experience": "travel activity",
        "vibe": "landscape scenery",
        "spot": "landmark scenic",
    }.get(tag_type, "travel")


def build_search_queries(label: str, tag_type: str, city: Optional[str] = None) -> list[str]:
    """从具体到宽泛构造查询；景点类避免过早落到「城市+风景」导致错配/重复。"""
    label = (label or "").strip()
    city_en = _city_en(city)
    terms = _label_en_terms(label)
    queries: list[str] = []
    is_spot = tag_type in {"spot", "culture"}

    # 1) 词典命中的具体英文词（最准）
    if terms:
        specific = " ".join(terms)
        if city_en:
            queries.append(f"{specific} {city_en}")
        queries.append(specific)
        queries.append(f"{specific} {_type_en_hint(tag_type)}")

    # 2) 中文全名优先（尤其景点），再拼城市
    if label:
        if is_spot and city:
            queries.append(f"{label} {city}")
            queries.append(f"{label} {city} 景点")
        queries.append(label)
        if city and not is_spot:
            queries.append(f"{label} {city}")
        if is_spot and city_en:
            queries.append(f"{label} {city_en}")

    # 3) 城市+品类：美食/文化可作中等兜底；景点类放到最后且更克制
    if city_en:
        if tag_type == "food":
            if any(k in (label + (city or "")) for k in ("藏", "拉萨", "西藏", "牦牛")):
                queries.append(f"{city_en} tibetan hot pot food")
            else:
                queries.append(f"{city_en} traditional local food")
        elif tag_type == "culture":
            queries.append(f"{city_en} temple culture")
        elif tag_type in {"experience", "vibe"}:
            queries.append(f"{city_en} {_type_en_hint(tag_type)}")
        elif tag_type == "spot" and not terms:
            # 无词典命中时才允许较宽查询，但仍带上中文名关键词
            queries.append(f"{label} landmark {city_en}")

    seen = set()
    out: list[str] = []
    for q in queries:
        q = re.sub(r"\s+", " ", q).strip()
        if q and q.lower() not in seen:
            seen.add(q.lower())
            out.append(q)
    return out


def _normalize_exclude(exclude_urls: Optional[list[str]] = None) -> set[str]:
    out: set[str] = set()
    for item in exclude_urls or []:
        text = public_media_url(str(item or "").strip()) or str(item or "").strip()
        if text:
            out.add(text)
            # 同时保留去 query 的主干，便于比对 Unsplash CDN 变体
            bare = text.split("?")[0]
            if bare:
                out.add(bare)
    return out


def _url_excluded(url: str, exclude: set[str]) -> bool:
    if not url or not exclude:
        return False
    normalized = public_media_url(url) or url
    if normalized in exclude or url in exclude:
        return True
    bare = normalized.split("?")[0]
    return bare in exclude


def _relevance_blob(item: dict) -> str:
    tags = item.get("tags") or []
    tag_text = " ".join(
        str(t.get("title") or t) for t in tags if isinstance(t, (dict, str))
    )
    return " ".join(
        [
            str(item.get("description") or ""),
            str(item.get("alt_description") or ""),
            tag_text,
        ]
    ).lower()


def _score_relevance(blob: str, query: str, must_terms: list[str], tag_type: str = "") -> int:
    score = 0
    for term in must_terms:
        for word in re.findall(r"[a-z0-9]+", term.lower()):
            if len(word) < 3:
                continue
            if word in blob:
                score += 3
    for word in re.findall(r"[a-z0-9]+", query.lower()):
        if len(word) < 3:
            continue
        if word in blob:
            score += 1

    if tag_type == "food":
        food_signals = (
            "food", "dish", "meal", "soup", "pot", "bowl", "cuisine",
            "restaurant", "dinner", "lunch", "hotpot", "cooking", "eat",
            "broth", "stew",
        )
        animal_landscape = (
            "cow", "cattle", "pasture", "field", "mountain", "landscape",
            "herd", "grass", "meadow", "animal",
        )
        if any(s in blob for s in food_signals):
            score += 6
        else:
            score -= 8
        if any(s in blob for s in animal_landscape) and not any(s in blob for s in food_signals):
            score -= 6
        # 火锅查询不应落到面条图
        if "hot pot" in query.lower() or "hotpot" in query.lower().replace(" ", ""):
            if any(n in blob for n in ("noodle", "noodles", "pasta", "ramen", "spaghetti")) and "pot" not in blob:
                score -= 8

    if tag_type in {"spot", "culture"}:
        place_signals = (
            "temple", "pagoda", "palace", "lake", "island", "town", "village",
            "mountain", "park", "bridge", "harbor", "pier", "monastery",
            "scenic", "landmark", "china", "yunnan", "dali", "tibet",
        )
        generic_only = (
            "wallpaper", "abstract", "texture", "pattern", "studio",
        )
        if any(s in blob for s in place_signals):
            score += 4
        if any(s in blob for s in generic_only):
            score -= 5
        # 有具体词典词却完全未命中时降权
        if must_terms and score < 3:
            score -= 4

    return score


def _pick_unsplash_result(
    results: list,
    query: str,
    must_terms: list[str],
    tag_type: str = "",
    exclude: Optional[set[str]] = None,
) -> Optional[dict]:
    exclude = exclude or set()
    ranked = []
    for item in results:
        urls = item.get("urls") or {}
        url = urls.get("regular") or urls.get("small")
        if not url or _url_excluded(url, exclude):
            continue
        blob = _relevance_blob(item)
        score = _score_relevance(blob, query, must_terms, tag_type=tag_type)
        ranked.append((score, item, url))
    if not ranked:
        return None
    ranked.sort(key=lambda x: x[0], reverse=True)
    best_score, item, url = ranked[0]
    # 有明确菜品词或美食类型时，拒绝完全不相关结果
    if (must_terms or tag_type == "food") and best_score <= 0:
        return None
    # 景点：无正分则宁可失败，避免城市通用图乱配
    if tag_type in {"spot", "culture"} and best_score <= 0:
        return None
    user = ((item.get("user") or {}).get("name")) or "Unsplash"
    return {
        "url": url,
        "source": "unsplash",
        "source_page": (item.get("links") or {}).get("html"),
        "attribution": user,
    }


def _search_query(label: str, tag_type: str, city: Optional[str]) -> str:
    queries = build_search_queries(label, tag_type, city)
    return queries[0] if queries else (label or "travel")


def _search_pexels(query: str, exclude: Optional[set[str]] = None) -> Optional[dict]:
    if not settings.PEXELS_API_KEY:
        return None
    exclude = exclude or set()
    try:
        with httpx.Client(timeout=HTTP_TIMEOUT) as client:
            resp = client.get(
                "https://api.pexels.com/v1/search",
                params={"query": query, "per_page": 10, "orientation": "landscape"},
                headers={"Authorization": settings.PEXELS_API_KEY},
            )
            resp.raise_for_status()
            photos = resp.json().get("photos") or []
            for photo in photos:
                url = (photo.get("src") or {}).get("large") or (photo.get("src") or {}).get("medium")
                if not url or _url_excluded(url, exclude):
                    continue
                return {
                    "url": url,
                    "source": "pexels",
                    "source_page": photo.get("url"),
                    "attribution": (photo.get("photographer") or "Pexels"),
                }
    except Exception as exc:
        logger.warning("Pexels search failed: %s", exc)
    return None


def _search_unsplash(
    query: str,
    must_terms: Optional[list[str]] = None,
    tag_type: str = "",
    exclude: Optional[set[str]] = None,
) -> Optional[dict]:
    if not settings.UNSPLASH_ACCESS_KEY:
        return None
    exclude = exclude or set()
    try:
        with httpx.Client(timeout=HTTP_TIMEOUT) as client:
            resp = client.get(
                "https://api.unsplash.com/search/photos",
                params={"query": query, "per_page": 12, "orientation": "landscape"},
                headers={"Authorization": f"Client-ID {settings.UNSPLASH_ACCESS_KEY}"},
            )
            resp.raise_for_status()
            results = resp.json().get("results") or []
            picked = _pick_unsplash_result(
                results, query, must_terms or [], tag_type=tag_type, exclude=exclude
            )
            if picked:
                return picked
            # 非景点/美食：无 must_terms 时允许取首张未排除结果
            if not must_terms and tag_type not in {"food", "spot", "culture"} and results:
                for item in results:
                    urls = item.get("urls") or {}
                    url = urls.get("regular") or urls.get("small")
                    if not url or _url_excluded(url, exclude):
                        continue
                    user = ((item.get("user") or {}).get("name")) or "Unsplash"
                    return {
                        "url": url,
                        "source": "unsplash",
                        "source_page": (item.get("links") or {}).get("html"),
                        "attribution": user,
                    }
    except Exception as exc:
        logger.warning("Unsplash search failed: %s", exc)
    return None


def _search_openverse(query: str, exclude: Optional[set[str]] = None) -> Optional[dict]:
    exclude = exclude or set()
    try:
        with httpx.Client(timeout=HTTP_TIMEOUT, headers={"User-Agent": USER_AGENT}) as client:
            resp = client.get(
                "https://api.openverse.org/v1/images/",
                params={"q": query, "page_size": 8, "license": "commercial"},
            )
            resp.raise_for_status()
            results = resp.json().get("results") or []
            for item in results:
                url = item.get("url")
                if not url or _url_excluded(url, exclude):
                    continue
                return {
                    "url": url,
                    "source": "openverse",
                    "source_page": item.get("foreign_landing_url") or item.get("detail_url"),
                    "attribution": item.get("creator") or item.get("provider") or "Openverse",
                }
    except Exception as exc:
        logger.warning("Openverse search failed: %s", exc)
    return None


def _search_wikimedia(query: str, exclude: Optional[set[str]] = None) -> Optional[dict]:
    exclude = exclude or set()
    try:
        with httpx.Client(timeout=HTTP_TIMEOUT, headers={"User-Agent": USER_AGENT}) as client:
            resp = client.get(
                "https://commons.wikimedia.org/w/api.php",
                params={
                    "action": "query",
                    "format": "json",
                    "generator": "search",
                    "gsrsearch": query,
                    "gsrnamespace": 6,
                    "gsrlimit": 8,
                    "prop": "imageinfo",
                    "iiprop": "url|mime|extmetadata",
                    "iiurlwidth": 800,
                },
            )
            resp.raise_for_status()
            pages = ((resp.json().get("query") or {}).get("pages") or {})
            for page in pages.values():
                infos = page.get("imageinfo") or []
                if not infos:
                    continue
                info = infos[0]
                mime = str(info.get("mime") or "")
                if not mime.startswith("image/"):
                    continue
                url = info.get("thumburl") or info.get("url")
                if not url or _url_excluded(url, exclude):
                    continue
                artist = ""
                meta = info.get("extmetadata") or {}
                if isinstance(meta.get("Artist"), dict):
                    artist = re.sub(r"<[^>]+>", "", meta["Artist"].get("value") or "")
                return {
                    "url": url,
                    "source": "wikimedia",
                    "source_page": info.get("descriptionurl"),
                    "attribution": (artist or "Wikimedia Commons")[:240],
                }
    except Exception as exc:
        logger.warning("Wikimedia search failed: %s", exc)
    return None


def _search_amap_poi(
    label: str,
    city: Optional[str] = None,
    exclude: Optional[set[str]] = None,
) -> Optional[dict]:
    """高德 POI 配图：国内 CDN，云主机可达性最好。"""
    key = (settings.AMAP_WEB_SERVICE_KEY or "").strip()
    if not key or not (label or "").strip():
        return None
    exclude = exclude or set()
    params: dict = {
        "key": key,
        "keywords": (label or "").strip(),
        "offset": 8,
        "page": 1,
        "extensions": "all",
    }
    city_text = (city or "").strip()
    if city_text:
        params["city"] = city_text
        params["citylimit"] = "true"
    base = (settings.AMAP_WEB_SERVICE_BASE or "https://restapi.amap.com/v3").rstrip("/")
    try:
        with httpx.Client(timeout=HTTP_TIMEOUT) as client:
            resp = client.get(f"{base}/place/text", params=params)
            resp.raise_for_status()
            payload = resp.json()
            if str(payload.get("status")) != "1":
                return None
            for poi in payload.get("pois") or []:
                photos = poi.get("photos") or []
                if not isinstance(photos, list):
                    continue
                for photo in photos:
                    if not isinstance(photo, dict):
                        continue
                    url = (photo.get("url") or "").strip()
                    if not url or _url_excluded(url, exclude):
                        continue
                    name = (poi.get("name") or label or "").strip()
                    return {
                        "url": url,
                        "source": "amap",
                        "source_page": None,
                        "attribution": f"高德地图 · {name}"[:240],
                    }
    except Exception as exc:
        logger.warning("Amap POI photo search failed: %s", exc)
    return None


def search_remote_image(
    label: str,
    tag_type: str,
    city: Optional[str],
    exclude_urls: Optional[list[str]] = None,
) -> Optional[dict]:
    must_terms = _label_en_terms(label)
    queries = build_search_queries(label, tag_type, city)
    exclude = _normalize_exclude(exclude_urls)

    # 1) 国内：高德 POI 配图
    hit = _search_amap_poi(label, city, exclude=exclude)
    if hit and hit.get("url"):
        return hit
    # 城市限制过严时再放宽一次
    if city:
        hit = _search_amap_poi(label, city=None, exclude=exclude)
        if hit and hit.get("url"):
            return hit

    # 2) Wikimedia / Openverse：相对海外图站更稳；中文查询优先
    for query in queries[:3]:
        hit = _search_wikimedia(query, exclude=exclude)
        if hit and hit.get("url"):
            return hit
        hit = _search_openverse(query, exclude=exclude)
        if hit and hit.get("url"):
            return hit

    # 3) 海外图搜（配置了 key 才试；国内云主机常超时）
    for query in queries:
        hit = _search_unsplash(query, must_terms=must_terms, tag_type=tag_type, exclude=exclude)
        if hit and hit.get("url"):
            return hit
        hit = _search_pexels(query, exclude=exclude)
        if hit and hit.get("url"):
            return hit
    return None


def download_and_store(image_url: str, label: str) -> str:
    referer = "https://www.amap.com/"
    lower = (image_url or "").lower()
    if "unsplash" in lower:
        referer = "https://unsplash.com/"
    elif "wikimedia" in lower or "wikipedia" in lower:
        referer = "https://commons.wikimedia.org/"
    elif "pexels" in lower:
        referer = "https://www.pexels.com/"
    headers = {"User-Agent": USER_AGENT, "Referer": referer}
    with httpx.Client(timeout=DOWNLOAD_TIMEOUT, follow_redirects=True, headers=headers) as client:
        resp = client.get(image_url)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "image/jpeg").split(";")[0].strip()
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=502, detail="远程资源不是图片")
        if len(resp.content) > 8 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="远程图片过大")
        ext = {
            "image/jpeg": ".jpg",
            "image/jpg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
        }.get(content_type, ".jpg")
        safe_name = re.sub(r"[^\w\-]+", "_", label)[:40] or "tag"
        key = generate_key("gallery", f"{safe_name}{ext}")
        return upload_file(resp.content, content_type, key)


@router.post("/tag-preview", response_model=schemas.CommonResponse)
def resolve_tag_preview(payload: schemas.TagPreviewRequest, db: Session = Depends(get_db)):
    label = payload.label
    tag_type = payload.tag_type
    city = payload.city
    cache_key = build_cache_key(label, tag_type, city)
    exclude = _normalize_exclude(payload.exclude_urls)

    # 同城其它标签已占用的图也尽量避开，降低行程内撞车
    if tag_type in {"spot", "culture"} and city:
        siblings = (
            db.query(models.MediaGalleryItem)
            .filter(
                models.MediaGalleryItem.tag_type == tag_type,
                models.MediaGalleryItem.city == city,
                models.MediaGalleryItem.label != label,
                models.MediaGalleryItem.image_url.isnot(None),
            )
            .limit(40)
            .all()
        )
        for row in siblings:
            exclude |= _normalize_exclude([row.image_url])

    # 1) 前端已有本地景点图：直接返回，并可写入图库便于统一管理
    if payload.local_image and not _url_excluded(payload.local_image, exclude):
        existing = db.query(models.MediaGalleryItem).filter(models.MediaGalleryItem.cache_key == cache_key).first()
        if existing:
            existing.hit_count = (existing.hit_count or 0) + 1
            if not existing.image_url:
                existing.image_url = payload.local_image
            db.commit()
            db.refresh(existing)
            return schemas.CommonResponse(
                data={
                    "label": existing.label,
                    "tag_type": existing.tag_type,
                    "image_url": public_media_url(existing.image_url),
                    "source": existing.source,
                    "attribution": existing.attribution,
                    "cached": True,
                }
            )
        item = models.MediaGalleryItem(
            cache_key=cache_key,
            label=label,
            tag_type=tag_type,
            city=city,
            image_url=payload.local_image,
            source="local_bundle",
            attribution="本地景点图库",
            hit_count=1,
        )
        db.add(item)
        db.commit()
        return schemas.CommonResponse(
            data={
                "label": label,
                "tag_type": tag_type,
                "image_url": public_media_url(payload.local_image),
                "source": "local_bundle",
                "attribution": "本地景点图库",
                "cached": False,
            }
        )

    # 2) 本地管理图库命中（若已在排除列表则重新搜索）
    existing = db.query(models.MediaGalleryItem).filter(models.MediaGalleryItem.cache_key == cache_key).first()
    if existing and existing.image_url and not _url_excluded(existing.image_url, exclude):
        existing.hit_count = (existing.hit_count or 0) + 1
        # 顺带修正历史绝对 URL
        normalized = public_media_url(existing.image_url)
        if normalized and normalized != existing.image_url and normalized.startswith("/"):
            existing.image_url = normalized
        db.commit()
        db.refresh(existing)
        return schemas.CommonResponse(
            data={
                "label": existing.label,
                "tag_type": existing.tag_type,
                "image_url": public_media_url(existing.image_url),
                "source": existing.source,
                "attribution": existing.attribution,
                "cached": True,
            }
        )

    # 2.5) 内置本地封面（如厦门大学等），国内直出、无需海外图搜
    curated = resolve_curated_local_cover(label)
    if curated and not _url_excluded(curated, exclude):
        if existing:
            existing.image_url = curated
            existing.source = "local_bundle"
            existing.attribution = "本地景点图库"
            existing.hit_count = (existing.hit_count or 0) + 1
            db.commit()
            db.refresh(existing)
            item = existing
            cached = True
        else:
            item = models.MediaGalleryItem(
                cache_key=cache_key,
                label=label,
                tag_type=tag_type,
                city=city,
                image_url=curated,
                source="local_bundle",
                attribution="本地景点图库",
                hit_count=1,
            )
            db.add(item)
            db.commit()
            db.refresh(item)
            cached = False
        return schemas.CommonResponse(
            data={
                "label": item.label,
                "tag_type": item.tag_type,
                "image_url": public_media_url(item.image_url),
                "source": item.source,
                "attribution": item.attribution,
                "cached": cached,
            }
        )

    # 3) 图搜并落地（高德 → Wikimedia → 海外）
    remote = search_remote_image(label, tag_type, city, exclude_urls=list(exclude))
    if not remote:
        raise HTTPException(status_code=404, detail="未找到可用图片，请稍后再试")

    try:
        stored_url = download_and_store(remote["url"], label)
    except HTTPException:
        # 下载失败时退回远程直链，仍写入图库避免反复搜索
        stored_url = remote["url"]
    except Exception as exc:
        logger.warning("store gallery image failed: %s", exc)
        stored_url = remote["url"]

    stored_url = public_media_url(stored_url) or stored_url

    if existing:
        existing.image_url = stored_url
        existing.source = remote.get("source") or "remote"
        existing.source_page = remote.get("source_page")
        existing.attribution = (remote.get("attribution") or "")[:240] or None
        existing.hit_count = (existing.hit_count or 0) + 1
        db.commit()
        db.refresh(existing)
        item = existing
    else:
        item = models.MediaGalleryItem(
            cache_key=cache_key,
            label=label,
            tag_type=tag_type,
            city=city,
            image_url=stored_url,
            source=remote.get("source") or "remote",
            source_page=remote.get("source_page"),
            attribution=(remote.get("attribution") or "")[:240] or None,
            hit_count=1,
        )
        db.add(item)
        db.commit()
        db.refresh(item)

    return schemas.CommonResponse(
        data={
            "label": item.label,
            "tag_type": item.tag_type,
            "image_url": public_media_url(item.image_url),
            "source": item.source,
            "attribution": item.attribution,
            "cached": False,
        }
    )


@router.get("/gallery", response_model=schemas.CommonResponse)
def list_gallery(page: int = 1, page_size: int = 20, q: Optional[str] = None, db: Session = Depends(get_db)):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 50)
    query = db.query(models.MediaGalleryItem)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(models.MediaGalleryItem.label.ilike(like))
    total = query.count()
    items = (
        query.order_by(models.MediaGalleryItem.updated_at.desc(), models.MediaGalleryItem.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return schemas.CommonResponse(
        data={
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": [
                {
                    "id": item.id,
                    "label": item.label,
                    "tag_type": item.tag_type,
                    "city": item.city,
                    "image_url": item.image_url,
                    "source": item.source,
                    "attribution": item.attribution,
                    "hit_count": item.hit_count,
                    "created_at": item.created_at,
                    "updated_at": item.updated_at,
                }
                for item in items
            ],
        }
    )
