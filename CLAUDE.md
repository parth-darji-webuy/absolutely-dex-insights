# AbsolutelyDeX Insights

A dashboard for the store's A/B tests, events and products. It runs only on this computer.
`docs/prototype.html` is the approved design and the sample data (CSS in `<style>`, the app in `<script>`).
It is built in 8 phases.

## Rules (follow them in every phase)

- One phase per session. Start with a short plan (what you'll build, main files, new packages) and wait for my OK.
- `docs/prototype.html` is the design. Before building a part, read its CSS and JS and match it: wording, spacing, colours, animations, hover, loading and empty states, at 1440, 820 and 390 px.
- At the end of a phase: run `npm run lint`, `npx tsc --noEmit`, `npm test` and `npm run build`, and fix every failure. Show me what you built, `git status --short`, a short "check by hand" list and the commit message "Phase N: <title>". Ask "Shall I commit?" and commit only after I say yes. Never push, branch or amend unless I ask.
- Ask before adding a package I didn't name, or deleting files outside `src/`.
- Never open, read or print `.env`. Never put a password, key or connection string in code, logs, commits or the chat.
- Never write to the store database: no `prisma migrate`, no `db push`. SQL only through `$queryRaw` tagged templates, with table names from a fixed list.
- If something doesn't fit (a column name differs, the prototype is unclear), stop and ask me.
- Stack: Next.js 16 App Router, TypeScript, `src/`, `@/*`, Tailwind, Inter, route protection in `src/proxy.ts`. Icons and charts ported from the prototype as React SVG, no chart or UI library. Vitest for tests. Small files; Server Components unless interaction needs `"use client"`.
- Pages get data only from async functions in `src/lib/data.ts`: `getOverview()`, `getStoreLast30()`, `getExperiments()`, `getExperiment(key)`, `getEvents()`, `getProducts()`, `getReportRows(key, from, to)`. Until phase 6 they return the sample data after 400 ms; then real queries, same names and types.
- One account only: Admin, "Designer Exchange", designerexchange9@gmail.com. Leave out the prototype's Viewer role and masked visitor IDs.
- Edge cases everywhere: no data shows zeros and the prototype's empty states, never `NaN` or `"undefined"`; nothing to divide by shows "—"; if one card's data fails, that card shows an error with Retry and the rest of the page still works.

## Commands

- `npm run dev` (http://localhost:3000), `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`.
- Next.js 16 differs from older versions. Before writing Next.js code, check the bundled docs in `node_modules/next/dist/docs/`.
- Node 22.12 or newer (`.nvmrc` says 22).
