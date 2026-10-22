# Math Practice App

A browser-based flashcard app that helps children ages 7–12 practice addition,
subtraction, multiplication, and division. Built with React, TypeScript, and
Vite. All progress is stored in the browser: no account, server, ads, or
tracking.

- Full requirements: [`docs/specification.md`](docs/specification.md)
- Implementation plan and progress: [`docs/TODO.md`](docs/TODO.md)

## Features

- **Flashcard practice** with four answer choices: pick an answer, flip the
  card, and say whether you got it right. Four difficulty levels, any mix of
  operations, and 5, 10, or 20 questions or continuous practice.
- **Mistake review**: missed facts become mistake patterns. Review mode asks
  related questions (nearby facts, reversed facts, and fact families such as
  56 ÷ 8 for 8 × 7), prioritizes frequent and recent mistakes, and marks a
  mistake mastered after enough correct review answers.
- **Statistics**: overall accuracy, results by operation and level, recent
  sessions, the most missed facts, and progress on every mistake.
- **Settings**: default problems, level, and length; card animation,
  explanations, encouraging messages, and sound effects; mastery threshold;
  and clearing all data.
- **Accessible**: full keyboard support (including keys 1–4 for answers),
  screen-reader text for every problem, reduced-motion support, WCAG AA
  contrast, and layouts that work from small phones to desktops.
- **Safe with saved data**: sessions survive a page refresh, leaving a session
  asks first, and damaged saved data is repaired one category at a time.

## Privacy

The app collects no personal information and makes no network requests after
it loads. Settings and practice history are saved in the browser's
`localStorage` on the student's own device, under keys beginning with
`mathPractice.`. Clearing the browser's data, or using another browser or
device, starts with no saved progress. The Settings page explains this to
students and families, and the deployed site sends a strict Content Security
Policy so only the app's own files can load.

## Prerequisites

- Node.js `22.18+` or `24.11+` (required by Vitest 5; Vite 7 also runs on these)
- npm 10+

## Getting started

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173). To try the app
on a tablet or phone on the same network, run `npm run dev -- --host` and open
the "Network" address it prints.

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

## Testing

Tests use Vitest with jsdom, React Testing Library, and axe-core. Test files
live next to the code they test (`*.test.ts` / `*.test.tsx`) and cover:

- **Unit tests** for question generation, difficulty ranges, answer choices,
  statistics, mistake patterns, similar questions, mastery, and storage.
- **Component tests** for selectors, cards, progress, dialogs, and pages.
- **Integration tests** for complete sessions, mistake review, refresh
  recovery, leaving a session, damaged saved data, and resetting statistics.
- **Accessibility tests**: axe-core checks on every page and a complete
  keyboard-only session.

## Project structure

```text
src/
├── app/          # App root, route table, context provider, app-level tests
├── components/   # Reusable UI (layout, setup, practice, statistics, common)
├── constants/    # Option labels, difficulty rules, and default settings
├── hooks/        # usePracticeSession
├── pages/        # One component per route, plus error and loading pages
├── services/     # Question generation, review, statistics, and storage
├── test/         # Test setup and helpers
├── types/        # Shared TypeScript domain types
└── utils/        # Small pure helpers (formatting, validation, math, ids)
```

## Routes

| Path                | Page                                   |
| ------------------- | -------------------------------------- |
| `/`                 | Home                                   |
| `/practice/setup`   | Practice setup (`/practice` redirects) |
| `/practice/session` | Practice session                       |
| `/practice/summary` | Session summary                        |
| `/statistics`       | Statistics (loaded on first visit)     |
| `/settings`         | Settings (loaded on first visit)       |

Any other path shows a "Page not found" screen. Route paths are defined once
in `src/app/routes.ts` and the route table in `src/app/routeTable.tsx`.

## Saved data

| Key                            | Contents                                           |
| ------------------------------ | -------------------------------------------------- |
| `mathPractice.version`         | Data format version (currently 2)                  |
| `mathPractice.settings`        | Settings                                           |
| `mathPractice.sessions`        | The 100 most recent sessions                       |
| `mathPractice.attempts`        | The 5,000 most recent answers, in a compact form   |
| `mathPractice.statistics`      | All-time totals, kept when old answers are trimmed |
| `mathPractice.mistakePatterns` | Mistakes and their mastery progress                |
| `mathPractice.activeSession`   | The session in progress, for refresh recovery      |

When the data format changes, add a migration in
`src/services/schemaMigrations.ts` and raise `CURRENT_SCHEMA_VERSION`.

## Deployment

The app is a static site. `netlify.toml` configures Netlify:

- **Build**: `npm run build`, publishing the `dist` folder, on Node 22.
- **Routing**: every path is served `index.html`, so React Router can show the
  right page after a refresh or when a link is opened directly.
- **Headers**: a strict Content Security Policy and privacy headers for every
  page, and long-term caching for the hashed files in `/assets`.

To deploy, connect the GitHub repository to a new Netlify site; it reads these
settings automatically and redeploys on every push to `main`. Other static
hosts work too, as long as they serve `index.html` for unknown paths.
