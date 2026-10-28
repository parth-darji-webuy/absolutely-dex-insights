import { describe, expect, it } from "vitest";
import { checkSql } from "./sql-check";

const ok = (sql: string) => {
  const r = checkSql(sql);
  if (!r.ok) throw new Error(`expected OK, got: ${r.reason} for ${sql}`);
  return r;
};
const refused = (sql: unknown, why?: RegExp) => {
  const r = checkSql(sql);
  expect(r.ok, String(sql)).toBe(false);
  if (!r.ok && why) expect(r.reason).toMatch(why);
};

describe("the SQL check: what must be refused", () => {
  it("DROP TABLE and every other write", () => {
    refused("DROP TABLE add_to_cart_tracking", /only SELECT/);
    refused("DELETE FROM experiment_tracking", /only SELECT/);
    refused("UPDATE add_to_cart_tracking SET quantity = 0", /only SELECT/);
    refused("INSERT INTO theme_toggle_tracking VALUES (1)", /only SELECT/);
    refused("TRUNCATE experiment_tracking");
    refused("ALTER TABLE experiment_tracking ADD COLUMN x int");
    refused("CREATE TABLE x (a int)");
    refused("GRANT ALL ON experiment_tracking TO public");
    refused("COPY experiment_tracking TO '/tmp/x'");
  });

  it("two statements", () => {
    refused("SELECT 1; SELECT 2", /more than one/);
    refused("SELECT 1; DROP TABLE experiment_tracking;", /more than one/);
    refused(";", /empty|only SELECT/);
  });

  it("a hidden second statement", () => {
    refused("SELECT 1 /* ; */ ; DROP TABLE x", /comments|more than one/);
    refused("SELECT 1 -- done\n; DROP TABLE x", /comments/);
    refused("SELECT 1 /* hide */ FROM theme_toggle_tracking", /comments/);
    refused("WITH d AS (DELETE FROM add_to_cart_tracking RETURNING *) SELECT * FROM d", /delete is not allowed/);
    refused("WITH d AS (UPDATE add_to_cart_tracking SET quantity = 1 RETURNING *) SELECT * FROM d");
    refused("SELECT 1 FROM theme_toggle_tracking WHERE theme = E'\\'; DROP TABLE x; --'", /comments|backslash|prefixed/);
    refused("SELECT $$; DROP TABLE x;$$", /dollar/);
    refused("select 1; select 2", /more than one/);
  });

  it("pg_sleep and other functions that aren't on the list", () => {
    refused("SELECT pg_sleep(10)", /system functions|not allowed/);
    refused("SELECT pg_sleep(10) FROM theme_toggle_tracking");
    refused("SELECT * FROM theme_toggle_tracking WHERE pg_sleep(5) IS NOT NULL");
    refused("SELECT PG_SLEEP(1)");
    refused('SELECT "pg_sleep"(10)');
    refused("SELECT * FROM generate_series(1, 100000000)", /not allowed/);
    refused("SELECT version()", /not allowed/);
    refused("SELECT current_setting('server_version')", /not allowed/);
    refused("SELECT set_config('statement_timeout', '0', false)", /set_config/);
    refused("SELECT pg_read_file('/etc/passwd')");
    refused("SELECT public.my_function(1)", /qualified/);
    refused("SELECT * FROM unnest(ARRAY[1,2])", /unnest/);
  });

  it("a table that isn't allowed", () => {
    refused('SELECT * FROM "User"', /table User is not allowed/);
    refused('SELECT "passwordHash" FROM "User"');
    refused("SELECT * FROM users", /users/);
    refused("SELECT * FROM experiment_exposure", /not allowed/);
    refused("SELECT * FROM pg_user", /system|not allowed/);
    refused("SELECT * FROM pg_catalog.pg_tables", /system|not allowed|public schema/);
    refused("SELECT * FROM information_schema.tables", /information_schema|public schema/);
    refused('SELECT * FROM "pg_shadow"');
    refused('SELECT * FROM public."User"');
    refused("SELECT * FROM other.experiment_tracking", /public schema/);
    refused("SELECT * FROM Product", /product/); // unquoted, so Postgres would look for "product"
    refused("SELECT * FROM theme_toggle_tracking t JOIN \"Review\" r ON r.id = t.id");
    refused("SELECT * FROM theme_toggle_tracking, \"User\"", /JOIN/);
    refused("SELECT * FROM (SELECT * FROM \"User\") x");
    refused("SELECT * FROM theme_toggle_tracking WHERE id IN (SELECT id FROM users)");
    refused("SELECT a.* FROM theme_toggle_tracking a, users b WHERE a.id = b.user_id");
  });

  it("other ways to write, lock or read the system", () => {
    refused("SELECT * INTO new_table FROM theme_toggle_tracking", /into/);
    refused("SELECT * FROM theme_toggle_tracking FOR UPDATE", /update|locking/);
    refused("SELECT * FROM theme_toggle_tracking FOR SHARE", /locking/);
    refused("SELECT 'x'::regclass", /system/);
    refused("WITH RECURSIVE t AS (SELECT 1 UNION ALL SELECT 1 FROM t) SELECT * FROM t", /recursive/);
    refused("SELECT * FROM theme_toggle_tracking WHERE id = $1", /dollar/);
  });

  it("junk", () => {
    refused("");
    refused("   ");
    refused(undefined);
    refused(42);
    refused(null);
    refused("hello world");
    refused("SELECT 'unfinished");
    refused("SELECT (1");
    refused("SELECT 1)");
    refused("SELECT " + "1,".repeat(3000) + "1");
    refused("SELECT * FROM theme_toggle_tracking LIMIT x");
  });
});

describe("the SQL check: what must be allowed", () => {
  it("adds LIMIT 200 when it is missing, and says so", () => {
    expect(ok("SELECT COUNT(*) FROM add_to_cart_tracking")).toEqual({ ok: true, sql: "SELECT COUNT(*) FROM add_to_cart_tracking LIMIT 200", limitAdded: true });
    expect(ok("SELECT theme FROM theme_toggle_tracking;").sql).toBe("SELECT theme FROM theme_toggle_tracking LIMIT 200");
    expect(ok("select theme from theme_toggle_tracking order by theme").sql).toBe("select theme from theme_toggle_tracking order by theme LIMIT 200");
  });

  it("keeps a LIMIT of 200 or less, lowers a bigger one", () => {
    expect(ok("SELECT theme FROM theme_toggle_tracking LIMIT 10")).toMatchObject({ sql: "SELECT theme FROM theme_toggle_tracking LIMIT 10", limitAdded: false });
    expect(ok("SELECT theme FROM theme_toggle_tracking LIMIT 200").sql).toMatch(/LIMIT 200$/);
    expect(ok("SELECT theme FROM theme_toggle_tracking LIMIT 100000").sql).toBe("SELECT theme FROM theme_toggle_tracking LIMIT 200");
    expect(ok("SELECT theme FROM theme_toggle_tracking LIMIT ALL").sql).toBe("SELECT theme FROM theme_toggle_tracking LIMIT 200");
  });

  it("adds a LIMIT to the whole query when only a sub-query has one", () => {
    expect(ok('SELECT * FROM (SELECT theme FROM theme_toggle_tracking LIMIT 5) x').sql).toMatch(/\) x LIMIT 200$/);
  });

  it("accepts the questions people really ask", () => {
    ok(`SELECT p.name AS product, COUNT(*) AS add_to_carts
        FROM add_to_cart_tracking a JOIN "Product" p ON p.id = a."productId"
        WHERE (a."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata' >= date_trunc('day', now()) - interval '1 day'
        GROUP BY p.name ORDER BY add_to_carts DESC LIMIT 5`);
    ok(`SELECT c.name, COUNT(*) FROM add_to_cart_tracking a JOIN "Product" p ON p.id = a."productId" JOIN "Category" c ON c.id = p."categoryId" GROUP BY c.name`);
    ok(`SELECT e."variationId", COUNT(DISTINCT e."anonymousId") AS people FROM experiment_tracking e WHERE e."experimentKey" = 'quick-view-ab-test' GROUP BY 1`);
    ok(`WITH day AS (SELECT date_trunc('day', "createdAt") AS d, COUNT(*) AS n FROM theme_toggle_tracking GROUP BY 1) SELECT d, n FROM day ORDER BY d`);
    ok(`WITH a AS (SELECT 1 AS x), b AS (SELECT x FROM a) SELECT * FROM b`);
    ok(`SELECT EXTRACT(HOUR FROM "createdAt") AS hour, COUNT(*) FROM experiment_tracking GROUP BY 1`);
    ok(`SELECT ROUND(100.0 * COUNT(*) FILTER (WHERE theme = 'dark') / NULLIF(COUNT(*), 0), 1) AS pct_dark FROM theme_toggle_tracking`);
    ok(`SELECT * FROM public.theme_toggle_tracking`);
    ok(`SELECT COUNT(*) FROM theme_toggle_tracking WHERE id IN (SELECT id FROM theme_toggle_tracking)`);
    ok(`SELECT a.id FROM add_to_cart_tracking a WHERE EXISTS (SELECT 1 FROM quickview_tracking q WHERE q."anonymousId" = a."anonymousId")`);
    ok(`SELECT "anonymousId" IS DISTINCT FROM 'x' AS other FROM theme_toggle_tracking`);
    ok(`SELECT ROW_NUMBER() OVER (PARTITION BY theme ORDER BY "createdAt") AS n FROM theme_toggle_tracking`);
  });

  it("is not fooled by a forbidden word inside text", () => {
    ok(`SELECT * FROM add_to_cart_tracking WHERE "productName" = 'DROP TABLE users; -- ok; pg_sleep(5)'`);
    ok(`SELECT * FROM add_to_cart_tracking WHERE "productName" = 'it''s; a "User" trap'`);
    ok(`SELECT "selectedColor" AS "delete" FROM add_to_cart_tracking`.replace('"delete"', "color"));
  });

  it("works whatever the capital letters", () => {
    ok('SeLeCt CoUnT(*) FrOm Theme_Toggle_Tracking'.replace("Theme_Toggle_Tracking", "theme_toggle_tracking"));
    refused('SELECT * FROM "THEME_TOGGLE_TRACKING"');
  });
});
