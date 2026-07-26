/**
 * 省份景点数据
 * 31个省级行政区，含完整景点数据
 * adcode 与 datav.aliyun.com TopoJSON 保持一致
 */
export const provinceData = {
  110000: {
    id: '110000',
    name: '北京',
    nameEn: 'Beijing',
    description: '三千余年建城史，八百年建都史。故宫的红墙黄瓦、长城的巍峨壮阔、胡同里的烟火人间，共同编织着这座古都的独特魅力。',
    color: '#1A8A7A',
    hotspotCount: 12,
    bestSeason: '春秋两季',
    avgRating: 4.6,
    hotspots: [
      {
        name: '故宫博物院',
        nameEn: '故宫博物院',
        type: 'cultural',
        rating: 4.9,
        duration: '半天',
        price: '待定',
        shortDesc: '中国明清两代的皇家宫殿，是世界上现存规模最大、保存最完整的木质结构古建筑群。红墙黄瓦、雕梁画栋，收藏有百万件珍贵文物，堪',
        tags: [],
        imageUrl: '/images/landmarks/beijing_01_gugong.jpg'
      },
      {
        name: '慕田峪长城',
        nameEn: '慕田峪长城',
        type: 'cultural',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '万里长城的精华段之一，以雄伟险峻著称，植被覆盖率超过90%。相比八达岭游客更少，四季景色各异，春季花海、秋季红叶美不胜收',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/beijing_02_mutianyu.jpg',
      },
      {
        name: '颐和园',
        nameEn: '颐和园',
        type: 'cultural',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '中国清代皇家园林，以昆明湖、万寿山为基址，汲取江南园林设计手法建造。长廊彩绘、十七孔桥、佛香阁等景致精美绝伦，被誉为皇家',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/beijing_03_yiheyuan.jpg',
      },
      {
        name: '天坛公园',
        nameEn: '天坛公园',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '明清两代帝王祭天的场所，是中国古代祭天建筑的巅峰之作。祈年殿蓝瓦金饰、三层圆顶结构，象征天人合一的哲学理念，是中国古建筑',
        tags: [],
        imageUrl: '/images/landmarks/beijing_04_tiantan.jpg',
      },
      {
        name: '雍和宫',
        nameEn: '雍和宫',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '北京最大的藏传佛教寺院，原为雍正帝府邸，后改为喇嘛庙。建筑风格融合了汉、蒙、藏三种特色，香火旺盛，是京城重要的宗教和文化',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/beijing_05_yonghegong.jpg',
      },
      {
        name: '恭王府',
        nameEn: '恭王府',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '清代规模最大的王府建筑群，曾是和珅的府邸和庆亲王奕訢的居所。花园精巧雅致，建筑规制严谨，是了解清代王府文化和权臣历史的绝',
        tags: [],
        imageUrl: '/images/landmarks/beijing_06_gongwangfu.jpg',
      },
      {
        name: '圆明园',
        nameEn: '圆明园',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '清代大型皇家园林，曾被誉为\'万园之园\'。如今保留着残垣断壁的遗迹，既是近代屈辱历史的见证，也展现了昔日中华园林艺术的辉煌',
        tags: [],
        imageUrl: '/images/landmarks/beijing_07_yuanmingyuan.jpg',
      },
      {
        name: '什刹海',
        nameEn: '什刹海',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '北京历史文化街区，由前海、后海、西海三片水域组成。周边胡同密布、四合院林立，可以泛舟湖上、骑行老街，感受最地道的京味文化',
        tags: ['湖泊', '古城'],
        imageUrl: '/images/landmarks/beijing_08_shichahai.jpg',
      },
      {
        name: '国家博物馆',
        nameEn: '国家博物馆',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '世界上单体建筑面积最大的博物馆之一，珍藏有从远古到近现代的各类珍贵文物。司母戊鼎、四羊方尊等国家镇馆之宝在此展出，是了解',
        tags: [],
        imageUrl: '/images/landmarks/beijing_09_guojia.jpg',
      },
      {
        name: '北京环球度假区',
        nameEn: '北京环球度假区',
        type: 'adventure',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '亚洲首个环球影城主题公园，拥有哈利波特、变形金刚、功夫熊猫等多个 themed 园区。沉浸式游乐体验和世界级演出，是家庭',
        tags: ['亲子', '主题乐园'],
        imageUrl: '/images/landmarks/beijing_10_huanqiu.jpg',
      },
      {
        name: '798艺术区',
        nameEn: '798艺术区',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '由老电子工厂改造而成的当代艺术中心，汇集了画廊、美术馆、设计工作室和艺术空间。街头涂鸦、前卫雕塑和个性小店随处可见，是北',
        tags: [],
        imageUrl: '/images/landmarks/beijing_11_798.jpg',
      },
      {
        name: '奥林匹克森林公园',
        nameEn: '奥林匹克森林公园',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '北京最大的生态森林公园，为2008年奥运会而建。南北园各有特色，南园活泼北园宁静，春天樱花烂漫、秋天银杏金黄，是市民休闲',
        tags: [],
        imageUrl: '/images/landmarks/beijing_12_aolinpik.jpg',
      }
    ]
  },
  120000: {
    id: '120000',
    name: '天津',
    nameEn: 'Tianjin',
    description: '渤海之滨的直辖市，中西合璧的历史风貌。',
    color: '#1A8A7A',
    hotspotCount: 10,
    avgRating: 4.4,
    hotspots: [
      {
        name: '天津之眼',
        nameEn: '天津之眼',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '世界上唯一建在桥上的摩天轮，横跨海河之上，高120米。夜幕下流光溢彩，乘坐观光舱可360度饱览天津全城美景，是天津最具辨',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/tianjin_01_zhiyan.jpg'
      },
      {
        name: '古文化街',
        nameEn: '古文化街',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '天津最具民俗文化特色的商业步行街，供奉着天津的保护神——天后宫。泥人张、风筝魏等非遗手工艺品琳琅满目，煎饼果子、熟梨糕等',
        tags: ['世界遗产', '美食'],
        imageUrl: '/images/landmarks/tianjin_02_guwenhua.jpg'
      },
      {
        name: '五大道文化旅游区',
        nameEn: '五大道文化旅游区',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '汇集2000余栋不同风格的历史洋楼，英式、法式、意式建筑风格各异。民园广场、庆王府等景点散落其间，漫步其间仿佛穿越到上世',
        tags: [],
        imageUrl: '/images/landmarks/tianjin_03_wudadao.jpg'
      },
      {
        name: '意式风情区',
        nameEn: '意式风情区',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '亚洲最大的意大利风貌建筑群，由原意大利租界改造而成。托斯卡纳广场、梁启超饮冰室等景点点缀其间，欧式咖啡店、西餐厅营造出浓',
        tags: [],
        imageUrl: '/images/landmarks/tianjin_04_yishi.jpg'
      },
      {
        name: '盘山风景名胜区',
        nameEn: '盘山风景名胜区',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国十六大名山之一，有\'早知有盘山，何必下江南\'的美誉。奇石怪松、清泉飞瀑构成天然画卷，清帝乾隆曾三十余次登临，留下大量',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/tianjin_05_panshan.jpg'
      },
      {
        name: '海河游船',
        nameEn: '海河游船',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '沿海河乘船游览是感受天津之美的最佳方式。从天津站到津湾广场，沿途经过天津之眼、世纪钟、意式风情区等重要地标，两岸夜景灯光',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/tianjin_06_haihe.jpg'
      },
      {
        name: '瓷房子',
        nameEn: '瓷房子',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '由一栋百年法式洋房改造而成的奇特建筑，外墙上镶嵌着数万件古瓷、水晶、玉石。堪称一座用瓷器砌成的艺术博物馆，是中国独一无二',
        tags: [],
        imageUrl: '/images/landmarks/tianjin_07_cifang.jpg'
      },
      {
        name: '天津滨海图书馆',
        nameEn: '天津滨海图书馆',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '被誉为\'亚洲最美图书馆\'，巨大的球形书摘中心被层层叠叠的书梯环绕，形成壮观的\'眼睛\'造型。现代感十足的设计使其成为天津新',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/tianjin_08_binhai.jpg'
      },
      {
        name: '黄崖关长城',
        nameEn: '黄崖关长城',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '长城的东部终点，始建于明代，依山势蜿蜒盘旋。城墙依山而建、雄关险隘，敌楼和烽火台保存完好。秋季漫山红叶映衬古长城，美不胜',
        tags: [],
        imageUrl: '/images/landmarks/tianjin_09_huangya.jpg'
      },
      {
        name: '杨柳青古镇',
        nameEn: '杨柳青古镇',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '因享誉中外的杨柳青年画而闻名，是中国民间文化艺术之乡。石家大院、运河书院等古建群落保存完好，体验传统年画制作技艺感受浓郁',
        tags: ['湖泊', '古城'],
        imageUrl: '/images/landmarks/tianjin_10_yangliu.jpg'
      }
    ]
  },
  130000: {
    id: '130000',
    name: '河北',
    nameEn: 'Hebei',
    description: '环绕京津的燕赵大地，山海相依。',
    color: '#2EA89A',
    hotspotCount: 12,
    avgRating: 4.5,
    hotspots: [
      {
        name: '承德避暑山庄',
        nameEn: '承德避暑山庄',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最大的皇家园林，清代皇帝夏季避暑和处理政务的场所。占地564万平方米，集江南园林之秀美与北方山水之壮美于一体，是世界',
        tags: [],
        imageUrl: '/images/landmarks/hebei_01_bishu.jpg'
      },
      {
        name: '山海关',
        nameEn: '山海关',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '天下第一关，明万里长城的东北起点，自古为兵家必争之地。城楼巍峨险峻，周边长城绵延起伏，登上城楼可感受到古人守护疆土的雄壮',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/hebei_02_shanhaiguan.jpg'
      },
      {
        name: '北戴河',
        nameEn: '北戴河',
        type: 'urban',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最著名的海滨避暑胜地，海岸线绵长，沙软潮平。鸽子窝公园看海上日出、老虎石公园踏浪戏水，夏季这里是全国游客的休闲天堂。',
        tags: ['湖泊', '摄影', '城市'],
        imageUrl: '/images/landmarks/hebei_03_beidaihe.jpg'
      },
      {
        name: '正定古城',
        nameEn: '正定古城',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '有着3000多年历史的北方古城，保存了大量珍贵古迹。隆兴寺铜铸大佛、开元寺须弥塔、天宁寺凌霄塔等名胜林立，是华北地区保存',
        tags: ['古城', '佛教'],
        imageUrl: '/images/landmarks/hebei_04_zhengding.jpg'
      },
      {
        name: '白洋淀',
        nameEn: '白洋淀',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '华北平原上最大的淡水湖泊，以广袤的芦苇荡和水乡风光闻名。夏日荷花盛开、渔歌唱晚，乘一叶小船穿梭于水道之间，感受北方水乡的',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/hebei_05_baiyang.jpg'
      },
      {
        name: '赵州桥',
        nameEn: '赵州桥',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '世界现存最古老的单孔敞肩石拱桥，由隋代工匠李春建于公元595年。桥上雕刻精美，历经千年地震洪水仍巍然屹立，是中国古代桥梁',
        tags: [],
        imageUrl: '/images/landmarks/hebei_06_zhaozhou.jpg'
      },
      {
        name: '野三坡',
        nameEn: '野三坡',
        type: 'urban',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '太行山与燕山交汇处的大型自然风景区，集峡谷、河流、悬崖于一体。百里峡奇峰林立、鱼谷洞暗河神秘，夏季平均气温仅22度，是绝',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/hebei_07_yesanpo.jpg'
      },
      {
        name: '金山岭长城',
        nameEn: '金山岭长城',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '长城中保存最为完好、最具代表性的一段之一。敌楼密集、山势陡峭，摄影爱好者最爱的长城拍摄地，晨雾中的金山岭犹如仙境。',
        tags: ['摄影'],
        imageUrl: '/images/landmarks/hebei_08_jinshanling.jpg'
      },
      {
        name: '清西陵',
        nameEn: '清西陵',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '清代两大皇家陵寝之一，埋葬着雍正、嘉庆、道光等四位皇帝。规模宏大、建筑精美，古松参天、殿宇庄严，是中国古代陵寝建筑艺术的',
        tags: [],
        imageUrl: '/images/landmarks/hebei_09_qingxi.jpg'
      },
      {
        name: '崇礼滑雪场群',
        nameEn: '崇礼滑雪场群',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '2022年北京冬奥会雪上项目举办地，拥有国际标准的多个滑雪场。万龙、太舞、富龙等雪场设施完善，冬季滑雪度假的热土，夏季还',
        tags: [],
        imageUrl: '/images/landmarks/hebei_10_chongli.jpg'
      },
      {
        name: '保定直隶总督署',
        nameEn: '保定直隶总督署',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '中国保存最完整的清代省级衙署，曾是直隶总督办公和居住的地方。院内古建错落有致，馆内展览详述清代地方行政制度，是了解清代官',
        tags: [],
        imageUrl: '/images/landmarks/hebei_11_zhili.jpg'
      },
      {
        name: '秦皇岛阿那亚社区',
        nameEn: '秦皇岛阿那亚社区',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最具文艺气息的海滨社区，孤独图书馆和阿那亚礼堂成为现象级打卡地标。面朝大海的建筑设计简约而震撼，每年吸引无数游客奔赴',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/hebei_12_aranya.jpg'
      }
    ]
  },
  140000: {
    id: '140000',
    name: '山西',
    nameEn: 'Shanxi',
    description: '表里山河，中国古代建筑艺术的宝库。',
    color: '#0D6B5C',
    hotspotCount: 12,
    avgRating: 4.5,
    hotspots: [
      {
        name: '平遥古城',
        nameEn: '平遥古城',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '中国保存最为完整的四大古城之一，明清时期的金融中心日升昌票号便诞生于此。城墙周长6公里，城内街道商铺、客栈、庙宇保持原貌',
        tags: ['古城'],
        imageUrl: '/images/landmarks/shanxi_01_pingyao.jpg'
      },
      {
        name: '云冈石窟',
        nameEn: '云冈石窟',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '中国规模最大的古代石窟群之一，北魏皇室主持开凿。现存45个主要洞窟、51000余尊造像，佛像面容威严华美，是佛教艺术东传',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/shanxi_02_yungang.jpg'
      },
      {
        name: '悬空寺',
        nameEn: '悬空寺',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界十大危险的木结构建筑之一，悬挂在恒山金龙峡翠屏峰峭壁之上。始建于北魏，佛、道、儒三教合一，以\'危楼高百尺\'的建筑奇迹',
        tags: [],
        imageUrl: '/images/landmarks/shanxi_03_xuankong.jpg'
      },
      {
        name: '五台山',
        nameEn: '五台山',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '中国四大佛教名山之首，文殊菩萨的道场。现存寺庙47座，菩萨顶、显通寺等建筑宏伟，每逢盛夏来自世界各地的信徒和游客络绎不绝',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/shanxi_04_wutai.jpg'
      },
      {
        name: '晋祠',
        nameEn: '晋祠',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最早的皇家祭祀园林，为纪念晋国开国诸侯唐叔虞而建。圣母殿侍女塑像栩栩如生，难老泉清澈见底，周柏唐槐千年不死，堪称三绝',
        tags: [],
        imageUrl: '/images/landmarks/shanxi_05_jinci.jpg'
      },
      {
        name: '王家大院',
        nameEn: '王家大院',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最大的民居古建群之一，有\'王家归来不看院\'的美誉。总面积达25万平方米，砖木雕饰精美绝伦，是中国封建社会家族生活和建',
        tags: [],
        imageUrl: '/images/landmarks/shanxi_06_wangjia.jpg'
      },
      {
        name: '乔家大院',
        nameEn: '乔家大院',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '晋商文化的代表作，因电影《大红灯笼高高挂》取景而闻名。四四方方的城堡式建筑群，深宅大院、天井回廊尽显晋商家族的富庶与威严',
        tags: [],
        imageUrl: '/images/landmarks/shanxi_07_qiao.jpg'
      },
      {
        name: '壶口瀑布',
        nameEn: '壶口瀑布',
        type: 'urban',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '中国第二大瀑布、世界上最大的黄色瀑布。黄河之水奔腾而下、声震数里，水雾升腾间常有彩虹浮现。春季桃花汛、冬季冰瀑奇观各有壮',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/shanxi_08_hukou.jpg'
      },
      {
        name: '应县木塔',
        nameEn: '应县木塔',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '世界最高最古老的纯木结构楼阁式塔，高67.31米，全身不用一根铁钉。始建于辽代，历经千年地震战火而不倒，是中国古代木构建',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/shanxi_09_yingxian.jpg'
      },
      {
        name: '恒山景区',
        nameEn: '恒山景区',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '中国五岳之一的北岳，海拔2016米。山势雄奇险峻，道教、佛教遗迹遍布，金龙峡的奇险风光与悬空寺相得益彰，是登山祈福的好去',
        tags: ['雪山', '湖泊', '佛教'],
        imageUrl: '/images/landmarks/shanxi_10_hengshan.jpg'
      },
      {
        name: '雁门关',
        nameEn: '雁门关',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '中华第一关，长城上的重要关隘。自古以来为中原抵御北方游牧民族的前沿阵地，杨家将在这里浴血奋战，\'天下九塞雁门为首\'气势恢',
        tags: [],
        imageUrl: '/images/landmarks/shanxi_11_yanmen.jpg'
      },
      {
        name: '碛口古镇',
        nameEn: '碛口古镇',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '黄河上重要的水陆码头，曾是清代西北商贸的重要枢纽。九曲黄河在这里拐大弯，明清老街保存完好，走西口的文化记忆在此清晰可见。',
        tags: ['湖泊', '古城'],
        imageUrl: '/images/landmarks/shanxi_12_qikou.jpg'
      }
    ]
  },
  150000: {
    id: '150000',
    name: '内蒙古',
    nameEn: 'Inner Mongolia',
    description: '天苍苍野茫茫，风吹草低见牛羊。',
    color: '#D4A84B',
    hotspotCount: 0,
    avgRating: undefined,
    hotspots: [
    ]
  },
  210000: {
    id: '210000',
    name: '辽宁',
    nameEn: 'Liaoning',
    description: '共和国长子，工业重镇与海滨风光的交融。',
    color: '#0D6B5C',
    hotspotCount: 11,
    avgRating: 4.5,
    hotspots: [
      {
        name: '沈阳故宫',
        nameEn: '沈阳故宫',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '中国仅存的两大皇家宫殿建筑群之一，是清入关前的皇室居所。大政殿、十王亭等建筑独具满族特色，展示了努尔哈赤和皇太极时代的辉',
        tags: [],
        imageUrl: '/images/landmarks/liaoning_01_shenyang.jpg'
      },
      {
        name: '大连金石滩',
        nameEn: '大连金石滩',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '国家级旅游度假区，以奇特的海蚀地貌闻名。十里龟裂石大观形态各异，滨海栈道绵延曲折，地质博物馆展示了亿万年沧海桑田的地质奇',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/liaoning_02_jinshitan.jpg'
      },
      {
        name: '本溪水洞',
        nameEn: '本溪水洞',
        type: 'urban',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '世界上最长的充水溶洞之一，全长近六公里。乘船穿洞而入，钟乳石千姿百态、光影交错，洞内温度常年恒定12度，是避暑探险的绝佳',
        tags: ['城市'],
        imageUrl: '/images/landmarks/liaoning_03_benxi.jpg'
      },
      {
        name: '丹东凤凰山',
        nameEn: '丹东凤凰山',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '辽东第一山，以险峻著称。老牛背、玻璃栈道、箭眼峰等景点步步惊心，山间古道和明清石刻遍布，攀登其间既挑战体力又感受历史。',
        tags: [],
        imageUrl: '/images/landmarks/liaoning_04_fenghuang.jpg'
      },
      {
        name: '鸭绿江断桥',
        nameEn: '鸭绿江断桥',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '抗美援朝战争的历史见证，这座桥被美军炸毁后仅存中方一侧。站在桥上可远眺朝鲜新义州，江风拂面间回望历史，感受和平的来之不易',
        tags: [],
        imageUrl: '/images/landmarks/liaoning_05_yalu.jpg'
      },
      {
        name: '千山风景区',
        nameEn: '千山风景区',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '东北明珠，以奇峰怪石和佛教道教遗迹闻名。仙人台海拔1130米为最高峰，沿途古刹云集，春季山花烂漫，秋季红叶满山。',
        tags: ['雪山', '湖泊', '佛教'],
        imageUrl: '/images/landmarks/liaoning_06_qianshan.jpg'
      },
      {
        name: '星海广场',
        nameEn: '星海广场',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '亚洲最大的城市广场，占地176万平方米。广场上百年城雕长廊气势磅礴，海边音乐喷泉绚丽多彩，日落时分的海景更是令人陶醉。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/liaoning_07_xinghai.jpg'
      },
      {
        name: '盘锦红海滩',
        nameEn: '盘锦红海滩',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '世界上面积最大的红海滩湿地，大片碱蓬草在秋季变为鲜红色，如地毯般铺满海岸。成群的丹顶鹤在此栖息，构成了自然界最绚烂的色彩',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/liaoning_08_honghaitan.jpg'
      },
      {
        name: '老虎滩海洋公园',
        nameEn: '老虎滩海洋公园',
        type: 'adventure',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '大连著名的主题海洋公园，拥有世界最大的极地动物展馆。海豚海狮表演精彩纷呈，珊瑚馆、鸟语林等场馆让亲子家庭尽享欢乐时光。',
        tags: ['湖泊', '亲子', '主题乐园'],
        imageUrl: '/images/landmarks/liaoning_09_laohutan.jpg'
      },
      {
        name: '兴城古城',
        nameEn: '兴城古城',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '中国保存最完整的四座明代古城之一，曾是戚继光抗倭的前线指挥部。城墙完整、街巷格局清晰，毗邻的兴城海滨是不错的避暑沙滩。',
        tags: ['湖泊', '古城'],
        imageUrl: '/images/landmarks/liaoning_10_xingcheng.jpg'
      },
      {
        name: '朝阳鸟化石国家地质公园',
        nameEn: '朝阳鸟化石国家地质公园',
        type: 'urban',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '世界古生物研究的圣地，发现了世界上最早的鸟类和开花植物化石。这里的科学发现改写了对生命进化史的认识，是科普教育和科学探索',
        tags: ['城市'],
        imageUrl: '/images/landmarks/liaoning_11_niaohuashi.jpg'
      }
    ]
  },
  220000: {
    id: '220000',
    name: '吉林',
    nameEn: 'Jilin',
    description: '北国江城，长白山天池的冰雪奇缘。',
    color: '#2EA89A',
    hotspotCount: 10,
    avgRating: 4.5,
    hotspots: [
      {
        name: '长白山天池',
        nameEn: '长白山天池',
        type: 'natural',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '长白山火山口形成的巨大高山湖泊，海拔2189米，是中国最深的湖泊。湖水湛蓝深邃、神秘莫测，周围火山锥体巍峨耸立，四季景色',
        tags: ['雪山', '湖泊', '自然'],
        imageUrl: '/images/landmarks/jilin_01_changbaishan.jpg'
      },
      {
        name: '长春净月潭国家森林公园',
        nameEn: '长春净月潭国家森林公园',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '亚洲最大的人工林海，潭水碧波荡漾、四周松涛阵阵。冬季可赏冰雕雪景，春夏是徒步登山的绿色氧吧，被誉为长春市的\'绿肺\'。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/jilin_02_jingyuetan.jpg'
      },
      {
        name: '雾凇岛',
        nameEn: '雾凇岛',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '中国四大雾凇奇观之一，松花江上的江雾遇冷凝结在树枝上，形成晶莹剔透的玉树琼花。冬日清晨漫步林中，宛如进入冰雪童话王国。',
        tags: [],
        imageUrl: '/images/landmarks/jilin_03_wusongdao.jpg'
      },
      {
        name: '伪满皇宫博物院',
        nameEn: '伪满皇宫博物院',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '中国末代皇帝溥仪的宫殿遗址，记录了伪满洲国的历史。缉熙楼、勤民楼等建筑保存完好，是近代屈辱史和教育意义兼具的爱国主义基地',
        tags: [],
        imageUrl: '/images/landmarks/jilin_04_weiman.jpg'
      },
      {
        name: '查干湖',
        nameEn: '查干湖',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '内蒙古东部最大湖泊，以冬季冰上捕鱼的传统习俗闻名天下。每年腊月举行的传统冬捕仪式场面壮观，鱼跃冰面的丰收喜悦感染每一位来',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/jilin_05_chaganhu.jpg'
      },
      {
        name: '松花湖风景名胜区',
        nameEn: '松花湖风景名胜区',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '因丰满水电站大坝拦截松花江而形成的高山人工湖，水面开阔如海。夏季游船赏景、冬季滑雪度假，四季皆宜的风水宝地。',
        tags: ['雪山', '湖泊'],
        imageUrl: '/images/landmarks/jilin_06_songhuahu.jpg'
      },
      {
        name: '向海国家级自然保护区',
        nameEn: '向海国家级自然保护区',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '世界珍贵鹤类栖息地之一，丹顶鹤、白鹤等珍稀鸟类在此繁衍。芦苇湿地一望无际，湖面波光粼粼，是观鸟爱好者和自然摄影师的理想天',
        tags: ['湖泊', '摄影'],
        imageUrl: '/images/landmarks/jilin_07_xianghai.jpg'
      },
      {
        name: '高句丽文物古迹旅游景区',
        nameEn: '高句丽文物古迹旅游景区',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，涵盖高句丽王城、王陵及贵族墓葬。将军坟被誉为\'东方金字塔\'，五盔坟壁画精美绝伦，见证了千年前高句丽文明的辉',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/jilin_08_gaogouli.jpg'
      },
      {
        name: '延吉朝鲜族民俗园',
        nameEn: '延吉朝鲜族民俗园',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '沉浸式体验朝鲜族民俗文化的特色景区。身着韩服的游客穿梭于特色建筑之间，品尝冷面、打糕等传统美食，感受浓郁的朝鲜族风情。',
        tags: ['美食'],
        imageUrl: '/images/landmarks/jilin_09_yanji.jpg'
      },
      {
        name: '万达长白山度假区',
        nameEn: '万达长白山度假区',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '集滑雪、购物、温泉于一体的综合度假区。冬季拥有优质雪道的滑雪场吸引全国游客，夏季则可体验漂流、滑翔伞等户外运动，是东北旅',
        tags: []
      }
    ]
  },
  230000: {
    id: '230000',
    name: '黑龙江',
    nameEn: 'Heilongjiang',
    description: '冰雪王国，中国最北端的极致风光。',
    color: '#0D6B5C',
    hotspotCount: 12,
    avgRating: 4.5,
    hotspots: [
      {
        name: '圣索菲亚大教堂',
        nameEn: '圣索菲亚大教堂',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '远东最著名的东正教教堂，拜占庭式建筑风格令人叹为观止。绿色穹顶、砖红色墙体在白雪映衬下格外醒目，广场上成群鸽子与百年教堂',
        tags: [],
        imageUrl: '/images/landmarks/heilongjiang_01_suofeiya.jpg'
      },
      {
        name: '中央大街',
        nameEn: '中央大街',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '百年繁华的商业步行街，全线柏油路面由苏联工程师设计，两侧欧式建筑汇聚巴洛克、文艺复兴等多种风格。马迭尔冰棍、红肠面包店是',
        tags: ['美食'],
        imageUrl: '/images/landmarks/heilongjiang_02_zhongyangdajie.jpg'
      },
      {
        name: '亚布力滑雪旅游度假区',
        nameEn: '亚布力滑雪旅游度假区',
        type: 'urban',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最著名的滑雪胜地，拥有国际标准的多条雪道和先进的缆车系统。无论是初学者还是高级滑雪爱好者都能找到适合自己的雪道，冬天',
        tags: ['城市'],
        imageUrl: '/images/landmarks/heilongjiang_03_yabuli.jpg'
      },
      {
        name: '中国雪乡',
        nameEn: '中国雪乡',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '因积雪深厚、雪质如粉而得名，被誉为\'中国最美雪乡\'。冬季蘑菇状雪包覆盖木屋，红灯笼照亮雪路，炊烟袅袅中体验最纯粹的北国冰',
        tags: [],
        imageUrl: '/images/landmarks/heilongjiang_04_xuexiang.jpg'
      },
      {
        name: '太阳岛风景区',
        nameEn: '太阳岛风景区',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '松花江北岸的国家级风景名胜区，夏季绿树成荫、花团锦簇。冬季的雪博会在此举办，大型雪雕作品气势恢宏，是中国冰雪艺术的盛会。',
        tags: [],
        imageUrl: '/images/landmarks/heilongjiang_05_taiyangdao.jpg'
      },
      {
        name: '五大连池风景区',
        nameEn: '五大连池风景区',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '世界地质公园，由五座火山和五个堰塞湖组成。火山锥体形态各异，矿泉富含微量元素，药山、温泊等景点展现了大自然的火山力量与水',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/heilongjiang_06_wudalianchi.jpg'
      },
      {
        name: '漠河北极村',
        nameEn: '漠河北极村',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最北端的村庄，冬至前后可以体验到极昼现象和最美的星空。北极哨所、北极楼、龙江第一湾等景点让每一个来到\'北陲\'的人心潮',
        tags: ['湖泊', '摄影'],
        imageUrl: '/images/landmarks/heilongjiang_07_mohe.jpg'
      },
      {
        name: '伏尔加庄园',
        nameEn: '伏尔加庄园',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '以俄罗斯经典建筑复原为主题的景区，圣彼得堡冬宫、华严寺等俄式建筑一应俱全。在异国风情的庭院中品茶赏景，仿佛置身俄罗斯乡村',
        tags: [],
        imageUrl: '/images/landmarks/heilongjiang_08_fuerga.jpg'
      },
      {
        name: '镜泊湖风景区',
        nameEn: '镜泊湖风景区',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最大的火山堰塞湖，风景如画。吊水楼瀑布气势磅礴，湖中岛屿星罗棋布。夏季泛舟湖上秋赏红叶，冬季还可以体验罕见的冰下奇观',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/heilongjiang_09_jingpohu.jpg'
      },
      {
        name: '哈尔滨冰雪大世界',
        nameEn: '哈尔滨冰雪大世界',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '全球最大的冰雪主题乐园，每年冬天用松花江冰块建造起一座冰雪城堡。冰雕作品晶莹剔透、灯光映照五彩斑斓，是哈尔滨冬季旅游的王',
        tags: ['亲子'],
        imageUrl: '/images/landmarks/heilongjiang_10_bingxue.jpg'
      },
      {
        name: '伊春五营国家森林公园',
        nameEn: '伊春五营国家森林公园',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最大原始红松林保护区，面积广阔、林木参天。漫步在千年红松的林海之间，呼吸负氧离子爆棚的空气，感受大自然最纯净的力量。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/heilongjiang_11_yichun.jpg'
      },
      {
        name: '鹤岗兴凯湖',
        nameEn: '鹤岗兴凯湖',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '中俄边境的最大淡水湖之一，面积广阔浩渺如烟海。湖畔湿地是丹顶鹤等珍稀候鸟的重要栖息地，日出时分湖面金光粼粼，壮阔无边。',
        tags: ['湖泊', '摄影'],
        imageUrl: '/images/landmarks/heilongjiang_12_xingkaihu.jpg'
      }
    ]
  },
  310000: {
    id: '310000',
    name: '上海',
    nameEn: 'Shanghai',
    description: '东方巴黎，魔都夜景璀璨夺目。外滩的万国建筑群与现代陆家嘴天际线隔江相望，弄堂里藏着最地道的海派生活。',
    color: '#0D6B5C',
    hotspotCount: 12,
    bestSeason: '春秋两季',
    avgRating: 4.5,
    hotspots: [
      {
        name: '外滩',
        nameEn: '外滩',
        type: 'urban',
        rating: 4.9,
        duration: '半天',
        price: '待定',
        shortDesc: '上海的城市名片，绵延1.5公里的江滨步道旁矗立着百余幢风格各异的历史建筑，被誉为万国建筑博览群。夜幕降临时灯火辉煌，对岸',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/shanghai_01_waitan.jpg'
      },
      {
        name: '上海迪士尼度假区',
        nameEn: '上海迪士尼度假区',
        type: 'adventure',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '中国大陆首座迪士尼乐园，拥有全球最高的迪士尼城堡。奇幻童话之旅涵盖多个 themed 园区，冰雪奇缘主题区域持续升级，带',
        tags: ['湖泊', '亲子', '主题乐园'],
        imageUrl: '/images/landmarks/shanghai_02_disney.jpg'
      },
      {
        name: '豫园',
        nameEn: '豫园',
        type: 'urban',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '明代江南古典园林，距今已有四百余年历史。亭台楼阁、曲径通幽，毗邻城隍庙商圈，南翔小笼包等上海传统美食汇聚于此，体验老上海',
        tags: ['湖泊', '美食', '城市'],
        imageUrl: '/images/landmarks/shanghai_03_yuyuan.jpg'
      },
      {
        name: '南京路步行街',
        nameEn: '南京路步行街',
        type: 'urban',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '有着百年历史的中华第一商业街，东起外滩西至中山公园。老字号店铺鳞次栉比，现代化商场林立其间，霓虹闪烁间尽显魔都繁华本色。',
        tags: ['城市'],
        imageUrl: '/images/landmarks/shanghai_04_nanjing.jpg'
      },
      {
        name: '东方明珠塔',
        nameEn: '东方明珠塔',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '上海标志性建筑，高468米，曾是亚洲第一高塔。透明悬空观光走廊令人刺激，旋转餐厅可360度欣赏浦江两岸风光，夜晚灯光变幻',
        tags: ['湖泊', '佛教'],
        imageUrl: '/images/landmarks/shanghai_05_dongfang.jpg'
      },
      {
        name: '田子坊',
        nameEn: '田子坊',
        type: 'urban',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '由老弄堂工厂改造而成的创意文化街区，汇聚了各式精品小店、咖啡馆和艺术家工作室。石库门建筑特色鲜明，是感受上海里弄文化和小',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/shanghai_06_tianzifang.jpg'
      },
      {
        name: '武康路-安福路街区',
        nameEn: '武康路-安福路街区',
        type: 'urban',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '上海最具魅力的Citywalk路线之一，梧桐掩映的林荫道上遍布历史保护和优秀历史建筑。武康大楼、各类精品咖啡和小众买手店',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/shanghai_07_wukang.jpg'
      },
      {
        name: '上海天文馆',
        nameEn: '上海天文馆',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '全球建筑面积最大的科技馆，坐落于浦东临港新片区。沉浸式星际影院、互动天文展览让探索宇宙变得触手可及，是科普爱好者和亲子家',
        tags: ['湖泊', '亲子'],
        imageUrl: '/images/landmarks/shanghai_08_tianwen.jpg'
      },
      {
        name: '朱家角古镇',
        nameEn: '朱家角古镇',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '上海四大历史文化名镇之一，有着千年历史的江南水乡。放生桥横跨漕港河，沿河粉墙黛瓦、小船悠悠，体验\'上海威尼斯\'的慢生活时',
        tags: ['湖泊', '古城'],
        imageUrl: '/images/landmarks/shanghai_09_zhujiajiao.jpg'
      },
      {
        name: '新天地',
        nameEn: '新天地',
        type: 'urban',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '以上海独有的石库门建筑群为基础打造的时尚文化街区。将百年老宅改造为精品餐厅、酒吧和艺术展厅，新旧碰撞出独特的海派文化魅力',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/shanghai_10_xintiandi.jpg'
      },
      {
        name: '上海海昌海洋公园',
        nameEn: '上海海昌海洋公园',
        type: 'adventure',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '坐落于临港新城的大型海洋主题乐园，拥有虎鲸表演、极地动物、珊瑚港湾等多个主题区域。互动体验丰富，是亲子游和海洋生物爱好者',
        tags: ['湖泊', '亲子', '主题乐园'],
        imageUrl: '/images/landmarks/shanghai_11_haichang.jpg'
      },
      {
        name: '陆家嘴金融中心',
        nameEn: '陆家嘴金融中心',
        type: 'adventure',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最具影响力的金融贸易区之一，上海中心大厦、环球金融中心、金茂大厦三大超级地标拔地而起。登顶上海中心56层的观光厅，一',
        tags: ['湖泊', '主题乐园'],
        imageUrl: '/images/landmarks/shanghai_12_lujiazui.jpg'
      }
    ]
  },
  320000: {
    id: '320000',
    name: '江苏',
    nameEn: 'Jiangsu',
    description: '江南水乡的精华所在，园林与古城荟萃。',
    color: '#1A8A7A',
    hotspotCount: 12,
    avgRating: 4.6,
    hotspots: [
      {
        name: '苏州园林（拙政园）',
        nameEn: '苏州园林（拙政园）',
        type: 'cultural',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '中国四大名园之一，被誉为\'中国园林之母\'。小桥流水、亭台楼阁、假山池沼布局精巧，体现了中国文人写意山水画的极致境界，是来',
        tags: [],
        imageUrl: '/images/landmarks/jiangsu_01_zhuozheng.jpg'
      },
      {
        name: '南京夫子庙-秦淮河风光带',
        nameEn: '南京夫子庙-秦淮河风光带',
        type: 'urban',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最大的传统古街市，以夫子庙为中心、秦淮河为纽带。夜晚画舫巡游、灯火如昼，两岸酒楼茶肆古色古香，尽显\'烟笼寒水月笼沙\'',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/jiangsu_02_fuzimiao.jpg'
      },
      {
        name: '扬州瘦西湖',
        nameEn: '扬州瘦西湖',
        type: 'natural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '因婉约秀丽而得名\'小家碧玉\'的湖泊园林，二十四个景点串珠成链。五亭桥、二十四桥等名景精巧雅致，清晨薄雾中的瘦西湖堪称水墨',
        tags: ['湖泊', '自然'],
        imageUrl: '/images/landmarks/jiangsu_03_shouxihu.jpg'
      },
      {
        name: '南京明孝陵',
        nameEn: '南京明孝陵',
        type: 'urban',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '明太祖朱元璋与马皇后的合葬墓，世界文化遗产。神道石像生气势恢宏，秋季石象路的银杏红叶隧道美不胜收，是中国陵寝建筑的杰作。',
        tags: ['城市'],
        imageUrl: '/images/landmarks/jiangsu_04_mingxiao.jpg'
      },
      {
        name: '周庄古镇',
        nameEn: '周庄古镇',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国第一水乡，有\'上有天堂下有苏杭中有周庄\'之美誉。双桥、沈厅、张厅等古迹保存完好，晨雾中的小桥流水人家宛如一幅活着的江',
        tags: ['古城'],
        imageUrl: '/images/landmarks/jiangsu_05_zhouzhuang.jpg'
      },
      {
        name: '无锡太湖鼋头渚',
        nameEn: '无锡太湖鼋头渚',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '太湖第一胜景，因地形酷似浮鼋探头而得名。每年三月樱花谷万株樱花开如云霞，被誉为世界三大赏樱胜地之一，太湖的烟波浩渺在此尽',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/jiangsu_06_yuantou.jpg'
      },
      {
        name: '苏州拙政园',
        nameEn: '苏州拙政园',
        type: 'cultural',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '江南园林艺术的巅峰之作，以水池为中心、亭台临水而建。移步换景、咫尺之内再造乾坤，每一扇花窗都是一幅天然的框景画作，堪称中',
        tags: [],
        imageUrl: '/images/landmarks/jiangsu_07_zhuozheng2.jpg'
      },
      {
        name: '徐州云龙湖',
        nameEn: '徐州云龙湖',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '徐州的城市之眸，三面环山一面临城。湖中龙脊半岛如卧龙之脊，云龙山俯瞰全城。苏轼曾在此疏浚湖泊，千年文脉与现代休闲完美融合',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/jiangsu_08_yunlong.jpg'
      },
      {
        name: '连云港花果山',
        nameEn: '连云港花果山',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '《西游记》中孙悟空的故乡，水帘洞、仙人棋盘等景点与名著描述高度契合。玉女峰是江苏省最高峰，登临远眺黄海碧波，想象齐天大圣',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/jiangsu_09_huaguo.jpg'
      },
      {
        name: '镇江金山寺',
        nameEn: '镇江金山寺',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '传说\'水漫金山\'的发生地，始建于东晋，是中国佛教禅宗名寺。寺中慈寿塔高耸入云，寺内珍藏的《慈山寺碑》墨迹千古，金山揽胜为',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/jiangsu_10_jinshan.jpg'
      },
      {
        name: '无锡灵山大佛',
        nameEn: '无锡灵山大佛',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '高达88米的青铜露天释迦牟尼立像，是目前世界最大的露天青铜坐佛。灵山梵宫装饰华丽、金碧辉煌，九龙灌浴表演震撼人心，是佛教',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/jiangsu_11_lingshan.jpg'
      },
      {
        name: '苏州金鸡湖',
        nameEn: '苏州金鸡湖',
        type: 'urban',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '现代苏州的城市客厅，湖东高楼林立、湖西绿意盎然。东方之门、苏州中心等地标建筑倒映湖中，音乐喷泉和水幕电影让这里成为夜游苏',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/jiangsu_12_jinji.jpg'
      }
    ]
  },
  330000: {
    id: '330000',
    name: '浙江',
    nameEn: 'Zhejiang',
    description: '江南水乡的极致代表——杭州西湖的诗情画意、乌镇的小桥流水、普陀山的梵音缭绕。',
    color: '#2EA89A',
    hotspotCount: 16,
    bestSeason: '春季（3-5月）、秋季（9-11月）',
    avgRating: 4.5,
    hotspots: [
      {
        name: '西湖风景区',
        nameEn: '西湖风景区',
        type: 'natural',
        rating: 4.9,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，位于杭州市中心，以\'人间天堂\'著称。断桥残雪、苏堤春晓、雷峰夕照等十景闻名天下，湖水潋滟，山色空蒙，四季皆',
        tags: ['湖泊', '自然'],
        imageUrl: '/images/landmarks/zhejiang_01_xihu.jpg'
      },
      {
        name: '乌镇',
        nameEn: '乌镇',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最著名的江南水乡古镇之一，位于桐乡市。保存着完整的明清古建筑群和水巷纵横的格局，小桥流水人家，是体验江南水乡生活的绝',
        tags: ['古城'],
        imageUrl: '/images/landmarks/zhejiang_02_wuzhen.jpg'
      },
      {
        name: '普陀山',
        nameEn: '普陀山',
        type: 'urban',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '中国四大佛教名山之一，位于舟山市嵊泗列岛附近的海上仙山。这里是观音菩萨的道场，拥有普济寺、南天门等百年古刹，海天佛国气势',
        tags: ['湖泊', '佛教', '城市'],
        imageUrl: '/images/landmarks/zhejiang_03_putuo.jpg'
      },
      {
        name: '雁荡山',
        nameEn: '雁荡山',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '位于乐清市，被誉为\'东南第一山\'，以奇峰怪石、飞瀑流泉著称。灵峰夜景、大龙漱瀑布、灵岩飞渡是其三大绝景，山水之间尽显鬼斧',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/zhejiang_04_yandang.jpg'
      },
      {
        name: '楠溪江',
        nameEn: '楠溪江',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于永嘉县，以山水秀丽、田园风光迷人而著称。清碧的江水穿过古朴的村落，竹筏漂流是最佳体验方式，处处是\'江南好风景\'的诗意',
        tags: [],
        imageUrl: '/images/landmarks/zhejiang_05_nanxi.jpg'
      },
      {
        name: '横店影视城',
        nameEn: '横店影视城',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于东阳市，是全球规模最大的影视拍摄基地。还原了故宫、圆明园、阿房宫等历史场景，游客仿佛穿越古今，还能偶遇剧组拍戏。',
        tags: [],
        imageUrl: '/images/landmarks/zhejiang_06_hengdian.jpg'
      },
      {
        name: '西溪湿地',
        nameEn: '西溪湿地',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于杭州市区西部，是国家湿地公园和城市绿肺。芦苇荡漾、水道纵横，秋芦飞雪美不胜收，\'城市之肾\'的美誉实至名归。',
        tags: [],
        imageUrl: '/images/landmarks/zhejiang_07_xixi.jpg'
      },
      {
        name: '莫干山',
        nameEn: '莫干山',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于德清县，以竹海、温泉和民国别墅群闻名。曾是众多文人雅士的避暑胜地，如今精品民宿集群让这座名山焕发出新的时尚活力。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/zhejiang_08_mogan.jpg'
      },
      {
        name: '南浔古镇',
        nameEn: '南浔古镇',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于湖州市，是江南六大古镇之一。中西合璧的建筑风格独具特色，小莲庄、嘉业堂藏书楼彰显深厚的文化底蕴，商业化程度低，保留了',
        tags: ['湖泊', '古城'],
        imageUrl: '/images/landmarks/zhejiang_09_nanxun.jpg'
      },
      {
        name: '鲁迅故里',
        nameEn: '鲁迅故里',
        type: 'urban',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于绍兴市，是国家5A级景区。游客可以走进鲁迅笔下的百草园和三味书屋，感受这位文学巨匠的成长足迹，品味浓浓的绍兴人文气息',
        tags: ['城市'],
        imageUrl: '/images/landmarks/zhejiang_10_luxun.jpg'
      },
      {
        name: '东钱湖',
        nameEn: '东钱湖',
        type: 'natural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于宁波市，是浙江最大的湖泊，面积相当于杭州西湖的五倍。环湖有南宋石刻公园、小普陀等景点，骑行环湖是最受欢迎的休闲方式。',
        tags: ['湖泊', '自然'],
        imageUrl: '/images/landmarks/zhejiang_11_dongqian.jpg'
      },
      {
        name: '兰溪诸葛八卦村',
        nameEn: '兰溪诸葛八卦村',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于金华市兰溪市，是全国最大的诸葛亮后裔聚居地。八卦阵布局的古村落保存完好，八条小巷向外延伸，形成独特的迷宫式街巷格局。',
        tags: [],
        imageUrl: '/images/landmarks/zhejiang_12_zhuge.jpg'
      },
      {
        name: '松阳古村落',
        nameEn: '松阳古村落',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于丽水市松阳县，被誉为\'最后的江南秘境\'。散落着数百个保存完好的千年古村，云雾缭绕中的黄墙黛瓦，是摄影爱好者的天堂。',
        tags: ['摄影'],
        imageUrl: '/images/landmarks/zhejiang_13_songyang.jpg'
      },
      {
        name: '衢州市烂柯山',
        nameEn: '衢州市烂柯山',
        type: 'cultural',
        rating: 4.2,
        duration: '半天',
        price: '待定',
        shortDesc: '位于衢州市区东南，因\'王质遇仙\'的围棋典故而闻名天下。山中怪石嶙峋、古木参天，传说在此观棋可忘世，是围棋文化的圣地。',
        tags: [],
        imageUrl: '/images/landmarks/zhejiang_14_lanke.jpg'
      },
      {
        name: '沈园',
        nameEn: '沈园',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于绍兴市越城区，是南宋著名园林。陆游与唐婉凄美的爱情故事在此留下千古绝唱，《钗头凤》的词作让这座小园充满了浪漫而哀婉的',
        tags: [],
        imageUrl: '/images/landmarks/zhejiang_15_shenyuan.jpg'
      },
      {
        name: '普陀山朱家尖',
        nameEn: '普陀山朱家尖',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于舟山市，与普陀山隔海相望。南沙拥有优质沙滩和沙雕艺术广场，观音法界是目前全球规模最大的佛教文化综合景区之一。',
        tags: ['湖泊', '佛教'],
        imageUrl: '/images/landmarks/zhejiang_16_zhujiajian.jpg'
      }
    ]
  },
  340000: {
    id: '340000',
    name: '安徽',
    nameEn: 'Anhui',
    description: '黄山归来不看岳，徽派建筑的古韵风华。',
    color: '#0D6B5C',
    hotspotCount: 15,
    avgRating: 4.5,
    hotspots: [
      {
        name: '黄山风景区',
        nameEn: '黄山风景区',
        type: 'cultural',
        rating: 5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国第一名山，世界文化与自然双重遗产。奇松、怪石、云海、温泉、冬雪\'五绝\'举世闻名，\'五岳归来不看山，黄山归来不看岳\'是',
        tags: ['湖泊', '摄影'],
        imageUrl: '/images/landmarks/anhui_01_huangshan.jpg'
      },
      {
        name: '宏村',
        nameEn: '宏村',
        type: 'urban',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，被誉为\'中国画里的乡村\'。独特的牛形水系布局、粉墙黛瓦的徽派建筑倒映在月沼湖中，是写生和摄影的绝佳目的地。',
        tags: ['湖泊', '摄影', '城市'],
        imageUrl: '/images/landmarks/anhui_02_hongcun.jpg'
      },
      {
        name: '西递村',
        nameEn: '西递村',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，有\'古民居博物馆\'之称。村中明清古建筑林立，砖木石雕精美绝伦，胡文光牌坊气势恢宏，每一扇窗棂都值得细细品味',
        tags: [],
        imageUrl: '/images/landmarks/anhui_03_xidi.jpg'
      },
      {
        name: '九华山',
        nameEn: '九华山',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '中国四大佛教名山之一，地藏菩萨的道场。群峰叠翠，寺庙林立，化城寺、百岁宫香火鼎盛，朝圣与赏景两不误，是心灵休憩的理想之地',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/anhui_04_jiuhua.jpg'
      },
      {
        name: '天柱山',
        nameEn: '天柱山',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于潜山市，古称\'南岳\'，世界地质公园。主峰天柱峰海拔1489米，如一擎天巨柱直插云霄，峰林峡谷壮丽奇特，有\'江淮第一山',
        tags: ['雪山', '湖泊'],
        imageUrl: '/images/landmarks/anhui_05_tianzhu.jpg'
      },
      {
        name: '齐云山',
        nameEn: '齐云山',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '中国四大道教名山之一，以丹霞地貌和摩崖石刻著称。山体呈独特的红色赤壁丹崖，云海日出美不胜收，摩崖石刻遍布山间，文化底蕴深',
        tags: ['湖泊', '摄影'],
        imageUrl: '/images/landmarks/anhui_06_qiyun.jpg'
      },
      {
        name: '太平湖',
        nameEn: '太平湖',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于黄山市黄山区，被誉为\'黄山情侣\'。湖水碧绿如玉，散布着众多岛屿，乘船漫游其间，远处可见黄山的雄姿倒映水中，令人心旷神',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/anhui_07_taiping.jpg'
      },
      {
        name: '三河古镇',
        nameEn: '三河古镇',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于合肥市肥西县，是国家5A级景区。以水乡古镇风貌著称，三国古战场遗址、杨振宁旧居等景点丰富，庐州小吃更是让人垂涎。',
        tags: ['湖泊', '古城', '美食'],
        imageUrl: '/images/landmarks/anhui_08_sanhe.jpg'
      },
      {
        name: '亳州古城',
        nameEn: '亳州古城',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '华夏文明古都，曹操和华佗的故乡。花戏楼雕刻精美绝伦，曹操运兵道是地下军事奇迹，中医药文化源远流长，是一座活着的历史博物馆',
        tags: ['古城'],
        imageUrl: '/images/landmarks/anhui_09_bozhou.jpg'
      },
      {
        name: '琅琊山',
        nameEn: '琅琊山',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于滁州市，因欧阳修的《醉翁亭记》名扬天下。醉翁亭是中国四大名亭之一，琅琊山自古就有\'亭、台、楼、阁、轩、榭\'诸胜俱全的',
        tags: [],
        imageUrl: '/images/landmarks/anhui_10_langya.jpg'
      },
      {
        name: '呈坎',
        nameEn: '呈坎',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于黄山市徽州区，有\'中国风水第一村\'之称。按易经八卦布局的古村落，半亩塘荷花盛开时格外迷人，粉墙黛瓦间隐藏着浓厚的徽商',
        tags: [],
        imageUrl: '/images/landmarks/anhui_11_chengkan.jpg'
      },
      {
        name: '屯溪老街',
        nameEn: '屯溪老街',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于黄山市屯溪区，被称为\'活动着的清明上河图\'。整条街保存着明清时期的商铺建筑，徽墨、歙砚、茶叶等徽州特产琳琅满目，夜晚',
        tags: ['湖泊', '古城'],
        imageUrl: '/images/landmarks/anhui_12_tunxi.jpg'
      },
      {
        name: '龙川景区',
        nameEn: '龙川景区',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于宣城市绩溪县，是胡姓聚族而居的古村落。胡氏宗雕楼精美非凡，徽派木雕堪称一绝，村前龙川河如碧玉带环绕，风景如画。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/anhui_13_longchuan.jpg'
      },
      {
        name: '包公园',
        nameEn: '包公园',
        type: 'cultural',
        rating: 4.2,
        duration: '半天',
        price: '待定',
        shortDesc: '位于合肥市，是为纪念北宋清官包拯而建的综合景区。包公祠、包公墓、清风阁等建筑错落有致，了解一代名臣铁面无私的故事，感受廉',
        tags: [],
        imageUrl: '/images/landmarks/anhui_14_baogong.jpg'
      },
      {
        name: '黟县奇墅湖',
        nameEn: '黟县奇墅湖',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于黄山市黟县，隐藏在宏村附近的自然秘境。湖面如镜倒映着远处的宏村白墙黛瓦，晨雾弥漫时宛如仙境，是避开人流的低调宝藏景点',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/anhui_15_qishu.jpg'
      }
    ]
  },
  350000: {
    id: '350000',
    name: '福建',
    nameEn: 'Fujian',
    description: '山海交响的东南明珠。厦门的文艺小资、土楼的古老神秘、武夷山的碧水丹霞。',
    color: '#1A8A7A',
    hotspotCount: 16,
    bestSeason: '春秋两季',
    avgRating: 4.5,
    hotspots: [
      {
        name: '武夷山',
        nameEn: '武夷山',
        type: 'cultural',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化与自然双遗产，以\'奇秀甲於东南\'著称。九曲溪竹筏漂流是精华所在，两岸丹霞地貌峰峦叠嶂，大红袍母树更让这座山成为茶',
        tags: [],
        imageUrl: '/images/landmarks/fujian_01_wuyishan.jpg'
      },
      {
        name: '鼓浪屿',
        nameEn: '鼓浪屿',
        type: 'urban',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，厦门思明区西南面小岛。岛上没有机动车，万国建筑群错落有致，钢琴之声萦绕巷弄，日光岩俯瞰全岛和台湾海峡，文艺',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/fujian_02_gulangyu.jpg'
      },
      {
        name: '福建土楼（永定）',
        nameEn: '福建土楼（永定）',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，位于龙岩市永定区。巨大的环形或方形土建筑依山而建，可容纳数千居民，是客家文化的杰出代表，被赞誉为\'东方古城',
        tags: ['古城'],
        imageUrl: '/images/landmarks/fujian_03_tulou.jpg'
      },
      {
        name: '三坊七巷',
        nameEn: '三坊七巷',
        type: 'urban',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于福州市中心，是中国保存最完整的明清古建筑街区之一。\'半部中国近代史\'从这里走出，林则徐、严复等名人故居遍布，是一条行',
        tags: ['城市'],
        imageUrl: '/images/landmarks/fujian_04_sanfang.jpg'
      },
      {
        name: '太姥山',
        nameEn: '太姥山',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于福鼎市，东海仙山，国之山海奇观。以峰险、石奇、洞幽著称，花岗岩球状风化形成的怪石遍布山野，云雾中出现的海上石林令人叹',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/fujian_05_taimu.jpg'
      },
      {
        name: '清源山',
        nameEn: '清源山',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于泉州市，泉州人的后花园。老君岩是中国现存最大的宋代道教石雕造像，登上天台可远眺泉州古城与海湾，儒释道三教在此和谐共存',
        tags: ['湖泊', '古城'],
        imageUrl: '/images/landmarks/fujian_06_qingyuan.jpg'
      },
      {
        name: '湄洲岛',
        nameEn: '湄洲岛',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于莆田市，妈祖文化的发源地。妈祖祖庙是全世界妈祖信众心中的圣地，每年妈祖诞辰日，海内外数万名信众前来朝拜，香火绵延千年',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/fujian_07_meizhou.jpg'
      },
      {
        name: '泰宁大金湖',
        nameEn: '泰宁大金湖',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于三明市泰宁县，世界地质公园。湖面镶嵌着丹霞地貌的群山，水上丹霞与自然洞穴交相辉映，九龙潭的水上泛舟犹如在山水画中游走',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/fujian_08_taining.jpg'
      },
      {
        name: '东山岛',
        nameEn: '东山岛',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于漳州市东山县，素有\'闽南明珠\'之称。金銮湾的天际线沙滩平坦如镜，苏峰山环岛路穿行于悬崖峭壁之间，《左耳》等影视剧曾在',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/fujian_09_dongshan.jpg'
      },
      {
        name: '泉州开元寺',
        nameEn: '泉州开元寺',
        type: 'urban',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '位于泉州市区，福建省内规模最大的佛教寺院。东西双塔是中国最高的石塔，千年古桑依然枝繁叶茂，这里是海上丝绸之路起点的重要文',
        tags: ['湖泊', '佛教', '城市'],
        imageUrl: '/images/landmarks/fujian_10_kaiyuan.jpg'
      },
      {
        name: '白水洋',
        nameEn: '白水洋',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于宁德市屏南县，被誉为\'世界奇异之旅\'。宽阔的河床平坦如镜，浅水之上可以自由奔跑嬉戏，是世界上罕见的丹霞水上广场，夏日',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/fujian_11_baishui.jpg'
      },
      {
        name: '青云山',
        nameEn: '青云山',
        type: 'natural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于福州市永泰县，国家级森林公园。瀑布群气势磅礴，天池湖碧水如镜，原始森林茂密幽深，负氧离子含量极高，是天然的森林氧吧。',
        tags: ['湖泊', '自然'],
        imageUrl: '/images/landmarks/fujian_12_qingyun.jpg'
      },
      {
        name: '冠豸山',
        nameEn: '冠豸山',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于龙岩市连城县，世界地质公园。丹霞地貌与碧水丹崖交相辉映，石门湖如绿色丝带穿过山间，培田古民居展示了精美的客家传统建筑',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/fujian_13_guanzai.jpg'
      },
      {
        name: '古田旅游区',
        nameEn: '古田旅游区',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于龙岩市上杭县，国家5A级景区。古田会议旧址是中国共产党历史上最重要的转折点之一，纪念馆详实地记录了这段改变中国命运的',
        tags: [],
        imageUrl: '/images/landmarks/fujian_14_gutian.jpg'
      },
      {
        name: '平潭岛',
        nameEn: '平潭岛',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '福建省第一大岛，中国第五大岛。长江澳风车田是壮观的日落打卡地，仙人井的海蚀地貌鬼斧神工，每年春季的\'蓝眼泪\'荧光海奇观吸',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/fujian_15_pingtan.jpg'
      },
      {
        name: '泉州崇武古城',
        nameEn: '泉州崇武古城',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于惠安县，全国重点文物保护单位。明代stone城墙保存完整，沿着海岸线蜿蜒数公里，惠安女独特的服饰文化和石头厝民居构成',
        tags: ['湖泊', '古城'],
        imageUrl: '/images/landmarks/fujian_16_chongwu.jpg'
      }
    ]
  },
  360000: {
    id: '360000',
    name: '江西',
    nameEn: 'Jiangxi',
    description: '庐山烟雨浙江潮，红色摇篮与山水人文。',
    color: '#C23B22',
    hotspotCount: 14,
    avgRating: 4.5,
    hotspots: [
      {
        name: '庐山',
        nameEn: '庐山',
        type: 'cultural',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，中华十大名山之一。\'不识庐山真面目，只缘身在此山中\'，云雾变幻莫测，瀑布飞流直下，美廬山牯岭镇是高山上的桃',
        tags: ['雪山', '湖泊'],
        imageUrl: '/images/landmarks/jiangxi_01_lushan.jpg'
      },
      {
        name: '三清山',
        nameEn: '三清山',
        type: 'cultural',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '世界自然遗产，花岗岩峰林地貌的杰作。玉京、玉虚、玉华三峰如道家三位天尊并列，巨型花岗岩塑造的神仙雕塑形态逼真，被誉为\'西',
        tags: [],
        imageUrl: '/images/landmarks/jiangxi_02_sanqing.jpg'
      },
      {
        name: '婺源篁岭',
        nameEn: '婺源篁岭',
        type: 'adventure',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '被誉为\'中国最美乡村\'的核心景区。晒秋景观闻名天下，层层叠叠的梯田梯田，花海遍地，油菜花季金黄如海洋，是摄影爱好者心中的',
        tags: ['湖泊', '摄影', '主题乐园'],
        imageUrl: '/images/landmarks/jiangxi_03_wuyuan.jpg'
      },
      {
        name: '龙虎山',
        nameEn: '龙虎山',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '中国道教发祥地，世界自然遗产。泸溪河上的泸溪河是风景，丹霞地貌的仙岩奇峰如天然道观，悬棺表演更是千年未解之谜，惊险震撼。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/jiangxi_04_longhu.jpg'
      },
      {
        name: '滕王阁',
        nameEn: '滕王阁',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '江南三大名楼之首，位于南昌市赣江之滨。王勃的《滕王阁序》让此阁名扬天下，登楼远眺，落霞与孤鹜齐飞，秋水共长天一色的意境在',
        tags: [],
        imageUrl: '/images/landmarks/jiangxi_05_tengwang.jpg'
      },
      {
        name: '井冈山',
        nameEn: '井冈山',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国革命的摇篮，国家5A级景区。壮美的杜鹃花海与丰富的红色遗址交相辉映，黄洋界哨口的炮声犹在耳边回响，茨坪旧址见证了那段',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/jiangxi_06_jinggang.jpg'
      },
      {
        name: '景德镇古窑民俗博览区',
        nameEn: '景德镇古窑民俗博览区',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于瓷都景德镇，展示千年制瓷工艺的活态博物馆。从古窑遗址到非遗传承人的现场制作，每一件瓷器都凝聚着匠心，亲手体验拉坯烧瓷',
        tags: ['世界遗产'],
        imageUrl: '/images/landmarks/jiangxi_07_jingdezhen.jpg'
      },
      {
        name: '明月山',
        nameEn: '明月山',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于宜春市，以月亮文化闻名天下。天然氧吧空气清新，温汤温泉驰名中外，登山步道两旁竹林茂密，山顶观景台可俯瞰整片月文化景观',
        tags: []
      },
      {
        name: '仙女湖',
        nameEn: '仙女湖',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于新余市，中国爱情文化的经典象征。相传是七仙女下凡沐浴的地方，湖中散落的岛屿如珍珠般美丽，春天万亩油菜花海与碧水相映，',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/jiangxi_09_xiannv.jpg'
      },
      {
        name: '浯溪碑林',
        nameEn: '浯溪碑林',
        type: 'cultural',
        rating: 4.2,
        duration: '半天',
        price: '待定',
        shortDesc: '位于永州市祁阳县，摩崖石刻群规模宏大。颜真卿等书法大家在此留下珍贵遗迹，每一块石碑都是历史的见证，书法爱好者必去的文化圣',
        tags: [],
        imageUrl: '/images/landmarks/jiangxi_10_wuxi.jpg'
      },
      {
        name: '石城',
        nameEn: '石城',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于赣州市石城县，秋天红叶漫山遍野。银杏古树群已有千年历史，红叶与古村、炊烟构成一幅绝美的赣南秋景图，是南方罕见的红叶观',
        tags: [],
        imageUrl: '/images/landmarks/jiangxi_11_shicheng.jpg'
      },
      {
        name: '望仙谷',
        nameEn: '望仙谷',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于上饶市广信区，近年爆火的沉浸式峡谷景区。悬崖峭壁上的民宿在夜色中灯光璀璨，如仙侠世界的空中楼阁，仿佛走进了水墨画中。',
        tags: [],
        imageUrl: '/images/landmarks/jiangxi_12_wangxian.jpg'
      },
      {
        name: '葛仙村',
        nameEn: '葛仙村',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于上饶市铅山县，以道教仙文化为主题的度假区。夜幕降临后的灯光秀美轮美奂，温泉度假村、古装体验和夜景烟花让人穿越千年。',
        tags: [],
        imageUrl: '/images/landmarks/jiangxi_13_gexian.jpg'
      },
      {
        name: '瑶里古镇',
        nameEn: '瑶里古镇',
        type: 'urban',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于景德镇市浮梁县，有\'瓷之源、茶之乡、林之海\'美誉。明清古建筑保存完好，茶马古道蜿蜒山间，是景德镇瓷文化最重要的源头之',
        tags: ['湖泊', '古城', '城市'],
        imageUrl: '/images/landmarks/jiangxi_14_yaoli.jpg'
      }
    ]
  },
  370000: {
    id: '370000',
    name: '山东',
    nameEn: 'Shandong',
    description: '孔孟之乡，一山一水一圣人。',
    color: '#0D6B5C',
    hotspotCount: 14,
    avgRating: 4.5,
    hotspots: [
      {
        name: '泰山',
        nameEn: '泰山',
        type: 'cultural',
        rating: 4.9,
        duration: '半天',
        price: '待定',
        shortDesc: '五岳之首，世界文化与自然双重遗产。\'会当凌绝顶，一览众山小\'，历代帝王封禅之地，十八盘、南天门、玉皇顶沿途奇景不断，日出',
        tags: ['湖泊', '摄影'],
        imageUrl: '/images/landmarks/shandong_01_taishan.jpg'
      },
      {
        name: '趵突泉',
        nameEn: '趵突泉',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '天下第一泉，位于济南市区。三股泉水喷涌不息，终年水位不降，李清照词中的漱玉泉就在此处。趵突泉公园古木参天，泉水潺潺，是济',
        tags: [],
        imageUrl: '/images/landmarks/shandong_02_baotu.jpg'
      },
      {
        name: '青岛栈桥',
        nameEn: '青岛栈桥',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '青岛的象征，建于1892年。440米的栈桥深入大海，尽头的回澜阁是绝佳观景点，海鸥盘旋、浪花拍岸，日落时分的海天一色最是',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/shandong_03_zhanqiao.jpg'
      },
      {
        name: '崂山风景区',
        nameEn: '崂山风景区',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '海上第一名山，中国海岸线最高峻的山峰。道教文化源远流长，太清宫是千年道观，山海相连的壮阔景观让李白都为之沉醉，\'巨流浮沧',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/shandong_04_laoshan.jpg'
      },
      {
        name: '孔庙、孔府、孔林（三孔）',
        nameEn: '孔庙、孔府、孔林（三孔）',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，位于曲阜市。分别是祭祀孔子的庙宇、孔子后裔居住的府邸和孔子家族墓地，建筑宏伟、碑刻林立，儒家文化的精神圣地',
        tags: [],
        imageUrl: '/images/landmarks/shandong_05_san.jpg'
      },
      {
        name: '蓬莱阁',
        nameEn: '蓬莱阁',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国古代四大名楼之一，仙境般存在的地方。传说中八仙过海之处，海市蜃楼的奇观偶尔现身人间，戚继光纪念馆见证了这座海上雄关的',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/shandong_06_penglai.jpg'
      },
      {
        name: '大明湖',
        nameEn: '大明湖',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '\'四面荷花三面柳，一城山色半城湖\'。大明湖是济南的明珠，超然楼夜景令人惊艳，夏荷冬雪各有千秋，老舍笔下的济南由此而生。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/shandong_07_daming.jpg'
      },
      {
        name: '青岛八大关',
        nameEn: '青岛八大关',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '\'万国建筑博览会\'，每条街道以关隘命名。花石楼、公主别墅等各国风格建筑掩映在花树之间，秋季落叶铺满街道，是青岛最浪漫的打',
        tags: [],
        imageUrl: '/images/landmarks/shandong_08_badaguan.jpg'
      },
      {
        name: '威海刘公岛',
        nameEn: '威海刘公岛',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '海上仙山，甲午战争的见证地。岛上海军博物馆、甲午战争博物馆系统展示了那段屈辱与奋起的历史，北洋水师提督署承载着厚重的民族',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/shandong_09_liugong.jpg'
      },
      {
        name: '台儿庄古城',
        nameEn: '台儿庄古城',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '京杭大运河上唯一的古城，抗战英雄城。古城内有众多的古桥、庙宇和运河码头，夜景尤为璀璨，运河文化与大侠精神在此交融。',
        tags: ['湖泊', '古城'],
        imageUrl: '/images/landmarks/shandong_10_taierzhuang.jpg'
      },
      {
        name: '沂蒙山',
        nameEn: '沂蒙山',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '山东省第二大山脉，蒙山主峰海拔1156米。\'沂蒙山，壮美风光\'名不虚传，龟蒙顶、云蒙峰等景观壮美，红色革命旧址也增添了深',
        tags: ['雪山', '湖泊'],
        imageUrl: '/images/landmarks/shandong_11_yimeng.jpg'
      },
      {
        name: '日照万平口',
        nameEn: '日照万平口',
        type: 'urban',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '日照最著名的海滨浴场，细腻的金黄色沙滩绵延长达数公里。这里是看日出的绝佳位置，冲浪、帆船等海上娱乐项目丰富，傍晚散步浪漫',
        tags: ['湖泊', '摄影', '城市'],
        imageUrl: '/images/landmarks/shandong_13_wanping.jpg'
      },
      {
        name: '成山头',
        nameEn: '成山头',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '中国的好望角，大陆最先看到海上日出的地方。秦始皇两次驾临此处求仙问道，海驴岛的海鸥群在春夏季节遮天蔽日，天尽头碑前合影留',
        tags: ['湖泊', '摄影'],
        imageUrl: '/images/landmarks/shandong_13_chengshan.jpg'
      },
      {
        name: '周村古商城',
        nameEn: '周村古商城',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '\'天下第一村\'，保存最完整的明清古商业建筑群之一。大染坊的发源地，丝绸商号林立，糖桂花、烧饼等传统手工艺和美食让人感受到',
        tags: ['美食'],
        imageUrl: '/images/landmarks/shandong_14_zhoucun.jpg'
      }
    ]
  },
  410000: {
    id: '410000',
    name: '河南',
    nameEn: 'Henan',
    description: '华夏文明的发源地，一部河南史半部中国史。',
    color: '#C23B22',
    hotspotCount: 14,
    avgRating: 4.5,
    hotspots: [
      {
        name: '龙门石窟',
        nameEn: '龙门石窟',
        type: 'cultural',
        rating: 4.9,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，中国三大石窟之一。2345个窟龛、10万余尊佛像沿伊河两岸开凿，奉先寺卢舍那大佛端庄慈祥，代表了北魏至盛唐',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/henan_01_longmen.jpg'
      },
      {
        name: '少林寺',
        nameEn: '少林寺',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '中国佛教禅宗祖庭和功夫发源地。位于嵩山五乳峰下，始建于北魏，千年古刹中少林功夫名扬天下，塔林是中国最大的古代僧人墓群。',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/henan_02_shaolin.jpg'
      },
      {
        name: '清明上河园',
        nameEn: '清明上河园',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '国家5A景区，以张择端《清明上河图》为蓝本打造的大型宋代民俗主题公园。虹桥、大宋武侠城重现了北宋汴京的繁华，每天都有精彩',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/henan_03_qingming.jpg'
      },
      {
        name: '云台山',
        nameEn: '云台山',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界地质公园，位于焦作修武县。红石峡的丹霞赤壁与碧绿泉水相映成趣，瀑布群落差达314米，潭瀑峡三步一泉五步一瀑，堪称北方',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/henan_04_yuntai.jpg'
      },
      {
        name: '殷墟',
        nameEn: '殷墟',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，商代后期都城遗址。甲骨文的发现地，司母戊大方鼎的出土让三千年前的青铜文明重见天日，让这座城市当之无愧地成为',
        tags: [],
        imageUrl: '/images/landmarks/henan_05_yinxu.jpg'
      },
      {
        name: '嵩山',
        nameEn: '嵩山',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '中岳嵩山，五岳之一。少林武术的发源地，嵩阳书院是中国古代四大书院之一，中岳庙规模最大， Mount Song is a ',
        tags: [],
        imageUrl: '/images/landmarks/henan_06_songshan.jpg'
      },
      {
        name: '白马寺',
        nameEn: '白马寺',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国第一古刹，东汉明帝时期建立。佛教传入中国后兴建的第一座寺院，已有1900多年历史，国际佛殿区的泰国、缅甸、印度风格佛',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/henan_07_baima.jpg'
      },
      {
        name: '开封鼓楼',
        nameEn: '开封鼓楼',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '开封最具代表性的地标之一，夜市美食文化闻名全国。夜晚的鼓楼广场灯火通明，灌汤包、花生糕等开封特色美食让人流连忘返。',
        tags: ['美食'],
        imageUrl: '/images/landmarks/henan_08_gulou.jpg'
      },
      {
        name: '只有河南·戏剧幻城',
        nameEn: '只有河南·戏剧幻城',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '由王潮歌导演打造的全国最大戏剧群落，位于中牟县。21个剧场星罗棋布，以戏剧艺术讲述河南文明和黄河故事，沉浸式体验震撼人心',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/henan_09_xiju.jpg'
      },
      {
        name: '鸡公山',
        nameEn: '鸡公山',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '中国四大避暑胜地之一，位于信阳市。因山峰酷似报晓的公鸡而得名，保存完好的万国别墅群是近代中国建筑史上的奇观，气候宜人四季',
        tags: [],
        imageUrl: '/images/landmarks/henan_10_jigong.jpg'
      },
      {
        name: '宝丰魔术艺术节',
        nameEn: '宝丰魔术艺术节',
        type: 'cultural',
        rating: 4.2,
        duration: '半天',
        price: '待定',
        shortDesc: '位于平顶山市宝丰县，中国魔术之乡。每年的魔术艺术节汇聚全球顶尖魔术师，民间魔术表演无处不在，是中国唯一以魔术为主题的文化',
        tags: [],
        imageUrl: '/images/landmarks/henan_11_baofeng.jpg'
      },
      {
        name: '林州红旗渠',
        nameEn: '林州红旗渠',
        type: 'urban',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '世界第八大奇迹，人工天河。二十万林州人在太行山悬崖上修建了长达1500公里的灌溉渠道，被誉为\'人工天河\'，红旗渠精神激励',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/henan_12_hongqi.jpg'
      },
      {
        name: '洛阳牡丹园',
        nameEn: '洛阳牡丹园',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '\'洛阳牡丹甲天下\'，每年四月牡丹盛开时节，王城公园、中国国花园万人空巷。百余品种上千株牡丹竞相绽放，国色天香惊艳四方。',
        tags: [],
        imageUrl: '/images/landmarks/henan_13_mudan.jpg'
      },
      {
        name: '黄河花园口',
        nameEn: '黄河花园口',
        type: 'cultural',
        rating: 4.2,
        duration: '半天',
        price: '待定',
        shortDesc: '黄河文化体验地，位于郑州市。登高远眺黄河奔流不息的壮观景象，了解治黄历史和花园口事件，黄河铁桥和观景台是拍照打卡的热门之',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/henan_14_huayuan.jpg'
      }
    ]
  },
  420000: {
    id: '420000',
    name: '湖北',
    nameEn: 'Hubei',
    description: '千湖之省，九省通衢，荆楚文化源远流长。',
    color: '#1A8A7A',
    hotspotCount: 14,
    avgRating: 4.5,
    hotspots: [
      {
        name: '黄鹤楼',
        nameEn: '黄鹤楼',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '江南三大名楼之首，武汉城市象征。始建于三国时期，崔颢\'昔人已乘黄鹤去\'让此楼千古传诵，登楼远眺长江大桥和武昌城，武汉三镇',
        tags: [],
        imageUrl: '/images/landmarks/hubei_01_huanghe.jpg'
      },
      {
        name: '三峡大坝',
        nameEn: '三峡大坝',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界上最大的水利枢纽工程，位于宜昌市夷陵区。230米高的混凝土大坝气势磅礴，五级船闸和升船机展现了当代中国的工程奇迹，是',
        tags: [],
        imageUrl: '/images/landmarks/hubei_02_sanxia.jpg'
      },
      {
        name: '武当山',
        nameEn: '武当山',
        type: 'urban',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，中国道教圣地。金顶的铜铸真武大帝金像熠熠生辉，太子坡、南岩宫等道教建筑群依山而建，太极拳的发源地让这里成为',
        tags: ['城市'],
        imageUrl: '/images/landmarks/hubei_03_wudang.jpg'
      },
      {
        name: '神农架',
        nameEn: '神农架',
        type: 'cultural',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '世界自然遗产，神秘的北纬31度绿色传奇。原始森林覆盖率超过90%，金丝猴、珙桐等珍稀物种遍布其间，神农顶海拔3106米是',
        tags: ['雪山', '湖泊'],
        imageUrl: '/images/landmarks/hubei_04_shennong.jpg'
      },
      {
        name: '东湖风景区',
        nameEn: '东湖风景区',
        type: 'natural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最大的城中湖，比杭州西湖大五倍。听涛区、磨山景区、樱花园各具特色，每年三月樱花盛开时是武汉最美的风景线，绿道骑行更是',
        tags: ['湖泊', '自然'],
        imageUrl: '/images/landmarks/hubei_05_donghu.jpg'
      },
      {
        name: '恩施大峡谷',
        nameEn: '恩施大峡谷',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '国家5A级景区，被誉为\'与美国科罗拉多大峡谷难分伯仲\'。云龙地缝深邃壮观，绝壁栈道惊心动魄，一炷香巨石屹立千年风雨不倒，',
        tags: [],
        imageUrl: '/images/landmarks/hubei_06_enshi.jpg'
      },
      {
        name: '三峡人家',
        nameEn: '三峡人家',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于宜昌市，将壮美的峡江风光与浓郁的土家风情完美融合。渔船、纤夫、吊脚楼构成了一幅活的峡江风俗画，乘船穿越三峡最为惬意。',
        tags: [],
        imageUrl: '/images/landmarks/hubei_07_sanxia2.jpg'
      },
      {
        name: '湖北省博物馆',
        nameEn: '湖北省博物馆',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '国家一级博物馆，收藏了越王勾践剑、曾侯乙编钟等国宝级文物。现场编钟演奏让两千多年前的礼乐之声再次响彻耳畔，是了解楚文化最',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/hubei_08_bowuguan.jpg'
      },
      {
        name: '腾龙洞',
        nameEn: '腾龙洞',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '亚洲最大的溶洞系统，利川市境内的自然奇观。洞高200米，洞底面积超百万平方米，激光秀将溶洞装点成梦幻世界，洞口吞云吐雾般',
        tags: [],
        imageUrl: '/images/landmarks/hubei_09_tenglong.jpg'
      },
      {
        name: '古隆中',
        nameEn: '古隆中',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于襄阳市，三国时期诸葛亮隐居之地。\'三顾茅庐\'和\'隆中对\'的历史舞台，桃园结义、草庐对答的故事在此上演，三国文化爱好者',
        tags: [],
        imageUrl: '/images/landmarks/hubei_10_gulong.jpg'
      },
      {
        name: '三峡大瀑布',
        nameEn: '三峡大瀑布',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于宜昌市秭归县，华中地区最大的天然瀑布。从200多米的高处飞流直下，水雾弥漫中常有彩虹出现，穿过瀑布后面的水帘洞更是刺',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/hubei_11_pubu.jpg'
      },
      {
        name: '明显陵',
        nameEn: '明显陵',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，位于钟祥市，是明代帝王陵寝之一。嘉靖皇帝的父母合葬于此，陵墓设计精巧，龙凤石牌坊造型精美，是中国帝陵建筑的',
        tags: [],
        imageUrl: '/images/landmarks/hubei_12_mingxian.jpg'
      },
      {
        name: '屈原祠',
        nameEn: '屈原祠',
        type: 'urban',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于秭归县，为纪念爱国诗人屈原而建。紧邻三峡大坝，新屈原祠规模宏伟，端午节的龙舟竞渡和祭祀屈原仪式在这里隆重举行，屈原故',
        tags: ['城市'],
        imageUrl: '/images/landmarks/hubei_13_quyuan.jpg'
      },
      {
        name: '鹿院坪',
        nameEn: '鹿院坪',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于恩施市，是一个未被完全开发的世外桃源。坐落在深深的山谷之中，需要沿1000多级台阶下到谷底，原始森林、溪流瀑布保存完',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/hubei_14_luyuan.jpg'
      }
    ]
  },
  430000: {
    id: '430000',
    name: '湖南',
    nameEn: 'Hunan',
    description: '三湘四水，张家界的奇峰秀水惊艳世界。',
    color: '#C23B22',
    hotspotCount: 15,
    avgRating: 4.6,
    hotspots: [
      {
        name: '张家界国家森林公园',
        nameEn: '张家界国家森林公园',
        type: 'urban',
        rating: 4.9,
        duration: '半天',
        price: '待定',
        shortDesc: '世界自然遗产，国家森林公园。三千奇峰拔地而起，八百秀水蜿蜒其间，《阿凡达》中哈利路亚山的原型就在这里。天子山、袁家界、金',
        tags: ['城市'],
        imageUrl: '/images/landmarks/hunan_01_zhangjiajie.jpg'
      },
      {
        name: '武陵源',
        nameEn: '武陵源',
        type: 'cultural',
        rating: 4.9,
        duration: '半天',
        price: '待定',
        shortDesc: '张家界国家森林公园的核心景区，包含张家界、索溪峪、杨家界四大景区。奇特的石英砂岩大峰林在全球罕见，云雾变幻中群峰时隐时现',
        tags: [],
        imageUrl: '/images/landmarks/hunan_02_wulingyuan.jpg'
      },
      {
        name: '凤凰古城',
        nameEn: '凤凰古城',
        type: 'urban',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '国家历史文化名城，湘西的明珠。沱江河畔的吊脚楼鳞次栉比，清晨薄雾中的古城宛如水墨画，沈从文《边城》的原型就是这里，苗文化',
        tags: ['湖泊', '古城', '城市'],
        imageUrl: '/images/landmarks/hunan_03_fenghuang.jpg'
      },
      {
        name: '岳麓山',
        nameEn: '岳麓山',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '位于长沙市，是南岳七十二峰的最后一峰。爱晚亭是中国四大名亭之一，岳麓书院千年学府弦歌不辍，每年红叶季漫山红遍，登高远眺湘',
        tags: [],
        imageUrl: '/images/landmarks/hunan_04_yuelu.jpg'
      },
      {
        name: '橘子洲',
        nameEn: '橘子洲',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于长沙湘江中心的狭长小岛，毛主席《沁园春·长沙》的诞生地。毛泽东青年艺术雕塑气势恢宏，每年新年橘子洲烟花秀是长沙最盛大',
        tags: [],
        imageUrl: '/images/landmarks/hunan_05_juzi.jpg'
      },
      {
        name: '岳阳楼',
        nameEn: '岳阳楼',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '江南三大名楼之一，位于岳阳市。范仲淹《岳阳楼记》中\'先天下之忧而忧，后天下之乐而乐\'让此楼名垂千古，登楼远眺洞庭湖，浩浩',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/hunan_06_yueyang.jpg'
      },
      {
        name: '崀山',
        nameEn: '崀山',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '世界自然遗产，位于邵阳市新宁县。丹霞地貌举世罕见，八角寨云海、天一巷窄巷、辣椒峰群峰竞秀，\'丹霞魂，崀山魄\'被誉为丹霞之',
        tags: ['湖泊', '摄影'],
        imageUrl: '/images/landmarks/hunan_07_lang.jpg'
      },
      {
        name: '衡山（南岳）',
        nameEn: '衡山（南岳）',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '五岳之一的南岳，中国著名的佛教道教圣地。祝融峰高1300米，山顶的祝融殿常年香火旺盛，冬季雪景银装素裹，被称为\'南岳雪景',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/hunan_08_hengshan.jpg'
      },
      {
        name: '猛洞河漂流',
        nameEn: '猛洞河漂流',
        type: 'urban',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于湘西永顺县，被誉为\'天下第一漂\'。全程47公里的漂流线路穿越峡谷激流，刺激与美景并存，两岸原始森林郁郁葱葱，夏天避暑',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/hunan_09_mengdong.jpg'
      },
      {
        name: '芙蓉镇',
        nameEn: '芙蓉镇',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '原名王村，因电影《芙蓉镇》闻名。瀑布从镇中穿流而过，悬挂在水面上的土家吊脚楼是标志性的景观，夜晚灯光映照下的瀑布镇尤为壮',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/hunan_10_furong.jpg'
      },
      {
        name: '矮寨大桥',
        nameEn: '矮寨大桥',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '世界著名的悬索桥，亚洲最长跨径悬索桥。桥面距谷底330米，全长1073米，站在玻璃栈道上俯瞰深渊，体验心跳加速的刺激与震',
        tags: [],
        imageUrl: '/images/landmarks/hunan_11_aizhai.jpg'
      },
      {
        name: '莽山',
        nameEn: '莽山',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '位于郴州市宜章县，国家级森林公园。五指峰是标志性景观，云海日出和冬景雾凇令人叹为观止，负氧离子含量极高，是天然的康养度假',
        tags: ['湖泊', '摄影'],
        imageUrl: '/images/landmarks/hunan_12_mang.jpg'
      },
      {
        name: '通道皇都侗文化村',
        nameEn: '通道皇都侗文化村',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于怀化市通道县，中国最大的侗族聚居地之一。风雨桥、鼓楼是侗族的标志性建筑，侗族大歌无伴奏的多声部合唱是世界非物质文化遗',
        tags: [],
        imageUrl: '/images/landmarks/hunan_13_tongdao.jpg'
      },
      {
        name: '马王堆汉墓遗址',
        nameEn: '马王堆汉墓遗址',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于长沙市，汉代长沙国丞相辛追夫人的墓葬。出土的女尸千年不腐是世界考古奇迹，素纱禅衣仅重49克展示了汉代纺织的最高水平。',
        tags: [],
        imageUrl: '/images/landmarks/hunan_14_mawang.jpg'
      },
      {
        name: '德夯苗寨',
        nameEn: '德夯苗寨',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于湘西吉首市，\'德夯\'在苗语中意为\'美丽的峡谷\'。高耸的峡谷间吊脚楼依山而建，苗家人身着传统服饰，每年苗年、赶秋节热闹',
        tags: [],
        imageUrl: '/images/landmarks/hunan_15_dehang.jpg'
      }
    ]
  },
  440000: {
    id: '440000',
    name: '广东',
    nameEn: 'Guangdong',
    description: '岭南文化发源地，也是中国最繁华的经济大省。广州的食在广州、深圳的创新活力、珠海的浪漫海滨。',
    color: '#0D6B5C',
    hotspotCount: 15,
    bestSeason: '10月-12月 或 3月-4月',
    avgRating: 4.4,
    hotspots: [
      {
        name: '广州塔（小蛮腰）',
        nameEn: '广州塔（小蛮腰）',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '广州城市新中轴线上的标志性建筑，高600米的中国第一高塔。登顶俯瞰珠江新城天际线，旋转餐厅和摩天轮提供了独特的城市体验，',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/guangdong_01_xiaomanyao.jpg'
      },
      {
        name: '长隆旅游度假区',
        nameEn: '长隆旅游度假区',
        type: 'adventure',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '国家级旅游度假区，拥有长隆野生动物世界、长隆欢乐世界、长隆水上乐园等多个主题乐园。长隆大马戏是国际顶级的演艺盛宴，全家出',
        tags: ['亲子', '主题乐园'],
        imageUrl: '/images/landmarks/guangdong_02_changlong.jpg'
      },
      {
        name: '丹霞山',
        nameEn: '丹霞山',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界自然遗产，丹霞地貌命名地。长老峰、阳元石、阴元石构成了独一无二的地质奇观，锦江画廊两岸赤壁丹崖色彩艳丽，是地质爱好者',
        tags: [],
        imageUrl: '/images/landmarks/guangdong_03_danxia.jpg'
      },
      {
        name: '开平碉楼',
        nameEn: '开平碉楼',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，位于江门市开平市。中西合璧的塔楼式建筑散落在田野之间，是海外华侨思乡的寄托，影视《让子弹飞》和《盗梦空间》',
        tags: ['湖泊', '佛教'],
        imageUrl: '/images/landmarks/guangdong_04_kaiping.jpg'
      },
      {
        name: '潮州古城',
        nameEn: '潮州古城',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '国家历史文化名城，岭南文化的重要发源地之一。广济桥是世界上最早的启闭式桥梁，开元寺是粤东第一古刹，潮州美食更是享誉全球。',
        tags: ['古城', '美食'],
        imageUrl: '/images/landmarks/guangdong_05_chaozhou.jpg'
      },
      {
        name: '深圳华侨城',
        nameEn: '深圳华侨城',
        type: 'adventure',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '集世界之窗、锦绣中华、民俗文化村、欢乐谷于一体的综合旅游景区。一天之内走遍世界名胜、浓缩中华五千年历史，是中国主题乐园的',
        tags: ['亲子', '主题乐园'],
        imageUrl: '/images/landmarks/guangdong_06_huaqiao.jpg'
      },
      {
        name: '深圳大梅沙',
        nameEn: '深圳大梅沙',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '深圳最著名的海滨浴场，三面青山环抱一面碧海。沙细水净，是华南地区最大的海滩之一，傍晚的沙滩落日浪漫至极，周边海鲜大排档新',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/guangdong_07_dameisha.jpg'
      },
      {
        name: '顺德清晖园',
        nameEn: '顺德清晖园',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '广东四大名园之一，位于佛山市顺德区。岭南园林的杰出代表，亭台楼阁精巧雅致，假山池沼布局巧妙，美食之都的底蕴让它成为文化+',
        tags: ['美食'],
        imageUrl: '/images/landmarks/guangdong_08_qinghui.jpg'
      },
      {
        name: '惠州西湖',
        nameEn: '惠州西湖',
        type: 'natural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '国家5A级景区，苏东坡谪居惠州三年留下的文化印记。六湖九桥十景二十四胜，孤山赤壁、泗洲塔等古迹众多，岭南水乡的温婉风情尽',
        tags: ['湖泊', '佛教', '自然'],
        imageUrl: '/images/landmarks/guangdong_09_huizhou.jpg'
      },
      {
        name: '珠海长隆海洋王国',
        nameEn: '珠海长隆海洋王国',
        type: 'adventure',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '全球最大的海洋主题乐园之一，鲸鲨馆拥有世界上最大的水族箱。极地王国企鹅近距离相伴，海豚剧场精彩绝伦，夜间大秀烟花与音乐交',
        tags: ['湖泊', '亲子', '主题乐园'],
        imageUrl: '/images/landmarks/guangdong_10_zhuhai.jpg'
      },
      {
        name: '潮汕国家公园',
        nameEn: '潮汕国家公园',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于汕头市，拥有完整的红树林生态系统。南澳岛是广东最美海岛之一，环岛公路穿梭于山海之间，海鲜美食让这座滨海小城充满烟火气',
        tags: ['湖泊', '美食'],
        imageUrl: '/images/landmarks/guangdong_11_chaoshan.jpg'
      },
      {
        name: '广州陈家祠',
        nameEn: '广州陈家祠',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '广东最具特色的岭南建筑艺术宝库。屋顶的灰塑、木雕、砖雕精美绝伦，是清代岭南建筑装饰艺术的集大成者，被誉为岭南建筑明珠。',
        tags: [],
        imageUrl: '/images/landmarks/guangdong_12_chenjiaci.jpg'
      },
      {
        name: '湛江特呈岛',
        nameEn: '湛江特呈岛',
        type: 'cultural',
        rating: 4.2,
        duration: '半天',
        price: '待定',
        shortDesc: '湛江市区内的世外桃源，中国首个红树林温泉度假村所在地。天然红树林保护区保存完好，热带滨海风光独特，温泉与海岛结合的度假体',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/guangdong_13_techeng.jpg'
      },
      {
        name: '茂名放鸡岛',
        nameEn: '茂名放鸡岛',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '广东最美海岛之一，潜水天堂。海水清澈见底，珊瑚礁保存完好，海底世界五彩斑斓，岛上还有冲浪、摩托艇等丰富的海上娱乐项目。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/guangdong_14_fangji.jpg'
      },
      {
        name: '广州上下九步行街',
        nameEn: '广州上下九步行街',
        type: 'cultural',
        rating: 4.2,
        duration: '半天',
        price: '待定',
        shortDesc: '广州最繁华的传统商业步行街，骑楼建筑保存完好。从早茶到宵夜，肠粉、牛杂、蛋挞等广式美食应有尽有，骑楼下的烟火气是老广州味',
        tags: ['美食'],
        imageUrl: '/images/landmarks/guangdong_15_shangxia.jpg'
      }
    ]
  },
  450000: {
    id: '450000',
    name: '广西',
    nameEn: 'Guangxi',
    description: '桂林山水甲天下，壮乡风情浓郁。',
    color: '#2EA89A',
    hotspotCount: 15,
    avgRating: 4.5,
    hotspots: [
      {
        name: '漓江风景区',
        nameEn: '漓江风景区',
        type: 'urban',
        rating: 4.9,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最美的山水画卷，桂林山水的代表。214公里精华航段穿行在喀斯特峰林之间，九马画山、黄布倒影是经典景观，\'桂林山水甲天',
        tags: ['城市'],
        imageUrl: '/images/landmarks/guangxi_01_lijiang.jpg'
      },
      {
        name: '阳朔十里画廊',
        nameEn: '阳朔十里画廊',
        type: 'urban',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '阳朔最美的自行车骑行路线，沿途峰林田地交织如画。遇龙河漂流比漓江更显秀气恬淡，月亮山、图腾宫是骑行途中不可错过的亮点。',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/guangxi_02_yangshuo.jpg'
      },
      {
        name: '龙脊梯田',
        nameEn: '龙脊梯田',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界梯田奇观，始建于元朝。壮族和瑶族先民在陡峭山脊上开垦的梯田如巨龙盘旋，春耕灌水时如银链垂天，秋收金黄时似金龙舞动，壮',
        tags: [],
        imageUrl: '/images/landmarks/guangxi_03_longji.jpg'
      },
      {
        name: '象鼻山',
        nameEn: '象鼻山',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '桂林的城市标志和象征，因山形酷似一头伸长鼻子临江饮水的大象而得名。水月洞是必打卡景观，月夜时分洞中倒影如一轮明月沉入水中',
        tags: [],
        imageUrl: '/images/landmarks/guangxi_04_xiangbi.jpg'
      },
      {
        name: '德天跨国瀑布',
        nameEn: '德天跨国瀑布',
        type: 'cultural',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '亚洲第一、世界第四大跨国瀑布，位于崇左市大新县。与越南板约瀑布相连，丰水期水量高达每秒90立方米，乘竹筏靠近瀑布水雾扑面',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/guangxi_05_detian.jpg'
      },
      {
        name: '北海涠洲岛',
        nameEn: '北海涠洲岛',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最大最年轻的火山岛，北海市南部的海上明珠。鳄鱼山火山遗址、五彩滩日出、石螺口沙滩构成了一幅完美的热带海岛画卷，潜水胜',
        tags: ['湖泊', '摄影'],
        imageUrl: '/images/landmarks/guangxi_06_weizhou.jpg'
      },
      {
        name: '两江四湖',
        nameEn: '两江四湖',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '桂林市区内的环城水系景观工程。漓江、桃花江与杉湖、榕湖、桂湖、木龙湖连通，夜游两江四湖灯光璀璨，日月双塔在湖水中倒影如画',
        tags: ['湖泊', '佛教'],
        imageUrl: '/images/landmarks/guangxi_07_liangjiang.jpg'
      },
      {
        name: '银子岩',
        nameEn: '银子岩',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '阳朔境内最大的溶洞，\'游了银子岩，一世不缺钱\'。洞内钟乳石晶莹剔透、形态各异，在灯光照射下宛如银河撒落人间，被誉为\'洞内',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/guangxi_08_yinzi.jpg'
      },
      {
        name: '黄姚古镇',
        nameEn: '黄姚古镇',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '千年古村镇，位于贺州市昭平县。喀斯特峰林环抱中的明清古建筑群保存完好，古榕树、石板街、古戏台勾勒出诗意的小镇时光，是《茶',
        tags: ['古城'],
        imageUrl: '/images/landmarks/guangxi_09_huangyao.jpg'
      },
      {
        name: '北海银滩',
        nameEn: '北海银滩',
        type: 'urban',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '被誉为\'天下第一滩\'，绵延24公里的沙滩洁白细腻如粉末。海水退潮后水面平静如镜，是冲浪、帆船、海上摩托车的热门场地，日落',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/guangxi_10_yintan.jpg'
      },
      {
        name: '程阳风雨桥',
        nameEn: '程阳风雨桥',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '位于柳州市三江侗族自治县，中国四大名桥之一。整座桥梁不用一钉一铆，全部采用榫卯结构，侗族建筑艺术的巅峰之作，是侗族文化的',
        tags: [],
        imageUrl: '/images/landmarks/guangxi_11_chengyang.jpg'
      },
      {
        name: '南宁青秀山',
        nameEn: '南宁青秀山',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '南宁市区的绿色肺叶，国家5A级景区。荫生植物园、苏铁园、龙象塔等景点丰富，每年樱花节期间万株樱花竞相绽放，是城市中的一片',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/guangxi_12_qingxiu.jpg'
      },
      {
        name: '钦州八寨沟',
        nameEn: '钦州八寨沟',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '钦州市灵山县的天然氧吧，原始森林覆盖率达98%。峡谷瀑布、古藤名木、高山湖泊构成了一幅绿色的画卷，猕猴群在林间跳跃，野趣',
        tags: ['雪山', '湖泊']
      },
      {
        name: '百色起义纪念园',
        nameEn: '百色起义纪念园',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '位于百色市，是国家一类红色旅游景区。右江流域规模最大的革命纪念建筑群，纪念馆详实记录了邓小平、张云逸领导百色起义的光辉历',
        tags: [],
        imageUrl: '/images/landmarks/guangxi_14_baise.jpg'
      },
      {
        name: '靖西通灵大峡谷',
        nameEn: '靖西通灵大峡谷',
        type: 'urban',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '藏在百色靖西的隐秘秘境，亚洲第一高瀑布通灵大峡谷从312米的悬崖上飞泻而下。地下暗河、原始森林、奇花异草让这里如同失落的',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/guangxi_15_tongling.jpg'
      }
    ]
  },
  460000: {
    id: '460000',
    name: '海南',
    nameEn: 'Hainan',
    description: '中国最南端的热带天堂。碧海蓝天、椰风海韵、四季如夏。',
    color: '#D4A84B',
    hotspotCount: 15,
    bestSeason: '11月-次年4月',
    avgRating: 4.4,
    hotspots: [
      {
        name: '亚龙湾',
        nameEn: '亚龙湾',
        type: 'natural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '"天下第一湾"的美誉当之无愧，2000米银白色沙滩绵延，海水清澈见底能见度高。潜水、冲浪、日光浴，一站式享受热带海滨度假',
        tags: ['湖泊', '自然'],
        imageUrl: '/images/landmarks/hainan_01_yalong.jpg'
      },
      {
        name: '蜈支洲岛',
        nameEn: '蜈支洲岛',
        type: 'natural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '中国的"马尔代夫"，岛上沙质细腻洁白，海水能见度达6-18米。潜水圣地，热带鱼和珊瑚礁五彩缤纷，充满海底世界的神秘。',
        tags: ['湖泊', '自然'],
        imageUrl: '/images/landmarks/hainan_02_wuzhizhou.jpg'
      },
      {
        name: '南山文化旅游区',
        nameEn: '南山文化旅游区',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '108米高的海上观音像矗立于南海之滨，是目前世界最高的海上观音。5A级景区，佛教文化浓厚，是祈福圣地。',
        tags: ['湖泊', '佛教'],
        imageUrl: '/images/landmarks/hainan_03_nanshan.jpg'
      },
      {
        name: '天涯海角',
        nameEn: '天涯海角',
        type: 'natural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '因为"天涯"、"海角"两块巨石成为中国最著名的爱情象征地。夕阳西下时分，海浪拍打礁石，浪漫指数满分。',
        tags: ['湖泊', '自然'],
        imageUrl: '/images/landmarks/hainan_04_tianya.jpg'
      },
      {
        name: '热带天堂森林公园',
        nameEn: '热带天堂森林公园',
        type: 'natural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '《非诚勿扰2》主要取景地，贯穿整座亚龙湾热带雨林。过江龙索桥和高空栈道是热门打卡点，俯瞰亚龙湾全景。',
        tags: ['湖泊', '自然'],
        imageUrl: '/images/landmarks/hainan_05_redai.jpg'
      },
      {
        name: '西岛',
        nameEn: '西岛',
        type: 'natural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '比蜈支洲岛更原生态的海岛，疍家渔排和珊瑚石老屋独具特色。渔村生活缓慢悠闲，适合喜欢安静的旅行者。',
        tags: ['湖泊', '自然'],
        imageUrl: '/images/landmarks/hainan_06_xidao.jpg'
      },
      {
        name: '亚特兰蒂斯水世界',
        nameEn: '亚特兰蒂斯水世界',
        type: 'adventure',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '坐落于海棠湾的奢华综合度假村，拥有庞大的水族馆刺激的水上滑梯和各种海洋主题体验，是亲子游的首选。',
        tags: ['湖泊', '亲子', '主题乐园'],
        imageUrl: '/images/landmarks/hainan_07_yatelantis.jpg'
      },
      {
        name: '分界洲岛',
        nameEn: '分界洲岛',
        type: 'adventure',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '中国南北气候的分界线，岛上拥有独特的海洋生物资源和热带雨林。海枯洞、鸟礁群等自然景观引人入胜。',
        tags: ['湖泊', '主题乐园'],
        imageUrl: '/images/landmarks/hainan_08_fenjie.jpg'
      },
      {
        name: '呀诺达雨林文化旅游区',
        nameEn: '呀诺达雨林文化旅游区',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '热带雨林的自然博物馆，悬崖秋千、踏瀑戏水、高空滑索等刺激项目众多。空气中负氧离子爆棚，是天然的空调房。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/hainan_09_yanuo.jpg'
      },
      {
        name: '大小洞天',
        nameEn: '大小洞天',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '道教文化与滨海风光的结合，700多年的洞天长存。南海龙王原址碑林和洞天胜境是拍照打卡的热门地。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/hainan_10_daxiao.jpg'
      },
      {
        name: '文昌东郊椰林',
        nameEn: '文昌东郊椰林',
        type: 'urban',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '文昌椰风海韵的代表，绵延数十公里的椰子林构成热带风情画廊。椰林下吃椰子鸡、喝新鲜椰子水，惬意十足。',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/hainan_11_dongjiao.jpg'
      },
      {
        name: '海口骑楼老街',
        nameEn: '海口骑楼老街',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '东南亚风情与南洋文化的融合，百年骑楼建筑保留了清末民初的韵味。骑楼之下是各种老字号小吃和市井生活。',
        tags: ['湖泊', '古城', '美食'],
        imageUrl: '/images/landmarks/hainan_12_qilou.jpg'
      },
      {
        name: '万宁日月湾',
        nameEn: '万宁日月湾',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '冲浪爱好者的天堂，优质的浪况吸引了全国各地的冲浪爱好者。海边咖啡店的日落吧台是网红打卡的热门位置。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/hainan_13_riyue.jpg'
      },
      {
        name: '五指山',
        nameEn: '五指山',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '海南岛的最高峰，黎族和苗族同胞世代居住的家园。原始雨林中瀑布飞流、溪涧潺潺，是探索热带雨林的好选择。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/hainan_14_wuzhi.jpg'
      },
      {
        name: '陵水南湾猴岛',
        nameEn: '陵水南湾猴岛',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '世界上唯一的岛屿型猕猴自然保护区，一千多只野生猕猴自在生活。跨海缆车是观赏猴岛和海鸥的最佳方式。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/hainan_15_hou.jpg'
      }
    ]
  },
  500000: {
    id: '500000',
    name: '重庆',
    nameEn: 'Chongqing',
    description: '8D魔幻城市，火锅与山城夜景的独特魅力。',
    color: '#C23B22',
    hotspotCount: 12,
    avgRating: 4.5,
    hotspots: [
      {
        name: '洪崖洞',
        nameEn: '洪崖洞',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '重庆最著名的地标之一，吊脚楼风格的建筑群依山而建，夜晚亮灯后如同《千与千寻》中的汤屋。汇聚众多重庆特色小吃，是感受山城魔',
        tags: ['美食'],
        imageUrl: '/images/landmarks/chongqing_01_hongyadong.jpg'
      },
      {
        name: '解放碑',
        nameEn: '解放碑',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '重庆的城市中心和精神象征，是全国唯一一座纪念中华民族抗日战争胜利的纪念碑。周围是繁华的商圈，步行可达朝天门、洪崖洞等景点',
        tags: [],
        imageUrl: '/images/landmarks/chongqing_02_jiefangbei.jpg'
      },
      {
        name: '磁器口古镇',
        nameEn: '磁器口古镇',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '始建于宋代的千年古镇，位于嘉陵江畔。石板路两旁是各式茶馆、小吃店和手工艺品铺，陈麻花、毛血旺等地方美食让人垂涎，是老重庆',
        tags: ['古城', '美食'],
        imageUrl: '/images/landmarks/chongqing_03_ciqikou.jpg'
      },
      {
        name: '武隆天生三桥',
        nameEn: '武隆天生三桥',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '全球规模最大的天生桥群，三部变形金刚电影的取景地。天龙桥、青龙桥、黑龙桥三座巨型石桥横跨峡谷，洞内钟乳石千姿百态，大自然',
        tags: [],
        imageUrl: '/images/landmarks/chongqing_04_wulong.jpg'
      },
      {
        name: '长江索道',
        nameEn: '长江索道',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '被誉为\'东方瑞士日内瓦缆车\'的空中交通工具，横跨滚滚长江，连接南岸与渝中。乘坐轿厢中可俯瞰两江交汇的壮丽景色，是体验山城',
        tags: [],
        imageUrl: '/images/landmarks/chongqing_05_changjiang.jpg'
      },
      {
        name: '李子坝轻轨站',
        nameEn: '李子坝轻轨站',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '轻轨列车从居民楼中穿而过的奇观，是全球罕见的立体交通设计。在楼下的观景平台可以拍出列车穿楼的经典照片，是重庆网红打卡的第',
        tags: [],
        imageUrl: '/images/landmarks/chongqing_06_liziba.jpg'
      },
      {
        name: '大足石刻',
        nameEn: '大足石刻',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，始建于初唐、盛于南宋，共有摩崖造像五万余尊。宝顶山的千手观音、南山道观等造像精美绝伦，是中国晚期石窟艺术的',
        tags: [],
        imageUrl: '/images/landmarks/chongqing_07_dazu.jpg'
      },
      {
        name: '南山一棵树观景台',
        nameEn: '南山一棵树观景台',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '重庆最佳的全景俯瞰点之一，位于南山山顶。夜晚可远眺渝中半岛万家灯火、两江环抱的壮观景象，被誉为\'不夜城\'的绝美视角。',
        tags: [],
        imageUrl: '/images/landmarks/chongqing_08_nanshan.jpg'
      },
      {
        name: '重庆人民大礼堂',
        nameEn: '重庆人民大礼堂',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '仿明清宫殿式建筑风格的标志性建筑，外观宏伟壮观，与天安门颇有些神似。内部穹顶结构精妙，常举办大型会议和文化活动，是了解重',
        tags: [],
        imageUrl: '/images/landmarks/chongqing_09_dalitang.jpg'
      },
      {
        name: '两江夜游',
        nameEn: '两江夜游',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '乘游船穿行于长江与嘉陵江交汇处，两岸灯火阑珊、霓虹闪烁。途经洪崖洞、朝天门、大剧院等核心地标，在波光粼粼中品味山城的迷人',
        tags: [],
        imageUrl: '/images/landmarks/chongqing_10_liangjiang.jpg'
      },
      {
        name: '四川美术学院（黄桷坪校区）',
        nameEn: '四川美术学院（黄桷坪校区）',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '涂鸦艺术的天堂，整个校园及周边街道被色彩斑斓的涂鸦覆盖。工业风与现代艺术完美融合，是文艺青年和艺术爱好者必访的创意文化地',
        tags: [],
        imageUrl: '/images/landmarks/chongqing_11_meiyuan.jpg'
      },
      {
        name: '金佛山',
        nameEn: '金佛山',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '世界自然遗产地，以喀斯特地貌和原始森林著称。春季杜鹃花海漫山遍野，秋季红叶层林尽染，夏季则是清凉避暑的绝佳去处，拥有空中',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/chongqing_12_jinfo.jpg'
      }
    ]
  },
  510000: {
    id: '510000',
    name: '四川',
    nameEn: 'Sichuan',
    description: '天府之国，熊猫的故乡。九寨归来不看水，火锅沸腾暖人心。这里有最巴适的生活态度。',
    color: '#C23B22',
    hotspotCount: 18,
    bestSeason: '春秋两季',
    avgRating: 4.6,
    hotspots: [
      {
        name: '九寨沟风景名胜区',
        nameEn: '九寨沟风景名胜区',
        type: 'natural',
        rating: 4.9,
        duration: '半天',
        price: '待定',
        shortDesc: '被誉为"童话世界"的世界自然遗产，拥有翠海、叠瀑、彩林、雪峰、蓝冰和藏族风情"六绝"。五彩斑斓的湖泊如宝石般镶嵌在深山之',
        tags: ['湖泊', '自然'],
        imageUrl: '/images/landmarks/sichuan_01_jiuzhaigou.jpg'
      },
      {
        name: '稻城亚丁',
        nameEn: '稻城亚丁',
        type: 'urban',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '被誉为"香格里拉最后的秘境"，由仙乃日、央迈勇、夏诺多吉三座神山组成。雪山巍峨、草甸辽阔、藏寨原始，是摄影爱好者心中的圣',
        tags: ['雪山', '摄影', '城市'],
        imageUrl: '/images/landmarks/sichuan_02_daocheng.jpg'
      },
      {
        name: '峨眉山',
        nameEn: '峨眉山',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '中国四大佛教名山之一，以"雄、秀、奇、险"著称。金顶佛光是自然奇观，山中猴群与古树名木相映成趣，四季景色各异。',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/sichuan_03_emeishan.jpg'
      },
      {
        name: '乐山大佛',
        nameEn: '乐山大佛',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界上最高的石刻弥勒佛坐像，通高71米，依山凿成，临江危坐。大佛雕刻精细，气势磅礴，三江汇流处更显其雄伟壮观。',
        tags: [],
        imageUrl: '/images/landmarks/sichuan_04_leshan.jpg'
      },
      {
        name: '都江堰水利工程',
        nameEn: '都江堰水利工程',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '战国时期李冰父子修建的世界文化遗产，至今仍在发挥灌溉作用。这项两千年前的伟大工程巧妙地利用地形和水势，是无与伦比的治水奇',
        tags: [],
        imageUrl: '/images/landmarks/sichuan_05_dujiangyan.jpg'
      },
      {
        name: '青城山',
        nameEn: '青城山',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '道教发源地之一，素有"青城天下幽"之美誉。森林覆盖率超过95%，古木参天、溪流潺潺，是修身养性的绝佳去处。',
        tags: [],
        imageUrl: '/images/landmarks/sichuan_06_qingcheng.jpg'
      },
      {
        name: '成都大熊猫繁育研究基地',
        nameEn: '成都大熊猫繁育研究基地',
        type: 'adventure',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '全球最大的大熊猫人工繁育机构，可以看到各年龄段的大熊猫宝宝。园内的竹林环境和互动体验让游客近距离感受国宝的魅力。',
        tags: ['亲子', '主题乐园'],
        imageUrl: '/images/landmarks/sichuan_07_xiongmao.jpg'
      },
      {
        name: '黄龙风景名胜区',
        nameEn: '黄龙风景名胜区',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界自然遗产，以彩池、雪山、峡谷、森林"四绝"闻名。五彩池层层叠叠、色彩斑斓，宛如人间瑶池，美不胜收。',
        tags: ['雪山'],
        imageUrl: '/images/landmarks/sichuan_08_huanglong.jpg'
      },
      {
        name: '四姑娘山',
        nameEn: '四姑娘山',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '川西高原上的"阿尔卑斯"，由四座连绵不断的山峰组成。雪山壮丽、草甸辽阔、沟谷深邃，是登山和徒步爱好者的理想之地。',
        tags: ['雪山'],
        imageUrl: '/images/landmarks/sichuan_09_siguniang.jpg'
      },
      {
        name: '蜀南竹海',
        nameEn: '蜀南竹海',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最大的天然竹林景区，六万余亩翠竹遮天蔽日。漫步竹林栈道，清风拂面、竹叶沙沙，仿佛置身绿野仙踪。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/sichuan_10_zhuhai.jpg'
      },
      {
        name: '光雾山',
        nameEn: '光雾山',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国红叶之乡，秋季漫山遍野的红叶如火如荼，层林尽染。奇峰怪石、飞瀑流泉交织成一幅壮美的山水画卷。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/sichuan_11_guangwu.jpg'
      },
      {
        name: '海螺沟冰川森林公园',
        nameEn: '海螺沟冰川森林公园',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '拥有低海拔现代冰川的奇观，可以近距离观赏冰川从雪山延伸至森林的壮丽景象。温泉水与冰川同在，堪称一绝。',
        tags: ['雪山', '湖泊'],
        imageUrl: '/images/landmarks/sichuan_12_hailuo.jpg'
      },
      {
        name: '贡嘎雪山',
        nameEn: '贡嘎雪山',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '蜀山之王，海拔7556米的贡嘎山是四川第一高峰。从子梅垭口或冷嘎措远眺雪山倒影，震撼人心。',
        tags: ['雪山', '湖泊'],
        imageUrl: '/images/landmarks/sichuan_13_gongga.jpg'
      },
      {
        name: '色达喇荣五明佛学院',
        nameEn: '色达喇荣五明佛学院',
        type: 'urban',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '漫山遍野的红色僧舍依山而建，蔚为壮观。这里是世界上最大的藏传佛教学院之一，晨钟暮鼓间尽显信仰的力量。',
        tags: ['佛教', '城市'],
        imageUrl: '/images/landmarks/sichuan_14_seda.jpg'
      },
      {
        name: '武侯祠与锦里古街',
        nameEn: '武侯祠与锦里古街',
        type: 'urban',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '中国唯一的君臣合祀祠庙，三国文化圣地。毗邻的锦里古街夜晚灯火辉煌，川西民风民俗和地道小吃让人流连忘返。',
        tags: ['美食', '城市'],
        imageUrl: '/images/landmarks/sichuan_15_wuhou.jpg'
      },
      {
        name: '宽窄巷子',
        nameEn: '宽窄巷子',
        type: 'urban',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '成都遗留下来的清朝古街道建筑群，由宽巷子、窄巷子、井巷子组成。在这里可以品尝正宗川菜，体验老成都的慢生活。',
        tags: ['古城', '城市'],
        imageUrl: '/images/landmarks/sichuan_16_kuanzhai.jpg'
      },
      {
        name: '毕棚沟',
        nameEn: '毕棚沟',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '川西北的旅游新宠，集原始森林、雪山、海子、温泉于一体。四季皆美，春季杜鹃花盛开，秋季彩林绚烂，冬季滑雪泡温泉。',
        tags: ['雪山', '湖泊'],
        imageUrl: '/images/landmarks/sichuan_17_bipeng.jpg'
      },
      {
        name: '若尔盖大草原',
        nameEn: '若尔盖大草原',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最美的湿地草原之一，花湖、九曲黄河第一湾点缀其间。夏季绿草如茵、野花遍地，是感受藏乡风情的绝佳之地。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/sichuan_18_ruoergai.jpg'
      }
    ]
  },
  520000: {
    id: '520000',
    name: '贵州',
    nameEn: 'Guizhou',
    description: '多彩贵州，喀斯特地貌与苗族风情的交相辉映。',
    color: '#1A8A7A',
    hotspotCount: 6,
    avgRating: 4.6,
    hotspots: [
      {
        name: '黄果树瀑布',
        nameEn: '黄果树瀑布',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '亚洲最大的瀑布群，主瀑布高77.8米、宽101米，气势磅礴。可以穿过水帘洞从瀑布后面观赏，体验"花果山水帘洞"的神奇感受',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/guizhou_01_huangguoshu.jpg'
      },
      {
        name: '西江千户苗寨',
        nameEn: '西江千户苗寨',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '世界最大的苗族聚居村寨，上千栋吊脚楼依山而建。夜幕降临万家灯火时，整个苗寨流光溢彩，如梦如幻。',
        tags: [],
        imageUrl: '/images/landmarks/guizhou_02_xijiang.jpg'
      },
      {
        name: '梵净山',
        nameEn: '梵净山',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界自然遗产，地球上最古老的陆地之一。红云金顶和蘑菇石拔地而起，云海翻腾中宛如人间仙境。',
        tags: ['湖泊', '摄影'],
        imageUrl: '/images/landmarks/guizhou_03_fanjing.jpg'
      },
      {
        name: '荔波小七孔',
        nameEn: '荔波小七孔',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界自然遗产"中国南方喀斯特"的明珠，七孔古桥横跨鸳鸯江水。翡翠般的潭水和原始森林构成了令人窒息的美景。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/guizhou_04_xiaoqikong.jpg'
      },
      {
        name: '镇远古城',
        nameEn: '镇远古城',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '㵲阳河畔的千年古镇，太极图般的古城格局别具一格。舞阳河穿城而过，两岸古建筑错落有致，宁静而富有韵味。',
        tags: ['湖泊', '古城'],
        imageUrl: '/images/landmarks/guizhou_05_zhenyuan.jpg'
      },
      {
        name: '赤水大瀑布',
        nameEn: '赤水大瀑布',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '高76米、宽80米的壮观瀑布，从赤红色的丹霞峭壁上倾泻而下。周围原始森林葱郁，空气负氧离子含量极高。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/guizhou_06_chishui.jpg'
      }
    ]
  },
  530000: {
    id: '530000',
    name: '云南',
    nameEn: 'Yunnan',
    description: '彩云之南，风花雪月。大理的苍山洱海、丽江的古城韵味、香格里拉的人间天堂。',
    color: '#D4A84B',
    hotspotCount: 8,
    bestSeason: '全年适宜，3-10月最佳',
    avgRating: 4.5,
    hotspots: [
      {
        name: '丽江古城',
        nameEn: '丽江古城',
        type: 'urban',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，纳西族千年古城。四方街、大水车、五花石板路遍布小桥流水，酒吧街和纳西古乐让这里充满独特魅力。',
        tags: ['古城', '城市'],
        imageUrl: '/images/landmarks/yunnan_01_lijiang.jpg'
      },
      {
        name: '玉龙雪山',
        nameEn: '玉龙雪山',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '纳西族的神山，主峰扇子陡海拔5596米。乘坐索道直达冰川公园，俯瞰云雾下的蓝月谷，如梦似幻。',
        tags: ['雪山', '湖泊'],
        imageUrl: '/images/landmarks/yunnan_02_yulong.jpg'
      },
      {
        name: '洱海',
        nameEn: '洱海',
        type: 'natural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '高原明珠，苍山脚下的碧海蓝天。骑行环洱海，途经双廊、喜洲等古镇，白族民居与稻田交织成田园诗画。',
        tags: ['湖泊', '古城', '自然'],
        imageUrl: '/images/landmarks/yunnan_03_erhai.jpg'
      },
      {
        name: '大理古城',
        nameEn: '大理古城',
        type: 'natural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '南诏古都，东西临洱海、南北望苍山的千年古城。人民路上咖啡飘香，洋人街汇集各国游客，文艺气息浓厚。',
        tags: ['湖泊', '古城', '自然'],
        imageUrl: '/images/landmarks/yunnan_04_dali.jpg'
      },
      {
        name: '西双版纳热带植物园',
        nameEn: '西双版纳热带植物园',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '中国面积最大、收集物种最丰富的热带植物园，拥有一万多种珍稀植物。夜游区可以看萤火虫飞舞，奇幻无比。',
        tags: [],
        imageUrl: '/images/landmarks/yunnan_05_banna.jpg'
      },
      {
        name: '香格里拉普达措国家公园',
        nameEn: '香格里拉普达措国家公园',
        type: 'urban',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '真正的"香巴拉"秘境，属都湖、碧塔海如宝石般镶嵌在高山草甸之中。原始森林、高山花海和藏家村落浑然一体。',
        tags: ['雪山', '湖泊', '佛教', '城市'],
        imageUrl: '/images/landmarks/yunnan_06_pudacuo.jpg'
      },
      {
        name: '石林风景区',
        nameEn: '石林风景区',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '世界自然遗产，两亿年前的石灰岩经风化形成了奇特的石林地貌。剑状、柱状、蘑菇状的石笋千姿百态，如地下迷宫。',
        tags: [],
        imageUrl: '/images/landmarks/yunnan_07_shilin.jpg'
      },
      {
        name: '滇池',
        nameEn: '滇池',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '昆明母亲的怀抱，高原上最大的淡水湖。每年冬天十万多只红嘴鸥从西伯利亚飞来越冬，海埂大坝上人与自然和谐共处。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/yunnan_08_dianchi.jpg'
      }
    ]
  },
  540000: {
    id: '540000',
    name: '西藏',
    nameEn: 'Tibet',
    description: '世界屋脊，离天堂最近的地方。',
    color: '#D4A84B',
    hotspotCount: 6,
    avgRating: 4.6,
    hotspots: [
      {
        name: '布达拉宫',
        nameEn: '布达拉宫',
        type: 'cultural',
        rating: 4.9,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，青藏高原的标志性建筑。这座海拔3700米的宫殿群依山而建，红白相间的墙体金碧辉煌，承载着千年的藏传佛教历史',
        tags: ['雪山', '湖泊', '佛教'],
        imageUrl: '/images/landmarks/xizang_01_budalagong.jpg'
      },
      {
        name: '大昭寺',
        nameEn: '大昭寺',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '藏传佛教最神圣的寺庙，供奉着释迦牟尼十二岁等身像。八廓街的转经道上，信徒们虔诚磕长朝拜，令人动容。',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/xizang_02_dazhao.jpg'
      },
      {
        name: '八廓街',
        nameEn: '八廓街',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '围绕大昭寺的千年转经道，拉萨最热闹的地方。唐卡店、藏饰铺、藏香作坊鳞次栉比，是了解藏地文化的窗口。',
        tags: [],
        imageUrl: '/images/landmarks/xizang_03_bakuo.jpg'
      },
      {
        name: '扎什伦布寺',
        nameEn: '扎什伦布寺',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '日喀则的标志性建筑，历代班禅驻锡之地。五世到九世班禅灵塔殿金碧辉煌，强巴佛铜像高大庄严。',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/xizang_04_zhashi.jpg'
      },
      {
        name: '文成公主庙',
        nameEn: '文成公主庙',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '公元七世纪文成公主进藏途中停留之所，大日如来窟的唐代石刻造像珍贵罕见。马蹄印传说为文成公主所留。',
        tags: [],
        imageUrl: '/images/landmarks/xizang_05_wencheng.jpg'
      },
      {
        name: '罗布林卡',
        nameEn: '罗布林卡',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '达赖喇嘛的夏宫，西藏最大的园林。绿树成荫、亭台楼阁、人工湖波光粼粼，是拉萨城内的一处清凉宝地。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/xizang_06_luobu.jpg'
      }
    ]
  },
  610000: {
    id: '610000',
    name: '陕西',
    nameEn: 'Shaanxi',
    description: '千年古都西安，十三朝历史文化积淀。兵马俑的震撼、大雁塔的庄严、不夜城的繁华。',
    color: '#C23B22',
    hotspotCount: 10,
    bestSeason: '春季（3-5月）、秋季（9-11月）',
    avgRating: 4.5,
    hotspots: [
      {
        name: '大雁塔',
        nameEn: '大雁塔',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '玄奘法师为保存从天竺带回的佛经主持修建，是唐长安城的标志性建筑。夜晚音乐喷泉与古塔交相辉映。',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/shaanxi_01_dayanta.jpg'
      },
      {
        name: '大唐不夜城',
        nameEn: '大唐不夜城',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '以盛唐文化为背景的不夜城步行街，灯火璀璨、古装表演层出不穷。不倒翁小姐姐、盛唐密盒等网红表演吸引大批游客。',
        tags: [],
        imageUrl: '/images/landmarks/shaanxi_02_datang.jpg'
      },
      {
        name: '华清宫',
        nameEn: '华清宫',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '唐玄宗和杨贵妃的浪漫之地，骊山脚下的温泉行宫至今犹存。《长恨歌》大型实景演出在夜晚上演，感人至深。',
        tags: [],
        imageUrl: '/images/landmarks/shaanxi_03_huaqing.jpg'
      },
      {
        name: '西安城墙',
        nameEn: '西安城墙',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国现存最完整、规模最大的古代城垣，周长13.7公里。可以骑车绕城一周，感受古今交替的历史沧桑。',
        tags: [],
        imageUrl: '/images/landmarks/shaanxi_04_chengqiang.jpg'
      },
      {
        name: '回民街',
        nameEn: '回民街',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '西安最具烟火气的饮食文化街，腊牛羊肉夹馍、 biangbiang面、灌汤包、胡辣汤……让人从街头吃到街尾。',
        tags: [],
        imageUrl: '/images/landmarks/shaanxi_05_huimin.jpg'
      },
      {
        name: '乾陵',
        nameEn: '乾陵',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '唐高宗李治与女皇武则天的合葬墓，中国唯一两位皇帝的合葬陵墓。无字碑和六十一蕃臣像诉说千年往事。',
        tags: [],
        imageUrl: '/images/landmarks/shaanxi_06_qianling.jpg'
      },
      {
        name: '法门寺',
        nameEn: '法门寺',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '供奉佛祖真身指骨舍利的皇家寺庙，地宫出土的唐代珍宝举世无双。合十舍利塔庄严肃穆，是重要的佛教圣地。',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/shaanxi_07_famen.jpg'
      },
      {
        name: '黄帝陵',
        nameEn: '黄帝陵',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '中华民族始祖轩辕黄帝的陵寝，被誉为"天下第一陵"。每年清明公祭轩辕黄帝典礼在此举行，是中华儿女寻根问祖的圣地。',
        tags: [],
        imageUrl: '/images/landmarks/shaanxi_08_huangdi.jpg'
      },
      {
        name: '延安宝塔山',
        nameEn: '延安宝塔山',
        type: 'urban',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '革命圣地延安的标志，宝塔屹立在山巅，延河水在脚下奔流。杨家岭、枣园等革命旧址重温峥嵘岁月。',
        tags: ['湖泊', '佛教', '城市'],
        imageUrl: '/images/landmarks/shaanxi_09_baota.jpg'
      },
      {
        name: '汉阳陵',
        nameEn: '汉阳陵',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '汉景帝刘盈和王后的合葬墓，地下博物馆以原址保护闻名。精美的汉代陶俑和"裸体俑"展现了汉代的工艺水平。',
        tags: [],
        imageUrl: '/images/landmarks/shaanxi_10_hanyang.jpg'
      }
    ]
  },
  620000: {
    id: '620000',
    name: '甘肃',
    nameEn: 'Gansu',
    description: '丝绸之路的黄金段，敦煌莫高窟的艺术殿堂。',
    color: '#D4A84B',
    hotspotCount: 6,
    avgRating: 4.6,
    hotspots: [
      {
        name: '敦煌莫高窟',
        nameEn: '敦煌莫高窟',
        type: 'cultural',
        rating: 4.9,
        duration: '半天',
        price: '待定',
        shortDesc: '世界文化遗产，千年佛窟艺术宝库。四百五十余洞窟中存有四五千平方米壁画和两千余身彩塑，是世界上现存规模最大、内容最丰富的佛',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/gansu_01_mogao.jpg'
      },
      {
        name: '麦积山石窟',
        nameEn: '麦积山石窟',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '中国四大石窟之一，栈道上的艺术殿堂。千余尊泥塑佛像悬挂在陡峭的崖壁上，最精美的南北朝塑像栩栩如生。',
        tags: [],
        imageUrl: '/images/landmarks/gansu_02_maijishan.jpg'
      },
      {
        name: '天水伏羲庙',
        nameEn: '天水伏羲庙',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '中国规模最大的伏羲祭祀建筑群，每年农历三月二十八举行公祭中华民族始祖伏羲大典，是寻根祭祖的重要场所。',
        tags: [],
        imageUrl: '/images/landmarks/gansu_03_fuximiao.jpg'
      },
      {
        name: '拉卜楞寺',
        nameEn: '拉卜楞寺',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '格鲁派六大寺之一，世界上最长的转经道就在这里。金顶红墙的藏传佛教建筑群，藏文化学习的圣地。',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/gansu_04_labuleng.jpg'
      },
      {
        name: '炳灵寺石窟',
        nameEn: '炳灵寺石窟',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '黄河流域最重要的佛教艺术宝库之一，唐代大佛巍然端坐于炳灵石崖之上。乘船进入峡谷，别有洞天之感。',
        tags: ['湖泊', '佛教'],
        imageUrl: '/images/landmarks/gansu_05_binglingsi.jpg'
      },
      {
        name: '扎尕那',
        nameEn: '扎尕那',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '藏语意为"石头匣子"，四面绝壁环绕着古朴的藏族村寨。云雾缭绕中的仙女滩和晨雾弥漫的田野如世外桃源。',
        tags: []
      }
    ]
  },
  630000: {
    id: '630000',
    name: '青海',
    nameEn: 'Qinghai',
    description: '三江源头，青海湖的辽阔与高原的纯净。',
    color: '#2EA89A',
    hotspotCount: 12,
    avgRating: 4.5,
    hotspots: [
      {
        name: '青海湖',
        nameEn: '青海湖',
        type: 'natural',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最大的内陆咸水湖，面积达4500多平方公里。湛蓝的湖面与远处雪山相映，夏季遍地的油菜花为这片高原净土增添了绚丽色彩。',
        tags: ['雪山', '湖泊', '自然'],
        imageUrl: '/images/landmarks/qinghai_01_qinghaihu.jpg'
      },
      {
        name: '茶卡盐湖',
        nameEn: '茶卡盐湖',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '被称为"天空之镜"，盐湖湖面平静如镜，倒映蓝天白云。赤脚走在湖面上拍照，仿佛行走在云端，如梦如幻。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/qinghai_02_chaka.jpg'
      },
      {
        name: '祁连山',
        nameEn: '祁连山',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '被誉为"东方瑞士"的祁连草原，雪山、草原、森林、草甸交织成壮美的立体画卷。七月的高山草甸开满野花，牛羊成群。',
        tags: ['雪山'],
        imageUrl: '/images/landmarks/qinghai_03_qilian.jpg'
      },
      {
        name: '门源油菜花',
        nameEn: '门源油菜花',
        type: 'urban',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '每年七月上旬，百里油菜花海在祁连山脚下绚烂绽放。金黄的花海与远处的雪山、蓝天构成令人窒息的画面。',
        tags: ['雪山', '湖泊', '城市'],
        imageUrl: '/images/landmarks/qinghai_04_menyuan.jpg'
      },
      {
        name: '可可西里',
        nameEn: '可可西里',
        type: 'urban',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '世界第三大无人区，藏羚羊、野牦牛、藏野驴自由奔跑的天堂。卓乃湖和太阳湖是这片原始荒原上最珍贵的珍珠。',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/qinghai_05_kekexili.jpg'
      },
      {
        name: '塔尔寺',
        nameEn: '塔尔寺',
        type: 'cultural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '藏传佛教格鲁派六大寺之一，宗喀巴大师诞生地。壁画、堆绣、酥油花艺术"三绝"闻名于世，小金瓦寺金光灿烂。',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/qinghai_06_taer.jpg'
      },
      {
        name: '坎布拉国家森林公园',
        nameEn: '坎布拉国家森林公园',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '丹霞地貌与高原湖泊完美融合，人工水库与红岩峭壁形成鲜明对比。乘船游览犹如进入了藏区的桂林山水。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/qinghai_07_kanbula.jpg'
      },
      {
        name: '青海湖鸟岛',
        nameEn: '青海湖鸟岛',
        type: 'natural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '每年春季数十万只候鸟在此栖息繁衍，斑头雁、棕头鸥、天鹅争奇斗艳。站在观景台上，耳畔全是鸟鸣声。',
        tags: ['湖泊', '自然'],
        imageUrl: '/images/landmarks/qinghai_08_niaodao.jpg'
      },
      {
        name: '东昆仑瑶池',
        nameEn: '东昆仑瑶池',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '传说中的西王母居所——乌素特水上雅丹。奇特的浮水雅丹群漂浮在水面之上，是世界独一无二的地质奇观。',
        tags: [],
        imageUrl: '/images/landmarks/qinghai_09_kunlun.jpg'
      },
      {
        name: '循化撒拉族民俗村',
        nameEn: '循化撒拉族民俗村',
        type: 'natural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '中国第一个撒拉族自治县，孟达天池被誉为"高原明珠"。撒拉族的锅庄舞和民族服饰绚丽多彩，民族特色美食诱人。',
        tags: ['美食', '自然'],
        imageUrl: '/images/landmarks/qinghai_10_xunhua.jpg'
      },
      {
        name: '大武口丹霞',
        nameEn: '大武口丹霞',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '青海独特的丹霞地貌群，红、黄、绿、白各色岩层层层叠叠。在日落时分观看丹霞地貌，色彩层次极为丰富。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/qinghai_11_dawukou.jpg'
      },
      {
        name: '龙羊峡',
        nameEn: '龙羊峡',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '黄河上游第一座大型梯级电站，峡谷深峻、水质清澈。库区水域宽阔，两岸山体陡峭，是户外探险的好地方。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/qinghai_12_longyangxia.jpg'
      }
    ]
  },
  640000: {
    id: '640000',
    name: '宁夏',
    nameEn: 'Ningxia',
    description: '塞上江南，贺兰山下的神奇土地。',
    color: '#D4A84B',
    hotspotCount: 7,
    avgRating: 4.4,
    hotspots: [
      {
        name: '西夏陵',
        nameEn: '西夏陵',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '西夏王朝的皇家陵寝，十三座帝陵分布在广袤的草原上。夯土陵阙在夕阳下格外壮观，被誉为"东方的金字塔"。',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/ningxia_01_xixia.jpg'
      },
      {
        name: '镇北堡西部影城',
        nameEn: '镇北堡西部影城',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '《大话西游》《红高粱》等经典电影的拍摄地。张贤亮打造的影视古城充满了西北荒凉之美，穿上戏服就能穿越回电影场景。',
        tags: ['古城'],
        imageUrl: '/images/landmarks/ningxia_02_zhenbeibao.jpg'
      },
      {
        name: '贺兰山岩画',
        nameEn: '贺兰山岩画',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '三万年前先民留下的岩石绘画，记录了游牧民族的生活与信仰。贺兰口峡谷中密密麻麻的远古图腾，令人叹为观止。',
        tags: [],
        imageUrl: '/images/landmarks/ningxia_03_helanshan.jpg'
      },
      {
        name: '水洞沟遗址',
        nameEn: '水洞沟遗址',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最早发掘的旧石器时代遗址之一，也是唯一保存完好的遗址。地下长城和明代长城交织在这里，跨越万年的时空对话。',
        tags: [],
        imageUrl: '/images/landmarks/ningxia_04_shuidonggou.jpg'
      },
      {
        name: '承天寺塔',
        nameEn: '承天寺塔',
        type: 'cultural',
        rating: 4.1,
        duration: '半天',
        price: '待定',
        shortDesc: '宁夏现存最高的古代砖塔，始建于西夏天祐垂圣元年。八角九层楼阁式砖塔造型优美，是银川古城的标志之一。',
        tags: ['古城', '佛教'],
        imageUrl: '/images/landmarks/ningxia_05_chengtian.jpg'
      },
      {
        name: '青铜峡一百零八塔',
        nameEn: '青铜峡一百零八塔',
        type: 'cultural',
        rating: 4.4,
        duration: '半天',
        price: '待定',
        shortDesc: '中国现存最大的古塔群之一，一百零八座塔沿山坡整齐排列，气势恢宏。塔群背倚青铜峡谷，面向黄河，佛教文化氛围浓厚。',
        tags: ['湖泊', '佛教'],
        imageUrl: '/images/landmarks/ningxia_06_qingtongxia.jpg'
      },
      {
        name: '须弥山石窟',
        nameEn: '须弥山石窟',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '开凿于北魏时期的佛教石窟群，大佛窟弥勒佛高达20.6米。石窟雕刻精美，壁画色彩斑斓，堪称丝路明珠。',
        tags: ['佛教'],
        imageUrl: '/images/landmarks/ningxia_07_xumi.jpg'
      }
    ]
  },
  650000: {
    id: '650000',
    name: '新疆',
    nameEn: 'Xinjiang',
    description: '占中国六分之一面积的辽阔疆域。喀纳斯的秘境仙境、天山天池的冰雪圣洁、吐鲁番的葡萄飘香。',
    color: '#D4A84B',
    hotspotCount: 12,
    bestSeason: '6月-10月',
    avgRating: 4.5,
    hotspots: [
      {
        name: '喀纳斯湖',
        nameEn: '喀纳斯湖',
        type: 'natural',
        rating: 4.9,
        duration: '半天',
        price: '待定',
        shortDesc: '"神的后花园"，海拔1374米的高山冰蚀湖。湖水随季节变化呈不同的颜色，湖中传闻有大鱼怪兽，增添了一层神秘面纱。',
        tags: ['雪山', '湖泊', '自然'],
        imageUrl: '/images/landmarks/xinjiang_01_kanasi.jpg'
      },
      {
        name: '吐鲁番火焰山',
        nameEn: '吐鲁番火焰山',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '《西游记》中的火焰山原型，夏季地表温度可达70℃以上。赤红色的山体在高温蒸腾中摇曳扭曲，是大自然的热浪奇观。',
        tags: [],
        imageUrl: '/images/landmarks/xinjiang_02_huoyanshan.jpg'
      },
      {
        name: '喀什古城',
        nameEn: '喀什古城',
        type: 'cultural',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '中国现存最完整的伊斯兰风格古城之一，拥有2000多年历史。巷弄纵横、巴扎热闹、维吾尔族风情浓郁，每一步都是故事。',
        tags: ['古城'],
        imageUrl: '/images/landmarks/xinjiang_03_kashi.jpg'
      },
      {
        name: '天山天池',
        nameEn: '天山天池',
        type: 'natural',
        rating: 4.6,
        duration: '半天',
        price: '待定',
        shortDesc: '联合国教科文组织世界自然遗产，高海拔冰蚀冰碛湖。博格达峰倒映在翡翠般的湖水中，王母娘娘的瑶池传说增添了神秘色彩。',
        tags: ['雪山', '湖泊', '自然'],
        imageUrl: '/images/landmarks/xinjiang_04_tianchi.jpg'
      },
      {
        name: '独库公路',
        nameEn: '独库公路',
        type: 'urban',
        rating: 4.8,
        duration: '半天',
        price: '待定',
        shortDesc: '纵贯天山脊梁的景观大道，全长561公里。一年只有四个月通车，穿越四季、翻越四千米达坂，每一公里都是风景。',
        tags: ['城市'],
        imageUrl: '/images/landmarks/xinjiang_05_duku.jpg'
      },
      {
        name: '塔什库尔干',
        nameEn: '塔什库尔干',
        type: 'urban',
        rating: 4.7,
        duration: '半天',
        price: '待定',
        shortDesc: '帕米尔高原上的宝石，白石峰、白沙湖、卡拉库里湖构成极致风光。塔吉克族的金色鹰舞热情奔放，边境线风光壮丽。',
        tags: ['湖泊', '佛教', '城市'],
        imageUrl: '/images/landmarks/xinjiang_06_tashkurgan.jpg'
      },
      {
        name: '葡萄沟',
        nameEn: '葡萄沟',
        type: 'cultural',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '火焰山峡谷中的绿色走廊，吐鲁番最甜美的秘密所在。三百多个葡萄品种挂在架子上，维吾尔族民俗村充满异域风情。',
        tags: [],
        imageUrl: '/images/landmarks/xinjiang_07_putaogou.jpg'
      },
      {
        name: '乌尔禾魔鬼城',
        nameEn: '乌尔禾魔鬼城',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '雅丹地貌的天然博物馆，风蚀岩层形状怪诞。日落时分的彩色丘陵如同外星球表面，《卧虎藏龙》曾在此取景。',
        tags: [],
        imageUrl: '/images/landmarks/xinjiang_08_wuerhe.jpg'
      },
      {
        name: '吐鲁番交河故城',
        nameEn: '吐鲁番交河故城',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '世界上保存最完整、延续时间最长的生土建筑古城。从车辙交错的车道一直向下延伸到15米深的河床，两千年沧桑。',
        tags: ['湖泊', '古城'],
        imageUrl: '/images/landmarks/xinjiang_09_jiaohe.jpg'
      },
      {
        name: '博斯腾湖',
        nameEn: '博斯腾湖',
        type: 'urban',
        rating: 4.3,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最大的内陆淡水湖，芦苇荡绵延数公里，荷花盛开时"接天莲叶无穷碧"。渔村人家的日落宁静而美好。',
        tags: ['湖泊', '城市'],
        imageUrl: '/images/landmarks/xinjiang_10_bosten.jpg'
      },
      {
        name: '库车王府',
        nameEn: '库车王府',
        type: 'cultural',
        rating: 4.2,
        duration: '半天',
        price: '待定',
        shortDesc: '清代乾隆皇帝封授的库车王族府邸，融合了维吾尔族和中原建筑风格。精美的彩塑木雕展示了龟兹文化的光辉历史。',
        tags: [],
        imageUrl: '/images/landmarks/xinjiang_11_kuche.jpg'
      },
      {
        name: '伊犁薰衣草',
        nameEn: '伊犁薰衣草',
        type: 'cultural',
        rating: 4.5,
        duration: '半天',
        price: '待定',
        shortDesc: '中国最大的薰衣草种植基地，媲美法国普罗旺斯。每年六月紫色的花浪随风起伏，馥郁芬芳飘散在伊犁河谷。',
        tags: ['湖泊'],
        imageUrl: '/images/landmarks/xinjiang_12_yili.jpg'
      }
    ]
  },
  710000: {
    id: '710000',
    name: '台湾',
    nameEn: 'Taiwan',
    description: '宝岛台湾，日月潭与阿里山的美景。',
    color: '#1A8A7A',
    hotspotCount: 0,
    avgRating: undefined,
    hotspots: [
    ]
  },
  810000: {
    id: '810000',
    name: '香港',
    nameEn: 'Hong Kong',
    description: '东方之珠，购物与美食的天堂。',
    color: '#D4A84B',
    hotspotCount: 0,
    avgRating: undefined,
    hotspots: [
    ]
  },
  820000: {
    id: '820000',
    name: '澳门',
    nameEn: 'Macau',
    description: '中西文化交融的博彩之都，大三巴牌坊矗立。',
    color: '#C23B22',
    hotspotCount: 0,
    avgRating: undefined,
    hotspots: [
    ]
  }
}

/**
 * 热门目的地列表（用于底部轮播）
 */
// 景点名 → imageUrl 索引（懒加载）
// 用于根据景点名查找对应的本地真实照片
let _spotImageMap = null

// 构建 景点名 → imageUrl 的 Map（首次调用时构建，之后走缓存）
function buildSpotImageMap() {
  if (_spotImageMap) return _spotImageMap
  _spotImageMap = new Map()
  // 遍历所有省份的所有景点，构建名字到图片的映射
  Object.values(provinceData).forEach(province => {
    (province.hotspots || []).forEach(spot => {
      if (spot.imageUrl) {
        _spotImageMap.set(spot.name, spot.imageUrl)
      }
    })
  })
  return _spotImageMap
}

// 根据景点名查本地图片 URL
// 支持精确匹配 + 模糊匹配（包含关键词）
export function getSpotImageByName(name) {
  if (!name) return ''
  const map = buildSpotImageMap()
  // 1. 精确匹配
  if (map.has(name)) return map.get(name)
  // 2. 模糊匹配：找包含输入名的景点，或被输入名包含的景点
  for (const [spotName, url] of map.entries()) {
    if (spotName.includes(name) || name.includes(spotName)) return url
  }
  return ''
}

// 根据城市名找该省的所有热门景点（按评分排序，返回前 N 个）
// 用于 AI 生成行程时为城市优先匹配本地热门景点
export function getProvinceSpotsByCity(cityName, limit = 5) {
  if (!cityName) return []
  // 找省份：名字包含城市名（如"丽江"在云南省数据中）
  const result = []
  Object.values(provinceData).forEach(province => {
    // 先按省份名匹配
    if (province.name === cityName || province.name.includes(cityName) || cityName.includes(province.name)) {
      (province.hotspots || []).forEach(spot => {
        result.push({ ...spot, province: province.name })
      })
    }
  })
  // 按评分排序
  result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
  return result.slice(0, limit)
}

export const hotDestinations = [
  { id: 1, name: '故宫博物院', province: '北京', image: '', shortDesc: '中国明清两代的皇家宫殿，是世界上现存规模', rating: 4.9, season: '春秋两季' },
  { id: 2, name: '慕田峪长城', province: '北京', image: '', shortDesc: '万里长城的精华段之一，以雄伟险峻著称，植', rating: 4.8, season: '春秋两季' },
  { id: 3, name: '天津之眼', province: '天津', image: '', shortDesc: '世界上唯一建在桥上的摩天轮，横跨海河之上', rating: 4.5, season: '全年' },
  { id: 4, name: '古文化街', province: '天津', image: '', shortDesc: '天津最具民俗文化特色的商业步行街，供奉着', rating: 4.4, season: '全年' },
  { id: 5, name: '承德避暑山庄', province: '河北', image: '', shortDesc: '中国最大的皇家园林，清代皇帝夏季避暑和处', rating: 4.7, season: '全年' },
  { id: 6, name: '山海关', province: '河北', image: '', shortDesc: '天下第一关，明万里长城的东北起点，自古为', rating: 4.5, season: '全年' },
  { id: 7, name: '平遥古城', province: '山西', image: '', shortDesc: '中国保存最为完整的四大古城之一，明清时期', rating: 4.7, season: '全年' },
  { id: 8, name: '云冈石窟', province: '山西', image: '', shortDesc: '中国规模最大的古代石窟群之一，北魏皇室主', rating: 4.7, season: '全年' },
  { id: 9, name: '沈阳故宫', province: '辽宁', image: '', shortDesc: '中国仅存的两大皇家宫殿建筑群之一，是清入', rating: 4.7, season: '全年' },
  { id: 10, name: '大连金石滩', province: '辽宁', image: '', shortDesc: '国家级旅游度假区，以奇特的海蚀地貌闻名。', rating: 4.5, season: '全年' },
  { id: 11, name: '长白山天池', province: '吉林', image: '', shortDesc: '长白山火山口形成的巨大高山湖泊，海拔21', rating: 4.8, season: '全年' },
  { id: 12, name: '长春净月潭国家森林公园', province: '吉林', image: '', shortDesc: '亚洲最大的人工林海，潭水碧波荡漾、四周松', rating: 4.5, season: '全年' },
  { id: 13, name: '圣索菲亚大教堂', province: '黑龙江', image: '', shortDesc: '远东最著名的东正教教堂，拜占庭式建筑风格', rating: 4.6, season: '全年' },
  { id: 14, name: '中央大街', province: '黑龙江', image: '', shortDesc: '百年繁华的商业步行街，全线柏油路面由苏联', rating: 4.5, season: '全年' },
  { id: 15, name: '外滩', province: '上海', image: '', shortDesc: '上海的城市名片，绵延1.5公里的江滨步道', rating: 4.9, season: '春秋两季' },
  { id: 16, name: '上海迪士尼度假区', province: '上海', image: '', shortDesc: '中国大陆首座迪士尼乐园，拥有全球最高的迪', rating: 4.7, season: '春秋两季' },
  { id: 17, name: '苏州园林（拙政园）', province: '江苏', image: '', shortDesc: '中国四大名园之一，被誉为\'中国园林之母\'', rating: 4.8, season: '全年' },
  { id: 18, name: '南京夫子庙-秦淮河风光带', province: '江苏', image: '', shortDesc: '中国最大的传统古街市，以夫子庙为中心、秦', rating: 4.6, season: '全年' },
  { id: 19, name: '西湖风景区', province: '浙江', image: '', shortDesc: '世界文化遗产，位于杭州市中心，以\'人间天', rating: 4.9, season: '春季（3-5月）、秋季（9-11月）' },
  { id: 20, name: '乌镇', province: '浙江', image: '', shortDesc: '中国最著名的江南水乡古镇之一，位于桐乡市', rating: 4.7, season: '春季（3-5月）、秋季（9-11月）' },
  { id: 21, name: '黄山风景区', province: '安徽', image: '', shortDesc: '中国第一名山，世界文化与自然双重遗产。奇', rating: 5, season: '全年' },
  { id: 22, name: '宏村', province: '安徽', image: '', shortDesc: '世界文化遗产，被誉为\'中国画里的乡村\'。', rating: 4.8, season: '全年' },
  { id: 23, name: '武夷山', province: '福建', image: '', shortDesc: '世界文化与自然双遗产，以\'奇秀甲於东南\'', rating: 4.8, season: '春秋两季' },
  { id: 24, name: '鼓浪屿', province: '福建', image: '', shortDesc: '世界文化遗产，厦门思明区西南面小岛。岛上', rating: 4.7, season: '春秋两季' },
  { id: 25, name: '庐山', province: '江西', image: '', shortDesc: '世界文化遗产，中华十大名山之一。\'不识庐', rating: 4.8, season: '全年' },
  { id: 26, name: '三清山', province: '江西', image: '', shortDesc: '世界自然遗产，花岗岩峰林地貌的杰作。玉京', rating: 4.8, season: '全年' },
  { id: 27, name: '泰山', province: '山东', image: '', shortDesc: '五岳之首，世界文化与自然双重遗产。\'会当', rating: 4.9, season: '全年' },
  { id: 28, name: '趵突泉', province: '山东', image: '', shortDesc: '天下第一泉，位于济南市区。三股泉水喷涌不', rating: 4.5, season: '全年' },
  { id: 29, name: '龙门石窟', province: '河南', image: '', shortDesc: '世界文化遗产，中国三大石窟之一。2345', rating: 4.9, season: '全年' },
  { id: 30, name: '少林寺', province: '河南', image: '', shortDesc: '中国佛教禅宗祖庭和功夫发源地。位于嵩山五', rating: 4.7, season: '全年' },
  { id: 31, name: '黄鹤楼', province: '湖北', image: '', shortDesc: '江南三大名楼之首，武汉城市象征。始建于三', rating: 4.6, season: '全年' },
  { id: 32, name: '三峡大坝', province: '湖北', image: '', shortDesc: '世界上最大的水利枢纽工程，位于宜昌市夷陵', rating: 4.7, season: '全年' },
  { id: 33, name: '张家界国家森林公园', province: '湖南', image: '', shortDesc: '世界自然遗产，国家森林公园。三千奇峰拔地', rating: 4.9, season: '全年' },
  { id: 34, name: '武陵源', province: '湖南', image: '', shortDesc: '张家界国家森林公园的核心景区，包含张家界', rating: 4.9, season: '全年' },
  { id: 35, name: '广州塔（小蛮腰）', province: '广东', image: '', shortDesc: '广州城市新中轴线上的标志性建筑，高600', rating: 4.5, season: '10月-12月 或 3月-4月' },
  { id: 36, name: '长隆旅游度假区', province: '广东', image: '', shortDesc: '国家级旅游度假区，拥有长隆野生动物世界、', rating: 4.6, season: '10月-12月 或 3月-4月' },
  { id: 37, name: '漓江风景区', province: '广西', image: '', shortDesc: '中国最美的山水画卷，桂林山水的代表。21', rating: 4.9, season: '全年' },
  { id: 38, name: '阳朔十里画廊', province: '广西', image: '', shortDesc: '阳朔最美的自行车骑行路线，沿途峰林田地交', rating: 4.7, season: '全年' },
  { id: 39, name: '亚龙湾', province: '海南', image: '', shortDesc: '"天下第一湾"的美誉当之无愧，2000米', rating: 4.7, season: '11月-次年4月' },
  { id: 40, name: '蜈支洲岛', province: '海南', image: '', shortDesc: '中国的"马尔代夫"，岛上沙质细腻洁白，海', rating: 4.6, season: '11月-次年4月' },
  { id: 41, name: '洪崖洞', province: '重庆', image: '', shortDesc: '重庆最著名的地标之一，吊脚楼风格的建筑群', rating: 4.7, season: '全年' },
  { id: 42, name: '解放碑', province: '重庆', image: '', shortDesc: '重庆的城市中心和精神象征，是全国唯一一座', rating: 4.5, season: '全年' },
  { id: 43, name: '九寨沟风景名胜区', province: '四川', image: '', shortDesc: '被誉为"童话世界"的世界自然遗产，拥有翠', rating: 4.9, season: '春秋两季' },
  { id: 44, name: '稻城亚丁', province: '四川', image: '', shortDesc: '被誉为"香格里拉最后的秘境"，由仙乃日、', rating: 4.8, season: '春秋两季' },
  { id: 45, name: '黄果树瀑布', province: '贵州', image: '', shortDesc: '亚洲最大的瀑布群，主瀑布高77.8米、宽', rating: 4.7, season: '全年' },
  { id: 46, name: '西江千户苗寨', province: '贵州', image: '', shortDesc: '世界最大的苗族聚居村寨，上千栋吊脚楼依山', rating: 4.5, season: '全年' },
  { id: 47, name: '丽江古城', province: '云南', image: '', shortDesc: '世界文化遗产，纳西族千年古城。四方街、大', rating: 4.5, season: '全年适宜，3-10月最佳' },
  { id: 48, name: '玉龙雪山', province: '云南', image: '', shortDesc: '纳西族的神山，主峰扇子陡海拔5596米。', rating: 4.7, season: '全年适宜，3-10月最佳' },
  { id: 49, name: '布达拉宫', province: '西藏', image: '', shortDesc: '世界文化遗产，青藏高原的标志性建筑。这座', rating: 4.9, season: '全年' },
  { id: 50, name: '大昭寺', province: '西藏', image: '', shortDesc: '藏传佛教最神圣的寺庙，供奉着释迦牟尼十二', rating: 4.7, season: '全年' },
  { id: 51, name: '大雁塔', province: '陕西', image: '', shortDesc: '玄奘法师为保存从天竺带回的佛经主持修建，', rating: 4.5, season: '春季（3-5月）、秋季（9-11月）' },
  { id: 52, name: '大唐不夜城', province: '陕西', image: '', shortDesc: '以盛唐文化为背景的不夜城步行街，灯火璀璨', rating: 4.5, season: '春季（3-5月）、秋季（9-11月）' },
  { id: 53, name: '敦煌莫高窟', province: '甘肃', image: '', shortDesc: '世界文化遗产，千年佛窟艺术宝库。四百五十', rating: 4.9, season: '全年' },
  { id: 54, name: '麦积山石窟', province: '甘肃', image: '', shortDesc: '中国四大石窟之一，栈道上的艺术殿堂。千余', rating: 4.6, season: '全年' },
  { id: 55, name: '青海湖', province: '青海', image: '', shortDesc: '中国最大的内陆咸水湖，面积达4500多平', rating: 4.8, season: '全年' },
  { id: 56, name: '茶卡盐湖', province: '青海', image: '', shortDesc: '被称为"天空之镜"，盐湖湖面平静如镜，倒', rating: 4.7, season: '全年' },
  { id: 57, name: '西夏陵', province: '宁夏', image: '', shortDesc: '西夏王朝的皇家陵寝，十三座帝陵分布在广袤', rating: 4.4, season: '全年' },
  { id: 58, name: '镇北堡西部影城', province: '宁夏', image: '', shortDesc: '《大话西游》《红高粱》等经典电影的拍摄地', rating: 4.5, season: '全年' },
  { id: 59, name: '喀纳斯湖', province: '新疆', image: '', shortDesc: '"神的后花园"，海拔1374米的高山冰蚀', rating: 4.9, season: '6月-10月' },
  { id: 60, name: '吐鲁番火焰山', province: '新疆', image: '', shortDesc: '《西游记》中的火焰山原型，夏季地表温度可', rating: 4.3, season: '6月-10月' }
]
