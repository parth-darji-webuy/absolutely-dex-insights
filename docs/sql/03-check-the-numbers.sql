-- 03. Check that the numbers on the website are real.
--
-- Each query uses the same rules as the page it checks, so the results should match exactly.
-- Run them in the Neon SQL Editor (the read-only role is enough) on the SAME database or branch the app points at.
-- Replace Asia/Kolkata with your INSIGHTS_TIMEZONE. Days on the website are cut in that time zone.
-- Reload the website first: pages can be up to ~10 seconds old.

-- A. Experiments page: people and conversions per variant (goal = added to cart).
--    For the What's New test use whats_new_tracking (and add: AND m."experimentKey" = e."experimentKey").
--    For the Theme Toggle test use theme_toggle_tracking.
SELECT e."experimentKey" AS experiment, e."variationId" AS variant,
       COUNT(*) AS people,
       COUNT(*) FILTER (WHERE EXISTS (
         SELECT 1 FROM add_to_cart_tracking m
         WHERE m."anonymousId" = e."anonymousId" AND m."createdAt" >= e."createdAt")) AS converted
FROM experiment_tracking e
GROUP BY 1, 2 ORDER BY 1, 2;

-- B. Overview: visitors and add-to-carts per day, last 7 days.
--    A visitor is anyone with any event that day.
WITH d AS (SELECT (((now() AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata')::date - g) AS day FROM generate_series(0, 6) g),
ev AS (
  SELECT "anonymousId" AS aid, "createdAt" FROM experiment_tracking
  UNION ALL SELECT "anonymousId", "createdAt" FROM add_to_cart_tracking
  UNION ALL SELECT "anonymousId", "createdAt" FROM quickview_tracking
  UNION ALL SELECT "anonymousId", "createdAt" FROM theme_toggle_tracking
  UNION ALL SELECT "anonymousId", "createdAt" FROM whats_new_tracking
  UNION ALL SELECT "anonymousId", "createdAt" FROM quick_view_cart_events)
SELECT d.day,
  (SELECT COUNT(DISTINCT aid) FROM ev WHERE (((ev."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata')::date) = d.day) AS visitors,
  (SELECT COUNT(*) FROM add_to_cart_tracking a WHERE (((a."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata')::date) = d.day) AS add_to_carts
FROM d ORDER BY d.day;

-- C. Overview "Activity over time": events per type per day, last 8 days.
SELECT (((c."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata')::date) AS day, src, COUNT(*) AS events
FROM (
  SELECT 'experiment_exposure' AS src, "createdAt" FROM experiment_tracking
  UNION ALL SELECT 'add_to_cart', "createdAt" FROM add_to_cart_tracking
  UNION ALL SELECT 'quick_view_clicked', "createdAt" FROM quickview_tracking
  UNION ALL SELECT 'theme_toggle', "createdAt" FROM theme_toggle_tracking
  UNION ALL SELECT 'whats_new_clicked', "createdAt" FROM whats_new_tracking
  UNION ALL SELECT 'quick_view_cart', "createdAt" FROM quick_view_cart_events) c
WHERE c."createdAt" >= now() - interval '8 days'
GROUP BY 1, 2 ORDER BY 1, 2;

-- D. Overview "Store · last N minutes" (here N = 30; use your STORE_REFRESH_MINUTES).
SELECT 'visitors (any event)' AS what, COUNT(DISTINCT aid) AS people FROM (
  SELECT "anonymousId" aid, "createdAt" FROM experiment_tracking
  UNION ALL SELECT "anonymousId", "createdAt" FROM add_to_cart_tracking
  UNION ALL SELECT "anonymousId", "createdAt" FROM quickview_tracking
  UNION ALL SELECT "anonymousId", "createdAt" FROM theme_toggle_tracking
  UNION ALL SELECT "anonymousId", "createdAt" FROM whats_new_tracking
  UNION ALL SELECT "anonymousId", "createdAt" FROM quick_view_cart_events) u
WHERE "createdAt" >= timezone('UTC', now()) - interval '30 minutes'
UNION ALL SELECT 'browsed products (saw an experiment)', COUNT(DISTINCT "anonymousId") FROM experiment_tracking WHERE "createdAt" >= timezone('UTC', now()) - interval '30 minutes'
UNION ALL SELECT 'opened quick view', COUNT(DISTINCT "anonymousId") FROM quickview_tracking WHERE "createdAt" >= timezone('UTC', now()) - interval '30 minutes'
UNION ALL SELECT 'added to cart', COUNT(DISTINCT "anonymousId") FROM add_to_cart_tracking WHERE "createdAt" >= timezone('UTC', now()) - interval '30 minutes';

-- E. Products page: this week's quick views and add-to-carts per product.
SELECT p.name,
  (SELECT COUNT(*) FROM add_to_cart_tracking a WHERE a."productId" = p.id AND a."createdAt" >= now() - interval '7 days') AS add_to_carts,
  (SELECT COUNT(*) FROM quickview_tracking q WHERE q."productId" = p.id AND q."createdAt" >= now() - interval '7 days') AS quick_views
FROM "Product" p ORDER BY 2 DESC, 3 DESC LIMIT 5;

-- F. Events page: the latest rows, newest first (the page shows the time in your local clock; the database stores UTC).
SELECT 'experiment_tracking' AS tbl, "anonymousId", "createdAt" FROM experiment_tracking
UNION ALL SELECT 'add_to_cart_tracking', "anonymousId", "createdAt" FROM add_to_cart_tracking
UNION ALL SELECT 'quickview_tracking', "anonymousId", "createdAt" FROM quickview_tracking
UNION ALL SELECT 'theme_toggle_tracking', "anonymousId", "createdAt" FROM theme_toggle_tracking
UNION ALL SELECT 'whats_new_tracking', "anonymousId", "createdAt" FROM whats_new_tracking
UNION ALL SELECT 'quick_view_cart_events', "anonymousId", "createdAt" FROM quick_view_cart_events
ORDER BY "createdAt" DESC LIMIT 40;
