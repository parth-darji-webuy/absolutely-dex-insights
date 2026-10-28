-- 02. Check that the read-only role really is read-only.
--
-- Run it in the Neon SQL Editor as the owner (neondb_owner) after 01.
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
