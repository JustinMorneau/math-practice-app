# Math Practice App

A browser-based flashcard app that helps children ages 7–12 practice addition,
subtraction, multiplication, and division. Built with React, TypeScript, and Vite.
All progress is stored locally in the browser — no account or backend required.

- Full requirements: [`docs/specification.md`](docs/specification.md)
- Implementation plan and progress: [`docs/TODO.md`](docs/TODO.md)

## Prerequisites

- Node.js `20.19+` or `22.12+` (required by Vite 7)
- npm 10+

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Scripts

| Command                | What it does                                        |
| ---------------------- | --------------------------------------------------- |
| `npm run dev`          | Start the development server with hot reload        |
| `npm run build`        | Type-check and create a production build in `dist/` |
| `npm run preview`      | Serve the production build locally                  |
| `npm run typecheck`    | Run the TypeScript compiler without emitting files  |
| `npm run lint`         | Run ESLint (`lint:fix` to auto-fix)                 |
| `npm run format`       | Format all files with Prettier                      |
| `npm run format:check` | Check formatting without writing (useful in CI)     |
| `npm test`             | Run the Vitest suite once                           |
| `npm run test:watch`   | Run Vitest in watch mode                            |

Tests use Vitest with jsdom and React Testing Library. Test files live next to
the code they test and are named `*.test.ts` / `*.test.tsx`.

## Project structure

```text
src/
├── app/          # App root, routes, and context provider
├── components/   # Reusable UI (layout, setup, practice, statistics, common)
├── constants/    # Option labels, descriptions, and defaults
├── pages/        # One component per route
├── services/     # Question generation, statistics, storage
├── hooks/        # Custom React hooks
├── types/        # Shared TypeScript domain types
├── utils/        # Small pure helpers (formatting, validation, math, ids)
└── test/         # Test setup
```

Empty folders contain a `.gitkeep` placeholder until they receive real files.

## Routes

| Path                | Page                                   |
| ------------------- | -------------------------------------- |
| `/`                 | Home                                   |
| `/practice/setup`   | Practice setup (`/practice` redirects) |
| `/practice/session` | Practice session                       |
| `/practice/summary` | Session summary                        |
| `/statistics`       | Statistics                             |
| `/settings`         | Settings                               |

Any other path shows a "Page not found" screen. Route paths are defined once
in `src/app/routes.ts`.
