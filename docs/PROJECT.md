# AbsolutelyDeX Insights: the full documentation

**Written for:** anyone who pulls this project and needs to run it, understand it, or hand it on, with no knowledge of how it was built.

Quick start only? Go to [SETUP.md](SETUP.md). This document explains the whole thing, section by section.

**Contents**

1. [What this is](#1-what-this-is)
2. [How it started and how it was built](#2-how-it-started-and-how-it-was-built)
3. [How it works, end to end](#3-how-it-works-end-to-end)
4. [The pages, section by section](#4-the-pages-section-by-section)
5. [The API routes](#5-the-api-routes)
6. [How the numbers are worked out](#6-how-the-numbers-are-worked-out)
7. [Ask your data, and what Groq is](#7-ask-your-data-and-what-groq-is)
8. [Security: what protects what](#8-security-what-protects-what)
9. [Environment variables (`.env`)](#9-environment-variables-env)
10. [Setting up from a pull](#10-setting-up-from-a-pull)
11. [The SQL: which script to run when](#11-the-sql-which-script-to-run-when)
12. [Day-to-day tasks](#12-day-to-day-tasks)
13. [Tests and quality checks](#13-tests-and-quality-checks)
14. [Troubleshooting](#14-troubleshooting)
15. [What is not tracked, and known limits](#15-what-is-not-tracked-and-known-limits)
16. [Where things are in the code](#16-where-things-are-in-the-code)

---

## 1. What this is

AbsolutelyDeX Insights is a private dashboard for the shop's **A/B tests, events and products**. It answers, in plain words:

- How is the shop doing this week? (**Overview**)
- Which A/B test is winning, and how sure are we? (**Experiments**)
- What exactly are people doing, one event at a time? (**Events**)
- Which products get opened and added to the cart? (**Products**)
- Can I get a test's daily results as a spreadsheet? (**Reports**)
- Can I just ask a question in English? (**Ask your data**)

Facts that shape everything else:

- **It runs only on this computer** (`localhost`). Nobody else on the network can reach it.
- **It only reads.** It reads the store's Neon (Postgres) database through a login that can only `SELECT`, and reads the list of running tests from GrowthBook. It never writes to either.
- **One account:** the Admin, `designerexchange9@gmail.com`, with the password you set in `.env`.
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Prisma 7 with the Neon adapter, Zod, jose, Groq's SDK, Vitest. Charts and icons are drawn by hand as SVG; there is no chart or UI library.

## 2. How it started and how it was built

### The starting point

It began with **`docs/prototype.html`**: a single approved design file that holds all the screens, the wording, the colours and a set of sample numbers. The rule was: build the real app to look and read like the prototype, one **phase** at a time, with a short plan and an OK before each phase.

The working rules live in `CLAUDE.md`. The important ones:

- One phase per session; plan first, build after approval.
- At the end of a phase run `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`, fix every failure, then commit with the message `Phase N: <title>`.
- Never write to the store database. SQL only through `$queryRaw` tagged templates, with table names from a fixed list.
- Never put a password, key or connection string in code, logs, commits or chat. `.env` is never opened or printed.
- Pages get data only from `src/lib/data.ts`.
- Edge cases everywhere: no data shows zeros and the prototype's empty states, never `NaN` or `"undefined"`; nothing to divide by shows "—"; if one card fails it shows an error with Retry and the rest of the page still works.

### The phases

| # | Commit | Date | What it added |
| --- | --- | --- | --- |
| 1 | `6176ba2` Foundation | 28 Oct 2026 | The Next.js project, TypeScript, Tailwind, test setup, folder layout, the data types, and sample data (the prototype's numbers) with the first tests. |
| 2 | `24113d3`, `2c9d2c7` Building blocks and sign-in page | 28 Oct | The reusable pieces: cards, buttons, chips, drawer, modal, tooltip, toasts, skeletons, the hand-drawn charts, the sidebar/header shell with the ⌘K search palette, the animated little people, the sign-in page, and a first (temporary) sign-in with a signed cookie and route protection in `src/proxy.ts`. A later fix stopped the clock being read in a way Next.js doesn't allow. |
| 3 | `59c77cb` Overview and Experiments | 28 Oct | The Overview page (summary, three KPIs, the "Store · last 30 minutes" card, activity chart, top products, sources, devices) and the Experiments list and detail pages, all on sample data. |
| 4 | `6b0ea89` Events, Products, Reports and Ask | 29 Oct | The Events page with its drawer, the Products page with the Quick View modal, the Reports page with CSV download, and the Ask page (on canned answers). Also a README and a page-by-page review. |
| 5 | `8ba9934` Database connection and Admin sign-in | 29 Oct | `.env` checking with Zod, the Prisma client for Neon, the read-only transaction with a 15-second limit, retry on connection errors, and **real sign-in** (password check, JWT session cookie). |
| 6 | `7eddb67` Real data from the store database and GrowthBook | 29 Oct | Every `data.ts` function now runs real queries; GrowthBook provides the running-test list; the statistics (chance to win, lift range, people needed, verdict); "Not tracked yet" for what the store doesn't record. Demo-data SQL added. |
| 7 | `e01ebb0` Store refresh, event details and CSV download | 29 Oct | The `/api/store/last-30`, `/api/events/detail` and `/api/reports/experiment` routes; a Store card that refreshes itself; the event drawer loading the real stored row and journey; the server-built CSV. |
| 8 | `ff1be54` Ask your data and final check | 29 Oct | Real **Ask your data**: Groq writes the SQL, the server checks and runs it read-only, Groq explains the rows. The switch-off setting, the final check, and removal of the sample-data folder. |
| + | `d1d0a06` Explain this experiment written by Groq | 29 Oct | The Explain drawer asks Groq for the explanation when opened, with the same number check and a fallback to the app's own words. |
| + | `d30ad1c` Overview summary by Groq… | 29 Oct | The Overview headline written by Groq (with a safety check on its numbers), "quiet store" hints that say when the last activity was, and clearer verdict wording for very slow tests. |

Two things were **deliberately dropped** along the way: the prototype's "Viewer" role and masked visitor ids (only the Admin exists), and every piece of sample data (it now lives only in small test fixtures, `src/test/fixtures.ts`).

### How it was checked

Each phase ended with lint, type-check, tests and a production build. In total there are about **277 automated tests in 29 files**. Pages were never compared with the prototype *by eye* at 1440, 820 and 390 px, because that needs a signed-in browser: do that check yourself (see [section 13](#13-tests-and-quality-checks)).

## 3. How it works, end to end

### The big picture

```
                         your browser (http://localhost:3000)
                                    │
                                    ▼
             ┌─────────────────────────────────────────────┐
             │  src/proxy.ts   is there a valid sign-in?   │──no──► pages: go to /sign-in
             └─────────────────────────────────────────────┘        /api/*: answer 401
                                    │ yes
                                    ▼
             ┌─────────────────────────────────────────────┐
             │  Next.js pages (server components)          │
             │  Overview · Experiments · Events · Products │
             │  Reports · Ask                              │
             └─────────────────────────────────────────────┘
                    │ data.ts                │ fetch() from the browser
                    ▼                        ▼
   ┌───────────────────────────┐   ┌──────────────────────────────────────┐
   │ src/lib/data.ts           │   │ /api/store/last-30   (Store card)    │
   │   getOverview() …         │   │ /api/events/detail   (event drawer)  │
   └───────────────────────────┘   │ /api/reports/experiment (CSV)        │
                    │              │ /api/ask             (Ask your data) │
   │ /api/experiments/explain (Explain)   │
                    ▼              └──────────────────────────────────────┘
   ┌───────────────────────────┐                  │
   │ src/lib/store/*  queries  │◄─────────────────┘
   └───────────────────────────┘
        │                    │                        ┌─────────────────┐
        │ runQuery()         │ GET /api/features      │ Groq (AI)       │
        ▼                    ▼                        │ only for Ask    │
 ┌──────────────┐   ┌────────────────┐                │ and the Overview│
 │ Neon Postgres│   │ GrowthBook     │                │ headline        │
 │ (read-only)  │   │ (client key)   │                └─────────────────┘
 └──────────────┘   └────────────────┘
```

### One page load, step by step (Overview, for example)

1. You open `/overview`. `src/proxy.ts` checks your `dex_session` cookie. Missing or expired → you are sent to `/sign-in`.
2. The page is built on the server. Each card is its own "slot": it shows grey placeholders while its data loads, and shows an error with **Retry** if only that card fails.
3. A card calls a function in `src/lib/data.ts` (`getOverview()`, `getExperiments()`, …). These are the **only** way pages get data.
4. `data.ts` calls the query code in `src/lib/store/`. Every query goes through `runQuery()` in `src/lib/db.ts`, which:
   - opens a transaction and, in one statement, makes it **read-only** and gives it a **15-second** limit,
   - retries **once after 1 second** if the connection drops or times out (not if a query is merely slow or refused),
   - uses a Prisma client connected as the read-only login.
5. The query results are shaped into the types in `src/types/` and rendered. Numbers that depend on the clock are worked out per visit, never while the app is being built.
6. Experiments additionally ask GrowthBook which tests are running (one GET, cached for 60 seconds). If GrowthBook can't be reached, the app falls back to "a test is running if someone entered it in the last 7 days".

### Things the browser asks for later

- The **Store · last N minutes** card refreshes itself by calling `/api/store/last-30` (on the Refresh button, and every `STORE_REFRESH_MINUTES` while the tab is visible).
- Clicking an event row calls `/api/events/detail` for the stored row and the visitor's journey.
- **Download CSV** calls `/api/reports/experiment`.
- **Ask** calls `/api/ask`.

### Time

Timestamps are stored in the database as **UTC without a time zone**. "Today", "yesterday" and "this week" are cut in `INSIGHTS_TIMEZONE`, so a visitor at 23:30 UTC on the 21st counts on the 22nd in Asia/Kolkata. The Events page shows times on your computer's clock.

## 4. The pages, section by section

The sidebar has Overview, Experiments, Events, Products and Reports. The header search bar (⌘K) jumps to pages and experiments and, when AI is on, asks questions. An unknown address shows a "Page not found" card.

### Sign in (`/sign-in`)

A split-screen page with an animated store scene. One account: `designerexchange9@gmail.com`. A wrong email and a wrong password give the **same** message so neither is revealed. The button is disabled while signing in. A session lasts **12 hours**.

### Overview (`/overview`)

| Card | What it shows | Where it comes from |
| --- | --- | --- |
| **Summary** | One sentence about add-to-carts this week against last week, with "Show the numbers" opening the figures. With AI on, Groq words the sentence (label: "Written by AI (Groq)…"); otherwise, or if Groq fails, the app words it itself ("Written from the numbers below, no AI"). | `add_to_cart_tracking`; GrowthBook for the leading test |
| **Visitors** | Visitors in the last 7 days and the change on the 7 days before. | all six tracking tables, distinct `anonymousId` |
| **Features** | How many feature flags exist; click to list them and open their test. | GrowthBook flags + the flags in the data |
| **Experiments** | How many are running and whether any is a likely winner. | experiments (section 6) |
| **Store · last N minutes** | A little scene of the store with five stops (opened What's New, browsed products, switched theme, opened quick view, added to cart) and the number of people at each; a box per running test with people, conversions, a bar per minute and both variants. Refresh button, "Updated hh:mm:ss". If nobody was there it says *"Quiet right now… The latest activity was 48m ago."* | the six tables, the last `STORE_REFRESH_MINUTES` minutes |
| **Activity over time** | Events per day for 7 days, stacked by type (click a legend entry to hide a type). | the six tables |
| **Top products** | Products ranked by add-to-carts this week. | `add_to_cart_tracking` + `"Product"` |
| **Where visitors come from**, **Devices** | "Not tracked yet": the store records neither a referrer nor a device. | n/a |

### Experiments (`/experiments`, `/experiments/<key>`)

**List:** a chip for All and each status, and one card per test: its two variants, who is ahead, the lift, how sure we are ("46% sure of leader"), how many people and days, and how much data is still needed.

**Detail page:** the verdict in plain words; a "traffic split" line that warns *"Uneven, check tracking"* if the last day was more than 5 points away from 50/50; a race between the two variants; both variants shown as the shopper would see them; conversion rate over time; people per day; the likely range of the true lift; and an **Explain** drawer that retells the result in words (written by Groq when AI is on, otherwise by the app; see section 7).

Which tests appear: every test with entries in `experiment_tracking`, plus every test GrowthBook is running (a test nobody has entered yet shows 0 people). Details of the maths are in [section 6](#6-how-the-numbers-are-worked-out).

### Events (`/events`)

- **Events per minute:** the last 60 minutes, stacked by type.
- **Event mix:** the last 7 days as a donut: how many rows of each kind.
- **Latest events:** the newest 40 rows from all six tables, with a time that keeps counting ("35s ago"), the event, the table, the product and the visitor.
- **Click a row** (or press Enter) for the drawer: the **visitor's journey** (their events within 7 days of this one, newest 100, with "and N earlier"), **where the variant comes from** (each table links to experiments differently), the **row exactly as stored**, and **Copy JSON**. On a quick-view event, "See what they saw" opens the store's Quick View.

### Products (`/products`)

A note at the top says what isn't tracked. Then:

- **Interest vs conversion:** needs product *views*, which the store doesn't record, so it says "Not tracked yet".
- **Product heat grid:** the five busiest products this week with quick views and add-to-carts, shaded cool to hot per column.
- **Quick view funnel:** people who opened quick view → people who added to cart from it, with the drop-off.
- **Your quick view, with click data:** the store's own product card; click Quick View for the modal with a **Show click data** switch. Only "added to cart" is tracked, so the other buttons show "Not tracked".
- **Popular categories** and **Popular colours:** share of this week's add-to-carts.

### Reports (`/reports`)

- **Period and experiment:** pick one experiment or all, a preset (Last 7 days, Last 30 days, This month, Last month) or any From/To. The rules, with the page's own wording: both dates real, From on or after `TRACKING_START`, To not in the future, From not after To, at most 366 days. A broken period shows the reason and greys out Download.
- **Experiment reports:** one row per test with its status, when it started, and *"In this period"* (people, days, rows) or *"Not running in this period"*. **Download CSV** gets the file from the server.

The CSV has: a details block (report, workspace, period, generated, time zone, generated by, row count), a blank line, a header (`date, weekday, experiment, flag, variant, label, people, converted, rate_pct, metric`), then one row per day per variant. Every cell is quoted, a cell starting with `=`, `+`, `-` or `@` gets an apostrophe in front (so a spreadsheet can't run it as a formula), and the file is UTF-8 with a byte-order mark and CRLF line ends, so Excel shows £ signs and dates correctly. File name: `absolutelydex_<key>-daily_<from>_to_<to>.csv`.

### Ask your data (`/ask`)

A question box, four suggestion chips, and answer cards (newest first) with the answer typed out, bars, and **Show the query / numbers**. See [section 7](#7-ask-your-data-and-what-groq-is). With `AI_PROVIDER=none` the page says *"Ask your data is switched off"*.

### Also good to know about every page

- **Three layouts:** a wide desktop layout with the full sidebar, a narrow "icon rail" on tablets (under about 1080 px), and a slide-in menu on phones (under about 820 px). The header has a hamburger button on phones.
- **Keyboard:** the ⌘K (or Ctrl+K) palette opens with arrows, Enter and Esc. Event rows are focusable and open with Enter or Space. Drawers and dialogs close with Esc. Buttons and switches show a focus ring.
- **Motion:** counting numbers, typed-out answers and the little animated people all stop when your system asks for reduced motion.
- **Loading and errors:** every card shows grey placeholders while it loads. If one card fails it shows an error with **Retry** and the rest of the page keeps working.
- **Sign out:** the button at the top right ends the session on this computer.
- **Privacy:** the Admin sees full visitor ids and full stored rows on the Events page. That is by design (there is no masked mode), so keep access to this computer and the password limited.

## 5. The API routes

All routes check that you are signed in themselves (the proxy is not the only lock) and send `Cache-Control: no-store`.

| Route | Method | What it does | Answers |
| --- | --- | --- | --- |
| `/api/store/last-30` | GET | The Store card's numbers for the last `STORE_REFRESH_MINUTES` minutes: the window, visitors, exposures, the five stop counts, per-test variant counts and people per minute. | 200, 401, 500 |
| `/api/events/detail?tbl=&id=` | GET | One event row as stored plus the visitor's journey. `tbl` must be one of the six tracking tables, `id` at most 64 characters. | 200, 400 (bad `tbl`/`id`), 401, 404 (no such row) |
| `/api/reports/experiment?key=&from=&to=` | GET | The CSV for one test and period (rules in section 4). | 200 (CSV), 400 (bad period, with the page's wording), 401, 404 (unknown test, or *"Not running in this period"*) |
| `/api/ask` | POST `{ "question": "…" }` | Ask your data. 1 to 300 characters, at most 10 a minute. | 200 (answer or refusal), 400, 401, 429, 502 (the query couldn’t run), 503 (AI busy, or switched off) |
| `/api/experiments/explain` | POST `{ "key": "…" }` | The AI's explanation of one test, as `{ ok, paragraphs }` (section 7). The server loads the test itself. At most 20 a minute. | 200, 400 (no key), 401, 404 (unknown test), 429, 500, 503 (AI switched off, busy, or its reply didn't pass the checks) |

## 6. How the numbers are worked out

### Definitions

- **Visitor:** a distinct `anonymousId`. Counted once per day and once across the week.
- **Exposure:** a visitor's first sight of a test (a row in `experiment_tracking`; there is one per visitor per test).
- **Variant:** `variationId` 0 is **control**, 1 is **treatment**. Only two-variant tests are shown.
- **Conversion ("reached the goal"):** the visitor has at least one goal event **at or after** their exposure. The goal comes from `src/config/experiments.ts`: *added to cart* (`add_to_cart_tracking`) by default, *clicked What's New* (`whats_new_tracking`, same test key) for the What's New test, *switched theme* (`theme_toggle_tracking`) for the theme test.
- **Rate:** conversions ÷ people in that variant, as a percentage. **Lift:** treatment's rate ÷ control's rate − 1.
- **Running:** GrowthBook lists the test; if GrowthBook can't be reached, someone entered it in the last 7 days.
- **Week / days:** cut in `INSIGHTS_TIMEZONE`. "This week" means the last 7 days including today.

### The statistics (plain words, indicative only)

These are **not** GrowthBook's official result. They are a quick, honest guide.

- **Chance treatment is better:** each rate is treated as an uncertain belief that starts open-minded and sharpens with data; the chance is the probability that treatment's true rate is above control's, shown as a whole percentage. 50% when nobody has been counted.
- **Likely range of the lift:** about 95% of the time the true lift lies inside it. It is wide when data is thin.
- **People needed:** roughly how many people (both variants together) would tell the two rates apart reliably. It is rounded to 100, kept between 200 and 20,000, and set to 2,000 while nobody has reached the goal.
- **Verdict:**
  - fewer than 100 people in total, or fewer than 30 in a variant → *"Too early to tell."*
  - chance 95% or more and treatment ahead → *"<Treatment> is winning."*
  - 90% or more → *"Treatment is probably winning."*
  - 5% or less and treatment behind → *"<Control> is winning."*
  - 75% or more and treatment ahead → *"<Treatment> may be ahead."*
  - otherwise → *"Too early to tell."*
  - A test that would need more than two months at its current pace says so instead of printing hundreds of days.
- **Likely winner:** chance 90% or more and treatment ahead (this is what the "★ likely winner" tag uses).

### The week-on-week comparison

Overview compares the last 7 days with the 7 days before. If there is nothing to compare with, the page says so instead of showing a percentage.

## 7. Ask your data, and what Groq is

### What Groq is

**Groq** is a company that runs AI language models on its own servers and lets apps call them. Insights uses the model in `GROQ_MODEL` (for example `openai/gpt-oss-120b`). It is not Elon Musk's "Grok" and it is not a database: it only reads and writes text. Groq is used in three places, and all three are switched off by `AI_PROVIDER=none`:

| # | Where you see it | What Groq does | Code | Calls Groq |
| --- | --- | --- | --- | --- |
| 1 | **Ask** page (and ⌘K) | Writes one SQL query, then turns the rows into 1–2 sentences. | `src/app/api/ask/route.ts`, `src/lib/ask/ask.ts` | twice per question |
| 2 | **Overview**, the headline card at the top | Writes one headline sentence from this week's totals. | `src/components/overview/SummaryCard.tsx`, `src/lib/ask/overview-summary.ts` | when the page renders (cached 30 min) |
| 3 | **Experiment page**, the "Explain this" drawer | Writes 2–3 short paragraphs explaining that test's result. | `src/components/experiments/ExplainDrawer.tsx`, `src/app/api/experiments/explain/route.ts`, `src/lib/ask/experiment-explain.ts` | when you open the drawer (cached 30 min) |

All three go through one function, `groqChat()` in `src/lib/ask/groq.ts`. It is the only place that talks to Groq: it reads `GROQ_API_KEY` and `GROQ_MODEL` from `.env` on the server (the key never reaches the browser), and when Groq is busy, slow or failing it throws an error that carries no details, so nothing sensitive can reach a log or a page.

### How a question is answered

```
Your question ──► (1) Groq writes ONE SQL query, told only about 8 tables
                  (2) the SERVER checks the query ──► refused? "I can only answer questions about the tracked data"
                  (3) the server runs it read-only, 15-second limit, at most 200 rows
                  (4) Groq turns the rows into 1–2 plain sentences
                  (5) you get: the sentence, bars, the table of rows, and the exact SQL that ran
```

- **The AI never sees the database.** It sees your question and a list of the eight allowed tables and columns.
- **The question is treated as data, never as instructions.** It is passed as JSON and the AI is told to ignore instructions inside it. Anyway, the check in step 2 is the real guard.
- **The check** (`src/lib/ask/sql-check.ts`) allows exactly one `SELECT` or `WITH`, only the six tracking tables plus `"Product"` and `"Category"`, only an approved list of functions, and nothing with comments, `;` in the middle, `pg_…` or `information_schema`, write words (`DELETE`, `DROP`, `INSERT`, `UPDATE`…), `INTO`, `FOR UPDATE`, `RECURSIVE`, or comma-joins. It adds `LIMIT 200` if missing and lowers a bigger limit to 200.
- **What leaves your computer:** the question text, the list of tables, and the result rows with visitor ids shortened (`kT9x…`), at most 50 rows. The database password, session secret and your sign-in never do.
- **Limits:** at most 10 questions a minute; a free Groq account has its own usage limits. When Groq is busy or fails, the page says *"The AI is busy, try again in a minute"*.

### The Overview headline

With AI on, Groq is given this week's add-to-cart and visitor totals and each running test's name, chance and lift (no visitor data) and writes one sentence. It is used only if it is a single short line **and every number in it is one the AI was given**; otherwise the app uses its own sentence. The same figures reuse one answer for 30 minutes.

### The "Explain this" drawer (experiment page)

The **Explain this** button on an experiment's page opens a drawer with the result retold in plain words.

1. Opening the drawer for the first time shows a loading placeholder and the tag *"Asking the AI…"* while the browser calls `POST /api/experiments/explain` with the test's key.
2. The server looks the test up itself (`getExperiment(key)`), so the AI only ever sees real figures, never text typed by a visitor.
3. Groq is given one JSON object about that test: its name and description, days running, each variant's label, people, conversions and rate, the lift, the chance the treatment is better, the people needed and still needed. No visitor ids and no other data.
4. The reply is used only if it is one to five short plain paragraphs **and every number in it is one the AI was given** (rates may be rounded, and the gap between them in points is allowed). Otherwise it is dropped.
5. When the reply is used, the tag reads *"Written by AI (Groq) from the numbers below"*. When it is not, because Groq is slow, busy, switched off or wrote a number it wasn't given, the drawer shows the app's own wording and the tag *"Written from the numbers, no AI"*. The drawer never shows an error for this.
6. The same figures reuse one answer for 30 minutes (a failed attempt is remembered for 2 minutes), and the drawer asks only once per page visit. At most 20 requests a minute.

The **Numbers used** table and the note *"Insights explains the numbers; it doesn't decide. The official result lives in GrowthBook"* are always shown and are never written by the AI. If a reply is rejected, the terminal prints one line (*"Explain: the AI's reply was not used:"* and the kind of problem), never the reply itself.

### Switching it off

Set `AI_PROVIDER=none` and restart. Ask disappears from ⌘K and the header search, `/ask` says *"Ask your data is switched off"*, `/api/ask` and `/api/experiments/explain` answer 503, and the Overview headline and the Explain drawer are worded by the app. Everything else works as normal.

## 8. Security: what protects what

| Layer | What it does |
| --- | --- |
| **Read-only database login** | `insights_reader_ro` can `SELECT` from 8 tables and do nothing else. It cannot read customer accounts (`"User"`). Created and verified by [`setup.sql`](sql/setup.sql). |
| **Read-only transaction + timeout** | Every query starts with `transaction_read_only = on` and `statement_timeout = 15s`. Even if the login were ever widened, a write fails with `cannot execute DELETE in a read-only transaction`. |
| **Fixed table list** | Table names in SQL come from the code, never from user input. The one exception, Ask, runs only after `checkSql` has proven the query uses the eight allowed tables. |
| **Sign-in** | The password is compared with SHA-256 and `timingSafeEqual`. The session is a JWT (HS256, signed with `SESSION_SECRET`) in an `httpOnly`, `SameSite=Lax` cookie named `dex_session`, valid 12 hours. |
| **Every route checks sign-in** | The proxy redirects pages; every API route and server action also calls `getCurrentUser()` itself. |
| **Localhost only** | `dev` and `start` bind to `localhost`. |
| **`.env` checking** | Zod checks every variable once at start. A bad one stops the app with one line that names the variable, never its value. |
| **Secrets** | `.env` and `src/generated` are git-ignored; logs show error names only; no key or connection string reaches the browser (scanned in the final check). |
| **CSV safety** | Cells starting with `=`, `+`, `-` or `@` get an apostrophe, so a spreadsheet can't run them. |
| **GrowthBook** | Only the public client key is used, with one GET request. No secret or admin key exists in the app. |

## 9. Environment variables (`.env`)

Copy `.env.example` to `.env` and fill in every line. Nothing in it is ever committed or shown.

| Variable | Required | What it is | Rules / example |
| --- | --- | --- | --- |
| `STORE_DATABASE_URL` | yes | The pooled Neon connection string, as `insights_reader_ro`. The app uses this. | `postgresql://…` |
| `STORE_DATABASE_URL_UNPOOLED` | yes | The direct Neon connection string, same login. Prisma uses this for `db:pull` and `db:generate`. | `postgresql://…` |
| `SESSION_SECRET` | yes | Signs the sign-in cookie. | 32+ random characters (`openssl rand -hex 32`). Changing it signs everyone out. |
| `ADMIN_PASSWORD` | yes | The Admin's password. | 12+ characters |
| `GROWTHBOOK_API_HOST` | yes | Where GrowthBook's feature list is served. | `https://cdn.growthbook.io` for GrowthBook Cloud |
| `GROWTHBOOK_CLIENT_KEY` | yes | The public SDK client key. | `sdk-…` (Settings → SDK Connections). **Not** a secret key. |
| `AI_PROVIDER` | yes | `groq` turns AI on, `none` turns it off. | exactly `groq` or `none` |
| `GROQ_API_KEY` | only for `groq` | Your Groq key. | `gsk_…` |
| `GROQ_MODEL` | only for `groq` | The model to use. | `openai/gpt-oss-120b` |
| `INSIGHTS_TIMEZONE` | yes | The shop's time zone, where days are cut. | a real zone, e.g. `Asia/Kolkata` |
| `TRACKING_START` | yes | The first day of tracking; the earliest a report may start. | `YYYY-MM-DD` |
| `STORE_REFRESH_MINUTES` | yes | The Store card's window and refresh interval. | whole number, 5 to 120 |

Plain `KEY=value` lines; no quotes, no spaces around `=`. Next.js reads `.env` (and `.env.local`, which would override it; use only `.env` to avoid surprises). The Prisma commands and the tests read only `.env`.

## 10. Setting up from a pull

The step-by-step guide is [SETUP.md](SETUP.md). In one screen:

```bash
git clone <repository url> absolutely-dex-insights && cd absolutely-dex-insights
nvm use && npm install
# in the Neon SQL Editor, as the owner: run docs/sql/setup.sql
cp .env.example .env          # fill in every line (section 9)
npm run db:generate           # builds src/generated (not in Git)
npm run dev                   # or: npm run build && npm run start
```

After every later `git pull`: `npm install` then `npm run db:generate`.

## 11. The SQL: which script to run when

| File | Run it… | As | What it does |
| --- | --- | --- | --- |
| [`docs/sql/setup.sql`](sql/setup.sql) | once, at setup | Neon owner | PART 1 creates `insights_reader_ro` with `SELECT` on the 8 tables. PART 2 proves the login can't write and can't read `"User"`. |

The setup script was run and checked on a local Postgres (role creation and the permission checks) before being written here.

### The tables the app reads

| Table | One row is… | Used for |
| --- | --- | --- |
| `experiment_tracking` | a visitor entering an A/B test (unique per visitor and test) | exposures, variants, "Saw an experiment" |
| `add_to_cart_tracking` | an add to cart | goal of most tests, top products, categories, colours |
| `quickview_tracking` | someone opening Quick View | quick-view numbers, funnel |
| `quick_view_cart_events` | an add to cart made from inside Quick View | funnel |
| `whats_new_tracking` | a click on "What's new" | goal of the What's New test |
| `theme_toggle_tracking` | a dark/light switch | goal of the theme test |
| `"Product"`, `"Category"` | the catalogue | product and category names |

Other tables exist in the database (customer accounts, reviews, wishlists, two older exposure tables). Insights deliberately cannot read them.

## 12. Day-to-day tasks

| I want to… | Do this |
| --- | --- |
| **Start / stop** | `npm run dev` (or `npm run build && npm run start`). Stop with `Ctrl+C`. |
| **Change the Admin password** | Edit `ADMIN_PASSWORD` in `.env`, restart. To also sign out browsers that are signed in, change `SESSION_SECRET` too. |
| **Rotate the database password** | Neon SQL Editor, as the owner: `ALTER ROLE insights_reader_ro PASSWORD 'new';`, then update both URLs in `.env`, restart. |
| **Refresh the database layout** | `npm run db:pull` (reads the tables into `prisma/schema.prisma`; read-only), then `npm run db:generate`. If a column Ask uses changed, update `src/lib/ask/schema.ts` (`npm test` fails if it names a column that no longer exists). |
| **Add an A/B test** | Nothing: it appears once GrowthBook runs it or visitors are recorded under its key. To count a goal other than "added to cart", add its key to `src/config/experiments.ts`. |
| **Turn AI off / on** | `AI_PROVIDER=none` / `groq`, restart. |
| **Replace the Groq or GrowthBook key** | Put the new `GROQ_API_KEY` or `GROWTHBOOK_CLIENT_KEY` in `.env`, restart. Revoke the old key in Groq or GrowthBook. |
| **Sign out everywhere** | Change `SESSION_SECRET`, restart. |
| **Share the project with someone else** | They do `docs/SETUP.md`. Never send them your `.env`; each person makes their own secrets. Only commit and push when you decide to: the rules in `CLAUDE.md` say not to push, branch or amend unless asked. |
| **Change how often the Store card refreshes** | `STORE_REFRESH_MINUTES` (5 to 120), restart. |
| **Get a test's results as a spreadsheet** | Reports → pick period → Download CSV. |
| **Update to new code** | `git pull`, `npm install`, `npm run db:generate`, restart. |

## 13. Tests and quality checks

```bash
npm run lint          # code style
npx tsc --noEmit      # types
npm test              # about 277 tests in 29 files
npm run build         # production build (also runs db:generate)
```

What the tests cover: the statistics and verdict wording; the day and time-zone maths; the report period rules and the CSV (BOM, CRLF, quoting, formula protection, file names); `.env` checking; the sign-in check and session token; the retry rules; the SQL check (including `DROP TABLE`, two statements, a hidden second statement, `pg_sleep`, a table that isn't allowed, a missing `LIMIT`); the Ask flow with a pretend AI and database; every API route (401, 400, 404, rate limit); the query code with a pretend database (empty database gives zeros, never `NaN`); and the markup of the main cards.

**Not covered by automatic tests, so check by hand after setup:**

1. Open every page signed in, at 1440, 820 and 390 px wide, and compare with `docs/prototype.html`.
2. Ask a real question and compare the answer with the SQL shown. Ask "delete every row": it must be refused.
3. Set `AI_PROVIDER=none` and confirm Ask disappears.
4. Download a CSV and open it in Excel.
5. Turn Wi-Fi off and press Refresh on the Store card: the old numbers stay, with "Couldn't refresh · Retry".

## 14. Troubleshooting

| Problem | Cause | Fix |
| --- | --- | --- |
| App stops at start with `Environment problem: X (…)` | `.env` is missing the variable or it is invalid | Fix that line (section 9), restart. |
| `Cannot find module '@/generated/store/client'` | The database client isn't built (it isn't in Git) | `npm run db:generate` |
| `db:generate` / `db:pull` says it cannot resolve `STORE_DATABASE_URL_UNPOOLED` | No `.env` | Create it. |
| Sign-in fails with the right password | `ADMIN_PASSWORD` changed but the app wasn't restarted, or a `.env.local` overrides `.env` | Restart; delete `.env.local`. |
| `/ask` says "switched off", or Ask is missing from ⌘K | `AI_PROVIDER=none` | Set `groq`, restart. |
| "The AI is busy, try again in a minute" | Groq is rate-limiting, slow, or the key/model is wrong | Wait; check `GROQ_API_KEY` and `GROQ_MODEL`. |
| "I can only answer questions about the tracked data" | The question was refused by design (or the AI refused) | Ask about events, products or tests; see the suggestion chips. |
| Overview is all zeros | No events in the last 7 days in the database the app points at | In the Neon SQL Editor run `SELECT MAX("createdAt") FROM add_to_cart_tracking;` If the newest row is old, this is correct. |
| "Store · last 30 minutes" is 0 | Nobody was in the store in that window | Correct; it says when the latest activity was. |
| A test shows 0 people and "1 day running" | GrowthBook runs it but no visitor has been recorded yet | Correct. |
| "Interest vs conversion" says "Not tracked yet" | The store doesn't record product views | See section 15. |
| Download says "Not running in this period" | The test had no days in that period | Pick a period after the test started. |
| Pages take 2 to 4 seconds | The Neon project is far away (each query makes several round trips) | Normal; a Neon project in a nearer region is the fix. |
| Numbers differ from a SQL check | Different database or branch, wrong time zone, or the page is a few seconds old | Use the same database; set the time zone in the query (section 11). |
| `Another next dev server is already running` | A copy is open | Use it, or stop it. |

## 15. What is not tracked, and known limits

**The store doesn't record these, so the app says "Not tracked yet" and never makes numbers up:**

- Product page **views** (so no "views vs add rate" chart, grid columns or insight).
- Whether people **saw** the Quick View button, and clicks on the card's heart, the Quick View button vs the eye icon, wishlist, "Product Detail" and close inside the modal. Only "opened quick view" and "added to cart from quick view" exist.
- **Where visitors come from** (referrer) and **what device** they use.

**Limits to know about:**

- **Statistics are indicative**, not GrowthBook's official result.
- **Only two-variant tests** are shown (control = 0, treatment = 1).
- **Test status** comes from the GrowthBook feature list; without a secret key there are no descriptions or "stopped" history.
- **In-memory caches and the Ask rate limit reset when the server restarts**, and a restart is needed after any `.env` change.
- **One account, one computer.** It is not built to be put on the internet.
- **`quick_view_cart_events` times** are treated as UTC (the table is empty in the sample database, so this was not confirmed).
- **Speed** depends on the distance to the Neon region.
- **The pages have not been compared with the prototype by eye** (see section 13).
- **`.env.example` still mentions the login name `insights_reader`.** The name doesn't matter; this guide uses `insights_reader_ro`.

## 16. Where things are in the code

```
docs/
  PROJECT.md, SETUP.md            these documents
  prototype.html                  the approved design
  sql/setup.sql                   the database login setup (section 11)
prisma/schema.prisma              the database layout (from db:pull)
prisma.config.ts                  Prisma settings (reads .env)
src/
  proxy.ts                        sign-in gate for pages; 401 for /api
  instrumentation.ts              checks .env at start
  app/
    (app)/                        the pages: overview, experiments, events, products, reports, ask
    sign-in/                      the sign-in page and its server actions
    api/                          store/last-30, events/detail, reports/experiment, ask
  components/                     charts, ui pieces, shell (sidebar, header, ⌘K), page cards
  config/
    accounts.ts                   the one Admin account
    experiments.ts                which table is each test's goal
  lib/
    data.ts                       the ONLY place pages get data from
    store/                        all the database queries (overview, experiments, events, products, reports, GrowthBook)
    db.ts                         read-only client, 15 s limit, retry
    env.ts                        .env checking
    session.ts, session-token.ts, auth.ts   sign-in and cookie
    stats.ts, tz.ts, dates.ts, format.ts, report.ts, report-period.ts   maths, days, CSV
    ask/                          Groq: groq (the one caller), Ask (sql-check, schema, rate limit), overview-summary, experiment-explain
  types/                          the shapes of all data
  test/fixtures.ts                small fixed data used by tests only
  generated/                      the database client (built by db:generate; not in Git)
```
