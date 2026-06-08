/**
 * 景区真实评论爬虫服务
 * 
 * 架构说明:
 * ┌──────────┐  API请求   ┌──────────────┐  HTTP/Headless  ┌────────────┐
 * │ 前端页面  │ ◄────────► │  爬虫服务     │ ◄─────────────► │ 携程/马蜂窝 │
 * │          │            │  scraper.js   │    Browser       │ 等OTA平台   │
 * └──────────┘            └──────────────┘                  └────────────┘
 *                                │
 *                         ┌──────┴──────┐
 *                         │  本地缓存     │
 *                         │ reviews/     │
 *                         └─────────────┘
 * 
 * 爬取策略:
 * ┌──────────┬────────────┬──────────────────────┐
 * │ 平台     │ 方式       │ 数据质量             │
 * ├──────────┼────────────┼──────────────────────┤
 * │ 携程     │ Headless   │ ⭐⭐⭐⭐⭐ 评论量大，评分准 │
 * │ 马蜂窝   │ Headless   │ ⭐⭐⭐⭐ 游记型评论，质量高 │
 * │ 去哪儿   │ Headless   │ ⭐⭐⭐ 作为补充数据源      │
 * └──────────┴────────────┴──────────────────────┘
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── 配置 ────────────────────────────────────────────
const CACHE_DIR = path.join(__dirname, '..', 'data', 'reviews');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 缓存 24 小时
const REQUEST_DELAY = {
  search: 2000,   // 搜索间隔
  detail: 1500,   // 详情页间隔
  review: 1000,   // 评论列表间隔
  retry: 5000,    // 重试间隔
};
const MAX_RETRIES = 2;
const REVIEWS_PER_PAGE = 15;  // 每页评论数

// ─── 工具函数 ─────────────────────────────────────────
/** 确保缓存目录存在 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/** 读取缓存 */
function getCache(key) {
  const file = path.join(CACHE_DIR, `${sanitizeKey(key)}.json`);
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    if (Date.now() - data.timestamp < CACHE_TTL) {
      return data.value;
    }
  }
  return null;
}

/** 写入缓存 */
function setCache(key, value) {
  ensureCacheDir();
  const file = path.join(CACHE_DIR, `${sanitizeKey(key)}.json`);
  fs.writeFileSync(file, JSON.stringify({ timestamp: Date.now(), value }, null, 2));
}

/** 清理 key 中的非法文件名字符 */
function sanitizeKey(key) {
  return key.replace(/[<>:"/\\|?*]/g, '_').slice(0, 100);
}

/** 延迟工具 */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** 随机 UA */
function randomUA() {
  const uas = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  ];
  return uas[Math.floor(Math.random() * uas.length)];
}

// ─── 浏览器管理 ───────────────────────────────────────
let browserInstance = null;
let browserContext = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
      ],
    });
  }
  if (!browserContext) {
    browserContext = await browserInstance.newContext({
      userAgent: randomUA(),
      viewport: { width: 1280, height: 800 },
      locale: 'zh-CN',
    });
  }
  return { browser: browserInstance, context: browserContext };
}

async function closeBrowser() {
  try { if (browserContext) await browserContext.close(); } catch (e) { /* ignore */ }
  try { if (browserInstance) await browserInstance.close(); } catch (e) { /* ignore */ }
  browserInstance = null;
  browserContext = null;
}

// ─── 结果标准化 ───────────────────────────────────────
/**
 * 将爬取结果统一为标准格式:
 * {
 *   spotName: string,
 *   platforms: {
 *     ctrip: { score, total, url, reviews: [{ user, date, rating, text, platform }] },
 *     mafengwo: { ... },
 *     qunar: { ... },
 *   },
 *   aggregate: { score, total, keywords, insight: { pros, cons } },
 *   timestamp: number,
 * }
 */

function normalizeReview(review, platform) {
  return {
    user: review.user || '匿名用户',
    date: review.date || '未知日期',
    rating: Math.min(5, Math.max(1, parseInt(review.rating) || 3)),
    text: (review.text || '').trim().slice(0, 500),
    platform: platform,
  };
}

function generateInsight(reviews) {
  if (!reviews || reviews.length === 0) {
    return { pros: ['暂无游客评价'], cons: ['暂无负面评价'], keywords: [] };
  }
  const positive = reviews.filter(r => r.rating >= 4);
  const negative = reviews.filter(r => r.rating <= 2);
  const allText = reviews.map(r => r.text).join(' ');

  // 提取高频关键词（简化版: 按词频统计）
  const keywordFreq = {};
  const words = allText.replace(/[，,。.！!？?、；;：:（）()【】\[\]""''\s]+/g, ' ')
    .split(' ')
    .filter(w => w.length >= 2 && !['一个','非常','真的','还是','觉得','那么','可以','自己','没有','那里','所以','因为','不是','而且','但是','已经','这样','什么','如果','他们','我们','就是','还有'].includes(w));
  words.forEach(w => {
    keywordFreq[w] = (keywordFreq[w] || 0) + 1;
  });
  const keywords = Object.entries(keywordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k]) => k);

  return {
    pros: positive.length > 0
      ? positive.slice(0, 3).map(r => r.text.slice(0, 50))
      : ['好评率较高，值得一去'],
    cons: negative.length > 0
      ? negative.slice(0, 3).map(r => r.text.slice(0, 50))
      : ['暂无明显的负面反馈'],
    keywords: keywords.length > 0 ? keywords : ['值得推荐', '景色优美'],
  };
}

// ═══════════════════════════════════════════════════════
//  携程 (Ctrip) 爬虫
// ═══════════════════════════════════════════════════════

/**
 * 在携程搜索景点，返回景点列表
 * URL: https://you.ctrip.com/searchsite/sight/?query=故宫
 */
async function searchCtripSpots(keyword, context) {
  const cacheKey = `ctrip_search_${keyword}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const page = await context.newPage();
  try {
    const url = `https://you.ctrip.com/searchsite/sight/?query=${encodeURIComponent(keyword)}`;
    console.log(`[Ctrip] 搜索: ${keyword}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(REQUEST_DELAY.search);

    // 尝试多种选择器提取搜索结果
    const spots = await page.evaluate(() => {
      const results = [];
      // 方式1: 标准搜索结果卡片
      const cards = document.querySelectorAll('.list_wide_mod2, .list_mod2, .result_item, .sight-list-item, [class*="sight"]');
      cards.forEach(card => {
        const nameEl = card.querySelector('h3, .cn_tit, .title, a[href*="/sight/"]');
        const name = nameEl?.textContent?.trim();
        const link = nameEl?.closest('a')?.href || card.querySelector('a[href*="/sight/"]')?.href || '';
        const scoreEl = card.querySelector('.score, .grade, [class*="score"], [class*="grade"]');
        const score = scoreEl?.textContent?.trim() || '';
        const countEl = card.querySelector('.comment_count, .recomment, [class*="comment"]');
        const count = countEl?.textContent?.trim() || '';

        if (name && name.length >= 2 && link) {
          // 提取景点 ID（携程格式: /sight/city{id}.html）
          const idMatch = link.match(/\/(\d+)\.html/);
          results.push({
            id: idMatch ? idMatch[1] : '',
            name,
            url: link.startsWith('http') ? link : `https://you.ctrip.com${link}`,
            score: parseFloat(score) || 0,
            reviewsCount: count,
            platform: 'ctrip',
          });
        }
      });

      // 方式2: 尝试从 JSON 数据中提取
      if (results.length === 0) {
        // 某些版本的页面有内嵌 JSON
        const scripts = document.querySelectorAll('script');
        scripts.forEach(s => {
          const text = s.textContent || '';
          if (text.includes('window.__INITIAL_STATE__') || text.includes('"sightName"')) {
            try {
              const jsonMatch = text.match(/window\.__INITIAL_STATE__\s*=\s*({.+?});?\s*$/);
              if (jsonMatch) {
                const data = JSON.parse(jsonMatch[1]);
                // 递归查找景点数据
                function findSpots(obj, depth = 0) {
                  if (depth > 10) return;
                  if (Array.isArray(obj)) {
                    obj.forEach(item => findSpots(item, depth + 1));
                  } else if (obj && typeof obj === 'object') {
                    if (obj.sightName || obj.name) {
                      results.push({
                        id: obj.sightId || obj.id || '',
                        name: obj.sightName || obj.name,
                        url: obj.url || '',
                        score: parseFloat(obj.score || obj.commentScore) || 0,
                        reviewsCount: String(obj.commentCount || obj.allCommentNum || ''),
                        platform: 'ctrip',
                      });
                    }
                    Object.values(obj).forEach(v => findSpots(v, depth + 1));
                  }
                }
                findSpots(data);
              }
            } catch (e) { /* ignore */ }
          }
        });
      }
      return results.filter(s => s.name).slice(0, 10);
    });

    console.log(`[Ctrip] 搜索到 ${spots.length} 个结果`);
    setCache(cacheKey, spots);
    await page.close();
    return spots;
  } catch (err) {
    console.error(`[Ctrip] 搜索失败: ${err.message}`);
    await page.close();
    return [];
  }
}

/**
 * 获取携程景点详情页的评分和基本数据
 * URL: https://you.ctrip.com/sight/{city}{id}.html
 */
async function getCtripSpotDetail(spotUrl, context) {
  const page = await context.newPage();
  try {
    console.log(`[Ctrip] 获取详情: ${spotUrl}`);
    await page.goto(spotUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(REQUEST_DELAY.detail);

    // 滚动到评论区域触发懒加载
    await page.evaluate(() => window.scrollTo(0, 800));
    await sleep(1500);

    // 尝试点击评论 tab
    const commentTabClicked = await page.evaluate(() => {
      const tabs = document.querySelectorAll('.commentTab, [data-type="comment"], .tab-nav a, [class*="comment"]');
      for (const tab of tabs) {
        if (tab.textContent.includes('评论') || tab.textContent.includes('点评')) {
          tab.click();
          return true;
        }
      }
      return false;
    });
    if (commentTabClicked) await sleep(2000);

    const detail = await page.evaluate(() => {
      // 提取评分 - 尝试多种选择器
      let score = '';
      const scoreSelectors = [
        '.grade .score', '.commentScoreNum', '.scoreNum', '.averageScore',
        '[class*="score"] strong', '.overall-score', '.rating-score',
      ];
      for (const sel of scoreSelectors) {
        const el = document.querySelector(sel);
        if (el) { score = el.textContent.trim(); break; }
      }

      // 提取评论总数
      let totalReviews = '';
      const countSelectors = [
        '.commentCount', '.allCommentNum', '.review-count', '.total-comment',
        '[class*="comment"] span', '.comment-num',
      ];
      for (const sel of countSelectors) {
        const el = document.querySelector(sel);
        if (el) { totalReviews = el.textContent.trim(); break; }
      }

      // 提取景点名
      const nameEl = document.querySelector('h1, .sightName, .cn_tit, .title-text');
      const spotName = nameEl?.textContent?.trim() || '';

      // 提取评论列表 (如果页面已渲染)
      const reviews = [];
      const reviewItems = document.querySelectorAll('.commentItem, .comment-item, .review-item, [class*="comment"] > div > div');
      reviewItems.forEach(item => {
        const userEl = item.querySelector('.userName, .user-name, .author, [class*="user"]');
        const dateEl = item.querySelector('.commentTime, .time, .date, [class*="time"]');
        const ratingEl = item.querySelectorAll('.star i.star-select, .star .on, i[class*="star"].on, .star .selected');
        const textEl = item.querySelector('.commentDetail, .comment-content, .content, [class*="detail"]');

        const user = userEl?.textContent?.trim() || '';
        const date = dateEl?.textContent?.trim() || '';
        const rating = ratingEl?.length || 0;
        const text = textEl?.textContent?.trim() || '';

        if (text && text.length > 10) {
          reviews.push({ user, date, rating, text });
        }
      });

      return { spotName, score, totalReviews, reviews };
    });

    await page.close();
    return detail;
  } catch (err) {
    console.error(`[Ctrip] 详情获取失败: ${err.message}`);
    await page.close();
    return { spotName: '', score: '', totalReviews: '', reviews: [] };
  }
}

/**
 * 从携程评论页获取评论
 * URL: https://you.ctrip.com/sight/{city}{id}.html#comment
 * 尝试直接请求 AJAX 接口
 */
async function getCtripReviews(spotId, pageNum = 1, context) {
  const cacheKey = `ctrip_reviews_${spotId}_p${pageNum}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const page = await context.newPage();
  try {
    // 携程评论 Ajax 接口 (此接口可能变动，需要定期维护)
    // 备选: 直接打开 #comment 页面抓取 DOM
    const url = `https://you.ctrip.com/sight/sightCommentList?sightId=${spotId}&page=${pageNum}&pageSize=${REVIEWS_PER_PAGE}`;
    console.log(`[Ctrip] 获取评论: spotId=${spotId}, page=${pageNum}`);

    // 先尝试 Ajax 接口
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    let reviews = [];
    let totalPages = 1;
    let totalCount = 0;

    if (response && response.ok()) {
      try {
        const json = await response.json();
        if (json && json.comments) {
          reviews = json.comments.map(c => ({
            user: c.userName || c.nickName || '携程用户',
            date: c.createTime || c.commentTime || '',
            rating: parseInt(c.score || c.rating) || 3,
            text: (c.content || c.commentDetail || '').trim(),
          }));
          totalPages = json.totalPage || Math.ceil((json.totalCount || 0) / REVIEWS_PER_PAGE) || 1;
          totalCount = json.totalCount || 0;
        }
      } catch (e) {
        // Ajax 接口失败，尝试 DOM 解析
        await page.goto(`https://you.ctrip.com/sight/sight${spotId}.html#comment`, {
          waitUntil: 'domcontentloaded', timeout: 30000,
        });
        await sleep(REQUEST_DELAY.review * 2);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await sleep(2000);

        reviews = await page.evaluate(() => {
          const items = document.querySelectorAll('.commentItem, .comment-item, [class*="comment"] > div > div');
          return Array.from(items).map(item => {
            const userEl = item.querySelector('.userName, .user-name, .author');
            const dateEl = item.querySelector('.commentTime, .time, .date');
            const stars = item.querySelectorAll('.star i.star-select, .star .on');
            const textEl = item.querySelector('.commentDetail, .comment-content, .content');
            return {
              user: userEl?.textContent?.trim() || '携程用户',
              date: dateEl?.textContent?.trim() || '',
              rating: stars.length || 3,
              text: textEl?.textContent?.trim() || '',
            };
          }).filter(r => r.text.length > 10);
        });
      }
    }

    const result = { reviews, totalPages, totalCount, page: pageNum };
    setCache(cacheKey, result);
    console.log(`[Ctrip] 获取到 ${reviews.length} 条评论`);
    await page.close();
    return result;
  } catch (err) {
    console.error(`[Ctrip] 评论获取失败: ${err.message}`);
    await page.close();
    return { reviews: [], totalPages: 0, totalCount: 0, page: pageNum };
  }
}

// ═══════════════════════════════════════════════════════
//  马蜂窝 (Mafengwo) 爬虫
// ═══════════════════════════════════════════════════════

/**
 * 在马蜂窝搜索景点
 * URL: https://www.mafengwo.cn/search/s.php?q=故宫&t=poi
 */
async function searchMafengwoSpots(keyword, context) {
  const cacheKey = `mafengwo_search_${keyword}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const page = await context.newPage();
  try {
    const url = `https://www.mafengwo.cn/search/s.php?q=${encodeURIComponent(keyword)}&t=poi`;
    console.log(`[Mafengwo] 搜索: ${keyword}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(REQUEST_DELAY.search);

    const spots = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.list_item, .poi-item, [class*="scenic"]');
      cards.forEach(card => {
        const nameEl = card.querySelector('h2, h3, .title, .cn_tit');
        const linkEl = card.querySelector('a[href*="/poi/"]');
        const scoreEl = card.querySelector('.score, .grade');
        const commentEl = card.querySelector('.comment, .rev');

        const name = nameEl?.textContent?.trim();
        const link = linkEl?.href || '';
        if (name && link) {
          const idMatch = link.match(/\/poi\/(\d+)\.html/);
          results.push({
            id: idMatch ? idMatch[1] : '',
            name,
            url: link,
            score: parseFloat(scoreEl?.textContent?.trim()) || 0,
            reviewsCount: commentEl?.textContent?.trim() || '',
            platform: 'mafengwo',
          });
        }
      });
      return results.filter(s => s.name).slice(0, 10);
    });

    console.log(`[Mafengwo] 搜索到 ${spots.length} 个结果`);
    setCache(cacheKey, spots);
    await page.close();
    return spots;
  } catch (err) {
    console.error(`[Mafengwo] 搜索失败: ${err.message}`);
    await page.close();
    return [];
  }
}

/**
 * 获取马蜂窝景点评价
 * URL: https://www.mafengwo.cn/poi/{id}.html
 */
async function getMafengwoReviews(spotId, pageNum = 1, context) {
  const cacheKey = `mafengwo_reviews_${spotId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const page = await context.newPage();
  try {
    const url = `https://www.mafengwo.cn/poi/${spotId}.html`;
    console.log(`[Mafengwo] 获取评论: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(REQUEST_DELAY.review);

    // 滚动到底部触发懒加载
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(2000);

    const result = await page.evaluate(() => {
      // 评分
      const scoreEl = document.querySelector('.score, .grade, .rank span');
      const score = scoreEl?.textContent?.trim() || '';

      // 评论数
      const countEl = document.querySelector('.comment-count, .rev-num, .total');
      const totalCount = countEl?.textContent?.trim() || '';

      // 景点名
      const nameEl = document.querySelector('h1, .title, .cn_tit');
      const name = nameEl?.textContent?.trim() || '';

      // 评论列表
      const reviews = [];
      const items = document.querySelectorAll('.comment-item, .review-item, [class*="comment"] li');
      items.forEach(item => {
        const userEl = item.querySelector('.user-name, .name, .author');
        const dateEl = item.querySelector('.time, .date');
        const stars = item.querySelectorAll('.star.on, i.on');
        const textEl = item.querySelector('.content, .text, .comment-text');

        const user = userEl?.textContent?.trim() || '马蜂窝用户';
        const date = dateEl?.textContent?.trim() || '';
        const rating = stars.length || 3;
        const text = textEl?.textContent?.trim() || '';

        if (text && text.length > 10) {
          reviews.push({ user, date, rating, text });
        }
      });

      return { name, score, totalCount, reviews };
    });

    console.log(`[Mafengwo] 获取到 ${result.reviews.length} 条评论`);
    setCache(cacheKey, result);
    await page.close();
    return result;
  } catch (err) {
    console.error(`[Mafengwo] 评论获取失败: ${err.message}`);
    await page.close();
    return { name: '', score: '', totalCount: '', reviews: [] };
  }
}

// ═══════════════════════════════════════════════════════
//  去哪儿 (Qunar) 爬虫 - 补充数据源
// ═══════════════════════════════════════════════════════

/**
 * 在去哪儿搜索景点
 */
async function searchQunarSpots(keyword, context) {
  const cacheKey = `qunar_search_${keyword}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const page = await context.newPage();
  try {
    const url = `https://travel.qunar.com/search/place?query=${encodeURIComponent(keyword)}`;
    console.log(`[Qunar] 搜索: ${keyword}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(REQUEST_DELAY.search);

    const spots = await page.evaluate(() => {
      const results = [];
      const cards = document.querySelectorAll('.list_item, .sight_item, [class*="item"]');
      cards.forEach(card => {
        const nameEl = card.querySelector('.cn_tit, h3, .title, .name');
        const linkEl = card.querySelector('a[href*="travel.qunar.com"]');
        const scoreEl = card.querySelector('.score, .grade, .rank');
        const name = nameEl?.textContent?.trim();
        const link = linkEl?.href || '';
        if (name && link) {
          const idMatch = link.match(/p-oi(\d+)/);
          results.push({
            id: idMatch ? idMatch[1] : '',
            name,
            url: link,
            score: parseFloat(scoreEl?.textContent?.trim()) || 0,
            reviewsCount: '',
            platform: 'qunar',
          });
        }
      });
      return results.filter(s => s.name).slice(0, 5);
    });

    setCache(cacheKey, spots);
    await page.close();
    return spots;
  } catch (err) {
    console.error(`[Qunar] 搜索失败: ${err.message}`);
    await page.close();
    return [];
  }
}

/**
 * 获取去哪儿评论
 */
async function getQunarReviews(spotId, context) {
  const cacheKey = `qunar_reviews_${spotId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const page = await context.newPage();
  try {
    const url = `https://travel.qunar.com/p-oi${spotId}.html`;
    console.log(`[Qunar] 获取评论: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(REQUEST_DELAY.review);
    await page.evaluate(() => window.scrollTo(0, 1500));
    await sleep(1500);

    const result = await page.evaluate(() => {
      const scoreEl = document.querySelector('.score, .comment-score, .rank');
      const countEl = document.querySelector('.comment-num, .total-count');
      const nameEl = document.querySelector('h1, .des_tit, .title');
      const name = nameEl?.textContent?.trim() || '';
      const score = scoreEl?.textContent?.trim() || '';
      const totalCount = countEl?.textContent?.trim() || '';

      const reviews = [];
      document.querySelectorAll('.comment_item, .comm-item, .comment-item').forEach(item => {
        const userEl = item.querySelector('.user_name, .name');
        const dateEl = item.querySelector('.time, .date');
        const stars = item.querySelectorAll('.star .active, .star.on');
        const textEl = item.querySelector('.comment_text, .content');
        const user = userEl?.textContent?.trim() || '去哪儿用户';
        const date = dateEl?.textContent?.trim() || '';
        const rating = stars.length || 3;
        const text = textEl?.textContent?.trim() || '';
        if (text.length > 10) reviews.push({ user, date, rating, text });
      });
      return { name, score, totalCount, reviews };
    });

    setCache(cacheKey, result);
    await page.close();
    return result;
  } catch (err) {
    console.error(`[Qunar] 评论获取失败: ${err.message}`);
    await page.close();
    return { name: '', score: '', totalCount: '', reviews: [] };
  }
}

// ═══════════════════════════════════════════════════════
//  公开接口 - 供路由层调用
// ═══════════════════════════════════════════════════════

/**
 * 搜索景点（跨平台）
 * @param {string} keyword - 搜索关键词
 * @param {string[]} platforms - 平台列表，默认 ['ctrip', 'mafengwo']
 * @returns {Promise<Object>} { results: [...], fromCache: bool }
 */
async function searchSpots(keyword, platforms = ['ctrip', 'mafengwo']) {
  try {
    const { context } = await getBrowser();
    const allResults = [];
    const tasks = [];

    if (platforms.includes('ctrip')) {
      tasks.push(
        searchCtripSpots(keyword, context).then(r => {
          allResults.push(...r.map(s => ({ ...s, platform: 'ctrip' })));
        }).catch(e => console.error('[searchSpots] ctrip 失败:', e.message))
      );
    }
    if (platforms.includes('mafengwo')) {
      tasks.push(
        searchMafengwoSpots(keyword, context).then(r => {
          allResults.push(...r.map(s => ({ ...s, platform: 'mafengwo' })));
        }).catch(e => console.error('[searchSpots] mafengwo 失败:', e.message))
      );
    }
    if (platforms.includes('qunar')) {
      tasks.push(
        searchQunarSpots(keyword, context).then(r => {
          allResults.push(...r.map(s => ({ ...s, platform: 'qunar' })));
        }).catch(e => console.error('[searchSpots] qunar 失败:', e.message))
      );
    }

    await Promise.allSettled(tasks);

    // 去重（同名景点合并）
    const nameMap = new Map();
    allResults.forEach(spot => {
      const stripped = spot.name.replace(/\s+/g, '');
      if (!nameMap.has(stripped) || spot.score > (nameMap.get(stripped).score || 0)) {
        nameMap.set(stripped, { ...spot, name: spot.name.trim() });
      }
    });

    return {
      success: true,
      results: Array.from(nameMap.values()).slice(0, 10),
      totalPlatforms: platforms.length,
      platformsSearched: platforms,
    };
  } catch (err) {
    console.error('[searchSpots] 异常:', err.message);
    return { success: false, error: err.message, results: [] };
  }
}

/**
 * 获取景点评价（跨平台聚合）
 * @param {Object} params
 * @param {string} params.spotName - 景点名称
 * @param {string} [params.ctripId] - 携程景点ID
 * @param {string} [params.mafengwoId] - 马蜂窝景点ID
 * @param {string[]} [params.platforms] - 要爬取的平台
 * @param {number} [params.page] - 页码
 * @returns {Promise<Object>}
 */
async function getReviews({ spotName, ctripId, mafengwoId, qunarId, platforms = ['ctrip', 'mafengwo'], page = 1 }) {
  const cacheKey = `aggregate_${spotName}_${platforms.join('_')}_p${page}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return { success: true, data: cached, fromCache: true };
  }

  try {
    const { context } = await getBrowser();
    const allQueries = [];
    let ctripData = { reviews: [], totalCount: 0 };
    let mafengwoData = { reviews: [], totalCount: 0 };
    let qunarData = { reviews: [], totalCount: 0 };

    // 如果没有提供 ID，先搜索获取
    let resolvedCtripId = ctripId;
    let resolvedMafengwoId = mafengwoId;
    let resolvedQunarId = qunarId;

    const idSearchTasks = [];
    if (platforms.includes('ctrip') && !resolvedCtripId) {
      idSearchTasks.push(
        searchCtripSpots(spotName, context).then(r => {
          const match = r.find(s => s.name.includes(spotName.slice(0, 2)) || s.name === spotName);
          if (match) resolvedCtripId = match.id;
        }).catch(e => console.error('[idSearch] ctrip 失败'))
      );
    }
    if (platforms.includes('mafengwo') && !resolvedMafengwoId) {
      idSearchTasks.push(
        searchMafengwoSpots(spotName, context).then(r => {
          const match = r.find(s => s.name.includes(spotName.slice(0, 2)) || s.name === spotName);
          if (match) resolvedMafengwoId = match.id;
        }).catch(e => console.error('[idSearch] mafengwo 失败'))
      );
    }
    if (platforms.includes('qunar') && !resolvedQunarId) {
      idSearchTasks.push(
        searchQunarSpots(spotName, context).then(r => {
          const match = r.find(s => s.name.includes(spotName.slice(0, 2)) || s.name === spotName);
          if (match) resolvedQunarId = match.id;
        }).catch(e => console.error('[idSearch] qunar 失败'))
      );
    }
    await Promise.allSettled(idSearchTasks);

    // 获取各平台评论
    const reviewTasks = [];
    if (resolvedCtripId) {
      reviewTasks.push(
        getCtripReviews(resolvedCtripId, page, context).then(r => { ctripData = r; }).catch(e => console.error(e))
      );
    }
    if (resolvedMafengwoId) {
      reviewTasks.push(
        getMafengwoReviews(resolvedMafengwoId, page, context).then(r => { mafengwoData = r; }).catch(e => console.error(e))
      );
    }
    if (resolvedQunarId) {
      reviewTasks.push(
        getQunarReviews(resolvedQunarId, context).then(r => { qunarData = r; }).catch(e => console.error(e))
      );
    }
    await Promise.allSettled(reviewTasks);

    // ─── 聚合数据 ───
    const allReviews = [
      ...ctripData.reviews.map(r => normalizeReview(r, 'ctrip')),
      ...mafengwoData.reviews.map(r => normalizeReview(r, 'mafengwo')),
      ...qunarData.reviews.map(r => normalizeReview(r, 'qunar')),
    ];

    // 计算综合评分
    const scores = allReviews.map(r => r.rating);
    const avgScore = scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : '4.5';

    const totalCount = (ctripData.totalCount || 0) + (mafengwoData.totalCount || 0) + (qunarData.totalCount || 0);
    const insight = generateInsight(allReviews);

    const result = {
      spotName,
      score: avgScore,
      total: totalCount > 0 ? `${(totalCount / 10000).toFixed(1)}万` : `${(allReviews.length / 10000 * 100).toFixed(0)}条`,
      platforms: {
        ctrip: {
          id: resolvedCtripId || '',
          score: ctripData.score || avgScore,
          count: ctripData.totalCount || 0,
          reviews: ctripData.reviews.map(r => normalizeReview(r, 'ctrip')),
        },
        mafengwo: mafengwoData.reviews.length > 0 ? {
          id: resolvedMafengwoId || '',
          score: mafengwoData.score || avgScore,
          count: mafengwoData.totalCount || 0,
          reviews: mafengwoData.reviews.map(r => normalizeReview(r, 'mafengwo')),
        } : undefined,
        qunar: qunarData.reviews.length > 0 ? {
          id: resolvedQunarId || '',
          score: qunarData.score || avgScore,
          count: qunarData.totalCount || 0,
          reviews: qunarData.reviews.map(r => normalizeReview(r, 'qunar')),
        } : undefined,
      },
      reviews: allReviews,
      insight,
      keywords: insight.keywords,
      timestamp: Date.now(),
      realData: allReviews.length > 0,
    };

    setCache(cacheKey, result);
    return { success: true, data: result, fromCache: false, reviewCount: allReviews.length };
  } catch (err) {
    console.error('[getReviews] 异常:', err.message);
    return { success: false, error: err.message, data: null };
  }
}

/**
 * 快速搜索景点（仅搜索，不获取评论）
 * 供前端搜索框使用
 */
async function quickSearch(keyword) {
  return searchSpots(keyword, ['ctrip']);
}

// ─── 导出 ────────────────────────────────────────────
module.exports = {
  searchSpots,
  getReviews,
  quickSearch,
  closeBrowser,

  // 底层方法也导出，方便单独调试
  searchCtripSpots,
  getCtripSpotDetail,
  getCtripReviews,
  searchMafengwoSpots,
  getMafengwoReviews,
  searchQunarSpots,
  getQunarReviews,
};
