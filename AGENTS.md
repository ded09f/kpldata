# AGENTS.md

## Cursor Cloud specific instructions

`kpldata` is a purely client-side static SPA (Vite 6 + React 19 + TypeScript). There is no backend, database, or environment variable — all data is bundled as static JSON under `src/data/`. Standard commands live in `package.json` and `README.md`; only the non-obvious caveats are captured here.

- **Dev server base path**: the app is served under `/kpldata/`, not the root. After `npm run dev`, open `http://localhost:5173/kpldata/` (`http://localhost:5173/` will 404). `npm run preview` serves the production build at `http://localhost:4173/kpldata/`.
- **Lint caveat**: `npm run lint` runs `oxlint`, but `oxlint` is not declared in `package.json`, so the script fails with `oxlint: not found`. Run lint via `npx oxlint` instead (exit 0; there is one pre-existing unused-import warning in `scripts/validate-data.mjs`).
- **Tests**: `npm test` runs Vitest once (`vitest run`); the only suite is `src/lib/predict.test.ts` (the Elo/form/H2H prediction model).
