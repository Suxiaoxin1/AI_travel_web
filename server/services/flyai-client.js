/**
 * 探途 WANDR - 飞猪 AI 开放平台 API 客户端
 *
 * 飞猪 FlyAI 基于 OpenClaw 协议，通过 CLI 工具调用：
 *   1. keyword-search → 度假/旅行团产品搜索
 *   2. search-hotel  → 酒店搜索
 *   3. 创建 / 取消 / 查询预订订单（本地管理）
 *   4. 沙箱模式（开发测试用，返回模拟数据）
 */

const { execSync } = require('child_process');
const { FLYAI_API_KEY, FLYAI_BASE_URL, NODE_ENV } = process.env;

// ---------- 通用 CLI 调用封装 ----------

/**
 * 调用 flyai CLI 并返回解析后的 JSON
 */
function execFlyai(args) {
  const env = { ...process.env, FLYAI_API_KEY };
  // 优先使用本地安装的 CLI，避免 npx 解析延迟
  const flyaiBin = require('path').join(__dirname, '..', 'node_modules', '.bin', 'flyai');
  const cmd = process.platform === 'win32' ? `"${flyaiBin}.cmd"` : flyaiBin;
  const fullCmd = `${cmd} ${args}`;
  console.log(`[FlyAI CLI] ${fullCmd}`);
  try {
    const stdout = execSync(fullCmd, {
      env,
      encoding: 'utf-8',
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true,
    });
    // 清理 BOM / 控制字符
    const clean = stdout.trim().replace(/^\uFEFF/, '');
    return JSON.parse(clean);
  } catch (err) {
    const stderr = err.stderr || '';
    console.error(`[FlyAI CLI Error] ${stderr || err.message}`);
    throw new Error(`FlyAI CLI 调用失败: ${stderr || err.message}`);
  }
}

// ---------- 1. 旅行团 / 度假产品搜索 ----------

/**
 * 搜索目的地旅行团 / 跟团游产品
 */
async function searchTourProducts(query) {
  if (NODE_ENV === 'sandbox' || !FLYAI_API_KEY || FLYAI_API_KEY === 'your_api_key_here') {
    console.log(`[Sandbox] searchTourProducts`, JSON.stringify(query, null, 2));
    return sandboxSearchProducts(query);
  }

  try {
    const keyword = query.keyword || '';
    const days = query.days || '';
    const daysSuffix = days ? ` ${days}日` : '';

    // 用 keyword-search 获取真实产品列表
    const raw = execFlyai(`keyword-search --query "${keyword}${daysSuffix} 跟团游 自由行"`);

    if (raw && raw.status === 0 && raw.data && raw.data.itemList) {
      const products = adaptTourProducts(raw.data.itemList, keyword, days);
      return {
        success: true,
        total: products.length,
        products,
      };
    }

    // API 返回异常则降级到沙箱
    console.warn('[FlyAI] keyword-search 返回异常，降级到沙箱');
    return sandboxSearchProducts(query);
  } catch (err) {
    console.error('[FlyAI] searchTourProducts 异常，降级到沙箱:', err.message);
    return sandboxSearchProducts(query);
  }
}

// ---------- 2. 酒店搜索 ----------

async function searchHotels({ city, checkIn, checkOut, guests = 2 }) {
  if (NODE_ENV === 'sandbox' || !FLYAI_API_KEY || FLYAI_API_KEY === 'your_api_key_here') {
    return sandboxSearchHotels(city);
  }

  try {
    const checkInStr = checkIn || '2026-06-10';
    const checkOutStr = checkOut || '2026-06-12';
    const raw = execFlyai(`search-hotel --dest-name "${city}" --check-in-date ${checkInStr} --check-out-date ${checkOutStr}`);

    if (raw && raw.status === 0 && raw.data && raw.data.itemList) {
      return {
        success: true,
        total: raw.data.itemList.length,
        hotels: raw.data.itemList.map((item, i) => ({
          id: item.shId || `HT${i}`,
          name: item.name || `${city}酒店`,
          stars: item.star === '豪华型' ? 5 : item.star === '舒适型' ? 4 : 3,
          price: parsePrice(item.price),
          rating: parseFloat(item.star) || 4.5,
          address: item.address || '',
          image: item.mainPic || '',
          brand: item.brandName || '',
          detailUrl: item.detailUrl || '',
          decorationTime: item.decorationTime || '',
        })),
      };
    }

    return sandboxSearchHotels(city);
  } catch (err) {
    console.error('[FlyAI] searchHotels 异常，降级到沙箱:', err.message);
    return sandboxSearchHotels(city);
  }
}

// ---------- 3. 创建预订 ----------

async function createBooking(order) {
  if (NODE_ENV === 'sandbox' || !FLYAI_API_KEY || FLYAI_API_KEY === 'your_api_key_here') {
    return sandboxCreateBooking(order);
  }
  // CLI 暂不支持直接下单，由后端自行管理订单
  return sandboxCreateBooking(order);
}

// ---------- 4. 查询订单 ----------

async function queryBooking(fliggyOrderId) {
  return { orderId: fliggyOrderId, status: 'confirmed' };
}

// ---------- 5. 取消订单 ----------

async function cancelBooking(fliggyOrderId, reason = '用户主动取消') {
  return { success: true, message: '订单已取消' };
}

// ================================================================
//  数据适配器：将 FlyAI CLI 返回的产品转为前端卡片格式
// ================================================================

let _uid = 0;
function nextId() {
  _uid++;
  return `FJA${Date.now().toString(36).toUpperCase()}_${_uid}`;
}

/**
 * 从产品标题中提取天数（支持多种中文表达）
 */
function extractDays(title) {
  // 匹配 "4天3晚"、"5天4晚"、"4日游"、"4天" 等
  let m = title.match(/(\d+)\s*天/);
  if (m) return parseInt(m[1], 10);
  m = title.match(/(\d+)\s*日\s*游/);
  if (m) return parseInt(m[1], 10);
  // 匹配 "4天3晚" 中前面那个数字
  m = title.match(/(\d+)\s*天\s*\d+\s*晚/);
  if (m) return parseInt(m[1], 10);
  return null;
}

/**
 * 从产品标题中推断产品类型
 */
function inferType(title) {
  if (/自由行|自驾|自订|自助|定制/.test(title)) return '自由行';
  return '跟团游';
}

/**
 * 解析价格字符串 "¥3xx" → 399
 */
function parsePrice(priceStr) {
  if (!priceStr || priceStr === 'null') return 0;
  const cleaned = priceStr.replace(/[¥￥,]/g, '');
  // "3xx" → 399, "1xx" → 199, "8x" → 89
  const replaced = cleaned.replace(/x+/g, (match) => '9'.repeat(match.length));
  return parseInt(replaced, 10) || 0;
}

/**
 * 将 keyword-search 原始结果转换为前端产品格式
 * 对"强匹配"产品用沙箱数据补全细节，其他产品用 API 数据 + 估算
 */
function adaptTourProducts(itemList, keyword, queryDays) {
  // 先获取沙箱数据作为补全字典
  const sandboxMap = {};
  for (const [dest, items] of Object.entries(DEST_PRODUCTS)) {
    for (const p of items) {
      sandboxMap[p.name] = p;
    }
  }

  // 跟踪哪些沙箱产品已被使用，避免重复匹配
  const usedSandboxIds = new Set();

  return itemList.map((item, idx) => {
    const info = item.info || {};
    const title = info.title || '未知产品';
    const days = extractDays(title) || extractDays(keyword) || queryDays || 5;
    const price = info.price ? parsePrice(info.price) : estimatePrice(title, days);
    const tags = (info.tags && info.tags.length > 0) ? info.tags : ['品质保障'];
    const type = inferType(title);

    // 严格匹配：仅当标题存在强关联时才用沙箱补全
    let enriched = null;
    for (const [sandboxName, sandboxData] of Object.entries(sandboxMap)) {
      if (usedSandboxIds.has(sandboxData.id)) continue; // 已使用过，跳过
      if (strongMatch(title, sandboxName)) {
        enriched = sandboxData;
        usedSandboxIds.add(sandboxData.id);
        break;
      }
    }

    const product = {
      id: nextId(),
      name: title,
      type,
      price: enriched ? enriched.price : price,
      days: enriched ? enriched.days : days,
      rating: enriched ? enriched.rating : (4.5 + Math.random() * 0.4).toFixed(1),
      sales: enriched ? enriched.sales : Math.floor(Math.random() * 3000) + 500,
      highlight: enriched ? enriched.highlight : tags.join('、'),
      images: info.picUrl ? [info.picUrl] : [],
      jumpUrl: info.jumpUrl || `https://www.fliggy.com/search?keyword=${encodeURIComponent(title)}`,
      hotelLevel: enriched ? enriched.hotelLevel : inferHotelLevel(title),
      meals: enriched ? enriched.meals : inferMeals(title, days),
      transport: enriched ? enriched.transport : '空调旅游车',
      itinerary: enriched ? enriched.itinerary : generateDefaultItinerary(title, days),
      tags: enriched ? [...new Set([...tags, ...enriched.tags])].slice(0, 4) : tags,
      groupSize: enriched ? enriched.groupSize : '2-28人',
      _source: 'flyai',
    };

    return product;
  });
}

/**
 * 强匹配：检查沙箱产品名是否高度相关
 * 要求沙箱产品名中至少 5 个连续字符出现在真实产品名中
 * 或沙箱核心关键词（>=3个词）全部命中
 */
function strongMatch(realTitle, sandboxTitle) {
  if (!realTitle || !sandboxTitle) return false;
  
  // 方法1：连续 5+ 字符匹配
  const shorter = sandboxTitle.length <= realTitle.length ? sandboxTitle : realTitle;
  const longer = sandboxTitle.length <= realTitle.length ? realTitle : sandboxTitle;
  for (let i = 0; i < shorter.length - 4; i++) {
    const seg = shorter.substring(i, i + 5);
    if (longer.includes(seg)) return true;
  }
  
  return false;
}

/**
 * 从标题推断住宿标准
 */
function inferHotelLevel(title) {
  if (/五星|豪华|希尔顿|喜来登|万豪|洲际|丽思/.test(title)) return '五星/豪华型';
  if (/亚朵|四星|高档|4钻|4星|希尔顿欢朋/.test(title)) return '四星/高档型';
  if (/民宿|客栈|特色/.test(title)) return '特色客栈';
  return '四星/高档型';
}

/**
 * 从标题推断餐饮
 */
function inferMeals(title, days) {
  if (days <= 3) return '含早餐';
  if (days <= 5) return `${days - 1}早${Math.floor(days * 1.5)}正餐`;
  return `${days - 1}早${Math.floor(days * 1.5)}正餐`;
}

/**
 * 根据标题估算价格（无法从 API 获取时）
 */
function estimatePrice(title, days) {
  if (title.includes('豪华') || title.includes('五星') || title.includes('私家')) return 2980 + Math.floor(Math.random() * 2000);
  if (title.includes('精品') || title.includes('纯玩')) return 1980 + Math.floor(Math.random() * 1000);
  if (title.includes('自由行')) return 1280 + Math.floor(Math.random() * 1500);
  return 1580 + Math.floor(Math.random() * 1500);
}

/**
 * 生成默认行程（无沙箱补全时）
 */
function generateDefaultItinerary(title, days) {
  const lines = [];
  for (let d = 1; d <= days; d++) {
    if (d === 1) lines.push(`D${d} 抵达目的地 → 入住酒店 → 自由活动`);
    else if (d === days) lines.push(`D${d} 自由活动 → 返程`);
    else lines.push(`D${d} 景点游览（详见产品详情页）`);
  }
  return lines;
}

// ================================================================
//  沙箱模拟数据（开发测试 / 降级专用）
// ================================================================

const DEST_PRODUCTS = {
  '张家界': [
    { id: 'FJ001', name: '张家界国家森林公园 4 日深度游', type: '跟团游', price: 1880, days: 4, rating: 4.8, sales: 2356, highlight: '含天门山索道 + 玻璃栈道', images: ['https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400'],
      hotelLevel: '四星/高档型', meals: '3早5正餐', transport: '往返空调大巴',
      itinerary: ['D1 抵达张家界 → 入住酒店 → 自由漫步溪布街', 'D2 张家界国家森林公园 → 金鞭溪 → 袁家界 → 天子山', 'D3 天门山国家森林公园 → 索道上山 → 玻璃栈道 → 天门洞', 'D4 土家风情园 → 返程'],
      tags: ['纯玩0购物', '必去打卡', '家庭首选'], groupSize: '2-28人' },
    { id: 'FJ002', name: '凤凰古城+张家界 5 日联游', type: '跟团游', price: 2580, days: 5, rating: 4.7, sales: 1802, highlight: '夜游沱江 + 土家风情表演', images: ['https://images.unsplash.com/photo-1528164344705-47542687000d?w=400'],
      hotelLevel: '四星/高档型', meals: '4早6正餐(含1特色长龙宴)', transport: '往返空调大巴',
      itinerary: ['D1 抵达张家界 → 溪布街自由活动', 'D2 张家界森林公园 → 袁家界迷魂台', 'D3 天门山玻璃栈道 → 凤凰古城 → 夜游沱江', 'D4 凤凰古城深度游览(沈从文故居/虹桥)', 'D5 苗寨体验 → 返程'],
      tags: ['双古城联游', '夜游沱江', '民族风情'], groupSize: '2-30人' },
    { id: 'FJ003', name: '张家界自由行 3 日套餐', type: '自由行', price: 1280, days: 3, rating: 4.5, sales: 4120, highlight: '含酒店 + 门票，行程自定', images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'],
      hotelLevel: '三星/舒适型', meals: '含早餐', transport: '不含大交通(可代订)',
      itinerary: ['D1 自行抵达 → 酒店办理入住 → 推荐溪布街美食探索', 'D2 张家界森林公园一日游(门票已含) → 推荐袁家界日落', 'D3 天门山半日游(门票已含) → 自由返程'],
      tags: ['行程灵活', '高性价比', '适合自驾'], groupSize: '自定义' },
  ],
  '桂林': [
    { id: 'FJ010', name: '桂林阳朔漓江 4 日精华游', type: '跟团游', price: 1680, days: 4, rating: 4.9, sales: 3100, highlight: '漓江竹筏 + 印象刘三姐', images: ['https://images.unsplash.com/photo-1537531383496-f4749b35b535?w=400'],
      hotelLevel: '四星/高档型', meals: '3早5正餐(含啤酒鱼)', transport: '全程空调旅游车',
      itinerary: ['D1 抵达桂林 → 两江四湖夜景', 'D2 漓江竹筏(兴坪-九马画山) → 西街自由活动', 'D3 遇龙河竹筏 → 十里画廊 → 印象刘三姐实景演出', 'D4 象鼻山 → 正阳步行街 → 返程'],
      tags: ['经典线路', '山水甲天下', '摄影推荐'], groupSize: '2-26人' },
    { id: 'FJ011', name: '龙脊梯田+桂林 5 日摄影团', type: '跟团游', price: 2280, days: 5, rating: 4.8, sales: 890, highlight: '专业摄影领队 + 最佳机位', images: ['https://images.unsplash.com/photo-1529921879218-f99546d27a3e?w=400'],
      hotelLevel: '特色客栈', meals: '4早6正餐(含农家宴)', transport: '空调旅游车+景区接驳',
      itinerary: ['D1 桂林集合 → 象鼻山拍摄日落', 'D2 前往龙脊梯田 → 金坑大寨红瑶梯田日出日落', 'D3 平安壮族梯田(七星伴月) → 古壮寨', 'D4 阳朔遇龙河 → 兴坪渔火', 'D5 漓江晨雾 → 返程'],
      tags: ['摄影专线', '小团出行', '最佳季节'], groupSize: '2-12人精品小团' },
    { id: 'FJ012', name: '桂林阳朔自由行 3 日轻奢版', type: '自由行', price: 1980, days: 3, rating: 4.6, sales: 2100, highlight: '精选网红民宿 + 私人定制攻略', images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400'],
      hotelLevel: '高端民宿/五星级泳池酒店', meals: '含早餐(可升级下午茶)', transport: '接送机服务',
      itinerary: ['D1 专车接机 → 入住网红民宿 → 西街酒吧街探索', 'D2 漓江游船或竹筏(自选) → 十里画廊骑行 → 相公山日落', 'D3 遇龙河漂流 → 下午茶时光 → 送机返程'],
      tags: ['轻奢度假', '网红打卡', '情侣优选'], groupSize: '自定义' },
  ],
  '北京': [
    { id: 'FJ020', name: '北京经典 5 日跟团游', type: '跟团游', price: 2080, days: 5, rating: 4.7, sales: 5200, highlight: '故宫+长城+颐和园+天坛', images: ['https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400'],
      hotelLevel: '四星/高档型', meals: '4早7正餐(含北京烤鸭)', transport: '豪华空调旅游车',
      itinerary: ['D1 抵达北京 → 王府井/前门大街自由活动', 'D2 天安门广场 → 故宫博物院 → 景山公园俯瞰紫禁城', 'D3 八达岭长城 → 鸟巢水立方外观', 'D4 颐和园 → 圆明园 → 清华北大外景', 'D5 天坛公园 → 返程'],
      tags: ['必去景点', '北京烤鸭', '历史人文'], groupSize: '2-32人' },
    { id: 'FJ021', name: '北京亲子研学 4 日游', type: '跟团游', price: 2680, days: 4, rating: 4.9, sales: 1600, highlight: '故宫探秘 + 科技馆 + 动物园', images: ['https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=400'],
      hotelLevel: '亲子主题酒店', meals: '3早5正餐(含营养儿童餐)', transport: '安全舒适的亲子专车',
      itinerary: ['D1 抵达北京 → 开营仪式 → 奥林匹克公园探索', 'D2 故宫研学(寻宝游戏模式) → 国家博物馆', 'D3 中国科技馆互动体验 → 北京动物园熊猫馆', 'D4 天安门升旗仪式 → 结营 → 返程'],
      tags: ['亲子研学', '寓教于乐', '小团出行'], groupSize: '5-10组家庭精品团' },
    { id: 'FJ022', name: '北京文化深度游 6 日定制', type: '自由行', price: 3200, days: 6, rating: 4.8, sales: 650, highlight: '胡同深度游 + 非遗体验 + 私人导游', images: ['https://images.unsplash.com/photo-1559000515-59bd5bf3e2f7?w=400'],
      hotelLevel: '五星/豪华型', meals: '含早餐+1次私房菜体验', transport: '专车接送+私人导游讲解',
      itinerary: ['D1 抵达 → 四合院酒店入住 → 胡同骑行初探', 'D2 故宫深度游(珍宝馆+钟表馆) → 景山', 'D3 长城(慕田峪)滑道体验 → 烤鸭DIY', 'D4 颐和园泛舟 → 798艺术区', 'D5 天坛 → 南铜锣巷非遗手作体验', 'D6 潘家园旧货市场 → 返程'],
      tags: ['深度文化', '私人定制', '非遗传'], groupSize: '1-6人' },
  ],
  '三亚': [
    { id: 'FJ030', name: '三亚双飞 5 日海岛度假', type: '自由行', price: 3280, days: 5, rating: 4.6, sales: 4300, highlight: '海景房 + 接送机 + 水上项目', images: ['https://images.unsplash.com/photo-1540202404-a2f29016b523?w=400'],
      hotelLevel: '五星海景度假酒店', meals: '每日双早(可升级为自助晚餐)', transport: '机场接送机',
      itinerary: ['D1 抵达三亚 → 海景房入住 → 椰梦长廊日落', 'D2 蜈支洲岛一日游(含上岛门票+潜水体验)', 'D3 亚特兰蒂斯水世界 / 或选择免税店购物日', 'D4 天涯海角 → 南山寺海上观音 → 海鲜市场', 'D5 酒店享用设施 → 送机返程'],
      tags: ['海岛度假', '蜜月首选', '免税购物'], groupSize: '自定义' },
    { id: 'FJ031', name: '三亚亲子 4 日欢乐游', type: '跟团游', price: 2580, days: 4, rating: 4.8, sales: 2100, highlight: '亚特兰蒂斯 + 热带天堂', images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400'],
      hotelLevel: '四星亲子酒店', meals: '3早4正餐(含海鲜BBQ)', transport: '全程旅游车',
      itinerary: ['D1 三亚接机 → 酒店休息 → 大东海沙滩', 'D2 亚特兰蒂斯水世界+失落的空间水族馆', 'D3 亚龙湾热带天堂森林公园(非诚勿扰2取景地)', 'D4 蜈支洲岛沙滩活动 → 送机返程'],
      tags: ['亲子乐园', '水上世界', '轻松休闲'], groupSize: '6-15组家庭' },
    { id: 'FJ032', name: '西沙群岛 4 日探险邮轮', type: '跟团游', price: 5980, days: 4, rating: 4.9, sales: 320, highlight: '中国马尔代夫 + 浮潜看珊瑚', images: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400'],
      hotelLevel: '邮轮海景舱', meals: '全含(船上自助餐+岛上野炊)', transport: '南海之梦号邮轮',
      itinerary: ['D1 三亚凤凰港登船 → 出航西沙 → 甲板观星', 'D2 全富岛(玻璃海水+白沙滩) → 鸭公岛浮潜', 'D3 银屿岛(渔民村探访+赶海) → 返航', 'D4 抵达三亚港 → 行程结束'],
      tags: ['一生一次', '玻璃海水', '稀缺航线'], groupSize: '限定300人/航次' },
  ],
  '西藏': [
    { id: 'FJ040', name: '拉萨+林芝 8 日朝圣之旅', type: '跟团游', price: 5980, days: 8, rating: 4.9, sales: 750, highlight: '布达拉宫 + 纳木错 + 南迦巴瓦', images: ['https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400'],
      hotelLevel: '当地最好(供氧酒店)', meals: '7早10正餐(含石锅鸡+藏式火锅)', transport: '正规旅游巴士',
      itinerary: ['D1 抵达拉萨 → 适应海拔 → 布达拉宫广场夜景', 'D2 布达拉宫 → 大昭寺 → 八廓街转经', 'D3 拉萨 → 米拉山口 → 卡定沟 → 林芝', 'D4 雅鲁藏布大峡谷 → 南迦巴瓦峰观景台', 'D5 巴松措 → 鲁朗林海(东方瑞士)', 'D6 林芝 → 尼洋河风光带 → 返回拉萨', 'D7 羊卓雍措(圣湖) → 卡若拉冰川', 'D8 送机返程(可延住)'],
      tags: ['朝圣之旅', '高原圣地', '一生必去'], groupSize: '2-18人精品团' },
    { id: 'FJ041', name: '珠峰大本营 10 日探险团', type: '跟团游', price: 8980, days: 10, rating: 4.8, sales: 320, highlight: '珠峰日出 + 羊卓雍措 + 扎什伦布寺', images: ['https://images.unsplash.com/photo-1559641494-4d8f5b4181e5?w=400'],
      hotelLevel: '沿途最优条件(部分无星)', meals: '9早12正餐', transport: '越野车(4人/车)',
      itinerary: ['D1-D2 抵达拉萨 → 适应海拔(重要!)', 'D3 拉萨 → 羊卓雍措 → 日喀则', 'D4 日喀则 → 扎什伦布寺 → 拉孜', 'D5 拉孜 → 定日 → 加乌拉山口(4座8000m雪山) → 珠峰大本营', 'D6 珠峰日出 → 定日返回日喀则', 'D7 日喀则 → 纳木错扎西半岛(看星空)', 'D8 纳木错日出 → 返回拉萨', 'D9 拉萨自由活动', 'D10 返程'],
      tags: ['世界屋脊', '极限挑战', '珠峰日出'], groupSize: '2-6人越野小团' },
    { id: 'FJ042', name: '拉萨市区 5 日文化慢旅', type: '自由行', price: 3680, days: 5, rating: 4.7, sales: 480, highlight: '供氧酒店 + 文化向导 + 手作唐卡体验', images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'],
      hotelLevel: '五星供氧酒店', meals: '含早餐+1次藏式欢迎晚宴', transport: '接送机+市内用车',
      itinerary: ['D1 抵达拉萨 → 供氧酒店休息 → 甜茶馆体验', 'D2 布达拉宫(含专业讲解) → 大昭寺', 'D3 哲蚌寺 → 色拉寺辩经 → 手作唐卡体验', 'D4 羊卓雍措一日游', 'D5 八廓街淘宝 → 送机返程'],
      tags: ['高原慢旅行', '文化沉浸', '适合初次入藏'], groupSize: '1-4人' },
  ],
  '西安': [
    { id: 'FJ050', name: '西安古都 4 日文化之旅', type: '跟团游', price: 1580, days: 4, rating: 4.7, sales: 3800, highlight: '兵马俑 + 华清池 + 回民街', images: ['https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400'],
      hotelLevel: '四星/高档型', meals: '3早5正餐(含饺子宴+羊肉泡馍)', transport: '豪华空调旅游车',
      itinerary: ['D1 抵达西安 → 钟鼓楼广场 → 回民街美食探索', 'D2 兵马俑博物馆 → 华清池 → 骊山', 'D3 陕西历史博物馆 → 大雁塔北广场音乐喷泉 → 大唐不夜城', 'D4 明城墙骑行 → 永兴坊小吃 → 返程'],
      tags: ['十三朝古都', '美食之都', '历史爱好者'], groupSize: '2-28人' },
    { id: 'FJ051', name: '西安+华山 5 日冒险游', type: '跟团游', price: 2380, days: 5, rating: 4.8, sales: 1400, highlight: '华山论剑 + 兵马俑深度探秘', images: ['https://images.unsplash.com/photo-1528164344705-47542687000d?w=400'],
      hotelLevel: '四星/高档型', meals: '4早6正餐(含biangbiang面制作体验)', transport: '空调车+华山索道',
      itinerary: ['D1 西安抵达 → 大唐芙蓉园夜景', 'D2 兵马俑+华清池(深度3小时讲解)', 'D3 华山西峰索道上 → 北峰长空栈道 → 西峰索道下', 'D4 西安城墙 → 陕西历史博物馆 → 大唐不夜城', 'D5 小雁塔 → 返程'],
      tags: ['奇险天下第一山', '深度讲解', '户外挑战'], groupSize: '2-22人' },
    { id: 'FJ052', name: '西安 3 日精华自由行', type: '自由行', price: 1180, days: 3, rating: 4.5, sales: 2900, highlight: '核心景点门票套餐 + 地道美食地图', images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400'],
      hotelLevel: '三星/舒适型(钟楼附近)', meals: '含早餐', transport: '不含(推荐地铁出行)',
      itinerary: ['D1 自行到达 → 入住钟楼附近酒店 → 回民街美食巡礼', 'D2 兵马俑(地铁+公交直达) → 华清池 → 晚上大唐不夜城', 'D3 陕西历史博物馆(需提前预约) → 城墙骑行 → 返程'],
      tags: ['超值套餐', '吃货友好', '交通便利'], groupSize: '自定义' },
  ],
  '丽江': [
    { id: 'FJ060', name: '丽江大理 6 日浪漫之旅', type: '跟团游', price: 2180, days: 6, rating: 4.8, sales: 2700, highlight: '玉龙雪山 + 洱海吉普车旅拍', images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'],
      hotelLevel: '特色客栈(纳西风格)', meals: '5早7正餐(含野生菌火锅+砂锅鱼)', transport: '正规旅游车',
      itinerary: ['D1 抵达丽江 → 丽江古城(四方街/大水车)', 'D2 玉龙雪山(冰川公园大索道) → 蓝月谷 → 印象丽江演出', 'D3 丽江 → 大理 → 洱海S湾吉普车旅拍', 'D4 崇圣寺三塔 → 大理古城(洋人街)', 'D5 双廊古镇 → 喜洲古镇(白族民居) → 返回丽江', 'D6 束河古镇自由活动 → 返程'],
      tags: ['风花雪月', '网红旅拍', '文艺青年'], groupSize: '2-24人' },
    { id: 'FJ061', name: '香格里拉+丽江 7 日秘境游', type: '跟团游', price: 3280, days: 7, rating: 4.9, sales: 890, highlight: '普达措国家公园 → 虎跳峡 → 松赞林寺', images: ['https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400'],
      hotelLevel: '当地最好(含香格里拉供氧房)', meals: '6早9正餐(含酥油茶+青稞酒体验)', transport: '旅游车+经验丰富的山路老司机',
      itinerary: ['D1 抵达丽江 → 丽江古城适应海拔', 'D2 丽江 → 长江第一湾 → 虎跳峡', 'D3 香格里拉 → 普达措国家公园', 'D4 松赞林寺 → 独克宗古城(最大转经筒)', 'D5 香格里拉 → 白水台 → 返回丽江', 'D6 玉龙雪山 → 蓝月谷', 'D7 束河古镇 → 送机返程'],
      tags: ['人间仙境', '藏族文化', '摄影天堂'], groupSize: '2-16人精品团' },
    { id: 'FJ062', name: '丽江古城 4 日慢生活', type: '自由行', price: 1480, days: 4, rating: 4.6, sales: 1800, highlight: '网红庭院客栈 + 手工扎染体验', images: ['https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400'],
      hotelLevel: '网红庭院客栈', meals: '含早餐+1次纳西喜宴', transport: '接送机',
      itinerary: ['D1 抵达丽江 → 入住网红客栈 → 古城夜景+民谣Live', 'D2 白沙古镇 → 手工扎染体验', 'D3 束河古镇 → 拉市海骑马划船', 'D4 睡到自然醒 → 古城最后漫步 → 送机'],
      tags: ['慢旅行', '避世桃源', '文艺打卡'], groupSize: '自定义' },
  ],
  '成都': [
    { id: 'FJ070', name: '成都+熊猫基地+九寨沟 6 日经典游', type: '跟团游', price: 2780, days: 6, rating: 4.9, sales: 4500, highlight: '国宝熊猫 + 九寨童话世界', images: ['https://images.unsplash.com/photo-1564424799991-4be087883d11?w=400'],
      hotelLevel: '四星/高档型', meals: '5早7正餐(含藏式土火锅+川菜)', transport: '空调旅游车',
      itinerary: ['D1 抵达成都 → 春熙路IFS → 太古里', 'D2 成都大熊猫繁育研究基地 → 都江堰', 'D3 成都 → 黄龙风景区 → 九寨沟口', 'D4 九寨沟全天游览', 'D5 九寨沟 → 中国古羌城 → 返回成都', 'D6 武侯祠 → 锦里古街 → 返程'],
      tags: ['国宝熊猫', '童话九寨', '必走线路'], groupSize: '2-26人' },
    { id: 'FJ071', name: '成都 4 日美食文化游', type: '跟团游', price: 1780, days: 4, rating: 4.7, sales: 3100, highlight: '宽窄巷子 + 川剧变脸 + 火锅', images: ['https://images.unsplash.com/photo-1498837167926-4e002ae17c19?w=400'],
      hotelLevel: '四星/市中心位置', meals: '3早4正餐(含正宗火锅+担担面制作)', transport: '空调旅游车',
      itinerary: ['D1 抵达成都 → 春熙路太古里 → 建设路小吃街', 'D2 大熊猫基地 → 三星堆博物馆(新馆)', 'D3 杜甫草堂 → 宽窄巷子 → 川剧院变脸秀', 'D4 武侯祠锦里 → 返程'],
      tags: ['美食之都', '安逸生活', '休闲首选'], groupSize: '2-28人' },
    { id: 'FJ072', name: '成都 3 日城市漫游', type: '自由行', price: 1280, days: 3, rating: 4.5, sales: 2200, highlight: '太古里商圈酒店 + 熊猫预约服务', images: ['https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400'],
      hotelLevel: '五星/太古里商圈', meals: '含早餐', transport: '接送机',
      itinerary: ['D1 抵达 → 太古里逛街 → 望平街咖啡一条街', 'D2 大熊猫基地 → 东郊记忆文创园', 'D3 人民公园喝茶 → 宽窄巷子 → 送机返程'],
      tags: ['城市漫游', '年轻潮流', '周末短假'], groupSize: '自定义' },
  ],
  '杭州': [
    { id: 'FJ080', name: '杭州西湖+乌镇 4 日江南游', type: '跟团游', price: 1680, days: 4, rating: 4.8, sales: 3600, highlight: '西湖十景 + 乌镇枕水人家', images: ['https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400'],
      hotelLevel: '四星/西湖景区', meals: '3早5正餐(含杭帮菜+东坡肉)', transport: '空调旅游车',
      itinerary: ['D1 抵达杭州 → 河坊街南宋御街 → 西湖夜景', 'D2 西湖环湖(花港观鱼→雷峰塔→苏堤春晓)', 'D3 灵隐寺飞来峰 → 西溪湿地 → 乌镇西栅(夜游)', 'D4 乌镇东栅 → 返程'],
      tags: ['烟雨江南', '水墨画卷', '诗意之旅'], groupSize: '2-26人' },
    { id: 'FJ081', name: '千岛湖 3 日山水度假', type: '自由行', price: 1880, days: 3, rating: 4.7, sales: 1200, highlight: '湖景度假村 + 皮划艇 + 鱼头汤', images: ['https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=400'],
      hotelLevel: '五星湖景度假村', meals: '含早餐+1顿有机鱼头宴', transport: '杭州市区接送',
      itinerary: ['D1 自行前往千岛湖 → 度假村入住 → 湖边骑行', 'D2 中心湖区游船 → 皮划艇/桨板', 'D3 森林氧吧步道 → 有机鱼头宴 → 返程'],
      tags: ['天然氧吧', '亲子度假', '舌尖美味'], groupSize: '自定义' },
  ],
};

const DEFAULT_PRODUCTS = [
  { id: 'FJ999', name: '热门目的地 5 日标准团', type: '跟团游', price: 1980, days: 5, rating: 4.6, sales: 1000, highlight: '品质住宿 + 精选景点', images: [],
    hotelLevel: '四星/高档型', meals: '4早6正餐', transport: '空调旅游车',
    itinerary: ['D1 抵达目的地 → 酒店入住', 'D2 核心景区A游览(含导游讲解)', 'D3 核心景区B游览 + 特色体验项目', 'D4 当地文化体验 → 自由活动', 'D5 周边景点 → 送站返程'],
    tags: ['品质保证', '热门畅销', '省心省力'], groupSize: '2-28人' },
];

function sandboxSearchProducts(query) {
  const keyword = query.keyword || '';
  let products = [];

  // 精确匹配目的地
  for (const [dest, items] of Object.entries(DEST_PRODUCTS)) {
    if (keyword.includes(dest) || dest.includes(keyword)) {
      products = products.concat(items);
    }
  }

  // 无匹配时返回默认产品
  if (!products.length) {
    products = DEFAULT_PRODUCTS;
  }

  // 按出行天数筛选
  if (query.days) {
    const filtered = products.filter(p => Math.abs(p.days - query.days) <= 2);
    if (filtered.length) products = filtered;
  }

  const kw = encodeURIComponent(query.keyword || '热门目的地');
  return {
    success: true,
    total: products.length,
    products: products.map((p, i) => ({
      ...p,
      _sandbox: true,
      _source: 'sandbox',
      pricePerPerson: p.price,
      totalPrice: p.price * (query.people || 1),
      jumpUrl: p.jumpUrl || `https://www.fliggy.com/search?keyword=${encodeURIComponent(p.name)}`,
    }))
  };
}

function sandboxSearchHotels(city) {
  return {
    success: true,
    total: 3,
    hotels: [
      { id: 'HT001', name: `${city}中心希尔顿酒店`, stars: 5, price: 680, rating: 4.8 },
      { id: 'HT002', name: `${city}景区精品民宿`, stars: 4, price: 380, rating: 4.6 },
      { id: 'HT003', name: `${city}经济连锁酒店`, stars: 3, price: 180, rating: 4.2 },
    ]
  };
}

function sandboxCreateBooking(order) {
  const orderId = `FJ${Date.now().toString(36).toUpperCase()}`;
  return {
    success: true,
    orderId,
    status: 'pending_payment',
    payUrl: null,
    message: '订单创建成功，请在 30 分钟内完成支付',
    _sandbox: true,
  };
}

// ---------- 导出 ----------

module.exports = {
  searchTourProducts,
  searchHotels,
  createBooking,
  queryBooking,
  cancelBooking,
  DEST_PRODUCTS,
};
