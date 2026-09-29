/**
 * 毕设项目设计 PPT（优化版）
 * 保留用户已改：题目「基于多模态大模型的个性化旅行智能体…」、导师陈晨
 */
const pptxgen = require("pptxgenjs");

const C = {
  navy: "0B1F33",
  deep: "123047",
  teal: "1A6B7A",
  tealLight: "2A8F9E",
  sand: "F4EEE4",
  ink: "1C2833",
  muted: "5A6A76",
  accent: "D4784A",
  white: "FFFFFF",
  line: "D9CFC2",
};

const TITLE = "基于多模态大模型的个性化旅行智能体的设计与实现";
const TOTAL = 9;
const OUT =
  "d:/ai-travel-homepage/docs/graduation/项目设计汇报-智能旅行规划系统.pptx";

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "苏贤标";
pres.title = TITLE;
pres.subject = "本科毕业设计项目设计汇报";

function addFooter(slide, page) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.35, w: 10, h: 0.275, fill: { color: C.navy },
  });
  slide.addText("星际行者 · 个性化旅行智能体", {
    x: 0.4, y: 5.37, w: 6.5, h: 0.24,
    fontSize: 10, fontFace: "Microsoft YaHei", color: "A8C5D4", margin: 0,
  });
  slide.addText(`${page} / ${TOTAL}`, {
    x: 8.3, y: 5.37, w: 1.3, h: 0.24,
    fontSize: 10, fontFace: "Microsoft YaHei", color: "A8C5D4",
    align: "right", margin: 0,
  });
}

function sectionBar(slide, title, subtitle) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.85, fill: { color: C.navy },
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0.85, w: 0.12, h: 4.5, fill: { color: C.teal },
  });
  slide.addText(title, {
    x: 0.4, y: 0.16, w: 9.2, h: 0.36,
    fontSize: 22, fontFace: "Microsoft YaHei", bold: true, color: C.white, margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.4, y: 0.52, w: 9.2, h: 0.26,
      fontSize: 12, fontFace: "Microsoft YaHei", color: "9EB8C7", margin: 0,
    });
  }
}

function bg(slide) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.sand },
  });
}

// ========== 1 封面 ==========
{
  const s = pres.addSlide();
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.navy },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 7.8, y: 0, w: 2.2, h: 5.625, fill: { color: C.deep },
  });
  s.addText("本科毕业设计 · 项目设计汇报", {
    x: 0.55, y: 1.05, w: 6.8, h: 0.32,
    fontSize: 14, fontFace: "Microsoft YaHei", color: C.tealLight, margin: 0,
  });
  s.addText(TITLE, {
    x: 0.55, y: 1.5, w: 7.0, h: 1.45,
    fontSize: 24, fontFace: "Microsoft YaHei", bold: true, color: C.white, margin: 0,
  });
  s.addText("产品名：星际行者 · AI 旅行向导", {
    x: 0.55, y: 3.15, w: 6.8, h: 0.32,
    fontSize: 15, fontFace: "Microsoft YaHei", color: C.accent, margin: 0,
  });
  s.addText([
    { text: "学生：苏贤标　　学号：20235820124", options: { breakLine: true } },
    { text: "专业：人工智能　　班级：3班", options: { breakLine: true } },
    { text: "指导教师：陈晨", options: { breakLine: false } },
  ], {
    x: 0.55, y: 3.7, w: 6.8, h: 1.0,
    fontSize: 13, fontFace: "Microsoft YaHei", color: "B8CDD8", margin: 0,
  });
  s.addText("多模态\n大模型\nVue 3\nFastAPI\n高德地图", {
    x: 8.0, y: 1.5, w: 1.8, h: 2.8,
    fontSize: 14, fontFace: "Microsoft YaHei", color: "8FB4C4",
    align: "center", valign: "middle", margin: 0,
  });
}

// ========== 2 用途：痛点 + 目标 ==========
{
  const s = pres.addSlide();
  bg(s);
  sectionBar(s, "系统用途与要解决的问题", "面向自助游用户，把模糊偏好变成可执行、可保存、可分享的旅行方案");
  addFooter(s, 2);

  // goal banner
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.35, y: 1.05, w: 9.3, h: 0.72,
    fill: { color: C.navy }, rectRadius: 0.06,
  });
  s.addText("系统目标：构建「多模态偏好理解 → 结构化行程 → 真实路线落地 → 手账/分享沉淀」的一站式旅行智能体。", {
    x: 0.55, y: 1.2, w: 8.9, h: 0.45,
    fontSize: 13, fontFace: "Microsoft YaHei", color: C.white, margin: 0,
  });

  const pains = [
    { t: "攻略碎片化", d: "信息分散多平台，难快速形成可执行方案", s: "一键生成多日行程" },
    { t: "个性化不足", d: "传统站点偏展示，难适配天数/预算/偏好", s: "多模态输入定制规划" },
    { t: "路网脱节", d: "文案行程缺少真实道路轨迹与分日落地", s: "高德真实路线衔接" },
    { t: "记忆难沉淀", d: "行程、手账、分享割裂，成果不易留存", s: "手账编辑与社区分享" },
  ];
  pains.forEach((p, i) => {
    const x = 0.35 + (i % 2) * 4.7;
    const y = 1.95 + Math.floor(i / 2) * 1.5;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 4.5, h: 1.35,
      fill: { color: C.white }, rectRadius: 0.08,
      shadow: { type: "outer", color: "000000", blur: 5, offset: 1, angle: 135, opacity: 0.08 },
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.1, h: 1.35, fill: { color: i % 2 === 0 ? C.teal : C.accent },
    });
    s.addText(p.t, {
      x: x + 0.28, y: y + 0.15, w: 4.0, h: 0.3,
      fontSize: 15, fontFace: "Microsoft YaHei", bold: true, color: C.ink, margin: 0,
    });
    s.addText(p.d, {
      x: x + 0.28, y: y + 0.5, w: 4.0, h: 0.3,
      fontSize: 12, fontFace: "Microsoft YaHei", color: C.muted, margin: 0,
    });
    s.addText("对策：" + p.s, {
      x: x + 0.28, y: y + 0.9, w: 4.0, h: 0.28,
      fontSize: 12, fontFace: "Microsoft YaHei", bold: true, color: C.teal, margin: 0,
    });
  });
}

// ========== 3 核心功能 ==========
{
  const s = pres.addSlide();
  bg(s);
  sectionBar(s, "核心功能点（已实现能力）", "围绕智能体主链路，覆盖规划、落地、记录与运营");
  addFooter(s, 3);

  const feats = [
    { n: "01", t: "账号与权限", d: "注册登录、刷新令牌、JWT 会话；角色权限与用户数据隔离" },
    { n: "02", t: "地图与景点", d: "省份探索、热门景点库；地图 Key 后端代理，保护服务密钥" },
    { n: "03", t: "AI 行程规划", d: "文字/图片/语音输入，生成多日多景点结构化行程并可保存" },
    { n: "04", t: "真实路线规划", d: "时间/路程/顺利/费用策略，按天真实道路轨迹与缓存保存" },
    { n: "05", t: "手账与分享", d: "3/5/9 宫格手账编辑；多图游记、点赞评论、二维码分享" },
    { n: "06", t: "内容运营后台", d: "景点发布/热门排序；游记评论审核；管理审计日志" },
  ];
  feats.forEach((f, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.3 + col * 3.2;
    const y = 1.1 + row * 1.95;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y, w: 3.05, h: 1.8,
      fill: { color: C.white }, rectRadius: 0.08,
      shadow: { type: "outer", color: "000000", blur: 5, offset: 1, angle: 135, opacity: 0.08 },
    });
    s.addText(f.n, {
      x: x + 0.18, y: y + 0.18, w: 2.6, h: 0.32,
      fontSize: 18, fontFace: "Arial", bold: true, color: C.teal, margin: 0,
    });
    s.addText(f.t, {
      x: x + 0.18, y: y + 0.55, w: 2.7, h: 0.32,
      fontSize: 15, fontFace: "Microsoft YaHei", bold: true, color: C.ink, margin: 0,
    });
    s.addText(f.d, {
      x: x + 0.18, y: y + 0.95, w: 2.7, h: 0.65,
      fontSize: 11, fontFace: "Microsoft YaHei", color: C.muted, margin: 0,
    });
  });
}

// ========== 4 算法基线 ==========
{
  const s = pres.addSlide();
  bg(s);
  sectionBar(s, "算法方案 · 基线模型与数据", "课程要求：基线模型、数据集、可量化评测指标");
  addFooter(s, 4);

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.3, y: 1.05, w: 4.55, h: 4.05,
    fill: { color: C.white }, rectRadius: 0.08,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.3, y: 1.05, w: 4.55, h: 0.48, fill: { color: C.teal },
  });
  s.addText("基线模型 Baseline", {
    x: 0.5, y: 1.12, w: 4.1, h: 0.35,
    fontSize: 15, fontFace: "Microsoft YaHei", bold: true, color: C.white, margin: 0,
  });
  s.addText([
    { text: "① 大模型直接生成", options: { bold: true, breakLine: true } },
    { text: "根据偏好文本调用 LLM，直接输出自然语言或半结构化多日行程草稿。", options: { breakLine: true } },
    { text: "", options: { breakLine: true } },
    { text: "② 地图路径规划 API", options: { bold: true, breakLine: true } },
    { text: "给定点序后，调用高德 Web 服务计算真实道路轨迹，作为路线落地基线。", options: { breakLine: true } },
    { text: "", options: { breakLine: true } },
    { text: "基线局限", options: { bold: true, breakLine: true } },
    { text: "• 输出格式不稳定，难直接入库", options: { breakLine: true } },
    { text: "• 易出现地点幻觉、日程冲突", options: { breakLine: true } },
    { text: "• 与前端展示/路线模块耦合弱", options: { breakLine: false } },
  ], {
    x: 0.5, y: 1.7, w: 4.15, h: 3.2,
    fontSize: 12, fontFace: "Microsoft YaHei", color: C.ink, margin: 0, valign: "top",
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.1, y: 1.05, w: 4.55, h: 4.05,
    fill: { color: C.white }, rectRadius: 0.08,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 1.05, w: 4.55, h: 0.48, fill: { color: C.accent },
  });
  s.addText("数据集 / 评测样例", {
    x: 5.3, y: 1.12, w: 4.1, h: 0.35,
    fontSize: 15, fontFace: "Microsoft YaHei", bold: true, color: C.white, margin: 0,
  });
  s.addText([
    { text: "自建小规模评测集（不依赖私有日志）", options: { bold: true, breakLine: true } },
    { text: "• 偏好文本：天数、预算、风格、同行人", options: { breakLine: true } },
    { text: "• 目的地与出行组合样例", options: { breakLine: true } },
    { text: "• 景点 POI 描述（公开资料 + 自建）", options: { breakLine: true } },
    { text: "• 可选图片输入样例（视觉要点提取）", options: { breakLine: true } },
    { text: "", options: { breakLine: true } },
    { text: "评测指标（验收导向）", options: { bold: true, breakLine: true } },
    { text: "• 行程 JSON / 字段可解析率", options: { breakLine: true } },
    { text: "• 地点合理性与日程完整性（人工抽检）", options: { breakLine: true } },
    { text: "• 分日路线生成成功率", options: { breakLine: true } },
    { text: "• 核心用例可演示通过率", options: { breakLine: false } },
  ], {
    x: 5.3, y: 1.7, w: 4.15, h: 3.2,
    fontSize: 12, fontFace: "Microsoft YaHei", color: C.ink, margin: 0, valign: "top",
  });
}

// ========== 5 算法改进 ==========
{
  const s = pres.addSlide();
  bg(s);
  sectionBar(s, "算法方案 · 两个改进点", "相对基线：提升可解析性、可执行性与工程可对接性");
  addFooter(s, 5);

  const steps = [
    { t: "多模态输入", d: "文字/图片/语音" },
    { t: "结构化约束", d: "Schema+校验重试" },
    { t: "偏好重排", d: "距离/时长/费用" },
    { t: "地图落地", d: "分日真实轨迹" },
  ];
  steps.forEach((st, i) => {
    const x = 0.35 + i * 2.4;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.05, w: 2.2, h: 0.95,
      fill: { color: C.navy }, rectRadius: 0.08,
    });
    s.addText(st.t, {
      x, y: 1.15, w: 2.2, h: 0.35,
      fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.white, align: "center", margin: 0,
    });
    s.addText(st.d, {
      x, y: 1.52, w: 2.2, h: 0.3,
      fontSize: 11, fontFace: "Microsoft YaHei", color: "9EB8C7", align: "center", margin: 0,
    });
    if (i < 3) {
      s.addText("→", {
        x: x + 2.05, y: 1.25, w: 0.35, h: 0.4,
        fontSize: 18, color: C.accent, margin: 0,
      });
    }
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.3, y: 2.2, w: 4.55, h: 2.85,
    fill: { color: C.white }, rectRadius: 0.08,
  });
  s.addText("改进点 1　结构化输出 + 多模态融合", {
    x: 0.5, y: 2.35, w: 4.2, h: 0.35,
    fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.teal, margin: 0,
  });
  s.addText("做法：字段约束、JSON Schema 校验与失败重试；图片先提取视觉要点再并入提示词。\n\n预期效果：提高行程可解析率，减少格式漂移，便于直接落库与前端渲染。", {
    x: 0.5, y: 2.8, w: 4.15, h: 2.0,
    fontSize: 12, fontFace: "Microsoft YaHei", color: C.ink, margin: 0,
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 5.1, y: 2.2, w: 4.55, h: 2.85,
    fill: { color: C.white }, rectRadius: 0.08,
  });
  s.addText("改进点 2　多日偏好重排与日程切分", {
    x: 5.3, y: 2.35, w: 4.2, h: 0.35,
    fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.accent, margin: 0,
  });
  s.addText("做法：对候选点按距离/时长/费用策略重排，并按天切分，再调用高德生成分日轨迹。\n\n预期效果：降低跨城跳跃与单日过载，提升路线可执行性与可视化质量。", {
    x: 5.3, y: 2.8, w: 4.15, h: 2.0,
    fontSize: 12, fontFace: "Microsoft YaHei", color: C.ink, margin: 0,
  });
}

// ========== 6 系统架构 ==========
{
  const s = pres.addSlide();
  bg(s);
  sectionBar(s, "系统架构", "前后端分离；大模型与地图作为外部智能服务接入");
  addFooter(s, 6);

  const layers = [
    { title: "表现层", desc: "Vue 3 + Vite + Pinia｜规划、路线、手账、分享、管理后台", color: C.teal },
    { title: "业务 API", desc: "FastAPI + JWT｜认证、行程、路线、景点、评论、上传、AI 代理", color: "1F5F8B" },
    { title: "外部服务", desc: "文本/视觉大模型｜高德地图 Web 服务 / JS API", color: C.accent },
    { title: "数据存储", desc: "PostgreSQL｜Redis｜S3/MinIO 对象存储（异常可回退本地）", color: C.navy },
  ];
  layers.forEach((L, i) => {
    const y = 1.05 + i * 0.85;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.45, y, w: 9.1, h: 0.75,
      fill: { color: C.white }, rectRadius: 0.06,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.45, y, w: 1.75, h: 0.75, fill: { color: L.color },
    });
    s.addText(L.title, {
      x: 0.5, y: y + 0.2, w: 1.65, h: 0.35,
      fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.white, align: "center", margin: 0,
    });
    s.addText(L.desc, {
      x: 2.4, y: y + 0.2, w: 6.9, h: 0.35,
      fontSize: 13, fontFace: "Microsoft YaHei", color: C.ink, margin: 0,
    });
    if (i < 3) {
      s.addText("↓", {
        x: 4.7, y: y + 0.62, w: 0.5, h: 0.25,
        fontSize: 12, color: C.muted, align: "center", margin: 0,
      });
    }
  });
}

// ========== 7 数据流 + 工程 ==========
{
  const s = pres.addSlide();
  bg(s);
  sectionBar(s, "技术实现与数据流", "从偏好输入到行程落地，再到记忆沉淀的工程闭环");
  addFooter(s, 7);

  const cards = [
    { t: "输入", items: ["文字偏好描述", "图片视觉要点", "语音转写文本"] },
    { t: "理解生成", items: ["提示词编排", "结构化 Schema", "校验与重试"] },
    { t: "路线落地", items: ["点位偏好重排", "多日日程切分", "高德真实轨迹"] },
    { t: "沉淀运营", items: ["行程/路线落库", "手账继续编辑", "分享与内容审核"] },
  ];
  cards.forEach((c, i) => {
    const x = 0.3 + i * 2.4;
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x, y: 1.1, w: 2.25, h: 2.55,
      fill: { color: C.white }, rectRadius: 0.08,
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.1, w: 2.25, h: 0.48, fill: { color: i === 3 ? C.accent : C.navy },
    });
    s.addText(`${i + 1}. ${c.t}`, {
      x, y: 1.18, w: 2.25, h: 0.35,
      fontSize: 14, fontFace: "Microsoft YaHei", bold: true, color: C.white, align: "center", margin: 0,
    });
    c.items.forEach((it, j) => {
      s.addText("·  " + it, {
        x: x + 0.18, y: 1.8 + j * 0.45, w: 1.95, h: 0.35,
        fontSize: 12, fontFace: "Microsoft YaHei", color: C.ink, margin: 0,
      });
    });
  });

  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 0.3, y: 3.85, w: 9.35, h: 1.2,
    fill: { color: C.navy }, rectRadius: 0.08,
  });
  s.addText("工程要点", {
    x: 0.5, y: 4.0, w: 8.9, h: 0.28,
    fontSize: 13, fontFace: "Microsoft YaHei", bold: true, color: C.accent, margin: 0,
  });
  s.addText("地图 Key 后端代理；JWT 鉴权与用户数据隔离；SQLAlchemy + Alembic 迁移；Docker Compose 部署 PostgreSQL / Redis / MinIO；核心接口具备自动化测试。", {
    x: 0.5, y: 4.35, w: 8.9, h: 0.5,
    fontSize: 12, fontFace: "Microsoft YaHei", color: C.white, margin: 0,
  });
}

// ========== 8 进度与小结 ==========
{
  const s = pres.addSlide();
  bg(s);
  sectionBar(s, "工作进度与汇报小结", "时间安排与开题报告、任务书保持一致");
  addFooter(s, 8);

  const timeline = [
    { d: "2026.09.01–09.30", t: "选题开题" },
    { d: "10.01–10.20", t: "技术学习" },
    { d: "10.21–10.31", t: "数据准备" },
    { d: "11.01–11.30", t: "系统实验" },
    { d: "12.01–12.31", t: "完善初稿" },
    { d: "2027.01–02.20", t: "定稿答辩" },
  ];
  timeline.forEach((item, i) => {
    const x = 0.3 + i * 1.6;
    s.addShape(pres.shapes.OVAL, {
      x: x + 0.55, y: 1.12, w: 0.26, h: 0.26, fill: { color: C.teal },
    });
    if (i < 5) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.81, y: 1.22, w: 1.34, h: 0.05, fill: { color: C.line },
      });
    }
    s.addText(item.d, {
      x, y: 1.5, w: 1.55, h: 0.45,
      fontSize: 10, fontFace: "Microsoft YaHei", color: C.muted, align: "center", margin: 0,
    });
    s.addText(item.t, {
      x, y: 1.95, w: 1.55, h: 0.3,
      fontSize: 12, fontFace: "Microsoft YaHei", bold: true, color: C.ink, align: "center", margin: 0,
    });
  });

  const points = [
    "用途：解决攻略碎片化、个性化不足、路网脱节与记忆难沉淀问题",
    "算法：LLM+地图基线；改进为结构化/多模态融合 + 多日偏好重排切分",
    "工程：Vue 3 + FastAPI + PostgreSQL + 高德 + 大模型，形成可演示闭环",
    "成果：可运行系统、对比实验说明、毕业论文与答辩材料",
  ];
  points.forEach((p, i) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
      x: 0.35, y: 2.45 + i * 0.65, w: 9.25, h: 0.58,
      fill: { color: C.white }, rectRadius: 0.05,
    });
    s.addText(`${i + 1}`, {
      x: 0.5, y: 2.55 + i * 0.65, w: 0.35, h: 0.35,
      fontSize: 15, fontFace: "Arial", bold: true, color: C.teal, margin: 0,
    });
    s.addText(p, {
      x: 1.0, y: 2.55 + i * 0.65, w: 8.3, h: 0.38,
      fontSize: 13, fontFace: "Microsoft YaHei", color: C.ink, margin: 0,
    });
  });
}

// ========== 9 谢谢聆听 ==========
{
  const s = pres.addSlide();
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 5.625, fill: { color: C.navy },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.18, h: 5.625, fill: { color: C.teal },
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 4.85, w: 10, h: 0.775, fill: { color: C.deep },
  });

  s.addText("谢谢聆听", {
    x: 0.5, y: 1.55, w: 9.0, h: 0.85,
    fontSize: 48, fontFace: "Microsoft YaHei", bold: true, color: C.white, align: "center", margin: 0,
  });
  s.addText("恳请各位老师批评指正", {
    x: 0.5, y: 2.5, w: 9.0, h: 0.45,
    fontSize: 20, fontFace: "Microsoft YaHei", color: C.tealLight, align: "center", margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 4.1, y: 3.15, w: 1.8, h: 0.06, fill: { color: C.accent },
  });
  s.addText(TITLE, {
    x: 0.8, y: 3.45, w: 8.4, h: 0.7,
    fontSize: 13, fontFace: "Microsoft YaHei", color: "A8C5D4", align: "center", margin: 0,
  });
  s.addText("学生：苏贤标　　指导教师：陈晨　　9 / 9", {
    x: 0.5, y: 5.05, w: 9.0, h: 0.35,
    fontSize: 13, fontFace: "Microsoft YaHei", color: "8FB4C4", align: "center", margin: 0,
  });
}

pres
  .writeFile({ fileName: OUT })
  .then(() => console.log("OK", OUT))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
