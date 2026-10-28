-- 04. "Why is my dashboard empty?" Start here.
--
-- Run in the Neon SQL Editor on the database or branch the app points at.
-- If last_row is older than 7 days, the 7-day Overview is correctly all zeros.
-- If demo_rows is not 0, this database contains fake visitors from docs/demo-data.sql.

SELECT 'experiment_tracking' AS "table", COUNT(*) AS rows, COUNT(*) FILTER (WHERE "anonymousId" LIKE 'demo\_%') AS demo_rows,
       to_char(MIN("createdAt"), 'YYYY-MM-DD HH24:MI') AS first_row, to_char(MAX("createdAt"), 'YYYY-MM-DD HH24:MI') AS last_row
FROM experiment_tracking
UNION ALL SELECT 'add_to_cart_tracking', COUNT(*), COUNT(*) FILTER (WHERE "anonymousId" LIKE 'demo\_%'), to_char(MIN("createdAt"), 'YYYY-MM-DD HH24:MI'), to_char(MAX("createdAt"), 'YYYY-MM-DD HH24:MI') FROM add_to_cart_tracking
UNION ALL SELECT 'quickview_tracking', COUNT(*), COUNT(*) FILTER (WHERE "anonymousId" LIKE 'demo\_%'), to_char(MIN("createdAt"), 'YYYY-MM-DD HH24:MI'), to_char(MAX("createdAt"), 'YYYY-MM-DD HH24:MI') FROM quickview_tracking
UNION ALL SELECT 'quick_view_cart_events', COUNT(*), COUNT(*) FILTER (WHERE "anonymousId" LIKE 'demo\_%'), to_char(MIN("createdAt"), 'YYYY-MM-DD HH24:MI'), to_char(MAX("createdAt"), 'YYYY-MM-DD HH24:MI') FROM quick_view_cart_events
UNION ALL SELECT 'whats_new_tracking', COUNT(*), COUNT(*) FILTER (WHERE "anonymousId" LIKE 'demo\_%'), to_char(MIN("createdAt"), 'YYYY-MM-DD HH24:MI'), to_char(MAX("createdAt"), 'YYYY-MM-DD HH24:MI') FROM whats_new_tracking
UNION ALL SELECT 'theme_toggle_tracking', COUNT(*), COUNT(*) FILTER (WHERE "anonymousId" LIKE 'demo\_%'), to_char(MIN("createdAt"), 'YYYY-MM-DD HH24:MI'), to_char(MAX("createdAt"), 'YYYY-MM-DD HH24:MI') FROM theme_toggle_tracking;

SELECT current_user AS connected_as, (SELECT COUNT(*) FROM "Product") AS products, (SELECT COUNT(*) FROM "Category") AS categories,
       to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI') AS database_clock_utc;
