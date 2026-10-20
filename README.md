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

## Project structure

```text
src/
├── app/          # App root, routes, and context provider
├── components/   # Reusable UI (layout, practice, statistics, common)
├── pages/        # One component per route
├── services/     # Question generation, statistics, storage
├── hooks/        # Custom React hooks
├── types/        # Shared TypeScript domain types
├── utils/        # Small pure helpers (math, shuffle, ids, validation)
└── test/         # Test setup
```

Empty folders contain a `.gitkeep` placeholder until they receive real files.
