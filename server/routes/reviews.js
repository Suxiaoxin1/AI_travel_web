/**
 * 景区评价 API 路由
 * 
 * 端点说明:
 * ├── GET  /api/reviews/search?keyword=        → 搜索景点
 * ├── GET  /api/reviews/aggregate?name=&platforms= → 聚合评论
 * ├── GET  /api/reviews/quick-search?keyword=  → 快速搜索（仅搜索）
 * ├── POST /api/reviews/fetch                   → 手动触发爬取
 * └── GET  /api/reviews/status                  → 查看爬虫状态
 *
 * 注意：Playwright 已从依赖中移除，所有爬虫路由安全降级为「功能未启用」状态。
 */

const express = require('express');
const router = express.Router();

// 懒加载 scraper — 安装失败时安全降级
let _scraper = null;
function getScraper() {
  if (_scraper === null) {
    try {
      _scraper = require('../services/scraper');
    } catch (e) {
      console.warn('[reviews] 爬虫模块未加载（Playwright 已移除），评论抓取功能已禁用');
      _scraper = false;
    }
  }
  return _scraper || null;
}

// ─── 1. 搜索景点 ───
// GET /api/reviews/search?keyword=故宫&platforms=ctrip,mafengwo
router.get('/search', async (req, res) => {
  try {
    const scraper = getScraper();
    if (!scraper) return res.json({ success: false, error: '评论抓取功能暂未启用', results: [] });

    const { keyword, platforms } = req.query;
    if (!keyword || keyword.length < 2) {
      return res.json({ success: false, error: '请输入至少2个字符的关键词', results: [] });
    }

    const platformList = platforms
      ? platforms.split(',').map(p => p.trim()).filter(Boolean)
      : ['ctrip', 'mafengwo'];

    const result = await scraper.searchSpots(keyword.trim(), platformList);
    res.json(result);
  } catch (err) {
    console.error('[reviews/search]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. 聚合获取评论 ───
// GET /api/reviews/aggregate?name=故宫博物院&platforms=ctrip&page=1
router.get('/aggregate', async (req, res) => {
  try {
    const scraper = getScraper();
    if (!scraper) return res.json({ success: false, error: '评论抓取功能暂未启用' });

    const { name, ctripId, mafengwoId, qunarId, platforms, page } = req.query;
    if (!name) {
      return res.json({ success: false, error: '请提供景点名称' });
    }

    const platformList = platforms
      ? platforms.split(',').map(p => p.trim()).filter(Boolean)
      : ['ctrip', 'mafengwo'];

    const result = await scraper.getReviews({
      spotName: name.trim(),
      ctripId: ctripId || undefined,
      mafengwoId: mafengwoId || undefined,
      qunarId: qunarId || undefined,
      platforms: platformList,
      page: parseInt(page) || 1,
    });

    if (!result.success) {
      return res.json({ success: false, error: result.error, data: null });
    }

    res.json(result);
  } catch (err) {
    console.error('[reviews/aggregate]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 3. 快速搜索（轻量级，仅返回搜索结果） ───
// GET /api/reviews/quick-search?keyword=故宫
router.get('/quick-search', async (req, res) => {
  try {
    const scraper = getScraper();
    if (!scraper) return res.json({ success: true, results: [] });

    const { keyword } = req.query;
    if (!keyword || keyword.length < 2) {
      return res.json({ success: true, results: [] });
    }

    const result = await scraper.quickSearch(keyword.trim());
    res.json(result);
  } catch (err) {
    console.error('[reviews/quick-search]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 4. 手动触发爬取 ───
// POST /api/reviews/fetch
// Body: { spotName: "故宫博物院", platforms: ["ctrip"], ctripId: "xxx" }
router.post('/fetch', async (req, res) => {
  try {
    const scraper = getScraper();
    if (!scraper) return res.status(503).json({ success: false, error: '评论抓取功能暂未启用' });

    const { spotName, platforms, ctripId, mafengwoId, qunarId } = req.body;
    if (!spotName) {
      return res.status(400).json({ success: false, error: '请提供景点名称' });
    }

    const result = await scraper.getReviews({
      spotName: spotName.trim(),
      ctripId: ctripId || undefined,
      mafengwoId: mafengwoId || undefined,
      qunarId: qunarId || undefined,
      platforms: platforms || ['ctrip', 'mafengwo'],
      page: 1,
    });

    if (result.success) {
      res.json({
        success: true,
        message: `成功获取 ${result.reviewCount} 条真实评价`,
        data: result.data,
      });
    } else {
      res.json({ success: false, error: result.error });
    }
  } catch (err) {
    console.error('[reviews/fetch]', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 5. 爬虫状态检查 ───
// GET /api/reviews/status
router.get('/status', (req, res) => {
  const scraper = getScraper();
  res.json({
    success: true,
    enabled: !!scraper,
    message: scraper ? '爬虫服务运行中' : '评论抓取功能未启用（Playwright 依赖已移除）',
    supportedPlatforms: scraper ? ['ctrip (携程)', 'mafengwo (马蜂窝)', 'qunar (去哪儿)'] : [],
    features: scraper ? ['景点搜索', '评论抓取', '多平台聚合', '24小时缓存'] : [],
    note: '数据来自公开页面爬取，仅供学习研究使用',
  });
});

module.exports = router;
