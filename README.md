# AbsolutelyDeX Insights

A dashboard for the store's A/B tests, events and products. It runs only on this computer.

## Run it

1. Use Node 22.12 or newer (`nvm use` reads `.nvmrc`).
2. `npm install`
3. Copy `.env.example` to `.env` and fill in every value (it lists what each one is for). `.env` is never committed. A missing or bad value stops the app with one line naming the variable.
4. `npm run db:generate` (it also runs as part of `npm run build`), then `npm run dev` and open http://localhost:3000. Sign in as the Admin with `ADMIN_PASSWORD`.

Until phase 6 every page still shows sample data; the database connection is ready but unused.

## Other commands

| Command | What it does |
| --- | --- |
| `npm run lint` | Checks the code style |
| `npx tsc --noEmit` | Checks the types |
| `npm test` | Runs the tests |
| `npm run build` | Generates the database client, then builds for production |
| `npm run db:pull` | Reads the store database's tables into `prisma/schema.prisma` (read-only) |
| `npm run db:generate` | Builds the typed database client in `src/generated/store` (git-ignored) |

## Where things are

- `docs/prototype.html` is the approved design and the sample data.
- `src/lib/data.ts` is the only place pages get data from.
- Reports download as CSV files that open in Excel (the file starts with a byte-order mark so £ and dates stay intact).
