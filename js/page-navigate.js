// ============ 导航功能 ============
let selectedSpot = null;

// ============ Leaflet 实时地图 ============
let leafletMap = null;
let leafletMarkers = [];       // 所有目的地标记
let activeMarker = null;      // 当前选中的标记

/** 目的地坐标数据库（key → [lat, lng, displayAddr]） */
const DEST_COORDS = {
  // === destDetailData === (WGS-84，使用时经 wgs84ToGcj02 转换为高德 GCJ-02)
  zhangjiajie: [29.115, 110.473, '湖南·张家界'],
  sanya:       [18.251, 109.506, '海南·三亚'],
  xian:        [34.340, 108.933, '陕西·西安'],
  chengdu:     [30.570, 104.061, '四川·成都'],
  xizang:      [29.648, 91.166, '西藏·拉萨'],
  // === chinaDestinationsData - 热门 === (WGS-84)
  gugong:      [39.916, 116.397, '北京'],
  changcheng:  [40.431, 116.569, '北京'],
  xihu:        [30.237, 120.141, '浙江·杭州'],
  wuzhen:      [30.742, 120.488, '浙江·乌镇'],
  jiuzhaigou:  [33.263, 103.918, '四川·阿坝'],
  daocheng:    [28.451, 100.391, '四川·甘孜'],
  lijiang:     [26.872, 100.230, '云南·丽江'],
  dali:        [25.606, 100.267, '云南·大理'],
  chaka:       [36.797, 99.085, '青海'],
  qinghaihu:   [36.894, 100.192, '青海'],
  dunhuang:    [40.037, 94.805, '甘肃·敦煌'],
  fanjingshan: [27.920, 108.701, '贵州·铜仁'],
  huangguoshu: [25.993, 105.669, '贵州·安顺'],
  guilin:      [25.234, 110.519, '广西·桂林'],
  // === chinaDestinationsData - 小众秘境 ===
  songyang:    [28.449, 119.487, '浙江·丽水'],
  genie:       [29.832, 99.598, '四川·甘孜'],
  dangling:    [30.975, 101.308, '四川·甘孜'],
  cuokahu:     [31.186, 100.602, '四川·甘孜'],
  nanjiluo:    [27.944, 99.663, '云南·迪庆'],
  jingmai:     [22.238, 100.055, '云南·普洱'],
  bingzhongluo:[28.021, 98.622,  '云南·怒江'],
  nianhu:      [26.566, 103.510, '云南·曲靖'],
  aikenquan:   [38.240, 91.079,  '青海·海西'],
  mangya:      [38.253, 90.861,  '青海·海西'],
  dongtai:     [37.370, 93.866,  '青海·海西'],
  heidushan:   [38.428, 90.554,  '青海·海西'],
  nianbaoyuze: [33.290, 100.699, '青海·果洛'],
  qiongkushitai:[43.033, 81.878,'新疆·伊犁'],
  xiaerxili:   [45.090, 82.050,  '新疆·博乐'],
  jiangbulake: [43.683, 89.691,  '新疆·昌吉'],
  dahaidao:    [42.550, 93.200,  '新疆·哈密'],
  zhagana:     [34.231, 103.190, '甘肃·甘南'],
  jiucaiping:  [26.984, 104.722, '贵州·毕节'],
  luodian:     [25.504, 106.760, '贵州·黔南'],
  sanmenhai:   [24.547, 107.048, '广西·河池'],
  mingshi:     [22.634, 106.967, '广西·崇左'],
  gulangyu:    [24.448, 118.067, '福建·厦门'],
  xiapu:       [26.882, 120.005, '福建·宁德'],
  sisu:        [26.713, 120.325, '福建·宁德'],
  huangshan:   [30.134, 118.167, '安徽·黄山'],
  hongcun:     [30.003, 117.986, '安徽·宏村'],
  yangchan:    [29.920, 118.642, '安徽·黄山'],
  wudangshan:  [32.401, 111.004, '湖北·十堰'],
  enshi:       [30.396, 109.484, '湖北·恩施'],
  luyuanping:  [30.338, 109.420, '湖北·恩施'],
  taishan:     [36.252, 117.107, '山东·泰安'],
  changdao:    [37.919, 120.738, '山东·烟台'],
  bingmayong:  [34.385, 109.273, '陕西·西安'],
  tangbuxiec:  [34.215, 108.960, '陕西·西安'],
  budala:      [29.658, 91.117, '西藏·拉萨'],
  zhangjiajie_park: [29.327, 110.412, '湖南·张家界'],
  sanqingshan: [28.908, 118.072, '江西·上饶'],
  hongyadong:  [29.565, 106.587, '重庆'],
  zhouzhuang:  [31.112, 120.844, '江苏·苏州'],
  pingyao:     [37.202, 112.178, '山西·晋中'],
  yalongwan:   [18.228, 109.640, '海南·三亚'],
};

/** WGS-84 → GCJ-02 坐标转换（高德地图需要火星坐标系） */
function wgs84ToGcj02(lng, lat) {
  const a = 6378245.0;
  const ee = 0.00669342162296594323;
  function transformLat(x, y) {
    let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320.0 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret;
  }
  function transformLng(x, y) {
    let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret;
  }
  // 国外坐标不需要转换
  if (lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271) {
    return { lng, lat };
  }
  const dLat = transformLat(lng - 105.0, lat - 35.0);
  const dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = lat / 180.0 * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - ee * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  const dLatFinal = (dLat * 180.0) / ((a * (1 - ee)) / (magic * sqrtMagic) * Math.PI);
  const dLngFinal = (dLng * 180.0) / (a / sqrtMagic * Math.cos(radLat) * Math.PI);
  return { lng: lng + dLngFinal, lat: lat + dLatFinal };
}

/** 预缓存 geocoder 结果 — LRU 限制 200 条（防止无限增长） */
const geocoderCache = new WANDR.LRUCache(200);

/** Nominatim 地理编码（免费，限速 1 req/s） */
async function geocodeAddress(query) {
  const cached = geocoderCache.get(query);
  if (cached !== undefined) return cached;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)},中国&limit=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.length > 0) {
      // Nominatim 返回 WGS-84，转换为 GCJ-02 适配高德地图瓦片
      const gcj = wgs84ToGcj02(parseFloat(data[0].lon), parseFloat(data[0].lat));
      const result = { lat: gcj.lat, lng: gcj.lng, addr: data[0].display_name || '' };
      geocoderCache.set(query, result);
      return result;
    }
    return null;
  } catch {
    return null;
  }
}

/** 根据 key 或 name 获取坐标 */
function getDestCoord(keyOrName) {
  // 精确 key 匹配
  if (DEST_COORDS[keyOrName]) {
    const gcj = wgs84ToGcj02(DEST_COORDS[keyOrName][1], DEST_COORDS[keyOrName][0]);
    return { lat: gcj.lat, lng: gcj.lng, addr: DEST_COORDS[keyOrName][2] };
  }
  // name 模糊匹配（去前缀如"丽江"匹配"丽江古城"）
  for (const [k, v] of Object.entries(DEST_COORDS)) {
    const allDests = getAllDestinations();
    const d = allDests.find(a => a.key === k);
    if (d && d.name === keyOrName) {
      const gcj = wgs84ToGcj02(v[1], v[0]);
      return { lat: gcj.lat, lng: gcj.lng, addr: v[2] };
    }
  }
  return null;
}

/** 创建自定义 DivIcon - 支持 hot/big/small/selected */
function createMarkerIcon(isHot, isSelected, markerType) {
  let cls = '';
  let iconSize, iconAnchor, popupAnchorY;
  let iconHtml = '';

  if (isSelected) {
    cls = 'selected';
    iconSize = [42, 42];
    iconAnchor = [11, 40];
    popupAnchorY = 44;
    iconHtml = '<i class="fa-solid fa-location-dot"></i>';
  } else if (markerType === 'big') {
    cls = 'big';
    iconSize = [16, 16];
    iconAnchor = [5, 14];
    popupAnchorY = 18;
    iconHtml = '<i class="fa-solid fa-location-dot"></i>';
  } else if (markerType === 'small') {
    cls = 'small';
    iconSize = [10, 10];
    iconAnchor = [3, 9];
    popupAnchorY = 11;
    iconHtml = '';
  } else if (isHot) {
    cls = 'hot';
    iconSize = [34, 34];
    iconAnchor = [9, 32];
    popupAnchorY = 36;
    iconHtml = '<i class="fa-solid fa-location-dot"></i>';
  } else {
    iconSize = [34, 34];
    iconAnchor = [9, 32];
    popupAnchorY = 36;
    iconHtml = '<i class="fa-solid fa-location-dot"></i>';
  }

  return L.divIcon({
    className: '',
    html: `<div class="custom-marker ${cls}">${iconHtml}</div>`,
    iconSize: iconSize,
    iconAnchor: iconAnchor,
    popupAnchor: [0, -popupAnchorY],
  });
}

// ============ 省份边界 GeoJSON 叠加层 ============
let provinceLayer = null;       // 省份边界图层
let provinceGeoData = null;     // 缓存的 GeoJSON 数据

/**
 * 加载并渲染中国省份边界
 * 数据源：阿里云 DataV（国内 CDN，稳定可靠）
 */
async function loadProvinceBoundaries() {
  if (provinceLayer || !leafletMap) return;
  // 首次加载显示轻量提示
  const loadingEl = document.createElement('div');
  loadingEl.className = 'map-loading-hint';
  loadingEl.textContent = '正在加载地区边界...';
  document.getElementById('mapContainer').appendChild(loadingEl);

  try {
    if (!provinceGeoData) {
      // 使用阿里云 DataV 全国省份边界（简化后 ~1.5MB）
      const resp = await fetch(
        'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
        { signal: AbortSignal.timeout(15000) }
      );
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      provinceGeoData = await resp.json();
    }

    provinceLayer = L.geoJSON(provinceGeoData, {
      style: (feature) => ({
        color: '#8B7355',           // 棕褐色边界线
        weight: 2,                   // 线宽
        opacity: 0.55,              // 边界透明度
        fillColor: feature.properties.name === '南海诸岛' ? '#ddeeff' : 'transparent',
        fillOpacity: 0.06,
        dashArray: null,
        lineCap: 'round',
        lineJoin: 'round',
      }),
      onEachFeature: (feature, layer) => {
        // 省份名作为 tooltip
        if (feature.properties.name) {
          layer.bindTooltip(feature.properties.name, {
            permanent: false,
            sticky: true,
            opacity: 0.85,
            className: 'province-tooltip',
            offset: [0, -8],
          });
        }
        // hover 高亮
        layer.on('mouseover', function () {
          this.setStyle({
            color: '#5C3D2E',
            weight: 3,
            opacity: 0.8,
            fillOpacity: 0.12,
          });
        });
        layer.on('mouseout', function () {
          provinceLayer.resetStyle(this);
        });
      },
    }).addTo(leafletMap);

    // 将边界层置于标记之下
    provinceLayer.bringToBack();
  } catch (err) {
    console.warn('[地图] 省份边界加载失败:', err.message);
  } finally {
    loadingEl.remove();
  }
}

/** ============ 全国省份景点标记 ============ */
let provinceSpotsLoaded = false;
const CATEGORY_COLORS = {
  '自然风光': '#10B981', '历史人文': '#F59E0B', '古镇村落': '#8B5CF6',
  '宗教圣地': '#EF4444', '现代城市': '#3B82F6', '文化艺术': '#EC4899',
  '民族文化': '#F97316',
};

/**
 * 加载全国各省景点标记到地图
 * - 大标记（big）：橙色水滴，60%大小，每省≥5个主要景点
 * - 小标记（small）：黑色水滴，60%大小，每省≥10个次级景点
 */
function loadAllProvinceSpots() {
  if (!leafletMap || provinceSpotsLoaded) return;
  provinceSpotsLoaded = true;

  // 延迟加载确保地图就绪，先清除所有旧标记
  setTimeout(() => {
    clearAllMarkers();

    if (!window.ALL_PROVINCE_SPOTS) {
      console.warn('[地图] ALL_PROVINCE_SPOTS 数据未加载');
      return;
    }

    for (const spot of ALL_PROVINCE_SPOTS) {
      const markerType = spot.type;
      const marker = L.marker([spot.lat, spot.lng], {
        icon: createMarkerIcon(false, false, markerType),
        opacity: markerType === 'small' ? 0.75 : 1,
        zIndexOffset: markerType === 'big' ? 100 : 0,
      }).addTo(leafletMap);

      const catColor = CATEGORY_COLORS[spot.category] || '#64748B';
      marker.bindPopup(`
        <div class="dest-popup" style="min-width:160px;">
          <div class="popup-name" style="font-size:0.92rem;">${spot.name}</div>
          <div class="popup-addr" style="font-size:0.78rem;">
            <span style="display:inline-block;background:${catColor};color:#fff;padding:1px 6px;border-radius:3px;font-size:0.68rem;margin-right:4px;">${spot.category}</span>
            ${spot.province}
          </div>
          <div class="popup-rating" style="margin-top:4px;">⭐ ${spot.rating} · ${spot.type === 'big' ? '主要景点' : '推荐景点'}</div>
          <div style="font-size:0.72rem;color:#666;margin-top:3px;line-height:1.4;">${spot.desc}</div>
        </div>
      `);

      marker._spotData = spot;

      // 点击标记时更新底部信息栏
      marker.on('click', () => {
        document.getElementById('mapDestName').innerHTML = `
          <i class="fa-solid fa-map-pin"></i>
          <span>${spot.name}</span>
        `;
        selectedSpot = { name: spot.name, addr: spot.province, lat: spot.lat, lng: spot.lng };
      });

      leafletMarkers.push(marker);
    }

    console.log(`[地图] 已加载 ${ALL_PROVINCE_SPOTS.length} 个全国景点标记`);
  }, 500);
}

/** ============ 底图与地图初始化 ============ */

/** 初始化 Leaflet 地图 */
function initLeafletMap() {
  const mapEl = document.getElementById('leafletMap');
  if (!mapEl || leafletMap) return;

  leafletMap = L.map('leafletMap', {
    center: [35.86, 104.19],
    zoom: 5,
    minZoom: 4,
    maxZoom: 18,          /* 路线规划时可放大看清细节 */
    zoomControl: true,
    attributionControl: false,
  });

  // 底图策略：高德地图（国内优先）→ CartoDB Voyager → CartoDB Positron → OSM
  tryAddTileLayer(
    'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    (tl) => { currentTileLayer = tl; mapEl.style.backgroundColor = '#f8f4ec'; },
    () => {
      tryAddTileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        (tl) => {
          currentTileLayer = tl;
          mapEl.style.backgroundColor = '#f5f0e8';
        },
        () => {
          tryAddTileLayer(
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            (tl) => { currentTileLayer = tl; mapEl.style.backgroundColor = '#f2efe9'; },
            () => {
              tryAddTileLayer(
                'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                (tl) => { currentTileLayer = tl; },
                () => {
                  mapEl.style.background = '#e8e3dc';
                  console.warn('[地图] 所有瓦片源加载失败');
                }
              );
            }
          );
        }
      );
    },
    '1'   // 高德子域名用数字 1-4，testSubdomain='1'
  );

  // 加载标记和边界
  // loadHotDestMarkers();  // 已停用旧标记，统一使用省份景点标记
  // loadAllProvinceSpots();  // 已停用：不再显示景点标记
  // setTimeout(() => loadProvinceBoundaries(), 800);  // 已停用：不再显示省份边界
}

/**
 * 尝试添加瓦片图层，支持成功/失败回调
 */
function tryAddTileLayer(url, onSuccess, onFail, testSubdomain = 'a') {
  const tileLayer = L.tileLayer(url, {
    maxZoom: 18,
    subdomains: testSubdomain === '1' ? '1234' : 'abcd',
    crossOrigin: true,
  });

  const testImg = new Image();
  testImg.crossOrigin = 'anonymous';
  testImg.onload = () => {
    if (!leafletMap.hasLayer(tileLayer)) {
      tileLayer.addTo(leafletMap);
      if (onSuccess) onSuccess(tileLayer);
    }
  };
  testImg.onerror = () => { if (onFail) onFail(); };
  testImg.src = url.replace('{s}', testSubdomain).replace('{z}','5').replace('{x}','16').replace('{y}','10');
  return tileLayer;
}

/** ============ 底图风格切换 ============ */
let currentTileLayer = null;

/** 当下最火 20 个旅游景点（WGS-84 坐标） */
const HOT_TOP_20 = [
  { name: '故宫博物院',     lat: 39.916, lng: 116.397, addr: '北京', rating: '4.8' },
  { name: '八达岭长城',     lat: 40.360, lng: 116.020, addr: '北京·延庆', rating: '4.7' },
  { name: '杭州西湖',       lat: 30.237, lng: 120.141, addr: '浙江·杭州', rating: '4.7' },
  { name: '秦始皇兵马俑',   lat: 34.385, lng: 109.273, addr: '陕西·西安', rating: '4.7' },
  { name: '重庆洪崖洞',     lat: 29.565, lng: 106.587, addr: '重庆', rating: '4.6' },
  { name: '成都宽窄巷子',   lat: 30.674, lng: 104.048, addr: '四川·成都', rating: '4.5' },
  { name: '上海外滩',       lat: 31.240, lng: 121.490, addr: '上海', rating: '4.7' },
  { name: '丽江古城',       lat: 26.872, lng: 100.230, addr: '云南·丽江', rating: '4.6' },
  { name: '九寨沟',         lat: 33.263, lng: 103.918, addr: '四川·阿坝', rating: '4.8' },
  { name: '泰山',           lat: 36.252, lng: 117.107, addr: '山东·泰安', rating: '4.7' },
  { name: '黄山',           lat: 30.134, lng: 118.167, addr: '安徽·黄山', rating: '4.8' },
  { name: '张家界',         lat: 29.115, lng: 110.473, addr: '湖南·张家界', rating: '4.7' },
  { name: '桂林漓江',       lat: 25.234, lng: 110.519, addr: '广西·桂林', rating: '4.6' },
  { name: '布达拉宫',       lat: 29.658, lng: 91.117, addr: '西藏·拉萨', rating: '4.8' },
  { name: '鼓浪屿',         lat: 24.448, lng: 118.067, addr: '福建·厦门', rating: '4.5' },
  { name: '三亚亚龙湾',     lat: 18.228, lng: 109.640, addr: '海南·三亚', rating: '4.6' },
  { name: '哈尔滨冰雪大世界', lat: 45.778, lng: 126.612, addr: '黑龙江·哈尔滨', rating: '4.6' },
  { name: '上海迪士尼',     lat: 31.144, lng: 121.660, addr: '上海·浦东', rating: '4.7' },
  { name: '北京环球影城',   lat: 39.733, lng: 116.675, addr: '北京·通州', rating: '4.7' },
  { name: '稻城亚丁',       lat: 28.451, lng: 100.391, addr: '四川·甘孜', rating: '4.7' },
];

/** 加载 20 个热门目的地标记到地图 */
function loadHotDestMarkers() {
  if (!leafletMap) return;
  clearAllMarkers();

  for (const d of HOT_TOP_20) {
    const gcj = wgs84ToGcj02(d.lng, d.lat);
    const { lat, lng } = gcj;

    const marker = L.marker([lat, lng], {
      icon: createMarkerIcon(true, false),
    }).addTo(leafletMap);

    marker.bindPopup(`
      <div class="dest-popup">
        <div class="popup-name">${d.name}</div>
        <div class="popup-addr">${d.addr}</div>
        <div class="popup-rating">⭐ ${d.rating}</div>
      </div>
    `);

    marker._destData = { name: d.name, addr: d.addr, lat, lng, isHot: true };

    // 点击地图标记
    marker.on('click', () => {
      highlightMapMarker(marker);
      selectedSpot = { name: d.name, addr: d.addr };
      document.getElementById('mapDestName').innerHTML = `<i class="fa-solid fa-map-pin"></i><span>${d.name}</span>`;
    });

    leafletMarkers.push(marker);
  }
}

/** 清除所有标记 */
function clearAllMarkers() {
  leafletMarkers.forEach(m => leafletMap.removeLayer(m));
  leafletMarkers = [];
  activeMarker = null;
}

/** 高亮指定标记，取消之前的 */
function highlightMapMarker(marker) {
  if (activeMarker && activeMarker._destData) {
    const d = activeMarker._destData;
    activeMarker.setIcon(createMarkerIcon(d.isHot, false));
  }
  if (marker && marker._destData) {
    marker.setIcon(createMarkerIcon(marker._destData.isHot, true));
    marker.openPopup();
  }
  activeMarker = marker;
}

/** 通过目的地名称定位地图标记 */
async function locateOnMap(name, addr) {
  if (!leafletMap) return;

  // 尝试本地坐标
  let coord = getDestCoord(name);
  if (!coord) {
    // AI 搜索结果走 geocoding
    const geo = await geocodeAddress(name);
    if (geo) coord = geo;
  }

  if (!coord) {
    console.warn('[地图] 无法定位:', name);
    return;
  }

  const { lat, lng } = coord;

  // 找到已有标记或创建新标记
  let foundMarker = null;
  for (const m of leafletMarkers) {
    if (m._destData && m._destData.name === name) {
      foundMarker = m;
      break;
    }
  }

  if (!foundMarker) {
    // 为 AI 搜索结果创建临时标记
    foundMarker = L.marker([lat, lng], {
      icon: createMarkerIcon(false, true),
    }).addTo(leafletMap);

    foundMarker.bindPopup(`
      <div class="dest-popup">
        <div class="popup-name">${name}</div>
        <div class="popup-addr">${addr || coord.addr || ''}</div>
      </div>
    `);

    foundMarker._destData = { name, addr, lat, lng, isHot: false, temp: true };
    leafletMarkers.push(foundMarker);
  }

  // 移动视图并高亮
  leafletMap.setView([lat, lng], Math.min(Math.max(leafletMap.getZoom(), 7), 10), { animate: true });
  highlightMapMarker(foundMarker);
}
function openExternalMap(destName) {
  const name = destName || (selectedSpot ? selectedSpot.name : '');
  if (!name) { showToast(T.selectDest); return; }

  // 高德地图（国内手机端首选）
  const gaodeUrl = `https://uri.amap.com/search?keyword=${encodeURIComponent(name)}&callnative=1`;
  // 百度地图
  const baiduUrl = `https://api.map.baidu.com/geocoder?address=${encodeURIComponent(name)}&output=html&src=wandr`;

  // PC 端优先百度、移动端优先高德
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const url = isMobile ? gaodeUrl : baiduUrl;
  window.open(url, '_blank');
}

function navigateTo(dest) {
  showToast(T.navigating(dest));
  setTimeout(() => openExternalMap(dest), 400);
}

function navigateCurrentDest() {
  openExternalMap(); // 自动使用 selectedSpot.name，无选中时弹 toast 提示
}

// ============ 从收藏导入行程到路线规划 ============
function importPlanToNavigate(index) {
  const favs = getFavorites();
  const fav = favs[index];
  if (!fav || !fav.isAiPlan || !fav.days || !fav.days.length) {
    showToast('该收藏没有可导入的行程数据');
    return;
  }

  // 关闭用户面板
  closeUserPanel();

  // 如果只有一天，直接导入
  if (fav.days.length === 1) {
    doImportPlanDay(fav, 0);
    return;
  }

  // 多天行程：弹出日期选择 Modal
  showDayPickerModal(fav, index);
}

/** 获取内联日期选择容器 */
function getDayPickerInline() {
  return document.getElementById('dayPickerInline');
}

/** 显示/隐藏导入面板的初始内容区（不影响 dayPickerInline） */
function toggleImportContent(show) {
  const el = document.getElementById('importSectionContent');
  if (el) el.style.display = show ? '' : 'none';
}

/** 为 navigate 页面提供 getDaySummary 兜底实现（page-ai-plan.js 中定义，navigate 页面未加载该文件） */
function getDaySummary(day) {
  if (!day || !day.acts || day.acts.length === 0) return '自由探索';
  return day.acts.map(a => a.name).join(' → ');
}

/** 在内联面板渲染天数选择 */
function renderInlineDayPicker(fav, onBack) {
  const container = getDayPickerInline();
  if (!container) return;

  // 隐藏导入按钮区，显示选择器（面板本身保持可见）
  toggleImportContent(false);
  container.style.display = '';

  container.innerHTML = `
    <div class="inline-picker-header">
      <button class="inline-picker-back" data-action="inlinePickerBack">
        <i class="fa-solid fa-arrow-left"></i> 返回
      </button>
      <div class="inline-picker-title">
        <i class="fa-solid fa-route"></i> 「${fav.name}」行程路线
      </div>
      <div class="inline-picker-sub">行程共 ${fav.days.length} 天，选择要导入哪一天的路线</div>
    </div>
    <div class="inline-picker-list">
      ${fav.days.map((d, i) => {
        const addrCount = (d.acts || []).filter(a => a.addr).length;
        const hasRoute = !!d.routeData;
        const routeInfo = hasRoute
          ? ` · ${formatDistance(d.routeData.summary.totalDistance)} · ${formatDuration(d.routeData.summary.totalTime)}`
          : '';
        return `
          <button class="day-picker-item inline-day-item ${hasRoute ? 'has-route' : ''}" data-day="${i}">
            <div class="day-picker-item-num">Day ${i + 1}${hasRoute ? ' 🛣' : ''}</div>
            <div class="day-picker-item-info">
              <div class="day-picker-item-title">${d.title || '第' + (i + 1) + '天'}</div>
              <div class="day-picker-item-desc">${d.desc || getDaySummary(d)}</div>
              <div class="day-picker-item-meta">
                <span><i class="fa-solid fa-list-check"></i> ${d.acts.length} 个行程</span>
                <span><i class="fa-solid fa-location-dot"></i> ${addrCount} 个可导航地址</span>
                ${hasRoute ? `<span style="color:var(--clr-primary);"><i class="fa-solid fa-map-marked-alt"></i> 已规划${routeInfo}</span>` : ''}
              </div>
            </div>
            <i class="fa-solid fa-chevron-right"></i>
          </button>`;
      }).join('')}
    </div>
    <div class="inline-picker-footer">
      <button class="inline-picker-btn secondary" data-action="inlinePickerCancel">取消</button>
      <button class="inline-picker-btn primary" data-day="-1" data-action="inlinePickerAll">
        <i class="fa-solid fa-layer-group"></i> 导入全部天数
      </button>
    </div>
  `;

  container._onBack = onBack;
  container._fav = fav;
}

/** 在内联面板渲染目的地选择 */
function renderInlineDestPicker(planFavs, onBack) {
  const container = getDayPickerInline();
  if (!container) return;

  toggleImportContent(false);
  container.style.display = '';

  container.innerHTML = `
    <div class="inline-picker-header">
      <button class="inline-picker-back" data-action="inlinePickerBack">
        <i class="fa-solid fa-arrow-left"></i> 返回
      </button>
      <div class="inline-picker-title">
        <i class="fa-solid fa-file-import"></i> 从 AI 收藏导入路线
      </div>
      <div class="inline-picker-sub">选择一个已保存的行程方案</div>
    </div>
    <div class="inline-picker-list">
      ${planFavs.map(f => `
        <button class="day-picker-item inline-day-item day-picker-dest-item" data-fav-name="${f.name.replace(/"/g, '&quot;')}">
          <img src="${f.img}" alt="${f.name}" class="day-picker-thumb" loading="lazy">
          <div class="day-picker-item-info">
            <div class="day-picker-item-title">${f.name}</div>
            <div class="day-picker-item-desc">${f.location || ''} · ${f.days.length} 天行程</div>
          </div>
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      `).join('')}
    </div>
    <div class="inline-picker-footer">
      <button class="inline-picker-btn secondary" data-action="inlinePickerCancel">取消</button>
    </div>
  `;

  container._onBack = onBack;
  container._planFavs = planFavs;
}

/** 重置内联选择器到初始状态 */
function resetInlinePicker() {
  const container = getDayPickerInline();
  if (container) {
    container.style.display = 'none';
    container.innerHTML = '';
    delete container._fav;
    delete container._planFavs;
    delete container._onBack;
  }
  toggleImportContent(true);
}

function handleInlinePickerBack() {
  const container = getDayPickerInline();
  if (container && container._onBack) {
    container._onBack();
  } else {
    resetInlinePicker();
  }
}

function handleInlinePickerCancel() {
  resetInlinePicker();
}

function handleInlinePickerAll(el) {
  const container = getDayPickerInline();
  const fav = container?._fav;
  if (fav) {
    resetInlinePicker();
    doImportPlanDay(fav, -1);
  }
}

function showDayPickerModal(fav) {
  renderInlineDayPicker(fav, resetInlinePicker);
}

function doImportPlanDay(fav, day) {
  // 存储路线来源：规划后可回存到原行程的对应天数
  window._routePlanSource = { favName: fav.name, day: day };

  // 提取地址
  let addrs = [];
  if (day === -1) {
    // 多日行程：按天分组，不做全天合并去重
    window._multiDayPlanData = { fav, days: [] };
    fav.days.forEach((d, di) => {
      const dayAddrs = (d.acts || []).filter(a => a.addr)
        .map(a => ({ name: a.name, addr: a.addr, time: a.time }));
      if (dayAddrs.length > 0) {
        window._multiDayPlanData.days.push({
          dayIndex: di,
          title: d.title || `第${di + 1}天`,
          addrs: dayAddrs
        });
      }
    });

    if (window._multiDayPlanData.days.length === 0) {
      showToast('所选行程中没有可导航的地址');
      window._multiDayPlanData = null;
      return;
    }

    // 渲染多天折叠面板，不走后续单天渲染逻辑
    renderMultiDayPanels();
    return;
  } else {
    // 导入指定天（原有逻辑）
    const dayData = fav.days[day];
    if (dayData && dayData.acts) {
      addrs = dayData.acts.filter(a => a.addr).map(a => ({ name: a.name, addr: a.addr, time: a.time }));
    }

    // 单天导入：清除多天数据
    window._multiDayPlanData = null;
    clearMultiDayRoutes();

    // 去重：同一地址按地址精确去重保留首次出现
    const seenAddrs = new Set();
    addrs = addrs.filter(a => {
      const key = a.addr.replace(/\s+/g, '');
      if (seenAddrs.has(key)) return false;
      seenAddrs.add(key);
      return true;
    });

    if (addrs.length === 0) {
      showToast('所选行程中没有可导航的地址');
      return;
    }
  }

  // 渲染到左侧景点列表
  const spotList = document.getElementById('spotList');

  // 构建标题
  const dayLabel = day === -1 ? '全部行程' : `第${day + 1}天`;

  // 检查该天是否已有保存的路线规划
  const dayDataForRoute = day >= 0 && fav.days ? fav.days[day] : null;
  const existingRoute = dayDataForRoute?.routeData;
  const routeSummaryHTML = existingRoute ? `
    <div class="existing-route-alert">
      <i class="fa-solid fa-circle-info"></i>
      <span>此行程已保存路线规划：${formatDistance(existingRoute.summary.totalDistance)} · ${formatDuration(existingRoute.summary.totalTime)}</span>
      <button class="existing-route-load-btn" data-action="loadExistingRouteForDay" data-fav-day="${day}">
        <i class="fa-solid fa-map"></i> 加载路线
      </button>
    </div>
  ` : '';

  spotList.innerHTML = `
    <div class="import-plan-header">
      <div class="import-plan-title">
        <i class="fa-solid fa-route"></i> ${fav.name} · ${dayLabel}
      </div>
      <div class="import-plan-desc">${addrs.length} 个目的地已导入</div>
    </div>
    ${routeSummaryHTML}
    <div class="import-select-all">
      <label class="import-checkbox-wrap">
        <input type="checkbox" id="importSelectAll" checked onchange="toggleAllImportSpots(this)">
        <span>全选</span>
      </label>
      <span class="import-selected-count" id="importSelectedCount">已选 ${addrs.length} 个</span>
    </div>
    <button class="btn-import-to-route" data-action="importToRoutePlan" style="width:100%; margin-bottom:8px; padding:8px; border-radius:var(--radius-sm); border:1.5px solid var(--clr-primary); background:rgba(46,139,87,0.06); color:var(--clr-primary); font-size:0.82rem; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:6px; transition:all 0.2s;">
      <i class="fa-solid fa-arrows-turn-to-dots"></i> 转入多点路线规划
    </button>
    ${addrs.map((a, i) => `
      <label class="spot-item import-spot-item import-spot-label">
        <input type="checkbox" class="import-spot-checkbox" checked data-name="${a.name.replace(/"/g, '&quot;')}" data-addr="${a.addr.replace(/"/g, '&quot;')}" onchange="updateImportSelectedCount()">
        <div class="spot-item-left">
          <div class="spot-item-num">${a.time || (i + 1)}</div>
          <div class="spot-item-content">
            <div class="spot-item-title">${a.name}</div>
            <div class="spot-item-addr"><i class="fa-solid fa-location-dot"></i> ${a.addr}</div>
          </div>
        </div>
      </label>
    `).join('')}
    <button class="btn-import-clear" data-action="clearImportedPlan"><i class="fa-solid fa-xmark"></i> 清除导入</button>
  `;

  // 更新地图标记
  addImportMarkers(addrs);

  // 滚动到导航区域
  document.getElementById('navigate').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** ============ 多天行程面板渲染 ============ */

/** 渲染多天折叠面板 */
function renderMultiDayPanels() {
  const data = window._multiDayPlanData;
  if (!data || !data.days.length) return;

  const spotList = document.getElementById('spotList');
  const totalAddrs = data.days.reduce((sum, d) => sum + d.addrs.length, 0);

  spotList.innerHTML = `
    <div class="import-plan-header">
      <div class="import-plan-title">
        <i class="fa-solid fa-route"></i> ${data.fav.name} · 全部行程
      </div>
      <div class="import-plan-desc">${data.days.length} 天 · ${totalAddrs} 个目的地</div>
    </div>
    <button class="btn-plan-all-days" data-action="planAllDays" style="width:100%; margin-bottom:8px; padding:10px; border-radius:var(--radius-sm); border:none; background:var(--clr-accent-2); color:#fff; font-size:0.88rem; font-weight:600; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:all 0.2s;">
      <i class="fa-solid fa-layer-group"></i> 一键规划全部路线
    </button>
    <button class="btn-save-multi-day" data-action="saveRoutePlan" id="btnSaveMultiDay">
      <i class="fa-solid fa-floppy-disk"></i> 保存全部路线到行程
    </button>
    <!-- 路线图例 -->
    <div class="route-legend" id="routeLegend" style="display:none;">
      ${data.days.map((d, i) => `
        <span class="route-legend-item" style="--legend-color:${DAY_COLORS[i % DAY_COLORS.length]};">
          <span class="route-legend-swatch"></span>
          第${d.dayIndex + 1}天
        </span>
      `).join('')}
    </div>
    ${data.days.map((d, i) => {
      const existingRoute = d.routeData;
      const existingRouteInfo = existingRoute
        ? `<span style="color:var(--clr-primary);font-size:0.7rem;"><i class="fa-solid fa-map-marked-alt"></i> ${formatDistance(existingRoute.summary.totalDistance)} · ${formatDuration(existingRoute.summary.totalTime)}</span>`
        : '';
      return `
      <div class="day-collapse-panel" id="dayPanel-${d.dayIndex}" style="--day-color:${DAY_COLORS[i % DAY_COLORS.length]};">
        <div class="day-collapse-header" data-action="toggleDayPanel" data-day="${d.dayIndex}">
          <div class="day-collapse-header-left">
            <span class="day-collapse-dot"></span>
            <div class="day-collapse-title-wrap">
              <span class="day-collapse-title">第${d.dayIndex + 1}天</span>
              <span class="day-collapse-subtitle">${d.title}</span>
            </div>
            <span class="day-collapse-meta">${d.addrs.length} 个地点</span>
            ${existingRouteInfo}
          </div>
          <div class="day-collapse-header-right">
            <span class="day-plan-status" id="dayStatus-${d.dayIndex}"></span>
            <span class="day-saved-badge" id="dayBadge-${d.dayIndex}" style="display:${d.routeData ? 'inline-flex' : 'none'};">
              <i class="fa-solid fa-check-circle"></i> 已规划
            </span>
            <i class="fa-solid fa-chevron-down day-collapse-arrow"></i>
          </div>
        </div>
        <div class="day-collapse-body" id="dayBody-${d.dayIndex}">
          <div class="day-addr-list">
            ${d.addrs.map((a, ai) => `
              <div class="day-addr-item">
                <span class="day-addr-num">${ai + 1}</span>
                <div class="day-addr-info">
                  <div class="day-addr-name">${a.name}</div>
                  <div class="day-addr-detail"><i class="fa-solid fa-location-dot"></i> ${a.addr}${a.time ? ' · ' + a.time : ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="day-panel-actions">
            ${d.routeData ? `<button class="btn-load-day-route" data-action="loadDayRoute" data-day="${d.dayIndex}">
              <i class="fa-solid fa-map"></i> 加载路线
            </button>` : ''}
            <button class="btn-plan-single-day" data-action="planSingleDay" data-day="${d.dayIndex}">
              <i class="fa-solid fa-route"></i> ${d.routeData ? '重新规划' : '规划今日路线'}
            </button>
          </div>
        </div>
      </div>`;
    }).join('')}
    <button class="btn-import-clear" data-action="clearImportedPlan"><i class="fa-solid fa-xmark"></i> 清除导入</button>
  `;
}

/** 折叠面板展开/收起 */
function toggleDayPanel(dayIndex) {
  const body = document.getElementById(`dayBody-${dayIndex}`);
  const arrow = document.querySelector(`#dayPanel-${dayIndex} .day-collapse-arrow`);
  if (!body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  if (arrow) {
    arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
  }
}

/** 更新某天的规划状态指示 */
function updateDayPlanStatus(dayIndex, status, summary, errMsg) {
  const statusEl = document.getElementById(`dayStatus-${dayIndex}`);
  const badgeEl = document.getElementById(`dayBadge-${dayIndex}`);
  if (!statusEl) return;
  if (status === 'planning') {
    statusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="color:#F39C12;"></i>';
    if (badgeEl) badgeEl.style.display = 'none';
  } else if (status === 'done') {
    const dist = summary ? formatDistance(summary.totalDistance) : '';
    const time = summary ? formatDuration(summary.totalTime) : '';
    statusEl.innerHTML = `<span style="color:var(--clr-primary);font-size:0.68rem;">${dist} · ${time}</span>`;
    if (badgeEl) badgeEl.style.display = 'inline-flex';
  } else if (status === 'failed') {
    statusEl.innerHTML = `<span style="color:#E74C3C;font-size:0.68rem;" title="${errMsg || ''}">规划失败</span>`;
    if (badgeEl) badgeEl.style.display = 'none';
  }
}

/** ============ 多天路线规划 ============ */

/** 一键规划全部路线（串行逐天调用接口） */
async function planAllDays() {
  if (!window._multiDayPlanData || !window._multiDayPlanData.days.length) {
    showToast('没有可规划的多天行程');
    return;
  }

  const days = window._multiDayPlanData.days;
  const btn = document.querySelector('[data-action="planAllDays"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 规划中...'; }

  // 清除旧的多天路线
  clearMultiDayRoutes();

  // 隐藏原有标记
  hideOriginalMarkers();

  // 显示图例
  const legend = document.getElementById('routeLegend');
  if (legend) legend.style.display = 'flex';

  // 串行规划每一天
  for (let i = 0; i < days.length; i++) {
    const dayData = days[i];
    if (dayData.addrs.length < 2) {
      updateDayPlanStatus(dayData.dayIndex, 'failed', null, '地址不足2个');
      continue;
    }

    updateDayPlanStatus(dayData.dayIndex, 'planning');

    try {
      const addresses = dayData.addrs.map((a, ai) => ({
        address: a.addr,
        fullAddress: a.addr,
        type: ai === 0 ? 'origin' : (ai === dayData.addrs.length - 1 ? 'destination' : 'waypoint'),
        city: extractCityFromAddress(a.addr)
      }));

      const resp = await fetch('/api/route/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses, options: { strategy: 0, optimizeOrder: false } })
      });

      const json = await resp.json();

      if (json.success && json.data) {
        const color = DAY_COLORS[i % DAY_COLORS.length];
        dayData.routeData = json.data;

        // 绘制本天路线（分色）
        drawRouteOnMap(json.data, {
          color: color,
          label: `Day${dayData.dayIndex + 1}`,
          tag: `day-${dayData.dayIndex}`
        });

        updateDayPlanStatus(dayData.dayIndex, 'done', json.data.summary);
      } else {
        updateDayPlanStatus(dayData.dayIndex, 'failed', null, json.error?.message || '规划失败');
      }
    } catch (err) {
      console.error(`[多天规划] Day ${dayData.dayIndex + 1} 失败:`, err);
      updateDayPlanStatus(dayData.dayIndex, 'failed', null, err.message);
    }
  }

  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-layer-group"></i> 一键规划全部路线'; }

  // 适配地图视野
  fitMultiDayBounds();

  const doneCount = days.filter(d => d.routeData).length;
  showToast(`路线规划完成！${doneCount}/${days.length} 天规划成功`);
}

/** 规划单天路线 */
async function planSingleDay(dayIndex) {
  if (!window._multiDayPlanData) return;

  const dayData = window._multiDayPlanData.days.find(d => d.dayIndex === dayIndex);
  if (!dayData || dayData.addrs.length < 2) {
    showToast('该天地址不足2个，无法规划路线');
    return;
  }

  updateDayPlanStatus(dayIndex, 'planning');

  // 隐藏原有标记
  hideOriginalMarkers();

  // 确保图例可见
  const legend = document.getElementById('routeLegend');
  if (legend) legend.style.display = 'flex';

  try {
    const addresses = dayData.addrs.map((a, ai) => ({
      address: a.addr,
      fullAddress: a.addr,
      type: ai === 0 ? 'origin' : (ai === dayData.addrs.length - 1 ? 'destination' : 'waypoint'),
      city: extractCityFromAddress(a.addr)
    }));

    const resp = await fetch('/api/route/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses, options: { strategy: 0, optimizeOrder: false } })
    });

    const json = await resp.json();

    if (json.success && json.data) {
      const idx = window._multiDayPlanData.days.findIndex(d => d.dayIndex === dayIndex);
      const color = DAY_COLORS[idx % DAY_COLORS.length];
      dayData.routeData = json.data;

      // 清除该天旧路线，绘制新路线
      clearSingleDayRoute(`day-${dayIndex}`);
      drawRouteOnMap(json.data, {
        color: color,
        label: `Day${dayIndex + 1}`,
        tag: `day-${dayIndex}`
      });

      updateDayPlanStatus(dayIndex, 'done', json.data.summary);
    } else {
      updateDayPlanStatus(dayIndex, 'failed', null, json.error?.message || '规划失败');
    }
  } catch (err) {
    console.error(`[单天规划] Day ${dayIndex + 1} 失败:`, err);
    updateDayPlanStatus(dayIndex, 'failed', null, err.message);
  }
}

/** 清除所有多天路线图层 */
function clearMultiDayRoutes() {
  window._multiDayRoutes.forEach(entry => {
    if (entry.layers) {
      if (entry.layers.outline) leafletMap.removeLayer(entry.layers.outline);
      if (entry.layers.polyline) leafletMap.removeLayer(entry.layers.polyline);
      if (entry.layers.highlight) leafletMap.removeLayer(entry.layers.highlight);
      (entry.layers.markers || []).forEach(m => leafletMap.removeLayer(m));
    }
  });
  window._multiDayRoutes = [];
  // 隐藏图例
  const legend = document.getElementById('routeLegend');
  if (legend) legend.style.display = 'none';
}

/** 清除指定 tag 的单天路线 */
function clearSingleDayRoute(tag) {
  const idx = window._multiDayRoutes.findIndex(r => r.tag === tag);
  if (idx === -1) return;
  const entry = window._multiDayRoutes[idx];
  if (entry.layers) {
    if (entry.layers.outline) leafletMap.removeLayer(entry.layers.outline);
    if (entry.layers.polyline) leafletMap.removeLayer(entry.layers.polyline);
    if (entry.layers.highlight) leafletMap.removeLayer(entry.layers.highlight);
    (entry.layers.markers || []).forEach(m => leafletMap.removeLayer(m));
  }
  window._multiDayRoutes.splice(idx, 1);
}

/** 适配地图视野到所有多天路线范围 */
function fitMultiDayBounds() {
  if (!window._multiDayRoutes.length) return;
  const allLatLngs = [];
  window._multiDayRoutes.forEach(entry => {
    (entry.layers.markers || []).forEach(m => {
      if (m.getLatLng) allLatLngs.push([m.getLatLng().lat, m.getLatLng().lng]);
    });
  });
  if (allLatLngs.length > 0) {
    leafletMap.fitBounds(allLatLngs, { padding: [60, 60], maxZoom: 14 });
  }
}

/** ============ 添加导入标记 ============
 * 先按名称精确匹配，再按地址模糊匹配
 */
function findSpotInAllData(name, addr) {
  const spots = window.ALL_PROVINCE_SPOTS || [];
  if (!spots.length) return null;

  // 精确名称匹配
  let match = spots.find(s => s.name === name);
  if (match) return match;

  // 名称包含匹配（如 "回民街美食巡礼" 匹配 "回民街"）
  match = spots.find(s => name.includes(s.name) || s.name.includes(name));
  if (match) return match;

  // 通过地址中的关键词匹配（如提取省份、城市、区县）
  if (addr) {
    const keywords = extractLocationKeywords(addr);
    for (const kw of keywords) {
      match = spots.find(s => s.province && s.province.includes(kw));
      if (match) return match;
    }
  }

  return null;
}

/** 从地址中提取省份/城市关键词 */
function extractLocationKeywords(addr) {
  const keywords = [];
  // 提取省份
  const provMatch = addr.match(/(北京|天津|上海|重庆|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|四川|贵州|云南|陕西|甘肃|青海|台湾|内蒙古|广西|西藏|宁夏|新疆|香港|澳门)/);
  if (provMatch) keywords.push(provMatch[0]);
  // 提取地级市（取前2-3个汉字+市）
  const cityMatch = addr.match(/([\u4e00-\u9fa5]{2,3})(?:市|州|地区|盟)/);
  if (cityMatch) keywords.push(cityMatch[1]);
  return keywords;
}

/** 在地图上放置单个导入标记 */
function placeImportMarker(spot, lat, lng, index) {
  const marker = L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'import-marker',
      html: `<div class="import-marker-num">${index + 1}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    })
  }).addTo(leafletMap)
    .bindPopup(`<b>${spot.name}</b><br>${spot.addr}`);

  window._importMarkers.push(marker);
  return marker;
}

function addImportMarkers(addrs) {
  if (!leafletMap) return;

  // 清除旧标记
  clearImportMarkers();

  window._importMarkers = [];

  // 优先从本地 ALL_PROVINCE_SPOTS 数据查找坐标（速度快，不走网络）
  const remainingAddrs = [];
  addrs.forEach((spot, i) => {
    const localSpot = findSpotInAllData(spot.name, spot.addr);
    if (localSpot) {
      // 本地数据为 WGS-84，需转为 GCJ-02 适配高德地图瓦片
      const gcj = wgs84ToGcj02(localSpot.lng, localSpot.lat);
      placeImportMarker(spot, gcj.lat, gcj.lng, i);
    } else {
      remainingAddrs.push({ spot, index: i });
    }
  });

  // 本地未匹配的地址，通过服务端 AMAP API 批量地理编码
  if (remainingAddrs.length > 0) {
    fetch('/api/address/batch-geocode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        addresses: remainingAddrs.map(a => ({
          address: a.spot.addr,
          city: extractCityFromAddress(a.spot.addr)
        }))
      })
    })
    .then(res => res.json())
    .then(json => {
      if (json.success && json.data) {
        json.data.forEach((result, idx) => {
          if (result && result.longitude && result.latitude) {
            const { spot, index } = remainingAddrs[idx];
            placeImportMarker(spot, result.latitude, result.longitude, index);
          }
        });
      }
    })
    .catch(err => {
      console.warn('[导入标记] 服务端地理编码失败:', err.message);
    })
    .finally(() => {
      // 调整地图视野
      const allMarkers = window._importMarkers;
      if (allMarkers && allMarkers.length > 0) {
        const bounds = allMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng]);
        leafletMap.fitBounds(bounds, { padding: [40, 40] });
      }
    });
  } else {
    // 全部从本地匹配成功，直接调整视野
    const allMarkers = window._importMarkers;
    if (allMarkers && allMarkers.length > 0) {
      const bounds = allMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng]);
      leafletMap.fitBounds(bounds, { padding: [40, 40] });
    }
  }
}

function clearImportMarkers() {
  if (window._importMarkers) {
    window._importMarkers.forEach(m => leafletMap.removeLayer(m));
    window._importMarkers = [];
  }
}

function clearImportedPlan() {
  clearImportMarkers();
  clearMultiDayRoutes();
  document.getElementById('spotList').innerHTML = '';
  selectedSpot = null;
  document.getElementById('mapDestName').innerHTML = '<i class="fa-solid fa-map-pin"></i><span>点击景点查看位置</span>';
  window._routePlanSource = null;  // 清除路线来源引用
  window._multiDayPlanData = null;  // 清除多天规划数据
}

function openImportFromFavorites() {
  const favs = getFavorites();
  const planFavs = favs.filter(f => f.isAiPlan && f.days && f.days.length);

  if (planFavs.length === 0) {
    showToast('暂无 AI 生成的行程收藏，请先使用 AI 规划并保存行程');
    return;
  }

  // 如果只有一个，直接进入天数选择
  if (planFavs.length === 1) {
    appendDayPickerModal(planFavs[0]);
    return;
  }

  // 多个收藏：先选目的地
  showFavDestinationPicker(planFavs);
}

/** 打开已保存的路线规划列表 */
function openSavedRoutes() {
  const favs = getFavorites();
  const routePlans = favs.filter(f => f.isRoutePlan && f.routeData);

  if (routePlans.length === 0) {
    showToast('暂无已保存的路线规划，请先在路线规划中完成规划并保存');
    return;
  }

  // 在内联区域渲染路线列表
  renderSavedRoutesList(routePlans);
}

/** 在内联区域渲染已保存路线列表 */
function renderSavedRoutesList(routePlans) {
  const container = getDayPickerInline();
  if (!container) return;

  toggleImportContent(false);
  container.style.display = '';

  // 构建索引映射：从完整收藏列表中获取实际索引
  const allFavs = getFavorites();
  const routeIndices = routePlans.map(rp => allFavs.indexOf(rp));

  container.innerHTML = `
    <div class="inline-picker-header">
      <button class="inline-picker-back" data-action="inlinePickerCancel">
        <i class="fa-solid fa-arrow-left"></i> 返回
      </button>
      <div class="inline-picker-title">
        <i class="fa-solid fa-folder-open"></i> 已保存路线
      </div>
      <div class="inline-picker-sub">共 ${routePlans.length} 条已保存路线</div>
    </div>
    <div class="inline-picker-list">
      ${routePlans.map((f, i) => `
        <div class="import-spot-item">
          <div class="import-spot-info">
            <div class="import-spot-name">
              <i class="fa-solid fa-map-marked-alt" style="color:var(--clr-primary);margin-right:4px;"></i>${f.name}
            </div>
            <div class="import-spot-addr">${f.sub}</div>
            <div class="import-spot-time">${f.addedAt}</div>
          </div>
          <div class="import-spot-actions">
            <button class="import-spot-btn primary" data-action="loadRoutePlanFromSaved" data-index="${routeIndices[i]}" title="加载此路线进行编辑或导航">
              <i class="fa-solid fa-map"></i> 加载路线
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function showFavDestinationPicker(planFavs) {
  renderInlineDestPicker(planFavs, resetInlinePicker);
}

function appendDayPickerModal(fav) {
  window._importFav = fav;
  renderInlineDayPicker(fav, function() {
    // 返回时重新显示目的地选择
    const favs = getFavorites().filter(f => f.isAiPlan && f.days && f.days.length);
    if (favs.length > 1) {
      renderInlineDestPicker(favs, resetInlinePicker);
    } else {
      resetInlinePicker();
    }
  });
}

// ============ 多点路线规划 ============
let routePanelMode = 'single';        // 'single' | 'route'
let routePanelWaypoints = [];         // 途经点 DOM 行引用
let routePlanPolyline = null;         // 地图上的路线
let routePlanOutline = null;          // 路线白色描边
let routePlanHighlight = null;        // 路线高光内层
let routePlanMarkers = [];            // 规划标记
let lastRoutePlanData = null;         // 最近一次成功的路线规划结果（可保存到收藏）

/** 多天行程路线规划状态 */
window._multiDayPlanData = null;     // { fav, days: [{dayIndex, title, addrs: [{name, addr, time}], routeData}] }
window._multiDayRoutes = [];          // [{dayIndex, tag, color, layers: {outline, polyline, highlight, markers:[]}}]
const DAY_COLORS = [
  '#C0392B', // Day 1 - 深红（白色文字清晰）
  '#2980B9', // Day 2 - 深蓝（白色文字清晰）
  '#27AE60', // Day 3 - 深绿（白色文字清晰）
  '#D35400', // Day 4 - 深橙（白色文字清晰）
  '#8E44AD', // Day 5 - 深紫（白色文字清晰）
  '#16A085', // Day 6 - 深青（白色文字清晰）
  '#E67E22', // Day 7 - 亮橙（白色文字清晰）
  '#34495E', // Day 8 - 深蓝灰（白色文字清晰）
];

/** 切换导航面板模式 */
function switchNavPanelMode(panel) {
  routePanelMode = panel;
  document.querySelectorAll('.nav-panel-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.nav-panel-tab[data-panel="${panel}"]`)?.classList.add('active');
  
  const singlePanel = document.getElementById('singleNavPanel');
  const routePanel = document.getElementById('routePlanPanel');
  const importPanel = document.getElementById('navImportSection');
  
  if (singlePanel) singlePanel.style.display = panel === 'single' ? '' : 'none';
  if (routePanel) routePanel.style.display = panel === 'route' ? '' : 'none';
  if (importPanel) importPanel.style.display = panel === 'import' ? '' : 'none';
}

/** 添加途经点行 */
function addRouteWaypoint() {
  const list = document.getElementById('routeAddressList');
  const wpCount = list.querySelectorAll('.route-addr-row[data-type="waypoint"]').length;
  if (wpCount >= 30) { showToast('最多支持30个途经点'); return; }
  
  const row = document.createElement('div');
  row.className = 'route-addr-row';
  row.dataset.type = 'waypoint';
  row.innerHTML = `
    <span class="route-addr-tag waypoint">途经</span>
    <input type="text" class="route-addr-input" placeholder="输入途经点地址..." oninput="searchRouteAddress(this)">
    <div class="route-addr-suggestions" style="display:none"></div>
    <button class="route-addr-remove" onclick="removeRouteWaypoint(this)" title="移除">
      <i class="fa-solid fa-xmark"></i>
    </button>
  `;
  
  // 插入到终点行之前
  const destRow = list.querySelector('.route-addr-row[data-type="destination"]');
  list.insertBefore(row, destRow);
  routePanelWaypoints.push(row);
}

/** 移除途经点行 */
function removeRouteWaypoint(btn) {
  const row = btn.closest('.route-addr-row');
  routePanelWaypoints = routePanelWaypoints.filter(r => r !== row);
  row.remove();
}

/** 搜索地址联想 */
let routeSearchTimers = {};
function searchRouteAddress(input) {
  const row = input.closest('.route-addr-row');
  const suggestionsDiv = row.querySelector('.route-addr-suggestions');
  const keyword = input.value.trim();
  
  if (routeSearchTimers[row]) clearTimeout(routeSearchTimers[row]);
  
  if (keyword.length < 2) {
    suggestionsDiv.style.display = 'none';
    return;
  }
  
  routeSearchTimers[row] = setTimeout(async () => {
    try {
      const resp = await fetch(`/api/address/search?keyword=${encodeURIComponent(keyword)}&limit=5`);
      const json = await resp.json();
      if (json.success && json.data && json.data.results && json.data.results.length > 0) {
        suggestionsDiv.innerHTML = json.data.results.map(r => `
          <div class="route-addr-sug-item" data-name="${r.name.replace(/"/g, '&quot;')}" data-addr="${(r.address || r.name).replace(/"/g, '&quot;')}">
            <div class="route-addr-sug-name">${r.name}</div>
            <div class="route-addr-sug-addr">${r.address || r.district || ''}</div>
          </div>
        `).join('');
        suggestionsDiv.style.display = 'block';
        
        suggestionsDiv.querySelectorAll('.route-addr-sug-item').forEach(item => {
          item.addEventListener('click', function() {
            input.value = this.dataset.name;
            input.dataset.selectedAddr = this.dataset.addr;
            suggestionsDiv.style.display = 'none';
          });
        });
      } else {
        suggestionsDiv.style.display = 'none';
      }
    } catch (e) {
      suggestionsDiv.style.display = 'none';
    }
  }, 400);
}

// 点击外部关闭搜索联想
document.addEventListener('click', function(e) {
  if (!e.target.closest('.route-addr-row')) {
    document.querySelectorAll('.route-addr-suggestions').forEach(d => d.style.display = 'none');
  }
});

/** 从完整地址中提取市级行政区，提升地理编码精度 */
function extractCityFromAddress(addr) {
  if (!addr) return '';
  // 去掉省级前缀，再提取市/州/盟级行政区
  const withoutProvince = addr.replace(/^[^省]+?省/, '');
  const match = withoutProvince.match(/^(.+?[州市盟])/);
  return match ? match[1] : '';
}

/** 开始路线规划 */
async function startRoutePlanning() {
  const btn = document.getElementById('startRouteBtn');

  // 收集所有地址
  const rows = document.querySelectorAll('#routeAddressList .route-addr-row');
  const addresses = [];

  rows.forEach(row => {
    const input = row.querySelector('.route-addr-input');
    const addr = input.value.trim();
    if (addr) {
      addresses.push({
        address: addr,
        fullAddress: addr,
        type: row.dataset.type,
        city: extractCityFromAddress(addr)
      });
    }
  });
  
  if (addresses.length < 2) {
    showToast('至少需要输入起点和终点地址');
    return;
  }
  
  // 按钮禁用+加载态
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 规划中...';
  
  try {
    // 策略映射：HTML radio 字符串值 → 高德 drivingStrategy 整数
    const strategyMap = { time: 0, distance: 2, smooth: 4, cost: 1 };
    const checkedStrategy = document.querySelector('input[name="routeStrategy"]:checked');
    const options = {
      strategy: checkedStrategy ? (strategyMap[checkedStrategy.value] ?? 0) : 0,
      optimizeOrder: document.getElementById('optimizeOrder').checked,
      optimizationStrategy: 'balanced'
    };
    
    const resp = await fetch('/api/route/plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addresses, options })
    });
    
    const json = await resp.json();
    
    if (!json.success) {
      const errMsg = json.error?.message || '路线规划失败';
      if (errMsg.includes('INVALID_USER_KEY') || errMsg.includes('key') || json.error?.code === 'INVALID_KEY' || json.error?.suggestion) {
        showToast('高德地图 API Key 未配置，请在 server/.env 中设置 AMAP_API_KEY');
        console.warn('[路线规划] 需要配置 AMAP_API_KEY → https://console.amap.com/dev/key/app');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-play"></i> 开始规划';
        return;
      }
      throw new Error(errMsg);
    }
    
    const data = json.data;
    
    // 隐藏原有标记，聚焦路线
    hideOriginalMarkers();
    
    // 绘制路线
    drawRouteOnMap(data);
    
    // 显示结果摘要
    document.getElementById('routePlanDist').textContent = formatDistance(data.summary.totalDistance);
    document.getElementById('routePlanTime').textContent = formatDuration(data.summary.totalTime);
    document.getElementById('routePlanToll').textContent = data.summary.totalTollFee > 0 ? `¥${data.summary.totalTollFee}` : '免费';
    document.getElementById('routeSummary').style.display = '';
    
    // 存储本次路线数据，以便保存到收藏
    const strategyText = checkedStrategy ? checkedStrategy.value : 'time';
    lastRoutePlanData = {
      addresses: addresses.map(a => ({ address: a.address, type: a.type })),
      strategy: strategyText,
      optimizeOrder: document.getElementById('optimizeOrder').checked,
      summary: {
        totalDistance: data.summary.totalDistance,
        totalTime: data.summary.totalTime,
        totalTollFee: data.summary.totalTollFee
      },
      origin: data.origin,
      destination: data.destination,
      waypoints: data.waypoints || [],
      routes: data.routes || [],
      polyline: data.routes && data.routes.length > 0 ? data.routes[0].polyline : null
    };
    
    showToast('路线规划完成！');
    
  } catch (err) {
    console.error('[路线规划] 失败:', err);
    const msg = err.message || '';
    if (msg.includes('INVALID_USER_KEY') || msg.includes('INVALID_KEY')) {
      showToast('高德地图 API Key 未配置，请在 server/.env 中设置 AMAP_API_KEY');
    } else {
      showToast('路线规划失败: ' + (msg || '服务暂不可用'));
    }
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-play"></i> 开始规划';
  }
}

/** 格式化距离 */
function formatDistance(meters) {
  if (meters >= 1000) return (meters / 1000).toFixed(1) + ' 公里';
  return meters + ' 米';
}

/** 格式化时长 */
function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return h + ' 小时 ' + m + ' 分钟';
  return m + ' 分钟';
}

/** 解码高德 polyline 加密字符串 */
function decodePolyline(encoded) {
  if (!encoded || encoded.length === 0) return [];
  const points = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0, lng = 0;
  
  while (index < len) {
    let shift = 0, result = 0;
    let b;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;
    
    shift = 0; result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;
    
    points.push([lat / 1e6, lng / 1e6]);
  }
  return points;
}

/** 在地图上绘制路线（导航风格，按顺序连接途经点）
 * @param {Object} data - 路线规划返回数据
 * @param {Object} [options] - 可选参数
 * @param {string} [options.color] - 路线主色（多天模式区分颜色）
 * @param {string} [options.label] - 标记前缀标签（如 "Day1"）
 * @param {string} [options.tag] - 图层分组标签（用于多天路线独立清除）
 */
function drawRouteOnMap(data, options = {}) {
  if (!leafletMap) return;

  const { color = '#007AFF', label = '', tag = '' } = options;
  const isMultiDay = !!tag;

  // 非多天模式：清除旧路线（多天模式下由调用方控制清除）
  if (!isMultiDay) {
    clearRoutePlanOnMap();
  }

  // --- 1. 构建有序点列表：起点 → 途经点A,B,C… → 终点 ---
  const orderedPoints = [];
  if (data.origin && data.origin.latitude && data.origin.longitude) {
    orderedPoints.push({ lat: data.origin.latitude, lng: data.origin.longitude, label: '起', type: 'origin', info: data.origin });
  }
  if (data.waypoints) {
    data.waypoints.forEach((wp, idx) => {
      if (wp.latitude && wp.longitude) {
        orderedPoints.push({ lat: wp.latitude, lng: wp.longitude, label: String.fromCharCode(65 + idx), type: 'waypoint', info: wp });
      }
    });
  }
  if (data.destination && data.destination.latitude && data.destination.longitude) {
    orderedPoints.push({ lat: data.destination.latitude, lng: data.destination.longitude, label: '终', type: 'dest', info: data.destination });
  }

  if (orderedPoints.length < 2) return;

  // 本地路线图层引用（多天模式存入 _multiDayRoutes，否则用全局变量）
  let localMarkers = [];
  let localOutline = null;
  let localPolyline = null;
  let localHighlight = null;

  // --- 2. 绘制标记（同天统一颜色：圆底+箭头使用当天的 color） ---
  const markerIcons = {
    origin: L.divIcon({
      className: 'nav-pin origin',
      html: `<div class="nav-pin-circle" style="background:${color}">起</div><div class="nav-pin-arrow" style="border-top-color:${color}"></div>`,
      iconSize: [46, 60], iconAnchor: [23, 52]
    }),
    dest: L.divIcon({
      className: 'nav-pin dest',
      html: `<div class="nav-pin-circle" style="background:${color}">终</div><div class="nav-pin-arrow" style="border-top-color:${color}"></div>`,
      iconSize: [46, 60], iconAnchor: [23, 52]
    }),
    waypoint: (lbl) => L.divIcon({
      className: 'nav-pin waypoint',
      html: `<div class="nav-pin-circle" style="background:${color}">${lbl}</div><div class="nav-pin-arrow" style="border-top-color:${color}"></div>`,
      iconSize: [38, 52], iconAnchor: [19, 44]
    })
  };

  orderedPoints.forEach((pt) => {
    let icon, popup;
    const dayLabel = label ? `[${label}] ` : '';
    if (pt.type === 'origin') {
      icon = markerIcons.origin;
      popup = `<b>${dayLabel}起点</b><br>` + (pt.info.fullAddress || '');
    } else if (pt.type === 'dest') {
      icon = markerIcons.dest;
      popup = `<b>${dayLabel}终点</b><br>` + (pt.info.fullAddress || '');
    } else {
      icon = markerIcons.waypoint(pt.label);
      popup = `<b>${dayLabel}途经点 ${pt.label}</b><br>${pt.info.fullAddress || ''}`;
    }
    const m = L.marker([pt.lat, pt.lng], { icon }).addTo(leafletMap).bindPopup(popup);
    localMarkers.push(m);
  });

  // --- 3. 按顺序连接相邻点（主线用 AMap polyline，顺序线段作为高亮连接） ---
  const route = data.routes && data.routes[0];
  let allCoords = [];

  if (route && route.polyline) {
    const segments = route.polyline.split(';');
    segments.forEach(seg => {
      if (seg && seg.trim()) {
        try {
          allCoords = allCoords.concat(decodePolyline(seg.trim()));
        } catch (e) {
          const coordPairs = seg.split('|');
          allCoords = allCoords.concat(coordPairs.map(pair => {
            const [lng, lat] = pair.split(',').map(Number);
            return [lat, lng];
          }));
        }
      }
    });

    if (allCoords.length > 1) {
      // 白色外描边
      localOutline = L.polyline(allCoords, {
        color: '#ffffff', weight: 14, opacity: 0.92,
        interactive: false, className: 'route-outline'
      }).addTo(leafletMap);

      // 主路线（分天分色）
      localPolyline = L.polyline(allCoords, {
        color: color, weight: 7, opacity: 1.0,
        lineJoin: 'round', lineCap: 'round', className: 'route-polyline'
      }).addTo(leafletMap);

      // 内层高光（使用主色淡色版）
      localHighlight = L.polyline(allCoords, {
        color: color, weight: 3, opacity: 0.45,
        interactive: false, className: 'route-highlight'
      }).addTo(leafletMap);

      // 方向箭头（多天模式下也传入 tag 以便追踪）
      addRouteArrows(allCoords, isMultiDay ? localMarkers : undefined);
    }
  }

  // --- 4. 绘制顺序连接线段（起→A→B→...→终） ---
  for (let i = 0; i < orderedPoints.length - 1; i++) {
    const from = orderedPoints[i];
    const to = orderedPoints[i + 1];
    const segCoords = [[from.lat, from.lng], [to.lat, to.lng]];

    // 顺序连接虚线（使用主色）
    const segLine = L.polyline(segCoords, {
      color: color,
      weight: 4,
      opacity: 0.85,
      dashArray: '10 6',
      interactive: false,
      className: 'route-segment-connector'
    }).addTo(leafletMap);
    localMarkers.push(segLine);

    // 线段中点方向标
    const midLat = (from.lat + to.lat) / 2;
    const midLng = (from.lng + to.lng) / 2;
    const angle = Math.atan2(to.lat - from.lat, to.lng - from.lng) * 180 / Math.PI;
    const arrowIcon = L.divIcon({
      className: '',
      html: `<div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:10px solid ${color};transform:rotate(${angle}deg);transform-origin:center;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3));"></div>`,
      iconSize: [12, 10], iconAnchor: [6, 5]
    });
    const arrowM = L.marker([midLat, midLng], { icon: arrowIcon, interactive: false }).addTo(leafletMap);
    localMarkers.push(arrowM);
  }

  // --- 5. 图层管理 ---
  if (isMultiDay) {
    // 多天模式：存入 _multiDayRoutes 数组
    window._multiDayRoutes.push({
      tag: tag,
      color: color,
      layers: {
        outline: localOutline,
        polyline: localPolyline,
        highlight: localHighlight,
        markers: localMarkers
      }
    });
  } else {
    // 单天/手动模式：存入全局变量
    routePlanOutline = localOutline;
    routePlanPolyline = localPolyline;
    routePlanHighlight = localHighlight;
    routePlanMarkers = localMarkers;

    // 自动缩放到路线视野
    if (routePlanMarkers.length > 0) {
      const group = new L.featureGroup(routePlanMarkers);
      if (routePlanPolyline) group.addLayer(routePlanPolyline);
      if (routePlanOutline) group.addLayer(routePlanOutline);
      if (routePlanHighlight) group.addLayer(routePlanHighlight);
      leafletMap.fitBounds(group.getBounds(), { padding: [60, 60], maxZoom: 16 });
    }
  }
}

/** 路线方向箭头 */
function addRouteArrows(coords, targetMarkers) {
  if (!coords || coords.length < 4) return;
  const markers = targetMarkers || routePlanMarkers;
  const step = Math.max(2, Math.floor(coords.length / 12));
  for (let i = step; i < coords.length - step; i += step) {
    const p1 = coords[i], p2 = coords[i + 1] || coords[i - 1];
    const angle = Math.atan2(p2[1] - p1[1], p2[0] - p1[0]) * 180 / Math.PI;
    const arrowIcon = L.divIcon({
      className: '',
      html: `<div class="route-arrow" style="transform:rotate(${angle}deg);transform-origin:center;"></div>`,
      iconSize: [10, 10], iconAnchor: [5, 5]
    });
    const marker = L.marker(p1, { icon: arrowIcon, interactive: false }).addTo(leafletMap);
    markers.push(marker);
  }
}

/** 清除地图上的路线 */
function clearRoutePlanOnMap() {
  if (routePlanOutline) {
    leafletMap.removeLayer(routePlanOutline);
    routePlanOutline = null;
  }
  if (routePlanPolyline) {
    leafletMap.removeLayer(routePlanPolyline);
    routePlanPolyline = null;
  }
  if (routePlanHighlight) {
    leafletMap.removeLayer(routePlanHighlight);
    routePlanHighlight = null;
  }
  routePlanMarkers.forEach(m => leafletMap.removeLayer(m));
  routePlanMarkers = [];
  // 同时清除多天路线
  clearMultiDayRoutes();
}

/** 清除路线规划 */
function clearRoutePlan() {
  clearRoutePlanOnMap();
  restoreOriginalMarkers();  // 恢复原有景点标记
  document.getElementById('routeSummary').style.display = 'none';
  document.getElementById('routePlanDist').textContent = '-';
  document.getElementById('routePlanTime').textContent = '-';
  document.getElementById('routePlanToll').textContent = '-';
  lastRoutePlanData = null;  // 清除缓存路线数据
  window._routePlanSource = null;  // 清除路线来源引用
  window._multiDayPlanData = null;  // 清除多天规划数据
}

/** 将当前路线规划结果保存到收藏 */
function saveRoutePlanToFavorites() {
  const source = window._routePlanSource;

  // ----- 情况0：多天路线规划 → 从 _multiDayPlanData 逐天回存 -----
  if (source && source.favName && source.day === -1 && window._multiDayPlanData && window._multiDayPlanData.days.length) {
    const favs = getFavorites();
    const favIndex = favs.findIndex(f => f.name === source.favName && f.isAiPlan);

    if (favIndex === -1) {
      showToast('未找到原行程收藏');
      return;
    }

    const fav = favs[favIndex];
    let savedCount = 0;

    window._multiDayPlanData.days.forEach(dayEntry => {
      if (!dayEntry.routeData) return;
      const dayData = fav.days[dayEntry.dayIndex];
      if (!dayData) return;

      const data = dayEntry.routeData;
      const addrs = dayEntry.addrs.map((a, ai) => ({
        address: a.addr,
        type: ai === 0 ? 'origin' : (ai === dayEntry.addrs.length - 1 ? 'destination' : 'waypoint')
      }));

      dayData.routeData = {
        orderedAddresses: addrs,
        strategy: 'time',
        optimizeOrder: false,
        summary: {
          totalDistance: data.summary.totalDistance,
          totalTime: data.summary.totalTime,
          totalTollFee: data.summary.totalTollFee
        },
        origin: data.origin,
        destination: data.destination,
        waypoints: data.waypoints,
        polyline: data.routes && data.routes.length > 0 ? data.routes[0].polyline : null,
        savedAt: new Date().toLocaleString()
      };

      syncRouteToDayActs(dayData, addrs);
      savedCount++;
    });

    saveFavorites(favs);
    refreshBadges();
    renderFavList();
    window._routePlanSource = null;
    window._multiDayPlanData = null;

    showToast(`已保存 ${savedCount} 天路线到「${fav.name}」✓`);

    // 保存后隐藏"保存全部路线"按钮
    const saveBtn = document.getElementById('btnSaveMultiDay');
    if (saveBtn) saveBtn.style.display = 'none';

    // 标记各天面板为已保存（显示徽章）
    window._multiDayPlanData.days.forEach(dayEntry => {
      if (!dayEntry.routeData) return;
      const badge = document.getElementById(`dayBadge-${dayEntry.dayIndex}`);
      if (badge) badge.style.display = 'inline-flex';
    });

    return;
  }

  // 非多天模式需要 lastRoutePlanData
  if (!lastRoutePlanData) {
    showToast('没有可保存的路线，请先完成路线规划');
    return;
  }

  const data = lastRoutePlanData;
  const addrs = data.addresses || [];

  // ----- 情况1：从AI行程导入的单天路线 → 回存到原行程的对应天数 -----
  if (source && source.favName && source.day >= 0) {
    const favs = getFavorites();
    const favIndex = favs.findIndex(f => f.name === source.favName && f.isAiPlan);

    if (favIndex === -1) {
      showToast('未找到原行程收藏，路线将保存为独立路线');
      saveAsStandaloneRoute(data, addrs);
      return;
    }

    const fav = favs[favIndex];
    const dayIndex = source.day;
    if (!fav.days || !fav.days[dayIndex]) {
      showToast('原行程数据异常，路线将保存为独立路线');
      saveAsStandaloneRoute(data, addrs);
      return;
    }

    const dayData = fav.days[dayIndex];

    // 将路线规划结果存入当日行程
    dayData.routeData = {
      orderedAddresses: addrs.map(a => ({ address: a.address, type: a.type })),
      strategy: data.strategy,
      optimizeOrder: data.optimizeOrder,
      summary: {
        totalDistance: data.summary.totalDistance,
        totalTime: data.summary.totalTime,
        totalTollFee: data.summary.totalTollFee
      },
      origin: data.origin,
      destination: data.destination,
      waypoints: data.waypoints,
      polyline: data.polyline,
      savedAt: new Date().toLocaleString()
    };

    // 将规划后的有序地址同步回当日 acts（按顺序重排，保留名称/时间）
    syncRouteToDayActs(dayData, addrs);

    saveFavorites(favs);
    refreshBadges();
    renderFavList();
    window._routePlanSource = null;  // 已消费来源引用

    const dayLabel = `第${dayIndex + 1}天`;
    const distStr = formatDistance(data.summary.totalDistance);
    const timeStr = formatDuration(data.summary.totalTime);
    showToast(`路线已保存到「${fav.name}」${dayLabel} ✓\n${distStr} · ${timeStr}`);
    return;
  }

  // ----- 情况2：手动规划的路线 → 创建独立路线收藏 -----
  saveAsStandaloneRoute(data, addrs);
}

/** 将路线规划结果保存为独立的路线收藏条目 */
function saveAsStandaloneRoute(data, addrs) {
  // 生成路线名称
  const firstAddr = addrs.length > 0 ? addrs[0].address : '未命名';
  const lastAddr = addrs.length > 1 ? addrs[addrs.length - 1].address : '';
  const defaultName = lastAddr
    ? `${firstAddr.slice(0, 8)} → ${lastAddr.slice(0, 8)}`
    : firstAddr.slice(0, 15);

  // 弹出简易输入框让用户自定义路线名称
  const routeName = prompt('为这条路线取个名字：', defaultName);
  if (!routeName || !routeName.trim()) return;

  const favs = getFavorites();

  // 生成副标题
  const wpCount = addrs.filter(a => a.type === 'waypoint').length;
  const distStr = formatDistance(data.summary.totalDistance);
  const timeStr = formatDuration(data.summary.totalTime);
  const subParts = [];
  if (wpCount > 0) subParts.push(`途经${wpCount}个点`);
  subParts.push(`${distStr} · ${timeStr}`);
  const sub = subParts.join(' · ');

  // 使用第一个地址尝试查找图片
  let img = 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80'; // 默认路线图
  const firstAddrInput = addrs[0]?.address || '';
  const localSpot = findSpotInAllData(firstAddrInput, firstAddrInput);
  if (localSpot && localSpot.img) {
    img = localSpot.img;
  }

  favs.push({
    name: routeName.trim(),
    sub: sub,
    img: img,
    price: data.summary.totalTollFee > 0 ? `¥${data.summary.totalTollFee}` : '免费',
    rating: `${addrs.length}个点`,
    addedAt: new Date().toLocaleDateString(),
    isRoutePlan: true,
    routeData: {
      addresses: addrs,
      strategy: data.strategy,
      optimizeOrder: data.optimizeOrder,
      summary: data.summary,
      origin: data.origin,
      destination: data.destination,
      waypoints: data.waypoints,
      polyline: data.polyline
    }
  });

  saveFavorites(favs);
  refreshBadges();
  renderFavList();
  showToast(`路线「${routeName.trim()}」已保存到收藏 ✓`);
}

/** 将规划后的地址顺序同步回当日 acts 数组 */
function syncRouteToDayActs(dayData, addrs) {
  if (!dayData || !dayData.acts) return;

  // 创建地址→原始act的映射
  const addrToAct = new Map();
  dayData.acts.forEach(act => {
    if (act.addr) {
      const key = act.addr.replace(/\s+/g, '');
      addrToAct.set(key, act);
    }
  });

  // 按规划顺序重建 acts（保留原始 name/time）
  const reordered = [];
  addrs.forEach(a => {
    const key = a.address.replace(/\s+/g, '');
    const orig = addrToAct.get(key);
    if (orig) {
      reordered.push({ ...orig });  // 浅拷贝，保留原始 name/time
    } else {
      // 用户手动添加的地址（不在原行程中）
      reordered.push({ name: a.address.slice(0, 8), addr: a.address, time: '' });
    }
  });

  // 追加原行程中但不在规划路线中的活动（排到最后）
  dayData.acts.forEach(act => {
    if (act.addr) {
      const key = act.addr.replace(/\s+/g, '');
      const alreadyIn = addrs.some(a => a.address.replace(/\s+/g, '') === key);
      if (!alreadyIn) {
        reordered.push({ ...act });
      }
    }
  });

  dayData.acts = reordered;
}

/** 加载已保存到某天的路线规划（从导入列表触发） */
function loadExistingRouteForDay(dayIndex) {
  const source = window._routePlanSource;
  if (!source || !source.favName) {
    showToast('无法定位原行程');
    return;
  }

  const favs = getFavorites();
  const fav = favs.find(f => f.name === source.favName && f.isAiPlan);
  if (!fav || !fav.days || !fav.days[dayIndex] || !fav.days[dayIndex].routeData) {
    showToast('该天没有已保存的路线规划');
    return;
  }

  const routeData = fav.days[dayIndex].routeData;

  // 切换到路线规划面板
  switchNavPanelMode('route');

  // 清除现有途经点
  routePanelWaypoints.forEach(r => r.remove());
  routePanelWaypoints = [];

  const addrs = routeData.orderedAddresses || routeData.addresses || [];
  if (addrs.length < 2) {
    showToast('路线数据不完整');
    return;
  }

  // 预填地址
  const originAddr = addrs.find(a => a.type === 'origin');
  const destAddr = addrs.find(a => a.type === 'destination');
  const waypoints = addrs.filter(a => a.type === 'waypoint');

  const originInput = document.querySelector('#routeAddressList .route-addr-row[data-type="origin"] .route-addr-input');
  if (originInput && originAddr) originInput.value = originAddr.address;

  const destInput = document.querySelector('#routeAddressList .route-addr-row[data-type="destination"] .route-addr-input');
  if (destInput && destAddr) destInput.value = destAddr.address;

  waypoints.forEach(wp => {
    addRouteWaypoint();
    const rows = document.querySelectorAll('#routeAddressList .route-addr-row[data-type="waypoint"]');
    const lastRow = rows[rows.length - 1];
    if (lastRow) lastRow.querySelector('.route-addr-input').value = wp.address;
  });

  // 恢复策略
  if (routeData.strategy) {
    const radio = document.querySelector(`input[name="routeStrategy"][value="${routeData.strategy}"]`);
    if (radio) radio.checked = true;
  }
  const optimizeCheckbox = document.getElementById('optimizeOrder');
  if (optimizeCheckbox) optimizeCheckbox.checked = !!routeData.optimizeOrder;

  // 显示路线摘要
  document.getElementById('routePlanDist').textContent = formatDistance(routeData.summary.totalDistance);
  document.getElementById('routePlanTime').textContent = formatDuration(routeData.summary.totalTime);
  document.getElementById('routePlanToll').textContent = routeData.summary.totalTollFee > 0 ? `¥${routeData.summary.totalTollFee}` : '免费';
  document.getElementById('routeSummary').style.display = '';

  // 存储为 lastRoutePlanData（再次保存会覆盖）
  lastRoutePlanData = {
    addresses: addrs,
    strategy: routeData.strategy,
    optimizeOrder: routeData.optimizeOrder,
    summary: routeData.summary,
    origin: routeData.origin,
    destination: routeData.destination,
    waypoints: routeData.waypoints,
    polyline: routeData.polyline
  };

  // 绘制路线
  if (routeData.polyline && routeData.origin && routeData.destination) {
    hideOriginalMarkers();
    drawRouteOnMap({
      origin: routeData.origin,
      destination: routeData.destination,
      waypoints: routeData.waypoints || [],
      summary: routeData.summary,
      routes: [{ polyline: routeData.polyline }]
    });
  }

  showToast(`已加载「${fav.name}」第${dayIndex + 1}天的路线`);
  smoothScrollToSection('#navigate');
}

/** 加载已保存的某天路线到地图（多天面板上下文） */
function loadDayRoute(dayIndex) {
  if (!window._multiDayPlanData) {
    showToast('尚未导入多天行程');
    return;
  }

  const idx = window._multiDayPlanData.days.findIndex(d => d.dayIndex === dayIndex);
  if (idx === -1) {
    showToast('未找到该天的行程数据');
    return;
  }

  const dayData = window._multiDayPlanData.days[idx];
  if (!dayData.routeData) {
    showToast('该天没有已规划的路线');
    return;
  }

  const data = dayData.routeData;
  const color = DAY_COLORS[idx % DAY_COLORS.length];

  // 展开面板
  const body = document.getElementById(`dayBody-${dayIndex}`);
  if (body && body.style.display === 'none') {
    toggleDayPanel(dayIndex);
  }

  // 隐藏原有标记
  hideOriginalMarkers();

  // 清除该天旧路线，绘制新路线
  clearSingleDayRoute(`day-${dayIndex}`);
  drawRouteOnMap(data, {
    color: color,
    label: `Day${dayIndex + 1}`,
    tag: `day-${dayIndex}`
  });

  // 显示图例
  const legend = document.getElementById('routeLegend');
  if (legend) legend.style.display = 'flex';

  showToast(`已加载第${dayIndex + 1}天路线 · ${formatDistance(data.summary.totalDistance)} · ${formatDuration(data.summary.totalTime)}`);
}

/** 策略文本映射（供加载时显示） */
const STRATEGY_LABEL_MAP = { time: '时间优先', distance: '路程优先', smooth: '顺利程度', cost: '花费价格' };

/** 从收藏加载路线规划到导航面板 */
function loadRoutePlanFromFav(index) {
  const favs = getFavorites();
  const fav = favs[index];
  if (!fav || !fav.isRoutePlan || !fav.routeData) {
    showToast('该收藏没有可加载的路线数据');
    return;
  }

  closeUserPanel();

  // 切换到路线规划面板
  switchNavPanelMode('route');

  const data = fav.routeData;
  const addrs = data.addresses || [];

  // 清除现有途经点
  routePanelWaypoints.forEach(r => r.remove());
  routePanelWaypoints = [];

  if (addrs.length < 2) {
    showToast('路线数据不完整，至少需要起点和终点');
    return;
  }

  // 预填起点（找到 origin 行）
  const originInput = document.querySelector('#routeAddressList .route-addr-row[data-type="origin"] .route-addr-input');
  const originAddr = addrs.find(a => a.type === 'origin');
  if (originInput && originAddr) originInput.value = originAddr.address;

  // 预填终点
  const destInput = document.querySelector('#routeAddressList .route-addr-row[data-type="destination"] .route-addr-input');
  const destAddr = addrs.find(a => a.type === 'destination');
  if (destInput && destAddr) destInput.value = destAddr.address;

  // 预填途经点
  const waypoints = addrs.filter(a => a.type === 'waypoint');
  waypoints.forEach(wp => {
    addRouteWaypoint();
    const rows = document.querySelectorAll('#routeAddressList .route-addr-row[data-type="waypoint"]');
    const lastRow = rows[rows.length - 1];
    if (lastRow) lastRow.querySelector('.route-addr-input').value = wp.address;
  });

  // 恢复策略和优化选项
  if (data.strategy) {
    const radio = document.querySelector(`input[name="routeStrategy"][value="${data.strategy}"]`);
    if (radio) radio.checked = true;
  }
  const optimizeCheckbox = document.getElementById('optimizeOrder');
  if (optimizeCheckbox) optimizeCheckbox.checked = !!data.optimizeOrder;

  // 显示路线摘要（使用保存的数据，不重新规划）
  document.getElementById('routePlanDist').textContent = formatDistance(data.summary.totalDistance);
  document.getElementById('routePlanTime').textContent = formatDuration(data.summary.totalTime);
  document.getElementById('routePlanToll').textContent = data.summary.totalTollFee > 0 ? `¥${data.summary.totalTollFee}` : '免费';
  document.getElementById('routeSummary').style.display = '';

  // 存储为 lastRoutePlanData，支持再次保存（修改后覆盖）
  lastRoutePlanData = {
    addresses: addrs,
    strategy: data.strategy,
    optimizeOrder: data.optimizeOrder,
    summary: data.summary,
    origin: data.origin,
    destination: data.destination,
    waypoints: data.waypoints,
    polyline: data.polyline
  };

  // 如果有保存的 polyline，直接绘制路线
  if (data.polyline && data.origin && data.destination) {
    hideOriginalMarkers();
    drawRouteOnMap({
      origin: data.origin,
      destination: data.destination,
      waypoints: data.waypoints || [],
      summary: data.summary,
      routes: [{ polyline: data.polyline }]
    });
  }

  showToast(`已加载路线「${fav.name}」，可修改后重新规划或保存`);
  // 滚动到导航区域
  smoothScrollToSection('#navigate');
}

/** 隐藏地图上所有原有标记（路线规划时调用） */
function hideOriginalMarkers() {
  // 标记已隐藏状态，避免重复操作
  if (window._markersHidden) return;
  window._markersHidden = true;

  // 隐藏省份景点标记
  leafletMarkers.forEach(m => {
    if (leafletMap.hasLayer(m)) leafletMap.removeLayer(m);
  });

  // 隐藏省份边界
  if (provinceLayer && leafletMap.hasLayer(provinceLayer)) {
    leafletMap.removeLayer(provinceLayer);
  }

  // 隐藏导入标记
  if (window._importMarkers && window._importMarkers.length) {
    window._importMarkers.forEach(m => {
      if (leafletMap.hasLayer(m)) leafletMap.removeLayer(m);
    });
  }
}

/** 恢复地图上所有原有标记（清除路线规划时调用） */
function restoreOriginalMarkers() {
  if (!window._markersHidden) return;
  window._markersHidden = false;

  // 恢复省份景点标记
  leafletMarkers.forEach(m => {
    if (!leafletMap.hasLayer(m)) m.addTo(leafletMap);
  });

  // 恢复省份边界
  if (provinceLayer && !leafletMap.hasLayer(provinceLayer)) {
    provinceLayer.addTo(leafletMap);
  }

  // 恢复导入标记
  if (window._importMarkers && window._importMarkers.length) {
    window._importMarkers.forEach(m => {
      if (!leafletMap.hasLayer(m)) m.addTo(leafletMap);
    });
  }
}

/** 从收藏导入到路线规划（预填表单） */
function toggleAllImportSpots(checkbox) {
  document.querySelectorAll('.import-spot-checkbox').forEach(cb => cb.checked = checkbox.checked);
  updateImportSelectedCount();
}

function updateImportSelectedCount() {
  const count = document.querySelectorAll('.import-spot-checkbox:checked').length;
  const total = document.querySelectorAll('.import-spot-checkbox').length;
  const el = document.getElementById('importSelectedCount');
  if (el) el.textContent = `已选 ${count} / ${total} 个`;
  const allEl = document.getElementById('importSelectAll');
  if (allEl) allEl.checked = count === total && total > 0;
}

function importToRoutePlan() {
  // 切换到路线规划面板
  switchNavPanelMode('route');

  // 获取选中的地点
  const checked = document.querySelectorAll('.import-spot-checkbox:checked');
  if (checked.length === 0) {
    showToast('请至少选择一个地点');
    return;
  }

  // 提取地址（去重：同一地址只保留一份）
  const seenAddrs = new Set();
  const addrs = [];
  checked.forEach(cb => {
    const name = cb.dataset.name;
    const addr = cb.dataset.addr;
    const key = addr.replace(/\s+/g, '');
    if (name && addr && !seenAddrs.has(key)) {
      seenAddrs.add(key);
      addrs.push({ name, addr });
    }
  });

  if (addrs.length < 2) {
    showToast('选中的地址不足2个，无法进行路线规划');
    return;
  }

  // 清除现有途经点
  routePanelWaypoints.forEach(r => r.remove());
  routePanelWaypoints = [];

  // 预填起点
  document.querySelector('#routeAddressList .route-addr-row[data-type="origin"] .route-addr-input').value = addrs[0].addr;

  // 预填终点
  document.querySelector('#routeAddressList .route-addr-row[data-type="destination"] .route-addr-input').value = addrs[addrs.length - 1].addr;

  // 预填中间为途经点
  for (let i = 1; i < addrs.length - 1; i++) {
    addRouteWaypoint();
    const rows = document.querySelectorAll('#routeAddressList .route-addr-row[data-type="waypoint"]');
    const lastRow = rows[rows.length - 1];
    if (lastRow) lastRow.querySelector('.route-addr-input').value = addrs[i].addr;
  }

  showToast(`已导入 ${addrs.length} 个地址到路线规划`);
}

/** 在新版 importPlanToNavigate 中增加「转入路线规划」按钮的入口 */
// 在已有的 doImportPlanDay 末尾，添加一个提示按钮到 spotList

// ============ 页面自动初始化 ============
document.addEventListener('DOMContentLoaded', () => {
  // 仅在本页运作（检测 leafletMap 容器）
  if (!document.getElementById('leafletMap')) return;

  // 初始化 Leaflet 地图
  setTimeout(() => {
    if (typeof initLeafletMap === 'function') initLeafletMap();
  }, 300);

  // 加载热门目的地标记到地图
  setTimeout(() => {
    if (typeof loadHotDestMarkers === 'function') loadHotDestMarkers();
  }, 800);

});


