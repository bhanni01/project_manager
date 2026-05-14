# Project Tracker

Web application for the Nepal Government engineering office to track Roads and Bridges infrastructure projects across fiscal years.

## Stack

- **Monorepo**: pnpm workspaces + Turborepo
- **App**: Next.js 15 (App Router, TypeScript)
- **DB**: PostgreSQL + Prisma _(added in Step 2)_
- **Auth**: Auth.js v5 _(added in Step 2)_
- **Hosting**: Vercel + Neon _(planned)_

## Prerequisites

- Node.js 20+ (24 works too)
- pnpm 9 — install via `corepack enable && corepack prepare pnpm@9.15.0 --activate`

## Setup

```sh
pnpm install
cp .env.example .env        # fill in values when DB step lands
pnpm dev                    # starts the Next.js dev server at http://localhost:3000
```

## Workspace scripts

| Command          | Description                          |
| ---------------- | ------------------------------------ |
| `pnpm dev`       | Run all apps in dev mode (Turborepo) |
| `pnpm build`     | Build all packages and apps          |
| `pnpm lint`      | Lint all packages                    |
| `pnpm typecheck` | Type-check all packages              |
| `pnpm test`      | Run all unit tests                   |

## Repository layout

```
apps/
  web/             Next.js app (frontend + server actions)
packages/
  db/              Prisma client + schema (stub)
  calc/            Pure calculation formulas (stub)
  shared/          Zod schemas, formatters, auth scope (stub)
  ui/              Shared UI components (stub)
  config/          Shared tsconfig, eslint, tailwind, prettier
```
