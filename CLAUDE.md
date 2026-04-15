# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install
npm run dev        # Custom Node server at port 9002 (see Proxy section)
npm run build      # Production build
npm run typecheck  # tsc --noEmit (run manually — build ignores TS errors)
npm run lint       # ESLint (run manually — build ignores lint errors)
./release.sh       # Interactive: commit + push + bump patch version + tag
```

`typescript.ignoreBuildErrors` and `eslint.ignoreDuringBuilds` are both `true` in `next.config.mjs`. Always run `typecheck` and `lint` manually.

## code-server Proxy

The app runs behind a code-server reverse proxy at `/proxy/9002/`. Code-server strips the `/proxy/9002` prefix before forwarding requests to the Node process.

`server.js` is a custom HTTP server (instead of `next dev`) that **re-adds** the stripped prefix before Next.js processes the request — the same pattern as `codeServerProxyPlugin` in webtile. `next.config.mjs` sets `basePath` and `skipTrailingSlashRedirect: true` (dev only); production runs at root with no basePath.

Do not remove `server.js`, `basePath`, or `skipTrailingSlashRedirect`. Do not replace `npm run dev` with `next dev -p 9002`.

`NEXT_PUBLIC_APP_BASEPATH` is set to `/proxy/9002` in dev and `''` in production via `next.config.mjs`. Client-side code uses this to prefix API fetch calls (e.g. `/api/autofill`). Server Actions are avoided because they generate double-prefix URLs behind this proxy.

`allowedDevOrigins` suppresses the cross-origin dev warning from code-server.

The `@opentelemetry/exporter-jaeger` webpack alias suppresses a missing-package error from Genkit at build time.

## Architecture

### Pages and routing (`src/app/`)
- `/` → `MainDashboard` — requires auth; redirects to `/login` if unauthenticated
- `/login` → email/password login
- `/register` → account creation
- `/api/autofill` → GET Route Handler that fetches a URL server-side and returns `{ title, favicon }`

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
All bookmark CRUD lives here. Uses `onSnapshot` for real-time updates. Tag autocomplete fetches all bookmarks from all users. View modes: big cards, small cards, list. Sort: date asc/desc, title asc/desc.

### Auto-fill (`src/app/api/autofill/route.ts` + `src/ai/flows/auto-fill-bookmark-details.ts`)
When a URL is entered in `AddBookmarkDialog` and the field loses focus, the client calls `GET /api/autofill?url=...`. The Route Handler fetches the page server-side (no CORS issues), extracts `<title>` and favicon via regex, and returns them. The client uses `NEXT_PUBLIC_APP_BASEPATH` to construct the correct URL. Favicons are displayed with plain `<img>` tags (not `next/image`) to avoid server-side proxy 403 errors.

`src/ai/genkit.ts` initializes the Genkit instance with `googleAI()` — requires `GOOGLE_GENAI_API_KEY` in `.env.local` if AI flows are used.

### Version
`NEXT_PUBLIC_APP_VERSION` is read from `package.json` at build time in `next.config.mjs` and displayed in the sidebar footer. `release.sh` bumps the patch version and creates a git tag after a successful push, triggering the GitHub Actions deploy workflow.

### Production deployment
Docker image built by GitHub Actions on release, pushed to `ghcr.io/johnlobo/linksafe:latest`, deployed via SSH to `/home/ubuntu/docker/linksafe/`. Reverse proxy: Nginx Proxy Manager on the same Docker `proxy-network`, forwarding to container `linksafe:3000`.
