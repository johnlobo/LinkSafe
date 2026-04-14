# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev        # Custom Node server at port 9002 (see Proxy section)
npm run build      # Production build
npm run typecheck  # tsc --noEmit (run manually — build ignores TS errors)
npm run lint       # ESLint (run manually — build ignores lint errors)
npm run genkit:watch  # Hot-reload Genkit AI flows for local testing
```

`typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` are both `true` in `next.config.mjs`. Always run `typecheck` and `lint` manually.

## code-server Proxy

The app runs behind a code-server reverse proxy at `/proxy/9002/`. Code-server strips the `/proxy/9002` prefix before forwarding requests to the Node process.

`server.js` is a custom HTTP server (instead of `next dev`) that **re-adds** the stripped prefix before Next.js processes the request — the same pattern as `codeServerProxyPlugin` in webtile. `next.config.mjs` sets `basePath: '/proxy/9002'` so Next.js generates correct links and asset URLs.

Do not remove `server.js` or `basePath`. Do not replace `npm run dev` with `next dev -p 9002`.

`allowedDevOrigins: ['code-server.digitalpartners.es']` suppresses the cross-origin dev warning.

The `@opentelemetry/exporter-jaeger` webpack alias suppresses a missing-package error from Genkit.

## Architecture

### Pages and routing (`src/app/`)
- `/` → `MainDashboard` — requires auth; redirects to `/login` if unauthenticated
- `/login` → email/password login
- `/register` → account creation

All pages are `'use client'` components. Auth state is managed by `AuthProvider` in `src/hooks/use-auth.tsx`, which wraps the whole app in `layout.tsx`.

### Firebase (`src/lib/firebase.ts`)
Credentials are **hardcoded** — no `.env` file needed. To use your own Firebase project, replace the `firebaseConfig` object in `src/lib/firebase.ts` and the `initializeApp()` call in `src/ai/genkit.ts`.

Firebase services used:
- **Auth**: email/password only (`getAuth`)
- **Firestore**: single `bookmarks` collection (flat, not nested under users)

Firestore data model:
```
bookmarks/{bookmarkId}
  userId: string       # owner's UID
  url: string
  title: string
  description?: string
  tags: string[]
  favicon?: string
  createdAt: string    # ISO date
```

Security rules (`firestore.rules`): any authenticated user can read all bookmarks (for tag autocomplete); only the owner can create/update/delete their own.

### Main dashboard (`src/components/dashboard/main-dashboard.tsx`)
All bookmark CRUD lives here. Uses `onSnapshot` for real-time updates. Tag autocomplete fetches all bookmarks from all users (scoped by Firestore rules). View modes: big cards, small cards, list. Sort: date asc/desc, title asc/desc.

### AI auto-fill (`src/ai/flows/auto-fill-bookmark-details.ts`)
Genkit flow triggered from `AddBookmarkDialog` when a URL is entered. Fetches the page via `allorigins.win` proxy, extracts `<title>` and favicon with regex, returns them to pre-fill the form. Requires `GOOGLE_GENAI_API_KEY` env var (set in `.env.local`). Defined with `'use server'` — runs server-side.

`src/ai/genkit.ts` initializes both Firebase app (required before Genkit) and the Genkit instance with `googleAI()` plugin.

### UI
shadcn/ui components in `src/components/ui/`. Theme toggle via `next-themes`. Toast notifications via `useToast` hook.
