@AGENTS.md

# CLAUDE.md

We're building the app described in @SPEC.md. Read that file for general architectural tasks or to double-check the exact database structure, tech stack or application architecture.

Keep your replies extremely concise and focus on conveying the key information. No unnecessary fluff, no long code snippets.

Whenever working with any third-party library or something similar, you MUST look up the official documentation to ensure that you're working with up-to-date information.
Use the DocsExplorer subagent for efficient documentation lookup.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ Next.js 16 — read before coding

This project uses **Next.js 16.2.4 + React 19.2.4**. Both have breaking changes vs. older training data. Before writing or modifying Next.js / React code, consult `node_modules/next/dist/docs/` for the current API surface (App Router conventions, async params, caching defaults, server actions, etc.). Heed deprecation notices.

## Commands

Run from `bindermvp/` (the actual app — the repo root is just a workspace with shared deps):

```bash
npm run dev      # next dev
npm run build    # next build
npm run start    # next start (after build)
npm run lint     # eslint (flat config in eslint.config.mjs)
```

There is no test runner configured yet.

## Architecture

**Product** (see `SPEC.md` for the full design doc, in French): a card-collection manager where users organize trading cards into customizable virtual **binders** (4/9/12-card pages). Card data is fetched from external game APIs (Pokémon TCG, Scryfall/Magic, Dragon Ball, Star Wars Unlimited) — only binder layout and per-user metadata is persisted.

**Stack**:
- Next.js App Router (full-stack: UI + `app/api/*` routes)
- **Clerk** for auth (`@clerk/nextjs`); `middleware.ts` gates routes
- **Supabase** (Postgres) for storage; RLS policies key off `auth.jwt() ->> 'sub'` (Clerk user ID stored as `TEXT user_id`)
- **TanStack Query** for server-state caching on the client
- Tailwind CSS v4 (via `@tailwindcss/postcss`)

**Data model** (see `SPEC.md` §Modèle de données for SQL):
- `binders` — owns `name, color, page_format (4|9|12), cover_image`
- `binder_cards` — `(binder_id, page_number, slot)` is unique; references an external `card_id` + `game` rather than a local card table
- `user_settings`
- All three tables have RLS enforcing `user_id = auth.jwt() ->> 'sub'`. The Supabase client must forward the Clerk JWT for queries to return rows.

**External card APIs — adapter pattern**: each game API is wrapped in a uniform `CardAdapter` interface (`search`, `getById`, `getImage`, `getSet`, `getName`) returning a normalized `Card` type. Add new games by implementing an adapter under `lib/adapters/` and registering it in `lib/adapters/index.ts` (`getAdapter(game)`). Server-side API routes under `app/api/search/[game]/route.ts` proxy these so API keys (e.g. `POKEMON_TCG_API_KEY`) stay server-side.

**Planned layout** (per `SPEC.md`; current `src/app/` is still the create-next-app skeleton):
- `app/(auth)/{sign-in,sign-up}` — Clerk catch-all routes
- `app/(app)/` — authenticated shell: `dashboard`, `binders`, `binders/[id]`, `search`, `settings`
- `app/api/binders/...`, `app/api/cards/...`, `app/api/search/[game]/...` — RESTful, return `{ data, error }`
- `lib/supabase/{client,server}.ts` — split browser vs. server clients (the server client must inject Clerk's session token)

## Conventions

- TypeScript strict; functional components + hooks only
- Components `PascalCase.tsx`, utilities `camelCase.ts`
- Server-state via React Query; local state via `useState`/`useReducer`
- API routes always return `{ data, error }`
- Generate Supabase types: `npx supabase gen types typescript --project-id <id> > types/database.ts`

## Repo layout note

`F:/React/BinderProject/` (the cwd) holds a thin `package.json` listing Clerk/Supabase/React Query but no scripts. The real Next.js app is in `bindermvp/`. Run all commands from there.
