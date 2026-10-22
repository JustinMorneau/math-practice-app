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

| Tool    | Version                       | Check with      |
| ------- | ----------------------------- | --------------- |
| Node.js | 22.18 or later, or 24.11+     | `node -v`       |
| npm     | 10 or later (comes with Node) | `npm -v`        |
| Git     | Any recent version            | `git --version` |

Install Node.js from [nodejs.org](https://nodejs.org) (choose the **LTS**
version). After installing, close and reopen your terminal so the `node` and
`npm` commands are found.

## Installing

1. Get the code:

   ```bash
   git clone https://github.com/JustinMorneau/math-practice-app.git
   cd math-practice-app
   ```

2. Install the dependencies listed in `package.json` (React, Vite, the test
   tools, and so on). They are downloaded into `node_modules/`, which is not
   committed:

   ```bash
   npm install
   ```

   Some versions of npm ask before running a package's setup script. If npm
   reports that `esbuild` has an install script waiting for approval, allow
   it; Vite needs it:

   ```bash
   npm install-scripts approve esbuild
   ```

## Running locally

Start the development server:

```bash
npm run dev
```

Open the address it prints (usually <http://localhost:5173>). The page
reloads automatically when you save a file. Press `Ctrl+C` in the terminal to
stop the server.

To try the app on a tablet or phone on the same Wi-Fi network:

```bash
npm run dev -- --host
```

Then open the "Network" address it prints on the other device.

Progress is saved in each browser's local storage, separately for every
address, so progress made on `localhost` does not appear on the deployed site.

## Testing

Run the full check before committing or deploying:

```bash
npm test               # all tests, once
npm run lint           # code quality rules
npm run typecheck      # TypeScript errors
npm run format:check   # formatting (fix with npm run format)
```

Use `npm run test:watch` while working; it reruns the affected tests on every
save.

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

## Building for deployment

1. Create the production build:

   ```bash
   npm run build
   ```

   This type-checks the code, then writes an optimized, minified copy of the
   app to `dist/`. Vite prints each file with its size.

2. Try the production build locally before deploying:

   ```bash
   npm run preview
   ```

   Open the address it prints (usually <http://localhost:4173>). Check that
   pages load, that refreshing on a page such as `/statistics` works, and that
   the browser console (F12) shows no errors.

3. Deploy the contents of `dist/`. Because it is a static site, any static
   host works, as long as it serves `index.html` for paths that are not real
   files (so React Router can show the right page after a refresh).

## Deploying to Netlify

`netlify.toml` already configures everything Netlify needs:

- **Build**: runs `npm run build` on Node 22 and publishes `dist`.
- **Routing**: serves `index.html` for every path.
- **Headers**: a strict Content Security Policy and privacy headers for every
  page, and long-term caching for the hashed files in `/assets`.

To set it up once:

1. Push the repository to GitHub.
2. In Netlify, add a new site and import an existing project from GitHub,
   giving Netlify access to only this repository.
3. Keep the build settings it reads from `netlify.toml` and deploy.
4. Optionally, rename the site under its configuration to choose the
   `*.netlify.app` address.

After that, every push to `main` builds and deploys the site automatically.

## Troubleshooting

| Problem                                                      | Fix                                                                                       |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `npm: command not found`                                     | Install Node.js, then close and reopen the terminal.                                      |
| `npm install` warns that esbuild's install script is waiting | Run `npm install-scripts approve esbuild`.                                                |
| An error mentions an unsupported Node.js version             | Install Node.js 22.18 or later (`node -v` shows the current version).                     |
| The dev server says the port is in use                       | Vite picks the next free port; use the address it prints.                                 |
| Refreshing a page on the deployed site shows "Not found"     | The host must serve `index.html` for unknown paths (`netlify.toml` does this on Netlify). |
| Saved progress is missing                                    | Progress is stored per browser and address; it does not move between devices or sites.    |
