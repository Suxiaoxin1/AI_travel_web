/**
 * 中国旅游景点详细数据
 * 从"中国旅游景点及视频总表.txt"解析生成（58个景点）
 * 数据结构与 destDetailData 保持一致
 *
 * 扩展字段：
 *   - type: '[热门]' | '[小众]' 景点分类
 *   - isHot: boolean 是否热门
 *   - videos: string[] 介绍视频链接
 *
 * 生成时间：2026-06-03
 */

const chinaDestinationsData = {
  gugong: {
    name: "故宫博物院", sub: "北京 · 热门景点", rating: '4.7', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/e/ef/The_Forbidden_City_-_View_from_Coal_Hill.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://www.bilibili.com/video/BV1Rh411R7xy （紫禁城600年 一见如故）",
      "https://www.bilibili.com/video/BV1hs41197A2 （我在故宫修文物）",
    ],
    history: {
      intro: "明清两朝皇家宫殿，现存最完整的木质古建群，世界文化遗产",
      timeline: [
        { year: "今", text: "故宫博物院已成为广受游客青睐的旅行目的地，明清两朝皇家宫殿，现存最完整的木质古建群，世界文化遗产..." },
        { year: "近代", text: "随着交通发展和旅游开发，故宫博物院逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "北京当地特色美食值得品尝，故宫博物院周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "故宫博物院所在的北京地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "明清两朝皇家宫殿，现存最完整的木质古建群，世界文化遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  changcheng: {
    name: "万里长城", sub: "北京 · 热门景点", rating: '4.9', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/2/23/The_Great_Wall_of_China_at_Jinshanling-edit.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://www.bilibili.com/video/BV1br5K6zERQ （4K航拍 万里长城今犹在）",
      "https://www.bilibili.com/video/BV114411R7Nj （长城：中国的故事 纪录片12集）",
    ],
    history: {
      intro: "中华民族精神象征，跨越千年的建筑奇迹，世界文化遗产",
      timeline: [
        { year: "今", text: "万里长城已成为广受游客青睐的旅行目的地，中华民族精神象征，跨越千年的建筑奇迹，世界文化遗产..." },
        { year: "近代", text: "随着交通发展和旅游开发，万里长城逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "北京当地特色美食值得品尝，万里长城周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "万里长城所在的北京地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "中华民族精神象征，跨越千年的建筑奇迹，世界文化遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  xihu: {
    name: "杭州西湖", sub: "浙江 · 热门景点", rating: '4.6', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/1/17/West_Lake%2C_Hangzhou_2025.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://www.bilibili.com/bangumi/play/ss33585 （中国通史 纪录片100集 含西湖相关）",
    ],
    history: {
      intro: "一湖碧水半城诗，春赏桃柳/夏观荷/秋闻桂/冬寻梅，世界文化遗产",
      timeline: [
        { year: "今", text: "杭州西湖已成为广受游客青睐的旅行目的地，一湖碧水半城诗，春赏桃柳/夏观荷/秋闻桂/冬寻梅，世界文化遗..." },
        { year: "近代", text: "随着交通发展和旅游开发，杭州西湖逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "浙江当地特色美食值得品尝，杭州西湖周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "杭州西湖所在的浙江地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "一湖碧水半城诗，春赏桃柳/夏观荷/秋闻桂/冬寻梅，世界文化遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  wuzhen: {
    name: "乌镇", sub: "浙江 · 热门景点", rating: '4.9', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/3/3a/1_wuzhen_aerial_2023.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=乌镇水乡风景",
    ],
    history: {
      intro: "中国最后的枕水人家，千年水乡古镇，世界互联网大会永久会址",
      timeline: [
        { year: "今", text: "乌镇已成为广受游客青睐的旅行目的地，中国最后的枕水人家，千年水乡古镇，世界互联网大会永久会址..." },
        { year: "近代", text: "随着交通发展和旅游开发，乌镇逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "浙江当地特色美食值得品尝，乌镇周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "乌镇所在的浙江地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "中国最后的枕水人家，千年水乡古镇，世界互联网大会永久会址...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  songyang: {
    name: "松阳古村群", sub: "丽水 · 小众秘境", rating: '4.1', price: '¥450',
    img: "https://upload.wikimedia.org/wikipedia/commons/c/c8/%E7%8B%AC%E5%B1%B1%E9%B8%9F%E7%9E%B0%E6%9D%BE%E9%98%B3%E5%8E%BF%E5%9F%8E_-_panoramio.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://www.bilibili.com/video/BV1iw5v6fEg6 （被《国家地理》评为江南最后的秘境有多美）",
      "https://www.bilibili.com/video/BV1PkzLB7EcW （最后的江南秘境 居然在浙江的深山里）",
    ],
    history: {
      intro: "被《国家地理》评为\"最后的江南秘境\"，杨家堂村金色夯土房如\"深山布达拉宫\"，陈家铺悬崖村落云海漫山，商业化极低",
      timeline: [
        { year: "今", text: "松阳古村群已成为备受探险者推崇的旅行目的地，被《国家地理》评为\"最后的江南秘境\"，杨家堂村金色夯土房如\"..." },
        { year: "近代", text: "随着交通发展和旅游开发，松阳古村群逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "浙江当地特色美食值得品尝，松阳古村群周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "松阳古村群所在的浙江地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "被《国家地理》评为\"最后的江南秘境\"，杨家堂村金色夯土房如\"深山布达拉宫\"，陈家铺悬崖村落云海漫山，...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  jiuzhaigou: {
    name: "九寨沟", sub: "阿坝 · 热门景点", rating: '4.9', price: '¥900',
    img: "https://upload.wikimedia.org/wikipedia/commons/2/28/1_jiuzhaigou_valley_wu_hua_hai_2011b.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://www.bilibili.com/video/BV1ku2nYnEEU （通了高铁的九寨沟 柴西西游记）",
      "https://www.bilibili.com/video/BV1VKRPBTE3t （九寨沟旅行攻略 保姆级路线）",
    ],
    history: {
      intro: "人间瑶池、童话世界，以翠海、叠瀑、彩林、雪峰、藏情五绝封神，世界自然遗产",
      timeline: [
        { year: "今", text: "九寨沟已成为广受游客青睐的旅行目的地，人间瑶池、童话世界，以翠海、叠瀑、彩林、雪峰、藏情五绝封神，..." },
        { year: "近代", text: "随着交通发展和旅游开发，九寨沟逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "四川当地特色美食值得品尝，九寨沟周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "九寨沟所在的四川地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "人间瑶池、童话世界，以翠海、叠瀑、彩林、雪峰、藏情五绝封神，世界自然遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  daocheng: {
    name: "稻城亚丁", sub: "甘孜 · 热门景点", rating: '4.6', price: '¥900',
    img: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Yading_National_Park_Milk_Lake.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=稻城亚丁风景介绍",
    ],
    history: {
      intro: "蓝色星球上最后一片净土，三座神山守护的人间仙境",
      timeline: [
        { year: "今", text: "稻城亚丁已成为广受游客青睐的旅行目的地，蓝色星球上最后一片净土，三座神山守护的人间仙境..." },
        { year: "近代", text: "随着交通发展和旅游开发，稻城亚丁逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "四川当地特色美食值得品尝，稻城亚丁周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "稻城亚丁所在的四川地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "蓝色星球上最后一片净土，三座神山守护的人间仙境...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  genie: {
    name: "格聂神山", sub: "甘孜 · 小众秘境", rating: '4.2', price: '¥700',
    img: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Mount_Genyen_2014.09.16_10-27-17.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=格聂神山+航拍",
    ],
    history: {
      intro: "川西最后的天堂之眼，\"格聂之眼\"如地球瞳孔凝视苍穹，冷古寺千年古佛，徒步穿越冰川秘境",
      timeline: [
        { year: "今", text: "格聂神山已成为备受探险者推崇的旅行目的地，川西最后的天堂之眼，\"格聂之眼\"如地球瞳孔凝视苍穹，冷古寺千..." },
        { year: "近代", text: "随着交通发展和旅游开发，格聂神山逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "四川当地特色美食值得品尝，格聂神山周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "格聂神山所在的四川地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "川西最后的天堂之眼，\"格聂之眼\"如地球瞳孔凝视苍穹，冷古寺千年古佛，徒步穿越冰川秘境...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  dangling: {
    name: "党岭", sub: "甘孜 · 小众秘境", rating: '4.2', price: '¥700',
    img: "https://upload.wikimedia.org/wikipedia/commons/2/28/Danba%2C_Garze%2C_Sichuan%2C_China_-_panoramio_%2810%29.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=党岭+川西+纪录片",
    ],
    history: {
      intro: "横断山深处的隐秘秘境，比稻城亚丁更清净，雪山、原始森林、温泉、高山海子（葫芦海、卓雍措）一应俱全",
      timeline: [
        { year: "今", text: "党岭已成为备受探险者推崇的旅行目的地，横断山深处的隐秘秘境，比稻城亚丁更清净，雪山、原始森林、温泉..." },
        { year: "近代", text: "随着交通发展和旅游开发，党岭逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "四川当地特色美食值得品尝，党岭周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "党岭所在的四川地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "横断山深处的隐秘秘境，比稻城亚丁更清净，雪山、原始森林、温泉、高山海子（葫芦海、卓雍措）一应俱全...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  cuokahu: {
    name: "措卡湖", sub: "甘孜 · 小众秘境", rating: '4.0', price: '¥700',
    img: "https://upload.wikimedia.org/wikipedia/commons/d/db/%E7%94%98%E7%99%BD%E8%B7%AF%E6%B2%BF%E9%80%94%E9%A3%8E%E5%85%891_-_panoramio.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=措卡湖+川西秘境",
    ],
    history: {
      intro: "川西小众蓝宝石，湖水澄澈如镜，藏式古寺与红杉倒映其间，游客稀少四季皆美，无过度商业化",
      timeline: [
        { year: "今", text: "措卡湖已成为备受探险者推崇的旅行目的地，川西小众蓝宝石，湖水澄澈如镜，藏式古寺与红杉倒映其间，游客稀..." },
        { year: "近代", text: "随着交通发展和旅游开发，措卡湖逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "四川当地特色美食值得品尝，措卡湖周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "措卡湖所在的四川地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "川西小众蓝宝石，湖水澄澈如镜，藏式古寺与红杉倒映其间，游客稀少四季皆美，无过度商业化...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  lijiang: {
    name: "丽江古城", sub: "云南 · 热门景点", rating: '4.8', price: '¥1500',
    img: "https://upload.wikimedia.org/wikipedia/commons/e/e2/1_lijiang_old_town_2012a.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=丽江古城风景介绍",
    ],
    history: {
      intro: "纳西族文化瑰宝，高原水乡，世界文化遗产",
      timeline: [
        { year: "今", text: "丽江古城已成为广受游客青睐的旅行目的地，纳西族文化瑰宝，高原水乡，世界文化遗产..." },
        { year: "近代", text: "随着交通发展和旅游开发，丽江古城逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "云南当地特色美食值得品尝，丽江古城周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "丽江古城所在的云南地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "纳西族文化瑰宝，高原水乡，世界文化遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  dali: {
    name: "大理苍山洱海", sub: "云南 · 热门景点", rating: '4.8', price: '¥1500',
    img: "https://upload.wikimedia.org/wikipedia/commons/6/68/%E6%B4%B1%E6%B5%B7%E4%B8%8B%E5%92%8C%E6%B9%BE%E6%B9%BF%E5%9C%B0%E5%85%AC%E5%9B%AD_2025-07-24_01.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=大理苍山洱海风景",
    ],
    history: {
      intro: "风花雪月之地，白族文化圣地，苍山雪洱海月",
      timeline: [
        { year: "今", text: "大理苍山洱海已成为广受游客青睐的旅行目的地，风花雪月之地，白族文化圣地，苍山雪洱海月..." },
        { year: "近代", text: "随着交通发展和旅游开发，大理苍山洱海逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "云南当地特色美食值得品尝，大理苍山洱海周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "大理苍山洱海所在的云南地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "风花雪月之地，白族文化圣地，苍山雪洱海月...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  nanjiluo: {
    name: "南极洛", sub: "迪庆 · 小众秘境", rating: '4.4', price: '¥1200',
    img: "https://upload.wikimedia.org/wikipedia/commons/d/d4/%E7%BB%B4%E8%A5%BF%E5%8E%BF%E5%85%B4%E7%BB%B4%E5%A4%A7%E9%81%93_-_2025-05-12.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=南极洛+航拍",
    ],
    history: {
      intro: "上帝遗落的彩池，12个高山湖泊随光影变幻色彩，雪山环绕，零商业化高山秘境，需徒步或越野车进入",
      timeline: [
        { year: "今", text: "南极洛已成为备受探险者推崇的旅行目的地，上帝遗落的彩池，12个高山湖泊随光影变幻色彩，雪山环绕，零商..." },
        { year: "近代", text: "随着交通发展和旅游开发，南极洛逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "云南当地特色美食值得品尝，南极洛周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "南极洛所在的云南地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "上帝遗落的彩池，12个高山湖泊随光影变幻色彩，雪山环绕，零商业化高山秘境，需徒步或越野车进入...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  jingmai: {
    name: "景迈山", sub: "普洱 · 小众秘境", rating: '4.1', price: '¥1200',
    img: "https://upload.wikimedia.org/wikipedia/commons/2/28/%E6%99%AE%E6%B4%B1%E5%B8%82_3.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=景迈山+茶文化+纪录片",
    ],
    history: {
      intro: "世界首个茶文化主题世界文化遗产，千年古茶林与布朗族古寨，冬季云海日出与万亩茶山共舞",
      timeline: [
        { year: "今", text: "景迈山已成为备受探险者推崇的旅行目的地，世界首个茶文化主题世界文化遗产，千年古茶林与布朗族古寨，冬季..." },
        { year: "近代", text: "随着交通发展和旅游开发，景迈山逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "云南当地特色美食值得品尝，景迈山周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "景迈山所在的云南地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "世界首个茶文化主题世界文化遗产，千年古茶林与布朗族古寨，冬季云海日出与万亩茶山共舞...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  bingzhongluo: {
    name: "丙中洛", sub: "怒江 · 小众秘境", rating: '4.4', price: '¥1200',
    img: "https://upload.wikimedia.org/wikipedia/commons/b/b9/%E8%B4%A1%E5%B1%B1%E5%8E%BF%E5%9F%8E%E5%A4%A9%E9%99%85%E7%BA%BF_-_%E8%88%AA%E6%8B%8D_-_2024-06-02_19.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=丙中洛+人神共居",
    ],
    history: {
      intro: "人神共居之地，怒江大峡谷深处的世外桃源，雾里村、秋那桶藏于云雾间，民风淳朴几乎无旅行团",
      timeline: [
        { year: "今", text: "丙中洛已成为备受探险者推崇的旅行目的地，人神共居之地，怒江大峡谷深处的世外桃源，雾里村、秋那桶藏于云..." },
        { year: "近代", text: "随着交通发展和旅游开发，丙中洛逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "云南当地特色美食值得品尝，丙中洛周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "丙中洛所在的云南地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "人神共居之地，怒江大峡谷深处的世外桃源，雾里村、秋那桶藏于云雾间，民风淳朴几乎无旅行团...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  nianhu: {
    name: "念湖", sub: "曲靖 · 小众秘境", rating: '4.2', price: '¥1200',
    img: "https://upload.wikimedia.org/wikipedia/commons/f/f8/%E4%BC%9A%E6%B3%BD%E5%8E%BF%E4%BD%8D%E7%BD%AE%E5%9B%BE.svg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=念湖+黑颈鹤+风景",
    ],
    history: {
      intro: "氤氲如画的美丽仙境，不绝群山清澈湖水，优雅黑颈鹤栖息地，云雾弥漫时如书画里的山水写意醉人",
      timeline: [
        { year: "今", text: "念湖已成为备受探险者推崇的旅行目的地，氤氲如画的美丽仙境，不绝群山清澈湖水，优雅黑颈鹤栖息地，云雾..." },
        { year: "近代", text: "随着交通发展和旅游开发，念湖逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "云南当地特色美食值得品尝，念湖周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "念湖所在的云南地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "氤氲如画的美丽仙境，不绝群山清澈湖水，优雅黑颈鹤栖息地，云雾弥漫时如书画里的山水写意醉人...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  chaka: {
    name: "茶卡盐湖", sub: "青海 · 热门景点", rating: '4.9', price: '¥1500',
    img: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Chaqia_Salt_Lake.JPG",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=茶卡盐湖风景介绍",
    ],
    history: {
      intro: "天空之镜，中国最美盐湖，倒映天地的梦幻仙境",
      timeline: [
        { year: "今", text: "茶卡盐湖已成为广受游客青睐的旅行目的地，天空之镜，中国最美盐湖，倒映天地的梦幻仙境..." },
        { year: "近代", text: "随着交通发展和旅游开发，茶卡盐湖逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "青海当地特色美食值得品尝，茶卡盐湖周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "茶卡盐湖所在的青海地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "天空之镜，中国最美盐湖，倒映天地的梦幻仙境...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  qinghaihu: {
    name: "青海湖", sub: "青海 · 热门景点", rating: '4.8', price: '¥1500',
    img: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Qinghai_lake.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=青海湖风景介绍",
    ],
    history: {
      intro: "中国最大内陆咸水湖，高原蓝宝石，油菜花海与碧波相映",
      timeline: [
        { year: "今", text: "青海湖已成为广受游客青睐的旅行目的地，中国最大内陆咸水湖，高原蓝宝石，油菜花海与碧波相映..." },
        { year: "近代", text: "随着交通发展和旅游开发，青海湖逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "青海当地特色美食值得品尝，青海湖周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "青海湖所在的青海地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "中国最大内陆咸水湖，高原蓝宝石，油菜花海与碧波相映...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  aikenquan: {
    name: "艾肯泉/恶魔之眼", sub: "海西 · 小众秘境", rating: '4.2', price: '¥1200',
    img: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Aiken_Spring_202107-1.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=艾肯泉+航拍+恶魔之眼",
    ],
    history: {
      intro: "昆仑之眼，汩汩喷涌千年的地热喷泉，航拍如大地瞳孔，硫磺沉淀形成凤凰展翅图案",
      timeline: [
        { year: "今", text: "艾肯泉/恶魔之眼已成为备受探险者推崇的旅行目的地，昆仑之眼，汩汩喷涌千年的地热喷泉，航拍如大地瞳孔，硫磺沉淀形..." },
        { year: "近代", text: "随着交通发展和旅游开发，艾肯泉/恶魔之眼逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "青海当地特色美食值得品尝，艾肯泉/恶魔之眼周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "艾肯泉/恶魔之眼所在的青海地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "昆仑之眼，汩汩喷涌千年的地热喷泉，航拍如大地瞳孔，硫磺沉淀形成凤凰展翅图案...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  mangya: {
    name: "茫崖翡翠湖", sub: "海西 · 小众秘境", rating: '4.4', price: '¥1200',
    img: "https://upload.wikimedia.org/wikipedia/commons/7/71/%E8%8C%AB%E5%B4%96_%E5%86%B7%E6%B9%96%E9%95%87%E5%85%A5%E5%8F%A3.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=茫崖翡翠湖+航拍",
    ],
    history: {
      intro: "柴达木盆地深处的绿色盐湖，盐巴笼入湖水如星星点点的圆珠落入玉盘，比茶卡人少景更绝",
      timeline: [
        { year: "今", text: "茫崖翡翠湖已成为备受探险者推崇的旅行目的地，柴达木盆地深处的绿色盐湖，盐巴笼入湖水如星星点点的圆珠落入玉..." },
        { year: "近代", text: "随着交通发展和旅游开发，茫崖翡翠湖逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "青海当地特色美食值得品尝，茫崖翡翠湖周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "茫崖翡翠湖所在的青海地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "柴达木盆地深处的绿色盐湖，盐巴笼入湖水如星星点点的圆珠落入玉盘，比茶卡人少景更绝...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  dongtai: {
    name: "东台吉乃尔湖", sub: "海西 · 小众秘境", rating: '4.5', price: '¥1200',
    img: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Alluvial_fan_in_Tsinghai.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=东台吉乃尔湖+风景",
    ],
    history: {
      intro: "柴达木盆地的\"马尔代夫\"，湖蓝色湖水+白色盐梗+金色沙滩，西北荒漠中的人间仙境",
      timeline: [
        { year: "今", text: "东台吉乃尔湖已成为备受探险者推崇的旅行目的地，柴达木盆地的\"马尔代夫\"，湖蓝色湖水+白色盐梗+金色沙滩，西..." },
        { year: "近代", text: "随着交通发展和旅游开发，东台吉乃尔湖逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "青海当地特色美食值得品尝，东台吉乃尔湖周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "东台吉乃尔湖所在的青海地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "柴达木盆地的\"马尔代夫\"，湖蓝色湖水+白色盐梗+金色沙滩，西北荒漠中的人间仙境...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  heidushan: {
    name: "黑独山", sub: "海西 · 小众秘境", rating: '4.1', price: '¥1200',
    img: "https://upload.wikimedia.org/wikipedia/commons/4/47/Location_of_Haixi_Prefecture_within_Qinghai_%28China%29.png",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=黑独山+火星+冷湖",
    ],
    history: {
      intro: "火星登陆实景地，水墨画般的黑色山丘群延绵20公里，日落金色光线切割黑色山体，俄博梁雅丹赛博朋克感",
      timeline: [
        { year: "今", text: "黑独山已成为备受探险者推崇的旅行目的地，火星登陆实景地，水墨画般的黑色山丘群延绵20公里，日落金色光..." },
        { year: "近代", text: "随着交通发展和旅游开发，黑独山逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "青海当地特色美食值得品尝，黑独山周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "黑独山所在的青海地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "火星登陆实景地，水墨画般的黑色山丘群延绵20公里，日落金色光线切割黑色山体，俄博梁雅丹赛博朋克感...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  nianbaoyuze: {
    name: "年保玉则", sub: "果洛 · 小众秘境", rating: '4.3', price: '¥1200',
    img: "https://upload.wikimedia.org/wikipedia/commons/b/b3/2007%E5%B9%B4%E4%B9%85%E6%B2%BB%E5%8E%BF%E5%9F%8E2.JPG",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=年保玉则+航拍+纪录片",
    ],
    history: {
      intro: "天神的后花园，雪山簇拥360个高山海子，夏季野花铺满草原溪流蜿蜒，生态保护严格游客稀少，2026年逐步恢复开放",
      timeline: [
        { year: "今", text: "年保玉则已成为备受探险者推崇的旅行目的地，天神的后花园，雪山簇拥360个高山海子，夏季野花铺满草原溪流..." },
        { year: "近代", text: "随着交通发展和旅游开发，年保玉则逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "青海当地特色美食值得品尝，年保玉则周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "年保玉则所在的青海地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "天神的后花园，雪山簇拥360个高山海子，夏季野花铺满草原溪流蜿蜒，生态保护严格游客稀少，2026年逐...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  qiongkushitai: {
    name: "琼库什台", sub: "伊犁 · 小众秘境", rating: '4.4', price: '¥1200',
    img: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Kalajun_Grassland.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=琼库什台+纪录片",
    ],
    history: {
      intro: "伊犁最原生态的立体草原童话，哈萨克族木屋村落，比那拉提更纯粹的游牧秘境，中国历史文化名村",
      timeline: [
        { year: "今", text: "琼库什台已成为备受探险者推崇的旅行目的地，伊犁最原生态的立体草原童话，哈萨克族木屋村落，比那拉提更纯粹..." },
        { year: "近代", text: "随着交通发展和旅游开发，琼库什台逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "新疆当地特色美食值得品尝，琼库什台周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "琼库什台所在的新疆地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "伊犁最原生态的立体草原童话，哈萨克族木屋村落，比那拉提更纯粹的游牧秘境，中国历史文化名村...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  xiaerxili: {
    name: "夏尔西里", sub: "博乐 · 小众秘境", rating: '4.2', price: '¥1200',
    img: "https://upload.wikimedia.org/wikipedia/commons/c/c0/Flowers_arround_Lake_Sailimu%2C_aka_Sayram_-_Flickr_-_George_Lu.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=夏尔西里+秘境",
    ],
    history: {
      intro: "中哈边境绿色迷宫，曾为军事禁区近年才有限开放，中国最后原始森林之一，6-7月漫山野花，每日限流需边防证",
      timeline: [
        { year: "今", text: "夏尔西里已成为备受探险者推崇的旅行目的地，中哈边境绿色迷宫，曾为军事禁区近年才有限开放，中国最后原始森..." },
        { year: "近代", text: "随着交通发展和旅游开发，夏尔西里逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "新疆当地特色美食值得品尝，夏尔西里周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "夏尔西里所在的新疆地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "中哈边境绿色迷宫，曾为军事禁区近年才有限开放，中国最后原始森林之一，6-7月漫山野花，每日限流需边防...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  jiangbulake: {
    name: "江布拉克", sub: "昌吉 · 小众秘境", rating: '4.2', price: '¥1200',
    img: "https://upload.wikimedia.org/wikipedia/commons/6/6e/%E4%B8%AD%E5%9B%BD%E6%96%B0%E7%96%86%E6%98%8C%E5%90%89%E5%9B%9E%E6%97%8F%E8%87%AA%E6%B2%BB%E5%B7%9E%E5%A5%87%E5%8F%B0%E5%8E%BF_China_Xinjiang_Qitai%2C_China_Xinjiang_Uru_-_panoramio_%281%29.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=江布拉克+麦浪+航拍",
    ],
    history: {
      intro: "天山脚下麦浪狂想曲，7月万亩七彩麦浪奇观，9月金色麦茬与雪山同框，冬季天然粉雪滑雪场",
      timeline: [
        { year: "今", text: "江布拉克已成为备受探险者推崇的旅行目的地，天山脚下麦浪狂想曲，7月万亩七彩麦浪奇观，9月金色麦茬与雪山..." },
        { year: "近代", text: "随着交通发展和旅游开发，江布拉克逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "新疆当地特色美食值得品尝，江布拉克周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "江布拉克所在的新疆地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "天山脚下麦浪狂想曲，7月万亩七彩麦浪奇观，9月金色麦茬与雪山同框，冬季天然粉雪滑雪场...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  dahaidao: {
    name: "大海道", sub: "哈密 · 小众秘境", rating: '4.4', price: '¥1200',
    img: "https://upload.wikimedia.org/wikipedia/commons/3/35/Downtown_Hami_City_night.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=大海道+雅丹+穿越",
    ],
    history: {
      intro: "丝绸之路上最富传奇色彩的一段，千万年风化形成的罕见雅丹地貌，沟壑纵横难觅人烟，极致荒野体验",
      timeline: [
        { year: "今", text: "大海道已成为备受探险者推崇的旅行目的地，丝绸之路上最富传奇色彩的一段，千万年风化形成的罕见雅丹地貌，..." },
        { year: "近代", text: "随着交通发展和旅游开发，大海道逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "新疆当地特色美食值得品尝，大海道周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "大海道所在的新疆地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "丝绸之路上最富传奇色彩的一段，千万年风化形成的罕见雅丹地貌，沟壑纵横难觅人烟，极致荒野体验...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  dunhuang: {
    name: "敦煌莫高窟", sub: "甘肃 · 热门景点", rating: '4.8', price: '¥900',
    img: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Dunhuang_Mogao_Ku_2013.12.31_12-30-18.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://www.bilibili.com/video/BV1qx411T76g （新丝绸之路 纪录片 含敦煌内容）",
      "https://www.bilibili.com/video/av5031538 （敦煌 纪录片）",
    ],
    history: {
      intro: "丝路明珠，千年佛教艺术宝库，世界文化遗产",
      timeline: [
        { year: "今", text: "敦煌莫高窟已成为广受游客青睐的旅行目的地，丝路明珠，千年佛教艺术宝库，世界文化遗产..." },
        { year: "近代", text: "随着交通发展和旅游开发，敦煌莫高窟逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "甘肃当地特色美食值得品尝，敦煌莫高窟周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "敦煌莫高窟所在的甘肃地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "丝路明珠，千年佛教艺术宝库，世界文化遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  zhagana: {
    name: "扎尕那", sub: "甘南 · 小众秘境", rating: '4.1', price: '¥700',
    img: "https://upload.wikimedia.org/wikipedia/commons/a/a3/%E7%9B%8A%E5%93%87%E7%A7%8B%E8%89%B2_-_panoramio.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=扎尕那+4K航拍",
    ],
    history: {
      intro: "藏语意为\"石匣子\"，四座石山环抱藏族村落的天然石城，被洛克誉为\"亚当夏娃诞生地\"，中国十大非著名山峰",
      timeline: [
        { year: "今", text: "扎尕那已成为备受探险者推崇的旅行目的地，藏语意为\"石匣子\"，四座石山环抱藏族村落的天然石城，被洛克誉..." },
        { year: "近代", text: "随着交通发展和旅游开发，扎尕那逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "甘肃当地特色美食值得品尝，扎尕那周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "扎尕那所在的甘肃地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "藏语意为\"石匣子\"，四座石山环抱藏族村落的天然石城，被洛克誉为\"亚当夏娃诞生地\"，中国十大非著名山峰...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  fanjingshan: {
    name: "梵净山", sub: "铜仁 · 热门景点", rating: '4.7', price: '¥900',
    img: "https://upload.wikimedia.org/wikipedia/commons/a/a5/%E6%A2%B5%E6%B7%A8%E5%B1%B1%E7%B4%85%E9%9B%B2%E9%87%91%E9%A0%82%EF%BC%88%E6%96%B0%E9%87%91%E9%A0%82%EF%BC%89.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=梵净山风景介绍",
    ],
    history: {
      intro: "天下众名岳之宗，东方第一仙山，世界自然遗产",
      timeline: [
        { year: "今", text: "梵净山已成为广受游客青睐的旅行目的地，天下众名岳之宗，东方第一仙山，世界自然遗产..." },
        { year: "近代", text: "随着交通发展和旅游开发，梵净山逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "贵州当地特色美食值得品尝，梵净山周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "梵净山所在的贵州地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "天下众名岳之宗，东方第一仙山，世界自然遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  huangguoshu: {
    name: "黄果树瀑布", sub: "安顺 · 热门景点", rating: '4.7', price: '¥900',
    img: "https://upload.wikimedia.org/wikipedia/commons/3/30/HuangguoshuFall.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=黄果树瀑布风景",
    ],
    history: {
      intro: "亚洲最大瀑布之一，飞流直下三千尺的壮美奇观",
      timeline: [
        { year: "今", text: "黄果树瀑布已成为广受游客青睐的旅行目的地，亚洲最大瀑布之一，飞流直下三千尺的壮美奇观..." },
        { year: "近代", text: "随着交通发展和旅游开发，黄果树瀑布逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "贵州当地特色美食值得品尝，黄果树瀑布周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "黄果树瀑布所在的贵州地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "亚洲最大瀑布之一，飞流直下三千尺的壮美奇观...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  jiucaiping: {
    name: "赫章韭菜坪", sub: "毕节 · 小众秘境", rating: '4.0', price: '¥700',
    img: "https://upload.wikimedia.org/wikipedia/commons/4/4d/Jiucaiping.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=韭菜坪+花海+航拍",
    ],
    history: {
      intro: "亚洲最大野生韭菜花海，7-8月万亩紫色花海媲美普罗旺斯，风车、云海、花海同框，海拔2000+米夏季凉爽",
      timeline: [
        { year: "今", text: "赫章韭菜坪已成为备受探险者推崇的旅行目的地，亚洲最大野生韭菜花海，7-8月万亩紫色花海媲美普罗旺斯，风车..." },
        { year: "近代", text: "随着交通发展和旅游开发，赫章韭菜坪逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "贵州当地特色美食值得品尝，赫章韭菜坪周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "赫章韭菜坪所在的贵州地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "亚洲最大野生韭菜花海，7-8月万亩紫色花海媲美普罗旺斯，风车、云海、花海同框，海拔2000+米夏季凉...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  luodian: {
    name: "罗甸大小井", sub: "黔南 · 小众秘境", rating: '4.1', price: '¥700',
    img: "https://upload.wikimedia.org/wikipedia/commons/4/4b/ChinaQiannanLuodian.png",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=罗甸大小井+蓝眼泪",
    ],
    history: {
      intro: "贵州私藏的蓝眼泪秘境，翡翠色暗河水系与30余个天坑相连，乘竹筏探秘地下暗河，门票仅50元",
      timeline: [
        { year: "今", text: "罗甸大小井已成为备受探险者推崇的旅行目的地，贵州私藏的蓝眼泪秘境，翡翠色暗河水系与30余个天坑相连，乘竹..." },
        { year: "近代", text: "随着交通发展和旅游开发，罗甸大小井逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "贵州当地特色美食值得品尝，罗甸大小井周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "罗甸大小井所在的贵州地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "贵州私藏的蓝眼泪秘境，翡翠色暗河水系与30余个天坑相连，乘竹筏探秘地下暗河，门票仅50元...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  guilin: {
    name: "桂林漓江", sub: "广西 · 热门景点", rating: '4.8', price: '¥900',
    img: "https://upload.wikimedia.org/wikipedia/commons/2/21/%E6%BC%93%E6%B1%9F%E5%B1%B1%E6%B0%B4.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=桂林漓江风景介绍",
    ],
    history: {
      intro: "山水甲天下，百里水墨画廊，20元人民币取景地",
      timeline: [
        { year: "今", text: "桂林漓江已成为广受游客青睐的旅行目的地，山水甲天下，百里水墨画廊，20元人民币取景地..." },
        { year: "近代", text: "随着交通发展和旅游开发，桂林漓江逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "广西当地特色美食值得品尝，桂林漓江周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "桂林漓江所在的广西地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "山水甲天下，百里水墨画廊，20元人民币取景地...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  sanmenhai: {
    name: "凤山三门海", sub: "河池 · 小众秘境", rating: '4.3', price: '¥700',
    img: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Peak_cluster_depression.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=凤山三门海+风景",
    ],
    history: {
      intro: "世界唯一可乘船游览的水上天坑，七座天窗呈北斗七星排布，碧绿江水穿行溶洞，现实版地心秘境",
      timeline: [
        { year: "今", text: "凤山三门海已成为备受探险者推崇的旅行目的地，世界唯一可乘船游览的水上天坑，七座天窗呈北斗七星排布，碧绿江..." },
        { year: "近代", text: "随着交通发展和旅游开发，凤山三门海逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "广西当地特色美食值得品尝，凤山三门海周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "凤山三门海所在的广西地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "世界唯一可乘船游览的水上天坑，七座天窗呈北斗七星排布，碧绿江水穿行溶洞，现实版地心秘境...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  mingshi: {
    name: "崇左明仕田园", sub: "崇左 · 小众秘境", rating: '4.4', price: '¥700',
    img: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Office_building_of_the_Chongzuo_government.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=明仕田园+竹筏漂流",
    ],
    history: {
      intro: "中越边境的水墨仙境，游客密度仅为桂林1/15，竹筏漂流黛色山峰间，壮族村落炊烟袅袅",
      timeline: [
        { year: "今", text: "崇左明仕田园已成为备受探险者推崇的旅行目的地，中越边境的水墨仙境，游客密度仅为桂林1/15，竹筏漂流黛色山..." },
        { year: "近代", text: "随着交通发展和旅游开发，崇左明仕田园逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "广西当地特色美食值得品尝，崇左明仕田园周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "崇左明仕田园所在的广西地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "中越边境的水墨仙境，游客密度仅为桂林1/15，竹筏漂流黛色山峰间，壮族村落炊烟袅袅...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  gulangyu: {
    name: "鼓浪屿", sub: "厦门 · 热门景点", rating: '4.8', price: '¥900',
    img: "https://upload.wikimedia.org/wikipedia/commons/0/0f/%E9%BC%93%E6%B5%AA%E5%B1%BF_-_panoramio.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=鼓浪屿风景介绍",
    ],
    history: {
      intro: "海上花园，钢琴之岛，万国建筑博览，世界文化遗产",
      timeline: [
        { year: "今", text: "鼓浪屿已成为广受游客青睐的旅行目的地，海上花园，钢琴之岛，万国建筑博览，世界文化遗产..." },
        { year: "近代", text: "随着交通发展和旅游开发，鼓浪屿逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "福建当地特色美食值得品尝，鼓浪屿周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "鼓浪屿所在的福建地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "海上花园，钢琴之岛，万国建筑博览，世界文化遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  xiapu: {
    name: "霞浦滩涂", sub: "宁德 · 小众秘境", rating: '4.3', price: '¥700',
    img: "https://upload.wikimedia.org/wikipedia/commons/c/c3/%E9%9C%9E%E6%B5%A6%E5%8E%BF%E5%BD%B1%E9%9B%86.png",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=霞浦滩涂+4K+摄影",
    ],
    history: {
      intro: "中国最美滩涂摄影圣地，潮汐光影魔术师，北岐日出、东壁日落、沙江S湾，随手拍都是壁纸",
      timeline: [
        { year: "今", text: "霞浦滩涂已成为备受探险者推崇的旅行目的地，中国最美滩涂摄影圣地，潮汐光影魔术师，北岐日出、东壁日落、沙..." },
        { year: "近代", text: "随着交通发展和旅游开发，霞浦滩涂逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "福建当地特色美食值得品尝，霞浦滩涂周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "霞浦滩涂所在的福建地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "中国最美滩涂摄影圣地，潮汐光影魔术师，北岐日出、东壁日落、沙江S湾，随手拍都是壁纸...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  sisu: {
    name: "四礵列岛", sub: "宁德 · 小众秘境", rating: '4.1', price: '¥700',
    img: "https://upload.wikimedia.org/wikipedia/commons/9/99/%E5%90%8E%E6%B8%AF%E3%81%8B%E3%82%89%E5%9B%9B%E3%82%BD%E3%82%A6%E5%88%97%E5%B3%B6%E3%81%B8%E5%90%91%E3%81%8B%E3%81%86%E5%AE%9A%E6%9C%9F%E8%88%B9.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=四礵列岛+航拍+秘境",
    ],
    history: {
      intro: "现实版塞尔达传说，由红礵、东礵、西礵、南礵等岛屿组成，东礵岛绿色草甸直入海中如世界尽头，红礵岛万只鸥鸟栖息，世外桃源般原生态",
      timeline: [
        { year: "今", text: "四礵列岛已成为备受探险者推崇的旅行目的地，现实版塞尔达传说，由红礵、东礵、西礵、南礵等岛屿组成，东礵岛..." },
        { year: "近代", text: "随着交通发展和旅游开发，四礵列岛逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "福建当地特色美食值得品尝，四礵列岛周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "四礵列岛所在的福建地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "现实版塞尔达传说，由红礵、东礵、西礵、南礵等岛屿组成，东礵岛绿色草甸直入海中如世界尽头，红礵岛万只鸥...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  huangshan: {
    name: "黄山", sub: "安徽 · 热门景点", rating: '4.8', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/1/1d/Huangshan_pic_4.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://www.bilibili.com/video/BV13WGb6YEes （黄山沉浸式导览 真实游览体验）",
      "https://www.bilibili.com/video/BV1d3L46CEf7 （黄山大环线一镜到底徒步）",
    ],
    history: {
      intro: "天下第一奇山，五绝奇松、怪石、云海、温泉、冬雪，世界文化与自然双遗产",
      timeline: [
        { year: "今", text: "黄山已成为广受游客青睐的旅行目的地，天下第一奇山，五绝奇松、怪石、云海、温泉、冬雪，世界文化与自..." },
        { year: "近代", text: "随着交通发展和旅游开发，黄山逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "安徽当地特色美食值得品尝，黄山周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "黄山所在的安徽地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "天下第一奇山，五绝奇松、怪石、云海、温泉、冬雪，世界文化与自然双遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  hongcun: {
    name: "宏村", sub: "黄山 · 热门景点", rating: '4.9', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/5/50/Yixian_Hongcun_2016.09.09_18-17-55.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=宏村徽派建筑风景",
    ],
    history: {
      intro: "活着的明清博物馆，水墨画般的徽派古村落，世界文化遗产",
      timeline: [
        { year: "今", text: "宏村已成为广受游客青睐的旅行目的地，活着的明清博物馆，水墨画般的徽派古村落，世界文化遗产..." },
        { year: "近代", text: "随着交通发展和旅游开发，宏村逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "安徽当地特色美食值得品尝，宏村周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "宏村所在的安徽地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "活着的明清博物馆，水墨画般的徽派古村落，世界文化遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  yangchan: {
    name: "阳产土楼", sub: "黄山 · 小众秘境", rating: '4.1', price: '¥450',
    img: "https://upload.wikimedia.org/wikipedia/commons/f/fe/%E9%98%B3%E4%BA%A7%E5%9C%9F%E6%A5%BC_07.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=阳产土楼+晒秋",
    ],
    history: {
      intro: "皖南最后的土楼王国，金黄土楼群依山而建，秋季晒秋场景如油画，治愈小众古村落",
      timeline: [
        { year: "今", text: "阳产土楼已成为备受探险者推崇的旅行目的地，皖南最后的土楼王国，金黄土楼群依山而建，秋季晒秋场景如油画，..." },
        { year: "近代", text: "随着交通发展和旅游开发，阳产土楼逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "安徽当地特色美食值得品尝，阳产土楼周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "阳产土楼所在的安徽地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "皖南最后的土楼王国，金黄土楼群依山而建，秋季晒秋场景如油画，治愈小众古村落...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  wudangshan: {
    name: "武当山", sub: "十堰 · 热门景点", rating: '4.7', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Wudang_Mountain_%2854131425234%29.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=武当山风景介绍",
    ],
    history: {
      intro: "道教圣地，太极发源地，云雾缭绕的仙山胜境，世界文化遗产",
      timeline: [
        { year: "今", text: "武当山已成为广受游客青睐的旅行目的地，道教圣地，太极发源地，云雾缭绕的仙山胜境，世界文化遗产..." },
        { year: "近代", text: "随着交通发展和旅游开发，武当山逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "湖北当地特色美食值得品尝，武当山周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "武当山所在的湖北地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "道教圣地，太极发源地，云雾缭绕的仙山胜境，世界文化遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  enshi: {
    name: "恩施大峡谷", sub: "湖北 · 热门景点", rating: '4.9', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/e/e3/Enshi_Canyon_109.21564E_30.45224N.png",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=恩施大峡谷风景",
    ],
    history: {
      intro: "地球最美丽的伤痕，喀斯特地貌奇观，百里绝壁千丈瀑布",
      timeline: [
        { year: "今", text: "恩施大峡谷已成为广受游客青睐的旅行目的地，地球最美丽的伤痕，喀斯特地貌奇观，百里绝壁千丈瀑布..." },
        { year: "近代", text: "随着交通发展和旅游开发，恩施大峡谷逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "湖北当地特色美食值得品尝，恩施大峡谷周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "恩施大峡谷所在的湖北地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "地球最美丽的伤痕，喀斯特地貌奇观，百里绝壁千丈瀑布...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  luyuanping: {
    name: "鹿院坪", sub: "恩施 · 小众秘境", rating: '4.0', price: '¥450',
    img: "https://upload.wikimedia.org/wikipedia/commons/0/09/Lichuan_Railway_Station.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=鹿院坪+天坑古村",
    ],
    history: {
      intro: "国内唯一需徒步进入的村落，深陷天坑之中四周绝壁环绕，地缝瀑布原始森林密布，与世隔绝的避世天堂",
      timeline: [
        { year: "今", text: "鹿院坪已成为备受探险者推崇的旅行目的地，国内唯一需徒步进入的村落，深陷天坑之中四周绝壁环绕，地缝瀑布..." },
        { year: "近代", text: "随着交通发展和旅游开发，鹿院坪逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "湖北当地特色美食值得品尝，鹿院坪周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "鹿院坪所在的湖北地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "国内唯一需徒步进入的村落，深陷天坑之中四周绝壁环绕，地缝瀑布原始森林密布，与世隔绝的避世天堂...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  taishan: {
    name: "泰山", sub: "泰安 · 热门景点", rating: '4.9', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/7/71/50304-Taishan_%2849055660366%29.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=泰山日出风景",
    ],
    history: {
      intro: "五岳之首，登泰山而小天下，世界文化与自然双遗产",
      timeline: [
        { year: "今", text: "泰山已成为广受游客青睐的旅行目的地，五岳之首，登泰山而小天下，世界文化与自然双遗产..." },
        { year: "近代", text: "随着交通发展和旅游开发，泰山逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "山东当地特色美食值得品尝，泰山周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "泰山所在的山东地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "五岳之首，登泰山而小天下，世界文化与自然双遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  changdao: {
    name: "烟台长岛", sub: "烟台 · 小众秘境", rating: '4.2', price: '¥450',
    img: "https://upload.wikimedia.org/wikipedia/commons/1/15/Penglai.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=烟台长岛+风景介绍",
    ],
    history: {
      intro: "黄海深处最干净安静的小众海岛，亿年海蚀崖+细腻球石海滩+淳朴渔家风情，北方治愈系海岛",
      timeline: [
        { year: "今", text: "烟台长岛已成为备受探险者推崇的旅行目的地，黄海深处最干净安静的小众海岛，亿年海蚀崖+细腻球石海滩+淳朴..." },
        { year: "近代", text: "随着交通发展和旅游开发，烟台长岛逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "山东当地特色美食值得品尝，烟台长岛周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "烟台长岛所在的山东地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "黄海深处最干净安静的小众海岛，亿年海蚀崖+细腻球石海滩+淳朴渔家风情，北方治愈系海岛...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  bingmayong: {
    name: "秦始皇兵马俑", sub: "西安 · 热门景点", rating: '4.6', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/8/88/51714-Terracota-Army.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://www.bilibili.com/video/BV1kh411A77d （Hello中国 英文版第51集 兵马俑）",
    ],
    history: {
      intro: "世界第八大奇迹，沉默的地下军团诉说大秦辉煌，世界文化遗产",
      timeline: [
        { year: "今", text: "秦始皇兵马俑已成为广受游客青睐的旅行目的地，世界第八大奇迹，沉默的地下军团诉说大秦辉煌，世界文化遗产..." },
        { year: "近代", text: "随着交通发展和旅游开发，秦始皇兵马俑逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "陕西当地特色美食值得品尝，秦始皇兵马俑周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "秦始皇兵马俑所在的陕西地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "世界第八大奇迹，沉默的地下军团诉说大秦辉煌，世界文化遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  tangbuxiec: {
    name: "西安大唐不夜城", sub: "西安 · 热门景点", rating: '4.7', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/e/e2/%E9%9B%81%E5%A1%94_%E5%A4%A7%E5%94%90%E4%B8%8D%E5%A4%9C%E5%9F%8E%E5%92%8C%E5%A4%A7%E9%9B%81%E5%A1%94.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=西安大唐不夜城夜景",
    ],
    history: {
      intro: "盛唐文化体验地，灯火辉煌的穿越之旅",
      timeline: [
        { year: "今", text: "西安大唐不夜城已成为广受游客青睐的旅行目的地，盛唐文化体验地，灯火辉煌的穿越之旅..." },
        { year: "近代", text: "随着交通发展和旅游开发，西安大唐不夜城逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "陕西当地特色美食值得品尝，西安大唐不夜城周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "西安大唐不夜城所在的陕西地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "盛唐文化体验地，灯火辉煌的穿越之旅...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  budala: {
    name: "布达拉宫", sub: "拉萨 · 热门景点", rating: '4.8', price: '¥1500',
    img: "https://upload.wikimedia.org/wikipedia/commons/b/b6/Potala_Palace_HQ.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://www.bilibili.com/video/av8668069 （第三极 纪录片 含布达拉宫内容）",
    ],
    history: {
      intro: "世界屋脊的明珠，藏传佛教圣地，世界文化遗产",
      timeline: [
        { year: "今", text: "布达拉宫已成为广受游客青睐的旅行目的地，世界屋脊的明珠，藏传佛教圣地，世界文化遗产..." },
        { year: "近代", text: "随着交通发展和旅游开发，布达拉宫逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "西藏当地特色美食值得品尝，布达拉宫周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "布达拉宫所在的西藏地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "世界屋脊的明珠，藏传佛教圣地，世界文化遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  zhangjiajie_park: {
    name: "张家界国家森林公园", sub: "湖南 · 热门景点", rating: '4.7', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/7/77/1_tianzishan_wulingyuan_zhangjiajie_2012.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://www.bilibili.com/video/BV1koKizrEB4 （哪个5A景区称得上6A景区）",
    ],
    history: {
      intro: "阿凡达取景地，三千奇峰拔地而起，全球唯一石英砂岩峰林地貌，世界自然遗产",
      timeline: [
        { year: "今", text: "张家界国家森林公园已成为广受游客青睐的旅行目的地，阿凡达取景地，三千奇峰拔地而起，全球唯一石英砂岩峰林地貌，世..." },
        { year: "近代", text: "随着交通发展和旅游开发，张家界国家森林公园逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "湖南当地特色美食值得品尝，张家界国家森林公园周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "张家界国家森林公园所在的湖南地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "阿凡达取景地，三千奇峰拔地而起，全球唯一石英砂岩峰林地貌，世界自然遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  sanqingshan: {
    name: "三清山", sub: "上饶 · 热门景点", rating: '4.8', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/3/31/Sanqingshan1522.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=三清山风景介绍",
    ],
    history: {
      intro: "西太平洋边缘最美丽的花岗岩，世界自然遗产，道教名山",
      timeline: [
        { year: "今", text: "三清山已成为广受游客青睐的旅行目的地，西太平洋边缘最美丽的花岗岩，世界自然遗产，道教名山..." },
        { year: "近代", text: "随着交通发展和旅游开发，三清山逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "江西当地特色美食值得品尝，三清山周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "三清山所在的江西地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "西太平洋边缘最美丽的花岗岩，世界自然遗产，道教名山...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  hongyadong: {
    name: "洪崖洞", sub: "重庆 · 热门景点", rating: '4.7', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/6/64/202308_Hongya_Cave_at_night_from_Qiansimen_Bridge.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=重庆洪崖洞夜景",
    ],
    history: {
      intro: "8D魔幻山城地标，千与千寻现实版，吊脚楼群夜景绝美",
      timeline: [
        { year: "今", text: "洪崖洞已成为广受游客青睐的旅行目的地，8D魔幻山城地标，千与千寻现实版，吊脚楼群夜景绝美..." },
        { year: "近代", text: "随着交通发展和旅游开发，洪崖洞逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "重庆当地特色美食值得品尝，洪崖洞周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "洪崖洞所在的重庆地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "8D魔幻山城地标，千与千寻现实版，吊脚楼群夜景绝美...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  zhouzhuang: {
    name: "周庄", sub: "苏州 · 热门景点", rating: '4.7', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/9/95/Zhouzhuang1.jpg",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=周庄古镇风景",
    ],
    history: {
      intro: "天下第一水乡，小桥流水人家，保存完好的明清古建筑群",
      timeline: [
        { year: "今", text: "周庄已成为广受游客青睐的旅行目的地，天下第一水乡，小桥流水人家，保存完好的明清古建筑群..." },
        { year: "近代", text: "随着交通发展和旅游开发，周庄逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "江苏当地特色美食值得品尝，周庄周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "周庄所在的江苏地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "天下第一水乡，小桥流水人家，保存完好的明清古建筑群...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  pingyao: {
    name: "平遥古城", sub: "晋中 · 热门景点", rating: '4.7', price: '¥650',
    img: "https://upload.wikimedia.org/wikipedia/commons/9/9d/Pingyao_40.JPG",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=平遥古城风景介绍",
    ],
    history: {
      intro: "中国保存最完整的古城之一，晋商文化发源地，世界文化遗产",
      timeline: [
        { year: "今", text: "平遥古城已成为广受游客青睐的旅行目的地，中国保存最完整的古城之一，晋商文化发源地，世界文化遗产..." },
        { year: "近代", text: "随着交通发展和旅游开发，平遥古城逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "山西当地特色美食值得品尝，平遥古城周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "平遥古城所在的山西地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "中国保存最完整的古城之一，晋商文化发源地，世界文化遗产...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  yalongwan: {
    name: "三亚亚龙湾", sub: "海南 · 热门景点", rating: '4.7', price: '¥1500',
    img: "https://upload.wikimedia.org/wikipedia/commons/f/f2/%E4%BA%9A%E9%BE%99%E6%B9%BE.JPG",
    type: "热门", isHot: true,
    videos: [
      "https://search.bilibili.com/all?keyword=三亚亚龙湾风景",
    ],
    history: {
      intro: "东方夏威夷，中国最美热带海滨，碧海银沙椰风海韵",
      timeline: [
        { year: "今", text: "三亚亚龙湾已成为广受游客青睐的旅行目的地，东方夏威夷，中国最美热带海滨，碧海银沙椰风海韵..." },
        { year: "近代", text: "随着交通发展和旅游开发，三亚亚龙湾逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "海南当地特色美食值得品尝，三亚亚龙湾周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "三亚亚龙湾所在的海南地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "东方夏威夷，中国最美热带海滨，碧海银沙椰风海韵...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  aershan: {
    name: "阿尔山", sub: "兴安盟 · 小众秘境", rating: '4.0', price: '¥700',
    img: "https://upload.wikimedia.org/wikipedia/commons/f/ff/%E9%98%BF%E5%B0%94%E5%B1%B1%E5%B8%82_%289535929873%29.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=阿尔山+纪录片+4K",
    ],
    history: {
      intro: "火山熔岩上的童话世界，9月全国最早金秋油画季，冬季零下40℃不冻河奇观+鹿苑圣诞场景",
      timeline: [
        { year: "今", text: "阿尔山已成为备受探险者推崇的旅行目的地，火山熔岩上的童话世界，9月全国最早金秋油画季，冬季零下40℃..." },
        { year: "近代", text: "随着交通发展和旅游开发，阿尔山逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "内蒙古当地特色美食值得品尝，阿尔山周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "阿尔山所在的内蒙古地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "火山熔岩上的童话世界，9月全国最早金秋油画季，冬季零下40℃不冻河奇观+鹿苑圣诞场景...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
  yichun: {
    name: "伊春小兴安岭", sub: "伊春 · 小众秘境", rating: '4.5', price: '¥700',
    img: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Sight_of_the_city_from_the_top_of_Xing%27an_Tower%2C_Yichun%2C_Heilongjiang%2C_China.jpg",
    type: "小众", isHot: false,
    videos: [
      "https://search.bilibili.com/all?keyword=伊春+小兴安岭+森林",
    ],
    history: {
      intro: "野生东北虎的森林秘境，汤旺河亚洲最大花岗岩石林群，五营红松林负氧离子爆表，冬季马拉爬犁寻鹿",
      timeline: [
        { year: "今", text: "伊春小兴安岭已成为备受探险者推崇的旅行目的地，野生东北虎的森林秘境，汤旺河亚洲最大花岗岩石林群，五营红松林..." },
        { year: "近代", text: "随着交通发展和旅游开发，伊春小兴安岭逐渐走入大众视野" },
      ],
      stories: [],
    },
    food: {
      intro: "黑龙江当地特色美食值得品尝，伊春小兴安岭周边有不少地道餐馆。",
      items: [],
    },
    heritage: {
      intro: "伊春小兴安岭所在的黑龙江地区拥有丰富的非物质文化遗产。",
      items: [],
    },
    landmarks: {
      intro: "野生东北虎的森林秘境，汤旺河亚洲最大花岗岩石林群，五营红松林负氧离子爆表，冬季马拉爬犁寻鹿...",
      items: [],
    },
    routes: {
      intro: '建议根据季节和个人偏好灵活安排行程，具体路线可咨询当地旅行社或使用 AI 规划功能。',
      routes: [],
    },
  },
};

// ====== 景点列表索引 ======
const chinaDestIndex = [
  { key: 'gugong', name: '故宫博物院' },
  { key: 'changcheng', name: '万里长城' },
  { key: 'xihu', name: '杭州西湖' },
  { key: 'wuzhen', name: '乌镇' },
  { key: 'songyang', name: '松阳古村群' },
  { key: 'jiuzhaigou', name: '九寨沟' },
  { key: 'daocheng', name: '稻城亚丁' },
  { key: 'genie', name: '格聂神山' },
  { key: 'dangling', name: '党岭' },
  { key: 'cuokahu', name: '措卡湖' },
  { key: 'lijiang', name: '丽江古城' },
  { key: 'dali', name: '大理苍山洱海' },
  { key: 'nanjiluo', name: '南极洛' },
  { key: 'jingmai', name: '景迈山' },
  { key: 'bingzhongluo', name: '丙中洛' },
  { key: 'nianhu', name: '念湖' },
  { key: 'chaka', name: '茶卡盐湖' },
  { key: 'qinghaihu', name: '青海湖' },
  { key: 'aikenquan', name: '艾肯泉/恶魔之眼' },
  { key: 'mangya', name: '茫崖翡翠湖' },
  { key: 'dongtai', name: '东台吉乃尔湖' },
  { key: 'heidushan', name: '黑独山' },
  { key: 'nianbaoyuze', name: '年保玉则' },
  { key: 'qiongkushitai', name: '琼库什台' },
  { key: 'xiaerxili', name: '夏尔西里' },
  { key: 'jiangbulake', name: '江布拉克' },
  { key: 'dahaidao', name: '大海道' },
  { key: 'dunhuang', name: '敦煌莫高窟' },
  { key: 'zhagana', name: '扎尕那' },
  { key: 'fanjingshan', name: '梵净山' },
  { key: 'huangguoshu', name: '黄果树瀑布' },
  { key: 'jiucaiping', name: '赫章韭菜坪' },
  { key: 'luodian', name: '罗甸大小井' },
  { key: 'guilin', name: '桂林漓江' },
  { key: 'sanmenhai', name: '凤山三门海' },
  { key: 'mingshi', name: '崇左明仕田园' },
  { key: 'gulangyu', name: '鼓浪屿' },
  { key: 'xiapu', name: '霞浦滩涂' },
  { key: 'sisu', name: '四礵列岛' },
  { key: 'huangshan', name: '黄山' },
  { key: 'hongcun', name: '宏村' },
  { key: 'yangchan', name: '阳产土楼' },
  { key: 'wudangshan', name: '武当山' },
  { key: 'enshi', name: '恩施大峡谷' },
  { key: 'luyuanping', name: '鹿院坪' },
  { key: 'taishan', name: '泰山' },
  { key: 'changdao', name: '烟台长岛' },
  { key: 'bingmayong', name: '秦始皇兵马俑' },
  { key: 'tangbuxiec', name: '西安大唐不夜城' },
  { key: 'budala', name: '布达拉宫' },
  { key: 'zhangjiajie_park', name: '张家界国家森林公园' },
  { key: 'sanqingshan', name: '三清山' },
  { key: 'hongyadong', name: '洪崖洞' },
  { key: 'zhouzhuang', name: '周庄' },
  { key: 'pingyao', name: '平遥古城' },
  { key: 'yalongwan', name: '三亚亚龙湾' },
  { key: 'aershan', name: '阿尔山' },
  { key: 'yichun', name: '伊春小兴安岭' },
];

// 将数据合并到现有的 destDetailData
// 使用方式：Object.assign(destDetailData, chinaDestinationsData);
// 或者在 script.js 中直接合并两个对象

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { chinaDestinationsData, chinaDestIndex };
}