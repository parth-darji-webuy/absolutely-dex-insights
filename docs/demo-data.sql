-- AbsolutelyDeX Insights: demo data for testing.
--
-- !! Run this ONLY on a TEST database or a Neon BRANCH, never on the live store. !!
-- Run it in the Neon SQL editor as the owner (neondb_owner). Insights itself never writes.
-- It adds about 1,200 fake visitors, whose ids all start with "demo_". Run it again any time:
-- it removes its own earlier rows first. docs/demo-data-remove.sql removes them for good.
-- The Product and Category tables must already have rows (it uses your real products).

BEGIN;

-- 0. Clean up any earlier run.
DELETE FROM quick_view_cart_events WHERE "anonymousId" LIKE 'demo\_%';
DELETE FROM quickview_tracking     WHERE "anonymousId" LIKE 'demo\_%';
DELETE FROM add_to_cart_tracking   WHERE "anonymousId" LIKE 'demo\_%';
DELETE FROM whats_new_tracking     WHERE "anonymousId" LIKE 'demo\_%';
DELETE FROM theme_toggle_tracking  WHERE "anonymousId" LIKE 'demo\_%';
DELETE FROM experiment_tracking    WHERE "anonymousId" LIKE 'demo\_%';

-- A repeatable "random" number between 0 and 1 for (visitor number, label).
CREATE FUNCTION pg_temp.rnd(i int, salt text) RETURNS float8 LANGUAGE sql IMMUTABLE AS
$$ SELECT ('x' || substr(md5(i::text || salt), 1, 7))::bit(28)::int / 268435455.0 $$;

-- 1. The fake visitors. 45 arrived in the last 28 minutes, 45 more in the last hour, the rest over 10 days.
CREATE TEMP TABLE demo_v ON COMMIT DROP AS
SELECT i,
       'demo_' || substr(md5('visitor' || i), 1, 7) AS aid,
       timezone('UTC', now()) - CASE
         WHEN i <= 45 THEN pg_temp.rnd(i, 't') * interval '28 minutes'
         WHEN i <= 90 THEN pg_temp.rnd(i, 't') * interval '58 minutes'
         ELSE pg_temp.rnd(i, 't') * interval '10 days'
       END AS t0
FROM generate_series(1, 1200) AS i;

-- 2. The four experiments (the same keys GrowthBook uses).
CREATE TEMP TABLE demo_x ON COMMIT DROP AS
SELECT * FROM (VALUES
  ('add-cart-button-experience', 'Add to Cart - Button Experience', 'add-to-cart',      'Control', 'Variation 1', 'control', 'treatment'),
  ('quick-view-ab-test',         'Quick View A/B Test',             'quick-view-enabled','Control', 'Treatment',   'false',   'true'),
  ('new-ab-test',                'Whats New A/B Test',              'whats-new',         'Whats New','New Arrivals','false',  'true'),
  ('theme-toggle',               'Theme Toggle',                    'toggle-theme',      'Control', 'Variation 1', 'false',   'true')
) AS t(key, name, flag, n0, n1, val0, val1);

-- 3. Who saw which variant (90% of visitors enter each test, 50 / 50 split).
INSERT INTO experiment_tracking (id, "anonymousId", "experimentKey", "experimentName", "variationId", "variationName", "variationValue", "featureId", "createdAt")
SELECT gen_random_uuid()::text, v.aid, x.key, x.name, a.vid,
       CASE a.vid WHEN 0 THEN x.n0 ELSE x.n1 END,
       CASE a.vid WHEN 0 THEN x.val0 ELSE x.val1 END,
       x.flag,
       LEAST(v.t0 + pg_temp.rnd(v.i, x.key || 'at') * interval '90 seconds', timezone('UTC', now()))
FROM demo_v v
CROSS JOIN demo_x x
CROSS JOIN LATERAL (SELECT (pg_temp.rnd(v.i, x.key || 'vid') >= 0.5)::int AS vid) a
WHERE pg_temp.rnd(v.i, x.key || 'in') < 0.9;

-- 4. Add to cart: 10% of the control group, 12.5% of "Variation 1" of the button test.
INSERT INTO add_to_cart_tracking (id, "anonymousId", "productId", "productName", slug, brand, price, quantity, "selectedSize", "selectedColor", "createdAt")
SELECT gen_random_uuid()::text, v.aid, p.id, p.name, p.slug, p.brand, p.price,
       1 + (pg_temp.rnd(v.i, 'qty') > 0.88)::int,
       p.sz ->> floor(pg_temp.rnd(v.i, 'size') * GREATEST(jsonb_array_length(p.sz), 1))::int,
       p.cl ->> floor(pg_temp.rnd(v.i, 'colour') * GREATEST(jsonb_array_length(p.cl), 1))::int,
       LEAST(v.t0 + interval '2 minutes' + pg_temp.rnd(v.i, 'cartat') * interval '25 minutes', timezone('UTC', now()))
FROM demo_v v
CROSS JOIN LATERAL (
  SELECT p0.*,
         CASE WHEN p0.sizes  LIKE '[%' THEN p0.sizes::jsonb  END AS sz,
         CASE WHEN p0.colors LIKE '[%' THEN p0.colors::jsonb END AS cl
  FROM "Product" p0
  ORDER BY pg_temp.rnd(v.i, p0.id) * (0.15 + pg_temp.rnd(0, p0.id)) DESC   -- some products are more popular
  LIMIT 1
) p
WHERE pg_temp.rnd(v.i, 'cart') <
      CASE WHEN pg_temp.rnd(v.i, 'add-cart-button-experiencevid') >= 0.5 THEN 0.125 ELSE 0.10 END;

-- 5. Quick view: only the "Treatment" group of the quick view test has it (28% open it).
INSERT INTO quickview_tracking (id, "anonymousId", "customerId", "productId", "featureKey", "featureEnabled", "experimentKey", "variationId", "createdAt")
SELECT 'c' || substr(md5(random()::text || v.i), 1, 24), v.aid, NULL, p.id,
       'quick-view-enabled', true, 'quick-view-ab-test', 1,
       LEAST(v.t0 + interval '1 minute' + pg_temp.rnd(v.i, 'qvat') * interval '10 minutes', timezone('UTC', now()))
FROM demo_v v
CROSS JOIN LATERAL (SELECT id FROM "Product" ORDER BY pg_temp.rnd(v.i, id || 'qv') DESC LIMIT 1) p
WHERE pg_temp.rnd(v.i, 'quick-view-ab-testvid') >= 0.5
  AND pg_temp.rnd(v.i, 'qv') < 0.28;

-- 6. About a fifth of the people who open the quick view add to cart from it.
INSERT INTO quick_view_cart_events (id, "anonymousId", "productId", "eventName", source, "createdAt")
SELECT gen_random_uuid()::text, q."anonymousId", q."productId", 'add_to_cart', 'quick_view',
       LEAST(q."createdAt" + interval '40 seconds', timezone('UTC', now()))
FROM quickview_tracking q
WHERE q."anonymousId" LIKE 'demo\_%' AND random() < 0.21;

-- 7. What's New clicks: 4% of "Whats New", 7% of "New Arrivals".
INSERT INTO whats_new_tracking (id, "anonymousId", "experimentKey", "variationId", "variationName", "variationValue", "createdAt")
SELECT 'c' || substr(md5(random()::text || v.i), 1, 24), v.aid, 'new-ab-test', a.vid,
       CASE a.vid WHEN 0 THEN 'What''s New' ELSE 'New Arrivals' END, a.vid::text,
       LEAST(v.t0 + interval '3 minutes' + pg_temp.rnd(v.i, 'wnat') * interval '15 minutes', timezone('UTC', now()))
FROM demo_v v
CROSS JOIN LATERAL (SELECT (pg_temp.rnd(v.i, 'new-ab-testvid') >= 0.5)::int AS vid) a
WHERE pg_temp.rnd(v.i, 'new-ab-testin') < 0.9
  AND pg_temp.rnd(v.i, 'wn') < CASE a.vid WHEN 0 THEN 0.04 ELSE 0.07 END;

-- 8. Theme toggles: 8% of visitors, two thirds to dark mode.
INSERT INTO theme_toggle_tracking (id, "anonymousId", theme, "createdAt")
SELECT gen_random_uuid()::text, v.aid,
       CASE WHEN pg_temp.rnd(v.i, 'dark') < 0.64 THEN 'dark' ELSE 'light' END,
       LEAST(v.t0 + interval '5 minutes' + pg_temp.rnd(v.i, 'that') * interval '20 minutes', timezone('UTC', now()))
FROM demo_v v
WHERE pg_temp.rnd(v.i, 'theme') < 0.08;

-- 9. What was added.
SELECT 'experiment_tracking' AS "table", COUNT(*) AS demo_rows FROM experiment_tracking WHERE "anonymousId" LIKE 'demo\_%'
UNION ALL SELECT 'add_to_cart_tracking',   COUNT(*) FROM add_to_cart_tracking   WHERE "anonymousId" LIKE 'demo\_%'
UNION ALL SELECT 'quickview_tracking',     COUNT(*) FROM quickview_tracking     WHERE "anonymousId" LIKE 'demo\_%'
UNION ALL SELECT 'quick_view_cart_events', COUNT(*) FROM quick_view_cart_events WHERE "anonymousId" LIKE 'demo\_%'
UNION ALL SELECT 'whats_new_tracking',     COUNT(*) FROM whats_new_tracking     WHERE "anonymousId" LIKE 'demo\_%'
UNION ALL SELECT 'theme_toggle_tracking',  COUNT(*) FROM theme_toggle_tracking  WHERE "anonymousId" LIKE 'demo\_%';

COMMIT;
