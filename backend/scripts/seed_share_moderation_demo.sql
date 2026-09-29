-- 本地测试：旅途分享 + 评论审核样例数据
-- 作者账号密码均为 123456（除已有 admin）
-- 评论按所属分享分别写，避免同一文案复制到所有帖子

BEGIN;

INSERT INTO users (account, nickname, hashed_password, avatar_bg, status, created_at, updated_at)
SELECT v.account, v.nickname, v.pwd, v.bg, 'active', NOW(), NOW()
FROM (VALUES
  ('traveler_lin', '林晓舟', '$2b$12$uuY9mPYxEjnpJUziRcxJw.OiTUFH80WjVs0cehbrXX6Fiblan4QkC', 'linear-gradient(135deg, #0D6B5C, #1A8A7A)'),
  ('traveler_chen', '陈南星', '$2b$12$uuY9mPYxEjnpJUziRcxJw.OiTUFH80WjVs0cehbrXX6Fiblan4QkC', 'linear-gradient(135deg, #7BA4D4, #5A8ABF)'),
  ('traveler_zhou', '周晚晴', '$2b$12$uuY9mPYxEjnpJUziRcxJw.OiTUFH80WjVs0cehbrXX6Fiblan4QkC', 'linear-gradient(135deg, #D4A84B, #C2960C)')
) AS v(account, nickname, pwd, bg)
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.account = v.account);

WITH authors AS (
  SELECT id, account FROM users WHERE account IN ('admin', 'traveler_lin', 'traveler_chen', 'traveler_zhou')
),
seed_posts AS (
  INSERT INTO posts (
    user_id, title, content, images, rating, tags, location,
    likes_count, comments_count, status, moderation_reason, created_at, updated_at
  )
  SELECT
    a.id,
    p.title,
    p.content,
    p.images,
    p.rating,
    p.tags,
    p.location,
    p.likes_count,
    0,
    p.status,
    p.moderation_reason,
    NOW() - (p.hours_ago || ' hours')::interval,
    NOW() - (p.hours_ago || ' hours')::interval
  FROM (VALUES
    ('traveler_lin', '鼓浪屿傍晚散步日记', '傍晚的日光岩风很轻，巷子里飘着海苔花生汤的味道。我们沿着龙头路慢慢走，拍了很多没有滤镜的街角。', ARRAY['/images/landmarks/fujian_02_gulangyu.jpg']::text[], 5, ARRAY['海岛','慢旅行']::varchar[], '厦门 · 鼓浪屿', 18, 'published', NULL, 30),
    ('traveler_chen', '故宫雨后红墙更醒目', '雨刚停，红墙被洗得发亮。午门到乾清宫这一段人流散开后，才真正感觉到这座城的尺度。', ARRAY['/images/landmarks/beijing_01_gugong.jpg']::text[], 5, ARRAY['古迹','北京']::varchar[], '北京 · 故宫', 42, 'published', NULL, 26),
    ('traveler_zhou', '西湖清晨几乎没有游客', '六点到苏堤，水面还有薄雾。断桥附近只有晨跑的人，拍到了很安静的一面。', ARRAY['/images/landmarks/zhejiang_01_xihu.jpg']::text[], 4, ARRAY['湖泊','清晨']::varchar[], '杭州 · 西湖', 27, 'published', NULL, 22),
    ('traveler_lin', '慕田峪长城云海来得突然', '爬到敌楼时云忽然涌上来，整段城墙像漂在海上。手套和热水是必要装备。', ARRAY['/images/landmarks/beijing_02_mutianyu.jpg']::text[], 5, ARRAY['长城','户外']::varchar[], '北京 · 慕田峪', 35, 'published', NULL, 18),
    ('traveler_chen', '外滩夜景人很多但值得', '黄浦江风很大，东方明珠和陆家嘴的灯一点点亮起来。建议提前定江景座位，不然只能站着看。', ARRAY['/images/landmarks/shanghai_01_waitan.jpg']::text[], 4, ARRAY['夜景','城市']::varchar[], '上海 · 外滩', 51, 'published', NULL, 14),
    ('traveler_zhou', '待复核：疑似广告引流文', '加微信领取低价机票攻略，私信有惊喜，全网最低价保证成交。', ARRAY[]::text[], 3, ARRAY['攻略']::varchar[], '全国', 2, 'hidden', '疑似广告引流，待人工复核', 10),
    ('traveler_lin', '张家界金鞭溪半日线', '金鞭溪步道湿滑，但负氧离子感很强。下午转天子山，云雾来得比预期早，记得带雨衣。', ARRAY['/images/landmarks/hunan_01_zhangjiajie.jpg']::text[], 5, ARRAY['山水','徒步']::varchar[], '湖南 · 张家界', 33, 'published', NULL, 8),
    ('admin', '九寨沟秋色短记', '五花海颜色分层非常明显，栈道游客较多。建议错峰进沟，中午光线最适合拍海子。', ARRAY['/images/landmarks/sichuan_01_jiuzhaigou.jpg']::text[], 5, ARRAY['秋景','自然']::varchar[], '四川 · 九寨沟', 61, 'published', NULL, 5),
    ('traveler_chen', '已删除测试：不当言论草稿', '这段内容仅用于后台删除态展示，不应出现在前台。', ARRAY[]::text[], 1, ARRAY['测试']::varchar[], '测试城市', 0, 'deleted', '测试删除状态', 3),
    ('traveler_zhou', '丽江古城夜巷小吃清单', '四方街转到木府附近，烤乳扇和鸡豆凉粉都值得排队。古城里坡多，鞋子要舒服。', ARRAY['/images/landmarks/yunnan_01_lijiang.jpg']::text[], 4, ARRAY['古城','美食']::varchar[], '云南 · 丽江', 24, 'published', NULL, 2)
  ) AS p(account, title, content, images, rating, tags, location, likes_count, status, moderation_reason, hours_ago)
  JOIN authors a ON a.account = p.account
  WHERE NOT EXISTS (
    SELECT 1 FROM posts existing WHERE existing.title = p.title AND existing.user_id = a.id
  )
  RETURNING id, title, status
),
target_posts AS (
  SELECT id, title, status FROM seed_posts
  UNION ALL
  SELECT p.id, p.title, p.status
  FROM posts p
  WHERE p.title IN (
    '鼓浪屿傍晚散步日记', '故宫雨后红墙更醒目', '西湖清晨几乎没有游客',
    '慕田峪长城云海来得突然', '外滩夜景人很多但值得', '待复核：疑似广告引流文',
    '张家界金鞭溪半日线', '九寨沟秋色短记', '丽江古城夜巷小吃清单'
  )
),
seed_comments AS (
  SELECT * FROM (VALUES
    ('鼓浪屿傍晚散步日记', 'traveler_chen', '龙头路那家花生汤还在吗？想照着去喝一口。', 'published', NULL, 28),
    ('鼓浪屿傍晚散步日记', 'traveler_zhou', '没有滤镜反而更有生活感，收藏路线了。', 'published', NULL, 24),
    ('鼓浪屿傍晚散步日记', 'traveler_lin', '隐藏测试：私聊加微信领取船票优惠', 'hidden', '含引流联系方式', 20),

    ('故宫雨后红墙更醒目', 'traveler_zhou', '雨后红墙确实好看，人少的时段拍到了吗？', 'published', NULL, 25),
    ('故宫雨后红墙更醒目', 'admin', '构图很稳，已加入本周精选候选。', 'published', NULL, 18),
    ('故宫雨后红墙更醒目', 'traveler_chen', '删除测试：辱骂性内容样例（故宫帖）', 'deleted', '测试删除评论', 14),

    ('西湖清晨几乎没有游客', 'traveler_lin', '六点出发值不值？想跟同样的时间去。', 'published', NULL, 21),
    ('西湖清晨几乎没有游客', 'traveler_chen', '薄雾那张太治愈了，求大概机位。', 'published', NULL, 17),

    ('慕田峪长城云海来得突然', 'traveler_zhou', '云海那天风速大吗？要不要冲锋衣？', 'published', NULL, 16),
    ('慕田峪长城云海来得突然', 'admin', '装备提醒很实用，适合户外新手。', 'published', NULL, 12),
    ('慕田峪长城云海来得突然', 'traveler_chen', '隐藏测试：加Vxxxx低价跟团长城一日游', 'hidden', '含引流联系方式', 9),

    ('外滩夜景人很多但值得', 'traveler_lin', '江景座位大概什么价位？有推荐饭店吗？', 'published', NULL, 13),
    ('外滩夜景人很多但值得', 'traveler_zhou', '风大这点说得对，围巾记得带。', 'published', NULL, 10),

    ('待复核：疑似广告引流文', 'traveler_chen', '这帖看起来像广告，建议下架。', 'published', NULL, 9),
    ('待复核：疑似广告引流文', 'admin', '已先隐藏，等待人工复核。', 'published', NULL, 8),
    ('待复核：疑似广告引流文', 'traveler_lin', '删除测试：辱骂性回复样例', 'deleted', '测试删除评论', 7),

    ('张家界金鞭溪半日线', 'traveler_zhou', '金鞭溪湿滑提醒及时，雨衣确实必要。', 'published', NULL, 7),
    ('张家界金鞭溪半日线', 'traveler_chen', '天子山云雾时段大概几点？', 'published', NULL, 5),
    ('张家界金鞭溪半日线', 'traveler_lin', '隐藏测试：扫码领张家界门票折扣', 'hidden', '含引流联系方式', 4),

    ('九寨沟秋色短记', 'traveler_chen', '五花海分层那张太漂亮了。', 'published', NULL, 4),
    ('九寨沟秋色短记', 'traveler_zhou', '错峰进沟建议很有用，周末避雷。', 'published', NULL, 3),
    ('九寨沟秋色短记', 'admin', '内容质量不错，可作季节专题素材。', 'published', NULL, 2),

    ('丽江古城夜巷小吃清单', 'traveler_lin', '烤乳扇和鸡豆凉粉都记下了，谢分享。', 'published', NULL, 2),
    ('丽江古城夜巷小吃清单', 'traveler_chen', '木府附近坡确实多，运动鞋走起。', 'published', NULL, 1),
    ('丽江古城夜巷小吃清单', 'traveler_zhou', '删除测试：辱骂性内容样例（丽江帖）', 'deleted', '测试删除评论', 1)
  ) AS c(post_title, account, content, status, moderation_reason, hours_ago)
)
INSERT INTO comments (
  post_id, user_id, content, status, moderation_reason, created_at
)
SELECT
  tp.id,
  a.id,
  sc.content,
  sc.status,
  sc.moderation_reason,
  NOW() - (sc.hours_ago || ' hours')::interval
FROM seed_comments sc
JOIN target_posts tp ON tp.title = sc.post_title
JOIN authors a ON a.account = sc.account
WHERE tp.status <> 'deleted'
  AND NOT EXISTS (
    SELECT 1 FROM comments existing
    WHERE existing.post_id = tp.id AND existing.content = sc.content
  );

UPDATE posts p
SET comments_count = (
  SELECT COUNT(*) FROM comments c
  WHERE c.post_id = p.id AND c.status = 'published' AND c.deleted_at IS NULL
)
WHERE p.title IN (
  '鼓浪屿傍晚散步日记', '故宫雨后红墙更醒目', '西湖清晨几乎没有游客',
  '慕田峪长城云海来得突然', '外滩夜景人很多但值得', '待复核：疑似广告引流文',
  '张家界金鞭溪半日线', '九寨沟秋色短记', '已删除测试：不当言论草稿',
  '丽江古城夜巷小吃清单'
);

COMMIT;

SELECT
  (SELECT COUNT(*) FROM posts) AS posts_total,
  (SELECT COUNT(*) FROM posts WHERE status = 'published') AS posts_published,
  (SELECT COUNT(*) FROM posts WHERE status = 'hidden') AS posts_hidden,
  (SELECT COUNT(*) FROM posts WHERE status = 'deleted') AS posts_deleted,
  (SELECT COUNT(*) FROM comments) AS comments_total,
  (SELECT COUNT(*) FROM comments WHERE status = 'published') AS comments_published,
  (SELECT COUNT(*) FROM comments WHERE status = 'hidden') AS comments_hidden,
  (SELECT COUNT(*) FROM comments WHERE status = 'deleted') AS comments_deleted;
