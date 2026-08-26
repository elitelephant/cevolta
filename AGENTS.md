# Cevolta

Non-custodial recurring payments on Stellar ([cevolta.xyz](https://cevolta.xyz)). Only the landing page + waitlist exists today. The Soroban contracts (Payment Registry, Smart Wallet integration) are not started. Read `CONTEXT.md` and `docs/adr/` before any protocol design work; if your output contradicts an ADR, say so explicitly instead of silently overriding.

## Layout

- `site/`: the only code, a small Turborepo (`site/package.json` + `site/turbo.json` at its own root, not the repo root) containing one app, `site/apps/web`, a Next.js landing page with an `/api/waitlist` route handler and `/about`, `/contact`, `/privacy` pages. TypeScript + ESLint + Vitest configured (`npm test` from `site/`).
- `CONTEXT.md`: domain glossary. Use its exact terms (Payee, Payer, Plan, Enrollment, Smart Wallet, Policy Signer, Payment Registry, Renewal Trigger); avoid the synonyms each entry lists.
- `docs/adr/`: architecture decisions. `docs/research/`: long-form research notes.

## Agent workflow conventions

### Issue tracker

Issues live as GitHub issues (via the `gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Agent readiness

- `middleware.ts` content-negotiates `Accept: text/markdown` to a rewritten `/api/markdown/[[...slug]]` route, which reads `content/markdown/<slug>.md` (or `index.md` for `/`). If you change a page's copy, update its markdown mirror in `content/markdown/` to match, or the two will drift.
- `public/llms.txt`, `app/sitemap.ts`, and `app/robots.ts` are the other machine-readable surfaces. `app/layout.tsx` emits an Organization JSON-LD block (`lib/structuredData.ts`).

## Site & waitlist

- Run locally: `cd site && npm install && npm run dev` (Turborepo runs `next dev` for `site/apps/web`; the Next.js dev server serves `/api/waitlist` natively, so `vercel dev` is no longer required for this).
- `site/.vercel/` links to the Vercel project `cevolta`. Root Directory on Vercel is set to `site/apps/web`.
- `POST /api/waitlist` appends emails to a single private Vercel Blob object (`waitlist.json`), read-modify-written per request. `GET /api/waitlist` dumps all entries and returns 401 unless the `x-admin-key` header matches `WAITLIST_ADMIN_KEY` (also 401 if unset).
- Env vars live in Vercel, not the repo: `BLOB_READ_WRITE_TOKEN` (required by the API; `vercel env pull` writes `site/apps/web/.env.local`) and `WAITLIST_ADMIN_KEY`. Never commit tokens or `.env*.local`.

## Conventions

- Anything committed to this repo must be in English (including issue bodies and PR text).
