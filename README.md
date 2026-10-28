# AbsolutelyDeX Insights

A dashboard for the store's A/B tests, events and products. It runs only on this computer and only reads the store's database.

## First time

1. Use Node 22.12 or newer (`nvm use` reads `.nvmrc`).
2. `npm install`
3. Copy `.env.example` to `.env` and fill in every value (the file explains each one). `.env` is never committed, and nothing in it is ever shown in the browser or the logs. A missing or bad value stops the app with one line naming the variable.
4. `npm run db:generate` (it also runs as part of `npm run build`).

## Start and stop

| What | Command |
| --- | --- |
| Work on it (reloads as you edit) | `npm run dev`, then open http://localhost:3000 |
| Run it for real | `npm run build`, then `npm run start`, then open http://localhost:3000 |
| Another port | `npm run start -- -p 3001` |
| Stop | press `Ctrl+C` in the terminal that is running it |

Both only listen on `localhost`, so nobody else on the network can reach them. Sign in as the Admin (`designerexchange9@gmail.com`) with `ADMIN_PASSWORD`.

## Change the Admin password

1. Put the new password in `ADMIN_PASSWORD` in `.env` (12 or more characters).
2. Restart the app (stop it, then start it again).
3. To also sign out any browser that is already signed in, change `SESSION_SECRET` (32 or more random characters, for example from `openssl rand -hex 32`) in the same step.

## Refresh the database schema

When the store adds or renames a column:

1. `npm run db:pull` reads the tables into `prisma/schema.prisma`. It only reads; nothing is changed in the database.
2. `npm run db:generate` rebuilds the typed client in `src/generated/store` (git-ignored).
3. If a column that Ask your data knows about changed, update `src/lib/ask/schema.ts`. `npm test` fails if it names a column that is no longer in `prisma/schema.prisma`.

## Add an experiment

Nothing to configure for it to show up. An experiment appears on its own once GrowthBook is running it (the client key in `.env` lets Insights read the list) or visitors start being recorded under its key in `experiment_tracking`.

By default a test's goal is "added to cart". To count something else, add the experiment's key to `src/config/experiments.ts`, say which tracking table its goal comes from (`add_to_cart_tracking`, `whats_new_tracking` or `theme_toggle_tracking`), and how the numbers should be worded.

## Switch Ask your data off

Set `AI_PROVIDER=none` in `.env` and restart. Ask disappears from ⌘K and the header search, and `/ask` says "Ask your data is switched off". Everything else keeps working. To switch it back on set `AI_PROVIDER=groq` and fill in `GROQ_API_KEY` and `GROQ_MODEL`.

How Ask stays safe: the AI only writes a query. The server checks it (one `SELECT`, the eight allowed tables, no system tables, no write words, `LIMIT 200`) before anything runs, and runs it read-only with a 15-second limit. Visitor ids are shortened before anything is sent to the AI. At most 10 questions a minute.

## Other commands

| Command | What it does |
| --- | --- |
| `npm run lint` | Checks the code style |
| `npx tsc --noEmit` | Checks the types |
| `npm test` | Runs the tests |
| `npm run db:pull` | Reads the store database's tables into `prisma/schema.prisma` (read-only) |
| `npm run db:generate` | Builds the typed database client |

## Where things are

- `docs/prototype.html` is the approved design.
- `src/lib/data.ts` is the only place pages get data from; the queries are in `src/lib/store/`.
- `src/app/api/` holds the four routes: `store/last-30`, `events/detail`, `reports/experiment` and `ask`. Each one checks you are signed in.
- `docs/demo-data.sql` fills a **test** database (never the live store) with fake visitors. `docs/demo-data-remove.sql` removes them again.
