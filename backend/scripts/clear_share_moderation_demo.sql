-- Clear corrupted demo posts/comments before UTF-8 reseed
DELETE FROM comments;
DELETE FROM posts;
UPDATE users
SET nickname = CASE account
  WHEN 'traveler_lin' THEN '林晓舟'
  WHEN 'traveler_chen' THEN '陈南星'
  WHEN 'traveler_zhou' THEN '周晚晴'
  ELSE nickname
END
WHERE account IN ('traveler_lin', 'traveler_chen', 'traveler_zhou');
