-- SETUP: the one SQL file you need to set up the database login for Insights.
--
-- Run it in the Neon SQL Editor, signed in as the owner role (neondb_owner), on the database or branch the app will read.
-- It has two parts. Run PART 1 once, then PART 2 to prove it worked.

-- ============================================================
-- PART 1: create the read-only login (run ONCE)
-- ============================================================
--
-- Before you run it:
--   * replace REPLACE-WITH-A-LONG-RANDOM-PASSWORD (make one with:  openssl rand -hex 24 ),
--   * replace neondb with your database name if it is different (Neon shows it on the Connect panel).
--
-- Why a SQL-made role? A role made in the Neon console joins "neon_superuser" and can WRITE.
-- A role made with CREATE ROLE has no powers except the ones granted below.

CREATE ROLE insights_reader_ro LOGIN PASSWORD 'REPLACE-WITH-A-LONG-RANDOM-PASSWORD';

GRANT CONNECT ON DATABASE neondb TO insights_reader_ro;
GRANT USAGE ON SCHEMA public TO insights_reader_ro;

-- SELECT only, and only on the 8 tables Insights reads.
-- The "User", users, Review and Wishlist tables are left out on purpose.
GRANT SELECT ON
  experiment_tracking,
  add_to_cart_tracking,
  quickview_tracking,
  quick_view_cart_events,
  whats_new_tracking,
  theme_toggle_tracking,
  "Product",
  "Category"
TO insights_reader_ro;

-- Later, if a new table is needed:   GRANT SELECT ON the_table TO insights_reader_ro;
-- To change the password later:      ALTER ROLE insights_reader_ro PASSWORD 'a-new-password';

-- ============================================================
-- PART 2: check the login really is read-only (run after PART 1)
-- ============================================================
--
-- Expected: can_select = true on the first row; every other column is false.

SELECT
  has_table_privilege('insights_reader_ro', 'experiment_tracking', 'SELECT') AS can_select,
  has_table_privilege('insights_reader_ro', 'experiment_tracking', 'INSERT') AS can_insert,
  has_table_privilege('insights_reader_ro', 'experiment_tracking', 'UPDATE') AS can_update,
  has_table_privilege('insights_reader_ro', 'experiment_tracking', 'DELETE') AS can_delete,
  has_table_privilege('insights_reader_ro', 'experiment_tracking', 'TRUNCATE') AS can_truncate,
  has_table_privilege('insights_reader_ro', '"User"', 'SELECT')               AS can_read_customer_users,
  pg_has_role('insights_reader_ro', 'neon_superuser', 'MEMBER')               AS is_neon_superuser;

-- Which tables can it read? Expected: exactly the 8 below.
SELECT table_name
FROM information_schema.role_table_grants
WHERE grantee = 'insights_reader_ro' AND privilege_type = 'SELECT' AND table_schema = 'public'
ORDER BY table_name;

-- The strongest test: sign in AS the new role (use its connection string in a SQL client) and run
--     DELETE FROM experiment_tracking WHERE false;
-- It must fail with:  permission denied for table experiment_tracking
