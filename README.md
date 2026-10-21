# Personal OS — frontend

A personal command center for documents, job search, communication and knowledge.

```bash
npm install
npm run dev        # http://localhost:3000
```

Demo login: `demo@example.com` / `demo123`

## Backend modes

The service layer runs against one of two backends, chosen at build time (copy `.env.example` to `.env.local`):

| `NEXT_PUBLIC_API_MODE` | Data comes from |
| --- | --- |
| `mock` (default) | In-browser mocks persisted to `localStorage` — no backend needed. |
| `api` | The AWS SAM backend in [`../knot-server`](../knot-server/README.md) at `NEXT_PUBLIC_API_URL`. |

In `api` mode, applications, companies, contacts, referrals, interviews, resumes, documents (real S3
uploads via presigned URLs), projects, tasks, notes, skills, certifications, links, activity,
notifications, settings and the dashboard summary use the API. Auth, email, templates, SMTP and
integrations have no backend yet and stay mocked in both modes.

The API client lives in `src/lib/api/` and the API services in `src/lib/services/api/`.

## Stack

Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui (Base UI) ·
Lucide · React Hook Form + Zod · Recharts · Sonner.

## Architecture

```
src/
  app/            routes — (app)/ is the authenticated shell, login/ is public
  components/     layout/ (shell, top bar, dialogs), navigation/ (sidebar, ⌘K palette), shared/, ui/ (shadcn)
  features/       one folder per module: components + mutation hooks
  lib/
    types/        domain models
    mock/         centralized seed data (dates relative to "now")
    api/          HTTP client for knot-server (envelope unwrapping, errors, presigned uploads)
    analytics/    dashboard aggregation used by the mock dashboard service
    services/     contracts.ts (interfaces) · api/ + mock/ (implementations) · index.ts (swap point)
    store/        shared query cache, session, theme, local preferences
    utils/        dates, formatting, template variables, zod resolver
```

- **Services** — the UI only calls interfaces such as `applicationService.getApplications()`.
  `src/lib/services/index.ts` picks the API or mock implementation of each contract based on
  `NEXT_PUBLIC_API_MODE`; components never call `fetch` directly.
- **Mock backend** — `src/lib/services/mock/db.ts` persists to `localStorage`, adds network latency, and
  records activity. Settings → Security → *Reset demo data* restores the seed.
- **Shared state** — `src/lib/store/query.ts` is a small query cache: every screen reading `applications`
  shares one result, so creating, editing or moving an item updates the dashboard, board, palette and
  detail pages immediately.

Shortcuts: `Ctrl/⌘ + K` opens the command palette and global search · `Ctrl/⌘ + S` saves a note.
