# Setup: from a fresh pull to a running dashboard

This is the short path. For how everything works, see [PROJECT.md](PROJECT.md).

**Time needed:** about 20 minutes the first time. **Cost:** nothing beyond the accounts you already have.

## What you need before you start

| You need | Where to get it | Used for |
| --- | --- | --- |
| **Node 22.12 or newer** | https://nodejs.org, or `nvm install 22` | running the app |
| **Git** | already on most Macs | getting the code |
| **A Neon database** with the store's tables | your Neon project (you need the *owner* login once) | the numbers |
| **A GrowthBook client key** (`sdk-…`) | GrowthBook → Settings → SDK Connections | the list of running experiments |
| **A Groq API key** (`gsk_…`), optional | https://console.groq.com → API Keys | "Ask your data" and the Overview headline. Skip it and set `AI_PROVIDER=none` |

You do **not** need a GrowthBook secret or admin key, and the app never writes to the store.

## Step by step

### 1. Get the code

```bash
git clone <your repository url> absolutely-dex-insights
cd absolutely-dex-insights
```

Already have it? Update with:

```bash
git pull
npm install
npm run db:generate      # always run this after a pull (see "Why db:generate" below)
```

### 2. Use the right Node

```bash
nvm use                  # reads .nvmrc (Node 22)
node -v                  # must print v22.12 or higher
```

### 3. Install

```bash
npm install
```

### 4. Create the read-only database login (once)

The app reads the store through a login that can only `SELECT`. Make it in the **Neon SQL Editor**, signed in as the owner (`neondb_owner`):

1. Open [`docs/sql/01-create-read-only-role.sql`](sql/01-create-read-only-role.sql).
2. Replace the password placeholder (make one with `openssl rand -hex 24`) and, if your database isn't called `neondb`, the database name.
3. Paste it into the SQL Editor and run it.
4. Run [`docs/sql/02-check-the-role.sql`](sql/02-check-the-role.sql). Every value except `can_select` must say `false`.

> Do not create this login by clicking "New role" in the Neon console. That kind of role can write.

### 5. Get the two connection strings

In Neon: **Connect** → choose your database and the role **insights_reader_ro** →

- **Connection pooling ON** → copy it. This is `STORE_DATABASE_URL`.
- **Connection pooling OFF** (the direct one) → copy it. This is `STORE_DATABASE_URL_UNPOOLED`.

### 6. Create `.env`

```bash
cp .env.example .env
```

Open `.env` and fill in every line. What each one means:

| Variable | What to put | Example |
| --- | --- | --- |
| `STORE_DATABASE_URL` | the pooled Neon URL from step 5 | `postgresql://insights_reader_ro:…@ep-…-pooler….neon.tech/neondb?sslmode=require` |
| `STORE_DATABASE_URL_UNPOOLED` | the direct Neon URL from step 5 | `postgresql://insights_reader_ro:…@ep-….neon.tech/neondb?sslmode=require` |
| `SESSION_SECRET` | 32+ random characters (`openssl rand -hex 32`) | 64 hex characters |
| `ADMIN_PASSWORD` | the password you will sign in with, 12+ characters | anything you choose |
| `GROWTHBOOK_API_HOST` | `https://cdn.growthbook.io` for GrowthBook Cloud | `https://cdn.growthbook.io` |
| `GROWTHBOOK_CLIENT_KEY` | the `sdk-…` key | `sdk-AbC123…` |
| `AI_PROVIDER` | `groq` to use AI, or `none` to switch it off | `groq` |
| `GROQ_API_KEY` | your Groq key (only needed for `groq`) | `gsk_…` |
| `GROQ_MODEL` | the Groq model name (only needed for `groq`) | `openai/gpt-oss-120b` |
| `INSIGHTS_TIMEZONE` | the shop's time zone; days are cut here | `Asia/Kolkata`, `Europe/London` |
| `TRACKING_START` | the first day the store tracked data, `YYYY-MM-DD` | `2026-09-01` |
| `STORE_REFRESH_MINUTES` | 5 to 120; how many minutes the "Store" card covers and how often it refreshes | `30` |

Rules: no quotes, no spaces around `=`, one value per line. `.env` is never committed to Git. A missing or wrong value stops the app at start with **one line naming the variable** (never its value).

### 7. Build the database client

```bash
npm run db:generate
```

This reads `prisma/schema.prisma` and writes the typed client into `src/generated/store` (not stored in Git, so every fresh pull needs this once).

### 8. Run it

For trying it out and developing:

```bash
npm run dev              # http://localhost:3000
```

For everyday use:

```bash
npm run build
npm run start            # http://localhost:3000   (stop with Ctrl+C)
```

Both listen on `localhost` only. Open the address, and sign in as:

- **Email:** `designerexchange9@gmail.com`
- **Password:** the `ADMIN_PASSWORD` you set

### 9. Check it works

- Overview, Experiments, Events, Products and Reports all open without an error card.
- Open an event row on **Events**; a drawer shows the visitor's journey and the stored row.
- On **Reports**, pick a period and download a CSV; open it in Excel (the £ signs and dates should look right).
- With `AI_PROVIDER=groq`, ask on **Ask**: "Which product had the most add-to-carts yesterday?" and compare the SQL shown.
- Empty or all zeros? Run [`docs/sql/04-is-there-data.sql`](sql/04-is-there-data.sql). If the latest row is older than 7 days, the 7-day Overview is correctly empty.

### 10. (Optional) Fake data for a demo

Never on the live store. Create a Neon **branch**, run [`docs/demo-data.sql`](demo-data.sql) in the branch's SQL Editor as the owner, and point the two `STORE_DATABASE_URL…` values at the branch. To go back, restore the live URLs. [`docs/demo-data-remove.sql`](demo-data-remove.sql) deletes only the fake visitors (ids starting `demo_`).

## Why `db:generate`?

`npm run build` does it for you. `npm run dev` does not. On a fresh clone (or after `git pull` if the database layout changed) run `npm run db:generate` before `npm run dev`, or you will see "Cannot find module '@/generated/store/client'".

## If something goes wrong

| You see | It means | Do this |
| --- | --- | --- |
| `Environment problem: X (missing)` | `.env` lacks or has a bad `X` | fix that line, restart |
| `Cannot find module '@/generated/store/client'` | the database client isn't built | `npm run db:generate` |
| `Cannot resolve environment variable: STORE_DATABASE_URL_UNPOOLED` (during `db:generate`) | `.env` is missing or incomplete | create it (step 6) |
| Sign-in says "That email and password don't match" | wrong password, or `ADMIN_PASSWORD` changed without a restart | restart the app; use the email above |
| `/ask` says "switched off" | `AI_PROVIDER=none` | set `groq`, save, restart |
| "The AI is busy, try again in a minute" | Groq is rate-limiting or down | wait a minute |
| Every page is empty / zeros | no events in the last 7 days | run `docs/sql/04-is-there-data.sql` |
| A page takes 2 to 4 seconds | the Neon project is far from you | normal; moving the Neon project nearer helps |
| "Another next dev server is already running" | a copy is already open | use it, or stop it (`Ctrl+C`) |

More in [PROJECT.md](PROJECT.md#14-troubleshooting).
