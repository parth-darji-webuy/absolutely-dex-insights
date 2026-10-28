-- 01. Create the read-only login that Insights uses.
--
-- Run this ONCE, in the Neon SQL Editor, signed in as the owner role (neondb_owner).
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
