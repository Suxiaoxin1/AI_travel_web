/**
 * 用户分享 API 路由
 * 
 * 存储方式：JSON 文件（data/shares.json），结构简单
 * 
 * API:
 *   GET    /api/shares          - 获取分享列表（支持 ?keyword=xxx 搜索）
 *   POST   /api/shares          - 发布新分享
 *   POST   /api/shares/:id/like - 点赞/取消点赞
 *   POST   /api/shares/:id/comment - 添加评论
 *   DELETE /api/shares/:id      - 删除分享
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const DATA_FILE = path.join(__dirname, '..', 'data', 'shares.json');

/** 读取所有分享 */
function readShares() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** 写入所有分享 */
function writeShares(shares) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(shares, null, 2), 'utf-8');
}

/** 生成唯一 ID */
function nextId() {
  return 'S' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 7).toUpperCase();
}

// ─── 1. 获取分享列表 ───
// GET /api/shares?keyword=xxx
router.get('/', (req, res) => {
  try {
    const { keyword } = req.query;
    let shares = readShares();

    if (keyword) {
      const kw = keyword.toLowerCase();
      shares = shares.filter(s =>
        (s.dest || '').toLowerCase().includes(kw) ||
        (s.title || '').toLowerCase().includes(kw) ||
        (s.content || '').toLowerCase().includes(kw) ||
        (s.tags || []).some(t => t.toLowerCase().includes(kw))
      );
    }

    // 按日期倒序
    shares.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.json({ success: true, shares });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 2. 发布新分享 ───
// POST /api/shares
// Body: { dest, title, content, rating, tags, userName }
router.post('/', (req, res) => {
  try {
    const { dest, title, content, rating, tags, userName, photos } = req.body;

    if (!dest || !content) {
      return res.status(400).json({ success: false, error: '目的地和内容不能为空' });
    }

    const now = new Date();
    const share = {
      id: nextId(),
      dest: dest.trim(),
      title: (title || '').trim(),
      content: content.trim(),
      rating: Math.min(5, Math.max(0, parseInt(rating) || 0)),
      tags: (tags || []).slice(0, 5).map(t => (t || '').trim()).filter(Boolean),
      photos: (photos || []).slice(0, 6).filter(p => typeof p === 'string' && p.length > 0),
      userName: (userName || '旅行者').trim(),
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      createdAt: now.toISOString(),
      likes: 0,
      likeUsers: [],
      comments: []
    };

    const shares = readShares();
    shares.push(share);
    writeShares(shares);

    res.json({ success: true, share });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 3. 点赞/取消点赞 ───
// POST /api/shares/:id/like
router.post('/:id/like', (req, res) => {
  try {
    const shares = readShares();
    const share = shares.find(s => s.id === req.params.id);
    if (!share) return res.status(404).json({ success: false, error: '分享不存在' });

    // 用 IP 作为用户标识（简化版）
    const userId = req.ip || 'anonymous';
    share.likeUsers = share.likeUsers || [];

    const idx = share.likeUsers.indexOf(userId);
    if (idx >= 0) {
      share.likeUsers.splice(idx, 1);
      share.likes = Math.max(0, share.likes - 1);
    } else {
      share.likeUsers.push(userId);
      share.likes = (share.likes || 0) + 1;
    }

    writeShares(shares);
    res.json({ success: true, likes: share.likes, liked: idx < 0 });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 4. 添加评论 ───
// POST /api/shares/:id/comment
// Body: { userName, text }
router.post('/:id/comment', (req, res) => {
  try {
    const { userName, text, photo } = req.body;
    if ((!text || !text.trim()) && !photo) {
      return res.status(400).json({ success: false, error: '评论内容或照片不能同时为空' });
    }

    const shares = readShares();
    const share = shares.find(s => s.id === req.params.id);
    if (!share) return res.status(404).json({ success: false, error: '分享不存在' });

    const now = new Date();
    const comment = {
      id: 'c' + Date.now().toString(36).toUpperCase(),
      userName: (userName || '匿名用户').trim(),
      text: (text || '').trim(),
      photo: (typeof photo === 'string' && photo.startsWith('data:image/')) ? photo : '',
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      createdAt: now.toISOString()
    };

    share.comments = share.comments || [];
    share.comments.push(comment);
    writeShares(shares);

    res.json({ success: true, comment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── 5. 删除分享 ───
// DELETE /api/shares/:id
router.delete('/:id', (req, res) => {
  try {
    const shares = readShares();
    const idx = shares.findIndex(s => s.id === req.params.id);
    if (idx < 0) return res.status(404).json({ success: false, error: '分享不存在' });

    shares.splice(idx, 1);
    writeShares(shares);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
