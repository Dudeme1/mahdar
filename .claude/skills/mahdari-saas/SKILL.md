---
name: mahdari-saas
description: "Use this skill whenever the user discusses 'Mahdari', mahdari.com, their voice-powered meeting minutes (MoM) SaaS, or work on its frontend (React/Vite on Vercel), backend (FastAPI/Python on Railway), database (Supabase), or payments (Dodopayments). Triggers include: mentions of Mahdars, MoM reports, attendees/templates/tags pages, the Mahdari sidebar, mahdari.com, or any continuation of building/debugging/extending this specific product. Load this skill before writing code, debugging, or planning features for this project so the existing architecture, conventions, and history are known instead of being re-explained from scratch."
---

# Mahdari — Voice-Powered Meeting Minutes SaaS

## What Mahdari Is

Mahdari (مهضري) is a voice-powered Minutes of Meeting (MoM) generator built for the MENA market (primarily Saudi Arabia and Jordan — consultants, government entities). The core flow:

> Record or type a description of a meeting → Whisper transcribes it → Claude extracts a structured MoM → user reviews/edits each section → export to a Word document using the user's own template.

The product philosophy: **utility first, polish second**. The founder (a non-coder engineer) is learning full-stack development by building this for real, hands-on, understanding every line — not copy-pasting blindly. Treat them as capable and increasingly experienced; they catch their own bugs, push back on bad suggestions, and make real architecture calls. Don't over-explain basics they've already demonstrated they understand, but do explain new concepts when introduced.

## Tech Stack

- **Frontend**: React + Vite, deployed on **Vercel**, domain **mahdari.com** (bought via Squarespace, DNS pointed to Vercel)
- **Backend**: Python + **FastAPI**, deployed on **Railway** (root directory set to `backend`, Procfile/start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`)
- **Database/Auth**: **Supabase** — Postgres + Auth (Google OAuth + email/password) + Storage (private buckets with signed URLs)
- **AI**: OpenAI **Whisper** (transcription) + **Claude** (claude-opus-4-6 in current code — verify model name is current) for structuring the MoM JSON
- **Payments**: **Dodopayments** (Merchant of Record — chosen because Stripe doesn't support Jordan; Dodo supports Jordan as a payout country). Live mode, $15/month "Mahdari Pro" plan.
- **PWA**: vite-plugin-pwa added so users can "Add to Home Screen" on mobile — this replaced the need for a native app or WhatsApp bot for now.

## Repo Structure

```
mahdar/  (GitHub repo name is lowercase, no second "i" — product name is "Mahdari")
  vercel.json          # root config: builds frontend/, rewrites /api and SPA catch-all
  frontend/
    src/
      App.jsx           # React Router routes, top-level auth state (user, token)
      supabase.js        # Supabase client init (anon key)
      config.js          # API_URL from import.meta.env.VITE_API_URL
      components/
        LoginScreen.jsx
        SignupScreen.jsx  (legacy from earlier empty-playground-style flow; Mahdari primarily uses Google OAuth)
        Layout.jsx         # persistent sidebar (New Mahdar, Attendees, Templates, History, Subscription, Sign Out)
        UploadScreen.jsx    # record/upload/type → /transcribe → /generate
        MahdarScreen.jsx    # editable MoM sections + export to Word
        ViewMahdarScreen.jsx # /mahdar/:id — reopen a past Mahdar without the upload UI
        MahdarsHistoryScreen.jsx
        AttendeesScreen.jsx  # full CRUD for saved attendees
        TemplatesScreen.jsx  # full CRUD for saved Word templates (Supabase Storage)
    .env / .env.local     # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL, VITE_APP_URL
  backend/
    main.py              # all FastAPI routes live here (monolithic — has not been split into routers)
    requirements.txt
    .python-version       # pinned to 3.11.3 (Railway defaulted to 3.13 and broke deps)
    .env                  # OPENAI_API_KEY, ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_KEY (service role), DODO_API_KEY, DODO_PRODUCT_ID, DODO_WEBHOOK_SECRET
```

## Supabase Schema

All tables have RLS **enabled** with 4 policies each (SELECT/INSERT/UPDATE/DELETE), all using `auth.uid() = user_id`. The backend uses the **service role key** so it bypasses RLS; RLS exists to protect against direct/public API misuse.

- **users**: `id`, `user_id` (uuid, default `auth.uid()`), `email`, `subscribed` (bool — legacy, superseded by `subscriptions.plan`), `created_at`
- **subscriptions**: `id`, `user_id` (uuid), `plan` (`free`/`pro`), `status` (`active`/`cancelled`/`expired`/`past_due`), `ends_at`, `mahdar_count_this_month`, `last_reset_date`, `created_at`. Limits are hardcoded in Python (`PLAN_LIMITS = {"free": 4, "pro": 250}`), not stored in the DB, so pricing changes don't require migrations.
- **mahdars**: `id`, `user_id`, `title`, `content` (jsonb — the full MoM object), `created_at`. (Renamed from "moms" to stay on-brand.)
- **attendees**: `id`, `user_id`, `name`, `email`, `role`, `aliases` (**array** column — e.g. `["Kev", "كيفن"]`), `created_at`
- **templates**: `id`, `user_id`, `name`, `file_path` (Supabase Storage path, NOT a public URL — bucket is private, signed URLs are generated fresh on each fetch with 1hr expiry), `created_at`
- A **tags** feature was added later (tagging Mahdars and attendees for filtering, and matching attendees against tags to disambiguate similar names/aliases) — schema for this was created by the user independently late in the build; verify current structure before assuming columns.

**Storage bucket**: `templates` (private). Files stored as `{user_id}/{filename}`. RLS storage policies check `auth.uid()::text = (storage.foldername(name))[1]`.

## Backend Routes (main.py)

- `POST /transcribe` — Whisper, takes multipart `file`
- `POST /generate` — takes `{transcript, language, token}`. Flow: verify user → fetch/auto-create subscription row → check `mahdar_count_this_month` against `PLAN_LIMITS[plan]`, return `{"error": "limit_reached", "message": ...}` if exceeded → call Claude (wrapped in a retry helper, `call_claude_with_retry`, since Anthropic occasionally 500s) → parse JSON → add Hijri dates for `date` and `next_meeting` via `hijri-converter` → fetch saved attendees and run them through `match_attendee()` (RapidFuzz `fuzz.WRatio`, threshold 75) to enrich Claude's plain-name attendees with saved email/role — **this matching happens AFTER generation as a separate deterministic step, not inside the Claude prompt**, to keep the prompt cheap/accurate regardless of how many saved attendees a user has → increment `mahdar_count_this_month` → insert into `mahdars` → return mom_data.
- `POST /export` — takes a `template` file (.docx) + all MoM fields as Form data (attendees/action_items sent as JSON strings, parsed server-side) → fills via `docxtpl` → returns the filled `.docx`. RTL Arabic templates need table-loop tags (`{%tr for ... %}` / `{%tr endfor %}`) placed in the *visually reversed* cell order because Word stores RTL table cells in reversed XML order.
- `POST /save-attendee`, `POST /get-attendees`, `POST /update-attendee`, `POST /delete-attendee`
- `POST /upload-template`, `POST /get-templates` (returns fresh signed URLs as `download_url`), `POST /delete-template`
- `POST /get-mahdars`, `POST /get-mahdar` (single, by id)
- `POST /subscribe` — creates a Dodopayments **checkout session** (`dodo.checkout_sessions.create(product_cart=[...], customer={"email":..., "name":...}, return_url=...)`), returns `{"url": session.checkout_url}`. Note: `checkout_sessions`, not `subscriptions.create` — the latter requires more rigid customer object typing and was the source of several 422 errors during build.
- `POST /webhook` — verifies via `dodo.webhooks.unwrap(payload, headers, secret)` (NOT `dodopayments.webhooks` module — that import path doesn't exist in the SDK). On `subscription.active`, looks up user by email and updates `subscriptions.plan = "pro"`, `status = "active"`, `ends_at = now + 1 month`.
- A temporary `/get-token` (email+password → access_token) was added for Postman testing — should be removed/guarded before any wider exposure.

## Hard-Won Gotchas (don't relearn these the slow way)

- **Railway**: root directory must be set explicitly to `backend`; `requirements.txt` must never contain a `pip freeze` taken from outside the venv (a local file path like `/home/.../alabaster...` will break the build — always `pip freeze` *with the venv activated*). Pin Python version via `.python-version` (3.13 default broke things).
- **CORS errors are often a red herring** — a backend crash (e.g. malformed Claude JSON, an exception) can surface in the browser as a CORS error because the server never sent CORS headers on its error response. If CORS suddenly breaks after working fine, check the backend logs first.
- **Dodopayments SDK churn**: `customer` for checkout sessions wants `{"email", "name"}`; `checkout_sessions.create` does not take `payment_link`; response field is `session.checkout_url`, not `.url`. Always re-check `docs.dodopayments.com` against the installed SDK version rather than trusting memorized examples — this API has changed multiple times during this build.
- **Dodopayments Customer Portal** exists and should be used instead of building subscription management (cancel/upgrade/payment-method-update) from scratch: static link is `https://customer.dodopayments.com/login/{business_id}` (test mode: `test.customer.dodopayments.com`). Business ID was `bus_D9dlIAaRH05nt0RMfWze3` at time of writing — confirm current value.
- **RTL Word templates**: cell order in the XML is reversed vs. visual order. Loop tags that work in LTR templates need to be placed in mirrored cells for RTL.
- **Supabase private storage**: never store `get_public_url()` output for a private bucket — store the storage `file_path` and generate a fresh `create_signed_url()` (1hr expiry) on every read.
- **`.maybeSingle()` not `.single()`** when a row may legitimately not exist yet (e.g. checking if a user/subscription row exists) — `.single()` throws a 406 on zero rows.
- **GitHub secret-scanning push protection**: this project hit it twice (once on the empty-playground predecessor, once here) from committing `.env` before `.gitignore` was in place. Fix is `git filter-branch ... --index-filter "git rm --cached --ignore-unmatch path/to/.env"` then `git push --force`. Always create `.gitignore` at the **repo root** before the first commit, not inside a subfolder.
- **PWA install**: `vite-plugin-pwa` + a manifest with 192x192 and 512x512 icons in `frontend/public` is enough to get "Add to Home Screen" on mobile — no native app needed for V1 mobile usage.

## Pricing Model (decided together, with real math)

- Cost per Mahdar ≈ $0.033 (Whisper ~$0.018 + Claude ~$0.014 + storage negligible)
- Fixed costs ≈ $30/month (Railway $5 + Supabase Pro $25)
- Dodopayments fee ≈ 6% + $0.40/transaction (4% base + 1.5% international + 0.5% subscription)
- **Free tier**: 4 Mahdars/month
- **Pro tier**: $15/month (originally calculated as ~$10–12, bumped to $15 to round to ~10 JOD-equivalent), capped at 250 Mahdars/month — the cap is for spam/abuse protection, not cost protection (break-even is in the hundreds of Mahdars per user)

## Product Roadmap — Discussed But Not Yet Built

See the companion document "Mahdari — Future Ideas & Open Threads" for the full, organized list. Highlights to know about even if not asked to build them yet: per-section AI regeneration with a custom prompt, saved custom "alias/context" prompts (e.g. "us" = our consulting team), an "umbrella" multi-service platform vision (email drafts → Outlook, WhatsApp Business API integration set up from the website), and a drag-and-drop UI for mapping `{{variables}}` into uploaded Word templates (current process requires users to hand-type Jinja/docxtpl tags, which was a real pain point even for the founder).

## Working Style With This User

- Build incrementally, one concrete step at a time; let them run/test before giving the next step.
- They like nautical "captain/quartermaster" banter — light, encouraging tone is welcome, not just dry technical answers.
- They actively push back on overly-complex or non-best-practice suggestions (e.g. questioned `ALL` RLS policies, questioned denormalized `mahdar_count` in `users`, separated `subscriptions` into its own table) — take their pushback seriously, it's usually correct, and explain trade-offs rather than just complying or just insisting.
- They've shipped a lot independently between sessions (UI redesign, tags feature, fixing bugs solo) — don't assume you need to re-derive context that they've already moved past; ask what's changed if picking back up after a gap.
