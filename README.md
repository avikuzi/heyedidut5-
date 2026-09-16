# הידידות 5 — ועד בית portal

React + Vite + TypeScript + Tailwind. Sprint 1 adds **Supabase Auth + Postgres** for the cashbox and tenants, without rewriting the existing Hebrew UI.

Live (pre-Sprint-1): https://heyedidut5.vercel.app/

---

## English — local setup

```bash
npm install
cp .env.example .env.local   # then fill in real values, or leave blank for localStorage fallback
npm run dev                  # http://localhost:3000
```

### Without Supabase (fallback)

If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` are empty or still placeholders, the app behaves like today: **localStorage** keys `vaad_heyedidut5_rbac_v5_*`.

- Committee login: password `avi2026` (or `VITE_ADMIN_PASSWORD`)
- Tenant login: register via invite token, e.g. `http://localhost:3000/?token=test-amir-apt3`

The header badge shows `localStorage`.

### With Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **Authentication → Providers**, keep Email enabled. For a course demo, turn **off** “Confirm email” (Authentication → Providers → Email) so `signUp` returns a session immediately.
3. In **Authentication → URL configuration**, set Site URL to your app origin (`http://localhost:3000` and later `https://heyedidut5.vercel.app`).
4. SQL Editor: run in order:
   - `supabase/migrations/20260916120000_init_vaad.sql` (tables, RLS, `build_ai_grounding`)
   - `supabase/seed.sql` (building הידידות 5, 9 properties, 106 ledger rows, demo invites)
5. Copy Project URL + **anon** key into `.env.local`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_ADMIN_EMAIL=avi@heyedidut5.demo
```

Never put the **service role** key in a `VITE_` variable.

6. Create demo Auth users (recommended):

```bash
# .env also needs SUPABASE_SERVICE_ROLE_KEY (Dashboard → Settings → API)
node --env-file=.env scripts/provision-demo-users.mjs
```

This creates:

| Role | Email | Password |
|------|-------|----------|
| Committee / ועד (`admin`) | `avi@heyedidut5.demo` | `Demo2026!` (or `DEMO_PASSWORD`) |
| Tenant apt 3 (debt −540) | `amir.apt3@heyedidut5.demo` | same |
| Tenant apt 7 (settled) | `tzachi.apt7@heyedidut5.demo` | same |

Or create users in the Auth dashboard with User Metadata:

```json
{ "role": "admin", "name": "אבי קוזי (ועד הבית)", "apartment_number": "2" }
```

7. Vercel: add the same `VITE_*` env vars and redeploy.

### Schema notes (balances + AI contract)

- `properties.current_balance` **negative = debt** (same as prod `currentBalance`).
- `transactions.amount` is always **positive**; `type` is `income` | `expense`.
- RLS: committee sees everything; a tenant sees only their property, their income rows, and building notices.
- `select public.build_ai_grounding('2026-09');` returns the v0.2 `AiGroundingContext` JSON (committee-only). Client helper: `buildAiGroundingContext()` in `src/lib/aiGrounding.ts`.
- Sprint 2 can call that SQL from an Edge Function / `POST /api/ai/chat`. **No LLM in this sprint.**

Regenerate seed from in-app data:

```bash
node scripts/generate-seed.mjs
```

---

## עברית — איך מגדירים

1. בלי מפתחות Supabase האפליקציה עובדת כמו היום על localStorage.
2. עם פרויקט Supabase: מריצים את קובץ ה־migration ואז את `seed.sql`, ממלאים `.env.local`, ויוצרים משתמשי דמו (סקריפט או הדשבורד).
3. ועד נכנס עם האימייל ב־`VITE_ADMIN_EMAIL` והסיסמה שמוגדרת ב־Auth. דייר נכנס עם אימייל/סיסמה, ורואה רק את הדירה שלו.
4. יתרה שלילית בנכס = חוב. זה אותו כלל כמו בפרוד וכמו בחוזה ה־AI.

---

## Sprint 2 gaps (AI chat — out of this PR)

- [ ] `POST /api/ai/chat` with server-built grounding (`build_ai_grounding`)
- [ ] Full system prompt + few-shots (contract §5)
- [ ] Eval JSON for U1/U2/U4
- [ ] Committee-only chat UI + “נסח הודעת חוב”
- [ ] Do not expose AI to the tenant portal

Insurance / charter / hazard modules stay local (out of cashbox MVP).

---

## Stack

React 18 · Vite 6 · TypeScript · Tailwind · `@supabase/supabase-js`
