# NexaBank — Active Plan: Dashboard Redesign (Admin pilot) + GlassFold Accents

> **Status:** Approved. Phase 0-1 authorized to run continuously (one commit per file). Run lint/typecheck/build at end of each phase. **STOP after Phase 2** and report; user reviews admin in browser before Phase 3.

## Global rules

- No work without explicit permission. Never work on more than one phase at a time (Phase 0 and Phase 1 authorized continuously per user permission; stop after Phase 2).
- Separate commit for each file changed.
- Before making changes, show full plan/todo for that step. Do not edit/run until previous step completed, tested, committed.
- Keep CI green: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
- Do not go up in directory structure.
- No banking/auth/dashboard data logic/API contract changes. RTK Query calls and functionality stay as-is.
- No CTA/landing work except required hero wrapper reuse refactor. No Mosaic, no new shader dependency.
- No `occurredAt` exposure in API routes/Zod schemas.
- Do not claim visual verification if cannot log in; report blocked and let user review in browser with seeded data.

## Locked decisions / clarifications

- **GlassFold banner:** `color1=#0E7C66`, `color2=#06120F`, `color3=#2FBF9F`, speed `~0.25`, bottom fade to page bg via gradient mask. **No** sidebar brand frame; no `admin/layout.tsx` or DashboardShell slot for it.
- **Single shared GlassFold wrapper** reused by landing hero and admin dashboard (no two wrappers).
- **PIN:** Demo customer PIN `123456` **SHOULD be shown** in demo credentials panel of login page and landing page (public demo value, approved P2.3). Keep one shared source for it. Remove any “no PIN exposure in UI” behavior for this demo PIN display.
- **No fake data:** Total Bank Balance sparkline must be built from real data already returned by API (e.g. monthly volume series). Any KPI delta/trend must be computed from real month-over-month values; if data cannot support it honestly, omit it. 3M/6M/12M selector slices data client-side; label honestly where a chart cannot be sliced.
- **Shared shell affects staff/customer:** keep backward compatible and list in report exactly which props/behaviors changed so user can smoke-test staff/customer in browser.
- **Seeds:** Do not run any seed against a production database. After Phase 0.4, report exact command to apply demo PIN to existing DB without wiping data.

## Phase 0 — Cleanup (first)

- [ ] **0.1** Delete `prisma/seed-history.ts` (redundant with `seed-demo.ts`). Commit: `chore: remove redundant seed history script`
- [ ] **0.2** Remove `"db:seed:history"` from `package.json`; keep `seed:demo`. Commit: `chore: remove seed history npm script`
- [ ] **0.3** `src/lib/demo-credentials.ts`: add one consistent demo PIN source (`DEMO_PIN = "123456"` / shared export). Expose PIN in login and landing demo credential panels (public demo value). Commit: `feat: add shared demo pin constant`
- [ ] **0.4** `prisma/seed.ts`: use shared demo PIN source for customer1 (set `pinHash` via bcrypt; keep existing behavior otherwise). Commit: `chore: use shared demo pin in base seed`. **After commit, report exact command to apply demo PIN to existing DB without wiping data; do not run.**
- [ ] **0.5** `prisma/seed-demo.ts`: replace local `DEMO_PIN` with shared demo PIN source. Commit: `chore: use shared demo pin in demo seed`
- [ ] **Phase 0 verify:** `npm run lint`, `npm run typecheck`, `npm run build`

## Phase 1 — Shared dashboard design system/components

Styling source: landing tokens + `docs/design/home/DESIGN.md`. Manrope headings/big numbers, Inter body, JetBrains Mono IDs/account numbers, tabular numerals, `#0E7C66` emerald, `#1F3A5F` navy, `1px #E4E7EC` borders, radii cards 12px/buttons+inputs 8px/badges 4px, soft shadows only on overlays. Full dark mode. Backward-compatible defaults where already used.

- [ ] **1.1** `src/components/shared/dashboard-nav.ts`: extend nav model for grouped sections. Admin groups: Overview (Dashboard), Banking (Customers, Accounts, Requests, Transactions, Loans), Risk (Suspicious), System (Staff, Settings, Audit Logs). Keep staff/customer compatible. Commit: `feat: add grouped dashboard navigation model`
- [ ] **1.2** `src/components/shared/dashboard-shell.tsx`: redesign shell — navy sidebar logo mark+name, grouped nav, active left emerald bar+tinted bg, user card bottom, collapsible icon rail on tablet, drawer on mobile. Top bar: breadcrumb, global search UI, theme toggle, notification bell, avatar menu. Preserve skip link/a11y/sign-out/notifications. Backward-compatible for staff/customer. Commit: `feat: redesign shared dashboard shell`
- [ ] **1.3** `src/components/shared/stat-card.tsx`: KPI redesign — icon chip, label, Manrope tabular value, optional delta/subtext, optional full-value tooltip, equal heights, no clipping; compact `৳` formatting support. Default-safe; featured variant support for Phase 3 (no shader yet). Commit: `feat: redesign shared stat card`
- [ ] **1.4** `src/components/shared/status-badge.tsx`: align with DESIGN.md badge tokens (4px radius, semantic tinted backgrounds, AA contrast, dark mode). Commit: `feat: align status badge with design tokens`
- [ ] **1.5** `src/components/shared/chart-card.tsx` *(new)*: title, one-line description, legend/range slot, consistent height, subtle gridlines, empty/loading, `rounded-[12px]` border card. Commit: `feat: add shared chart card component`
- [ ] **1.6** `src/components/shared/data-table.tsx` *(new)*: responsive desktop table/mobile stacked cards, right-aligned numeric/৳, mono IDs, no horizontal page scroll, keyboard/focus styles. Commit: `feat: add shared responsive data table component`
- [ ] **1.7** `src/components/shared/empty-state.tsx` *(new)*: clean “No data yet” with optional icon/description/action, dark mode. Commit: `feat: add shared empty state component`
- [ ] **1.8** `src/components/shared/page-header.tsx` *(new)*: Manrope title, subtitle, breadcrumb slot, 3M/6M/12M selector, primary action slot. Date range emits value; client-side slicing only where honest. Commit: `feat: add shared dashboard page header`
- [ ] **Phase 1 verify:** `npm run lint`, `npm run typecheck`, `npm run build`. Report shell prop/behavior changes for staff/customer smoke test.

## Phase 2 — Admin dashboard redesign (pilot) — STOP AFTER THIS PHASE

Functionality/RTK Query/data logic unchanged. Reuse existing endpoints only.

- [ ] **2.1** `src/app/admin/dashboard/page.tsx`: full redesign.
  - **Header:** Manrope title/subtitle, breadcrumb, 3M/6M/12M selector, primary action.
  - **KPIs (all 7 mandatory):** Row 1 featured Total Bank Balance (wide, large number, small sparkline from real monthly volume data) + Total Deposits + Total Withdrawals. Row 2 Total Customers, Total Accounts, Total Transactions, Pending Loan Applications. Icon chips, tabular Manrope values, optional delta/subtext only if real MoM data supports it; omit otherwise. Compact `৳` when narrow + full value tooltip; `৳` everywhere, never `BDT` in UI. Secondary KPIs (Active Loans, Open Flags, Pending Requests) as compact stat chips/thin row.
  - **Charts:** ChartCard with title/description/legend/range; consistent height; subtle gridlines; brand palette; donut with center total + legend list counts/%; Loan Approval Statistics clear stacked/horizontal bar by status; Monthly Banking Activity multi-series area/line. No clipped shapes; clean “No data yet”. 3M/6M/12M client-side slice where honest; label if not sliceable.
  - **Work panels:** Suspicious queue (open flags, Review -> `/admin/suspicious`), Pending loan applications (applicant, amount, status badge, Review -> `/admin/loans`), Recent transactions table (mono ID, type, right-aligned ৳ amount, StatusBadge, “View all” -> `/admin/transactions`). Existing RTK Query endpoints only.
  - **States/a11y/responsive:** loading skeletons every card/chart/panel; error states; keyboard focus; WCAG AA light/dark. Responsive 1280/768/375; grids collapse cleanly; tables stacked cards on mobile; no horizontal page scroll.
  - Commit: `feat: redesign admin dashboard page`
- [ ] **Phase 2 verify:** `npm run lint`, `npm run typecheck`, `npm run build`. **STOP and report.** Do not start Phase 3 until user reviews in browser.

## Phase 3 — GlassFold accents (last, after user approval)

- [ ] **3.1** `src/components/ui/glass-fold.tsx`: robust guard — WebGL unavailable or shader/context/compile failure => static CSS gradient fallback (no blank area), call `onError`. Keep `aria-hidden`, IntersectionObserver off-screen freeze, reduced-motion handling. Commit: `feat: add robust fallback guard to glass fold`
- [ ] **3.2** `src/components/shared/glass-fold-accent.tsx` *(new, single shared wrapper)*: `"use client"`, `next/dynamic({ ssr:false })`. Handles WebGL check, static fallback, mobile static fallback (no animation on mobile), reduced-motion fallback, `aria-hidden` decorative container. Reused by landing hero and admin dashboard. Commit: `feat: add shared glass fold accent wrapper`
- [ ] **3.3** `src/components/features/landing/hero-background.tsx`: refactor to reuse shared `GlassFoldAccent` wrapper (remove duplicate dynamic/webgl logic), preserve visual behavior/fallback. Commit: `refactor: reuse shared glass fold accent in hero`
- [ ] **3.4** `src/app/admin/dashboard/page.tsx`: add accents on top of redesigned dashboard. (1) Slim header banner ~160–200px behind page header, `color1 #0E7C66, color2 #06120F, color3 #2FBF9F`, speed `~0.25`, bottom fade to page background via gradient mask, dark overlay for AA text. (2) Featured “Total Bank Balance” KPI card background only, dark overlay + white/high-contrast text. Max 2 animated instances visible; mobile/reduced-motion/WebGL-fail => static fallback; off-screen freeze. All other KPI cards/charts/tables/panels remain flat. Commit: `feat: add glass fold accents to admin dashboard`
- [ ] **Phase 3 verify:** `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`. Sanity grep: `occurredAt` absent from `src/app/api/**` and `src/lib/validators/**`.

## Verification checklist (per phase/end)

- `npm run lint`
- `npm run typecheck`
- `npm run test` (report env DB/auth failures separately if recurring)
- `npm run build`
- `occurredAt` absent from `src/app/api/**` and `src/lib/validators/**`
- Screenshots only if DB/auth available; otherwise clearly blocked

---

## Archived — Landing page plan (completed)

<details>
<summary>Previous completed landing plan (Phases 0-7)</summary>

The previous landing page implementation plan (Phases 0-7) was completed and is preserved below for history. See git history for commit-level detail.

- P0 decisions, P1 theme/tokens/fonts, P2 landing route/sections/login prefill, P3 theme toggle/mobile drawer/stepper+FAQ+demo copy, P4 GlassFold hero, P5 MeshGradient footer, P6 content/responsive/a11y, P7 README/Playwright/final CI — completed.
- Real seeded demo credentials: `admin@nexabank.com`, `staff1@nexabank.com`, `customer1@nexabank.com`, password `Password@123`. Demo PIN `123456` is now a shared public demo value and should be displayed in demo credential panels.

</details>
