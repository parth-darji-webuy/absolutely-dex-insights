# AbsolutelyDeX Insights

A dashboard for the store's A/B tests, events and products. It runs only on this computer.

## Run it

1. Use Node 22.12 or newer (`nvm use` reads `.nvmrc`).
2. `npm install`
3. Create a `.env` file in this folder with the sign-in password (ask whoever set the project up for the variable names; the file is never committed).
4. `npm run dev`, then open http://localhost:3000 and sign in as the Admin account.

Until phase 6 every page shows sample data, so nothing needs a database.

## Other commands

| Command | What it does |
| --- | --- |
| `npm run lint` | Checks the code style |
| `npx tsc --noEmit` | Checks the types |
| `npm test` | Runs the tests |
| `npm run build` | Builds for production |

## Where things are

- `docs/prototype.html` is the approved design and the sample data.
- `src/lib/data.ts` is the only place pages get data from.
- Reports download as CSV files that open in Excel (the file starts with a byte-order mark so £ and dates stay intact).
