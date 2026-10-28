-- Removes everything docs/demo-data.sql added (every visitor whose id starts with "demo_").
-- Real visitors are never touched. Run it as the owner (neondb_owner).
BEGIN;
DELETE FROM quick_view_cart_events WHERE "anonymousId" LIKE 'demo\_%';
DELETE FROM quickview_tracking     WHERE "anonymousId" LIKE 'demo\_%';
DELETE FROM add_to_cart_tracking   WHERE "anonymousId" LIKE 'demo\_%';
DELETE FROM whats_new_tracking     WHERE "anonymousId" LIKE 'demo\_%';
DELETE FROM theme_toggle_tracking  WHERE "anonymousId" LIKE 'demo\_%';
DELETE FROM experiment_tracking    WHERE "anonymousId" LIKE 'demo\_%';
COMMIT;
