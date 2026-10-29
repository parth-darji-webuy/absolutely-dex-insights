// The text of the /docs page. Variable names only: no value from .env ever goes here.
// In any text, `like this` is shown as code.

export type DocBlock =
  | { kind: "p"; text: string }
  | { kind: "note"; text: string }
  | { kind: "steps"; items: { title: string; text?: string; code?: string }[] }
  | { kind: "table"; head: string[]; rows: string[][] }
  | { kind: "flow"; items: { title: string; text: string }[] }
  | { kind: "layers"; items: { title: string; text: string }[]; outside: { title: string; text: string }[] };

export type DocSection = { id: string; title: string; subtitle?: string; blocks: DocBlock[] };

export const DOC_SECTIONS: DocSection[] = [
  {
    id: "what",
    title: "What this is",
    subtitle: "Read this first.",
    blocks: [
      { kind: "p", text: "AbsolutelyDeX Insights shows the shop’s A/B tests, events and products in plain words. It runs only on this computer, at `localhost`." },
      { kind: "p", text: "It only reads. The numbers come from the store’s Neon database through a login that can run `SELECT` and nothing else. The list of running tests comes from GrowthBook. The app never writes to either." },
      { kind: "p", text: "There is one account: the Admin, `designerexchange9@gmail.com`." },
    ],
  },
  {
    id: "install",
    title: "Install",
    subtitle: "About 20 minutes the first time.",
    blocks: [
      {
        kind: "table",
        head: ["You need", "Used for"],
        rows: [
          ["Node 22.12 or newer", "running the app"],
          ["Git", "getting the code"],
          ["A Neon database with the store’s tables (the owner login, once)", "the numbers"],
          ["A GrowthBook client key (`sdk-…`)", "the list of running tests"],
          ["A Groq key (`gsk_…`), optional", "Ask, the Overview headline, Explain this"],
        ],
      },
      {
        kind: "steps",
        items: [
          { title: "Get the code", code: "git clone <your repository url> absolutely-dex-insights\ncd absolutely-dex-insights" },
          { title: "Use the right Node", text: "It must print v22.12 or higher.", code: "nvm use\nnode -v" },
          { title: "Install the packages", code: "npm install" },
          {
            title: "Make the read-only database login (once)",
            text: "In the Neon SQL Editor, signed in as the owner, run `docs/sql/01-create-read-only-role.sql`. Put your own password and database name in first. Then run `docs/sql/02-check-the-role.sql`: every value except `can_select` must say `false`. Do not make this login with “New role” in the Neon console, because that kind of role can write.",
          },
          {
            title: "Copy the two connection strings",
            text: "In Neon, choose Connect, your database and the role `insights_reader_ro`. Pooling on is `STORE_DATABASE_URL`. Pooling off is `STORE_DATABASE_URL_UNPOOLED`.",
          },
          { title: "Create `.env` and fill every line", text: "The next section says what each line is.", code: "cp .env.example .env" },
          { title: "Build the database client", text: "Run this after every fresh clone and every pull.", code: "npm run db:generate" },
          { title: "Start it, then sign in", text: "Open http://localhost:3000. Sign in with the Admin email and your `ADMIN_PASSWORD`.", code: "npm run dev" },
        ],
      },
      { kind: "note", text: "For everyday use, run `npm run build` and then `npm run start` instead. Both listen on `localhost` only." },
    ],
  },
  {
    id: "env",
    title: "The .env values",
    subtitle: "One value per line. No quotes, no spaces around `=`.",
    blocks: [
      {
        kind: "table",
        head: ["Name", "What to put"],
        rows: [
          ["`STORE_DATABASE_URL`", "The pooled Neon URL"],
          ["`STORE_DATABASE_URL_UNPOOLED`", "The direct Neon URL"],
          ["`SESSION_SECRET`", "32 or more random characters (`openssl rand -hex 32`)"],
          ["`ADMIN_PASSWORD`", "The password you sign in with, 12 or more characters"],
          ["`GROWTHBOOK_API_HOST`", "`https://cdn.growthbook.io` for GrowthBook Cloud"],
          ["`GROWTHBOOK_CLIENT_KEY`", "The `sdk-…` key from Settings, SDK Connections"],
          ["`AI_PROVIDER`", "`groq` to use the AI, or `none` to turn it off"],
          ["`GROQ_API_KEY`, `GROQ_MODEL`", "Needed only when `AI_PROVIDER` is `groq`"],
          ["`INSIGHTS_TIMEZONE`", "The shop’s time zone, like `Europe/London`. Days are cut here"],
          ["`TRACKING_START`", "The first day of tracking, `YYYY-MM-DD`"],
          ["`STORE_REFRESH_MINUTES`", "5 to 120. How long the Store card looks back, and how often it refreshes"],
        ],
      },
      { kind: "note", text: "`.env` is never committed. A wrong or missing value stops the app at start with one line naming the variable, never its value." },
    ],
  },
  {
    id: "data",
    title: "How the data arrives",
    subtitle: "Where the numbers start.",
    blocks: [
      { kind: "p", text: "The shop’s website records what visitors do into six tables in the Neon database. This app only reads those tables." },
      {
        kind: "table",
        head: ["Table", "Event it holds"],
        rows: [
          ["`experiment_tracking`", "A visitor saw an A/B test"],
          ["`add_to_cart_tracking`", "Added to cart"],
          ["`quickview_tracking`", "Opened quick view"],
          ["`theme_toggle_tracking`", "Switched theme"],
          ["`whats_new_tracking`", "Opened What’s New"],
          ["`quick_view_cart_events`", "Added to cart from quick view"],
        ],
      },
      { kind: "p", text: "A visitor is one distinct `anonymousId`. Each person counts once per day and once for the whole week. A day is a day in `INSIGHTS_TIMEZONE`, not UTC." },
      { kind: "p", text: "The store does not record where visitors came from or what device they used. Those cards say “Not tracked yet”." },
    ],
  },
  {
    id: "wired",
    title: "How it is wired",
    subtitle: "From the database to a card on the screen.",
    blocks: [
      {
        kind: "layers",
        items: [
          { title: "Browser", text: "You open a page. Only the Store card talks to the server again by itself" },
          { title: "src/proxy.ts", text: "Checks the sign-in cookie. Signed out goes to /sign-in" },
          { title: "Page and CardSlot", text: "src/app/(app)/*. Each card loads on its own, with a placeholder and an error with Retry" },
          { title: "src/lib/queries.ts", text: "One fetch per page load, shared by every card that needs it" },
          { title: "src/lib/data.ts", text: "The only door: getOverview, getExperiments, getEvents, getProducts, getReportRows, getStoreLast30" },
          { title: "src/lib/store/", text: "The SQL and the maths. Turns rows into typed objects" },
          { title: "src/lib/db.ts", text: "runQuery: read-only, 15 second limit, one retry" },
        ],
        outside: [
          { title: "Neon database", text: "Six tracking tables. Read only" },
          { title: "GrowthBook", text: "Which tests are running" },
          { title: "Groq", text: "Optional wording" },
        ],
      },
      {
        kind: "steps",
        items: [
          { title: "Read", text: "`runQuery` in `src/lib/db.ts` opens a read-only transaction. Every query uses a tagged `$queryRaw` template, with table names from a fixed list." },
          { title: "Shape", text: "`src/lib/store/` turns rows into typed objects. A missing day becomes 0, and a division by zero becomes “—”, never `NaN`." },
          { title: "Hand over", text: "Pages get data only from the functions in `src/lib/data.ts`, such as `getOverview()` and `getExperiments()`. Each one runs fresh on every visit." },
          { title: "Draw", text: "Each card is its own Server Component inside a `CardSlot`. It shows grey placeholders while it loads, and an error with Retry if it fails. The rest of the page keeps working." },
        ],
      },
    ],
  },
  {
    id: "fetch",
    title: "Fetched, updated and shown",
    subtitle: "The life of one number.",
    blocks: [
      {
        kind: "steps",
        items: [
          { title: "Fetched", text: "When a page opens, each card asks `queries.ts`, which asks `data.ts`, which runs the SQL in `src/lib/store/`. Nothing is cached between visits, so every visit reads the database again." },
          { title: "Updated", text: "The database is updated by the shop’s website, never by this app. A card shows new numbers when the page is loaded again, or, for the Store card, when its timer fires." },
          { title: "Shown", text: "A grey placeholder shows while the card loads, then the card appears. No data gives zeros and an empty state. Nothing to divide by gives “—”. A failed card gives an error with Retry, and the other cards keep working." },
        ],
      },
    ],
  },
  {
    id: "live",
    title: "What updates when",
    blocks: [
      {
        kind: "table",
        head: ["Part of the page", "Updates"],
        rows: [
          ["Store, last N minutes card", "Every N minutes while the tab is open, and when you press Refresh. Only that card reloads"],
          ["All other cards", "When you load the page, or press Retry on a card"],
          ["A failed Store refresh", "Keeps the old numbers and shows “Couldn’t refresh”"],
        ],
      },
      { kind: "p", text: "The Store card has its own short path, so it can refresh alone:" },
      {
        kind: "flow",
        items: [
          { title: "Store card", text: "Timer or Refresh" },
          { title: "/api/store/last-30", text: "Signed in only" },
          { title: "getStoreLast30", text: "data.ts" },
          { title: "Neon", text: "Last N minutes" },
        ],
      },
    ],
  },
  {
    id: "extras",
    title: "GrowthBook and Groq",
    subtitle: "Both are read-only helpers.",
    blocks: [
      { kind: "p", text: "GrowthBook lists which tests are running. If it can’t be reached, a test counts as running when someone entered it in the last 7 days." },
      { kind: "p", text: "Groq words the Overview headline, the experiment “Explain this” drawer and Ask your data. Set `AI_PROVIDER=none` to turn all of it off. The app words the headline itself, and Ask shows “switched off”." },
    ],
  },
  {
    id: "commands",
    title: "Commands",
    blocks: [
      {
        kind: "table",
        head: ["Command", "What it does"],
        rows: [
          ["`npm run dev`", "Runs the app at http://localhost:3000"],
          ["`npm run lint`", "Checks the code style"],
          ["`npx tsc --noEmit`", "Checks the types"],
          ["`npm test`", "Runs the tests"],
          ["`npm run build`", "Builds the app (runs `db:generate` first)"],
          ["`npm run db:generate`", "Rebuilds the database client"],
        ],
      },
    ],
  },
  {
    id: "problems",
    title: "If something breaks",
    blocks: [
      {
        kind: "table",
        head: ["You see", "Do this"],
        rows: [
          ["“Environment problem: X”", "Fix the line named X in `.env`, then restart"],
          ["“Cannot find module '@/generated/store/client'”", "Run `npm run db:generate`"],
          ["Sign-in says the email and password don’t match", "Use the Admin email. If you changed `ADMIN_PASSWORD`, restart the app"],
          ["Ask says “switched off”", "Set `AI_PROVIDER=groq`, save, restart"],
          ["“The AI is busy”", "Groq is rate-limiting. Wait a minute"],
          ["Every page shows zeros", "No events in the last 7 days. Run `docs/sql/04-is-there-data.sql`"],
          ["A page takes 2 to 4 seconds", "Normal when the Neon project is far from you"],
        ],
      },
      { kind: "note", text: "Full detail is in `docs/SETUP.md` and `docs/PROJECT.md`." },
    ],
  },
];
