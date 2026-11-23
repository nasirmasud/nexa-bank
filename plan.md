# NexaBank Public Home Page — Implementation Plan

Source design files: `docs/design/home/code-light.html` (primary), `code-dark.html` (dark reference), `code-mobile.html` (mobile reference), `DESIGN.md` (tokens), `ShaderShowcase.txt` (hero background), `glassFold.txt` (footer background). `Glass_-_Dashboard.txt` is identical to `glassFold.txt` — ignore.

## Rules / constraints

- Do not perform work without explicit permission. Never work on more than one phase at a time.
- Separate commit for each file changed.
- Before making any changes, show the full plan/todo for that step. Do not edit files or run commands until the previous step is completed, tested, and committed.
- Keep CI green: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
- Do not touch dashboard pages or banking logic.
- No external image URLs / hotlinked assets; replace with local SVG/CSS/lucide-react.
- `docs/` is local-only/gitignored; do not commit design reference files.

## P0 decisions (approved)

1. **Credentials**: Do **NOT** use docs values. Use real seeded demo credentials from `prisma/seed.ts` / current login. Create one shared constants file used by landing page, `/login?role=` prefill, and README so they never drift. Read values from `prisma/seed.ts`; do not guess. User will update docs later.
2. **Scope**: Approved file scope — `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/components/shared/providers.tsx`, `src/app/login/page.tsx` (role prefill only + shared constants), new `src/components/features/landing/*`, new `src/components/ui/glass-fold.tsx`, `package.json`, `package-lock.json`, `README.md`, Playwright config/script as needed. No dashboard/banking logic changes.
3. **Playwright**: devDependency + config + one npm script. Screenshots go to a gitignored folder (e.g. `screenshots/`), not committed.
4. **README**: update in P7.1.
5. **Theme**: `defaultTheme="light"`, `enableSystem` on (customer settings already offers system). Do not break existing `next-themes` consumers (`sonner`, customer settings).

## Plan adjustments (approved)

- Split P2.2 into **P2.2a** (header, top bar, hero, stats, roles/experience, admin preview) and **P2.2b** (all remaining sections). **Pause after P2.2a for user review.**
- Write corrected content from the start (no SOC2/FDIC/uptime/"International, Inc." claims, 5 real transaction types, "Sample data" labels). P6.1 remains an audit pass.
- Shaders: apply lazy-load, reduced-motion, off-screen pause, and static-fallback rules to **footer GlassFold as well**, not only hero.

## Real seeded demo credentials (from `prisma/seed.ts`)

- Password for all seeded users: `Password@123` (`DEMO_PASSWORD`).
- Admin: `admin@nexabank.com`
- Staff (canonical for demo/login prefill): `staff1@nexabank.com` (seed also has `staff2@nexabank.com`)
- Customer (canonical demo): `customer1@nexabank.com`
- No transaction PIN found in seed; if UI displays PIN, only show it if backed by real seed/data source.

## Findings

- Next.js 16.4.6 App Router, React 19, TS, Tailwind v4 CSS-first (`src/app/globals.css`, `@theme inline`), no `tailwind.config.*`. `next.config.ts` has `cacheComponents: true`.
- `next-themes` and `lucide-react` installed; `ThemeProvider` not mounted in `src/components/shared/providers.tsx`; `src/app/layout.tsx` lacks `suppressHydrationWarning`.
- Current `/` redirects logged-in users to role dashboard, unauthenticated to `/login`.
- Login has hardcoded demo buttons and no `?role=` prefill.
- Shared dashboard uses `rounded-full` in `status-badge`, `dashboard-shell`, customer notifications, login — do not break global radii.
- No Playwright config.

## Phased todo

### Phase 0 — Preflight / decisions
- [x] P0.1 Confirm scope boundaries and credential source.
- [x] P0.2 Record decisions/adjustments in `plan.md`.

### Phase 1 — Design tokens, fonts, theme foundation
- [ ] **P1.1 Add/confirm theme provider wiring** *(current step)*
  - Files: `src/components/shared/providers.tsx`, `src/app/layout.tsx`.
  - Add `next-themes` `ThemeProvider` with `attribute="class"`, `defaultTheme="light"`, `enableSystem`, sensible transition behavior. Add `suppressHydrationWarning` to `<html>`.
  - Preserve SessionProvider/Redux/Toaster behavior. Do not break `sonner` or customer settings theme consumers.
  - Verify: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.
  - Commits: one per file changed.

- [ ] **P1.2 Port landing/design tokens into Tailwind v4 CSS variables**
  - Files: `src/app/globals.css` (only add files if necessary).
  - Port DESIGN.md/code-light palette, semantic accents, spacing/type roles via CSS variables / `@theme inline` aliases without breaking existing dashboard tokens.
  - Do **not** remap global Tailwind radii to HTML’s broken config. Keep app radius behavior; landing uses explicit classes/tokens: cards/dialogs 12px, buttons/inputs 8px, badges/checkbox 4px, real pills/avatars only where intended.
  - Add dark-mode variables covering every landing section; use `code-dark.html` for sections it contains.
  - Add base utilities/primitives for tabular nums, subtle grid/dot background, container/max-width/gutters, smooth scroll, sticky-header scroll offset, reduced-motion fallbacks.
  - Verify: lint/typecheck/test/build; smoke-check dashboard token compatibility.

- [ ] **P1.3 Font/metadata sanity check**
  - Files: `src/app/layout.tsx` only if needed.
  - Confirm Manrope/Inter/JetBrains Mono variables available globally; landing can use `font-heading`, `font-sans`, `font-mono`.
  - Verify: lint/typecheck/test/build.

### Phase 2 — Landing page skeleton, routing, and auth behavior
- [ ] **P2.1 Replace root route with server-side landing entry**
  - Files: `src/app/page.tsx`.
  - Keep `await connection()` / server session check via `auth()`. Logged-in known role -> redirect to role dashboard. Unauthenticated -> render landing page (server component composed of landing sections).
  - Preserve `instant = false` / cache-components compatibility.
  - Verify: logged-in redirect works; unauthenticated `/` renders landing; lint/typecheck/test/build.

- [ ] **P2.2a Landing skeleton — first slice (PAUSE FOR REVIEW AFTER)**
  - Files: `src/components/features/landing/*` for header/top bar, hero, stats, roles/experience, admin preview; shared landing primitives as needed; `src/app/page.tsx` wiring as needed.
  - Follow `code-light.html` order/content for these sections. Correct content from start: no SOC2/FDIC/uptime/"NexaBank International, Inc." claims; top bar = “Simulated banking platform. No real money involved.” + demo-credentials link; 5 real transaction types = Deposit, Withdrawal, Transfer, Loan Disbursement, Loan Repayment; “Sample data” labels near mockups; no uptime/ledger-health percentage claims.
  - Anchors/smooth scroll/sticky offset where relevant. Local SVG/CSS/logo; Material Symbols -> lucide-react; no external image URLs.
  - Server components by default; isolate client islands.
  - **Pause after P2.2a for user review before P2.2b.**
  - Verify: lint/typecheck/test/build; visual check.

- [ ] **P2.2b Landing skeleton — remaining sections**
  - Files: remaining `src/components/features/landing/*` sections per `code-light.html` (features, how-it-works/transfer journey, staff/admin/roles detail as present, security, transfer pipeline, analytics/receipts/notifications/device showcase, demo credentials, FAQ, CTA, footer content structure; excluding shader internals handled in P4/P5).
  - Same content/accessibility/correctness rules. Anchors `#features`, `#security`, `#how-it-works`, `#roles`, `#faq`, `#demo-credentials`.
  - Verify: lint/typecheck/test/build.

- [ ] **P2.3 Login role-prefill and demo-entry links**
  - Files: `src/app/login/page.tsx`, shared demo credentials constants file (e.g. `src/lib/demo-credentials.ts` or agreed location), landing components using demo links.
  - Support `?role=customer|staff|admin` prefill using real seeded creds from shared constants. Keep existing login flow and `callbackUrl` behavior intact; no banking/auth logic changes.
  - “Enter as Customer/Staff/Admin” and “Login as …” -> `/login?role=...`; “Explore Demo” scrolls to `#demo-credentials`.
  - Verify: lint/typecheck/test/build; role prefill works.

### Phase 3 — Interactive client islands (accessible, isolated)
- [ ] **P3.1 Theme toggle component**
  - Files: `src/components/features/landing/theme-toggle.tsx` (client), header/footer integration.
  - `next-themes` with mounted guard; keyboard accessible; `aria-label`; persists. No breakage to sonner/customer settings.
  - Verify: lint/typecheck/test/build.

- [ ] **P3.2 Mobile drawer nav**
  - Files: landing header/mobile drawer client component(s).
  - Follow `code-mobile.html` intent; keyboard accessible (focus trap/escape/close on navigate), visible focus, `aria-label`s, skip link.
  - Verify: lint/typecheck/test/build.

- [ ] **P3.3 Transfer stepper, FAQ accordion, credential copy/show-hide**
  - Files: small client components under landing feature dir.
  - Accessible keyboard behavior and ARIA semantics. Credential panel uses shared constants; copy/show-hide accessible; handle clipboard errors.
  - Verify: lint/typecheck/test/build.

### Phase 4 — Hero shader background (MeshGradient only)
- [ ] **P4.1 Add shader dependency and hero wrapper**
  - Files: `package.json`, `package-lock.json`, `src/components/features/landing/hero-shader.tsx` (client), hero integration.
  - Add `@paper-design/shaders-react`. Use only MeshGradient idea from `ShaderShowcase.txt`; drop PulsingBorder, rotating text, demo/pricing copy, random particle logo, cyan/orange.
  - Recolor: base `#06120F`, emerald `#0E7C66`, navy `#1F3A5F`, light emerald `#2FBF9F`. No cyan/orange.
  - `next/dynamic(..., { ssr: false })` in small client wrapper; static CSS gradient first and WebGL fallback.
  - `prefers-reduced-motion` => speed 0/static; pause when off-screen (`IntersectionObserver`); skip second wireframe layer on mobile.
  - Dark gradient overlay for WCAG AA text contrast. No `Math.random` in render. `aria-hidden` on decorative canvas.
  - Verify: lint/typecheck/test/build; no hydration warnings.

### Phase 5 — Footer GlassFold background
- [ ] **P5.1 Add GlassFold component and footer integration**
  - Files: `src/components/ui/glass-fold.tsx`, footer landing component(s).
  - Keep GradFlow attribution comment from `glassFold.txt`. Recolor: `color1 #0E7C66`, `color2 #06120F`, `color3 #2FBF9F`, `speed ~0.4`, `noise ~0.08`.
  - Footer content above with overlay for contrast: 4 columns, disclaimer, GitHub/LinkedIn, theme toggle. Real links only where they exist; no fabricated governance/whitepaper/disclosure links unless real page exists.
  - Footer text: `© 2026 NexaBank. Simulated banking system, not a real financial institution.`
  - **Same shader rules as hero**: lazy-load, reduced-motion, off-screen pause, static fallback. `aria-hidden` on canvas.
  - Verify: lint/typecheck/test/build.

### Phase 6 — Content corrections, responsiveness, and polish
- [ ] **P6.1 Content audit/corrections pass**
  - Files: affected landing components/constants.
  - Audit for fabricated claims: SOC2 Type II, FDIC, Equal Housing Lender, NexaBank International Inc., Operational 99.99%, executive briefing, Security Whitepaper, Open Source Disclosure (unless real page exists). Ensure top bar/disclaimer/footer text exact as required.
  - Confirm 5 transaction types: Deposit, Withdrawal, Transfer, Loan Disbursement, Loan Repayment. “Sample data” labels near mockups; no uptime/ledger-health percentage claims.
  - Verify: lint/typecheck/test/build.

- [ ] **P6.2 Responsive/a11y/visual QA pass**
  - Files: landing components/CSS as needed.
  - Responsive 375/768/1280 per `code-mobile.html`; no horizontal scroll; sticky header offset; visible focus; skip link; icon button labels; keyboard support for stepper/accordion/drawer/copy/show-hide.
  - Dark mode covers all sections, validated against `code-dark.html` where applicable.
  - Verify: lint/typecheck/test/build.

### Phase 7 — Dependencies/docs, Playwright screenshots, final CI
- [ ] **P7.1 Package/README updates**
  - Files: `package.json`, `package-lock.json`, `README.md`.
  - Add required deps (`@paper-design/shaders-react`; `framer-motion` only if actually kept — plan to avoid). Document new libraries in README Tech Stack/libraries section. README demo credentials must use shared constants/real seeded values.
  - Verify: lint/typecheck/test/build.

- [ ] **P7.2 Playwright screenshot capture**
  - Files: `package.json`, `package-lock.json`, Playwright config, npm script, `.gitignore` (for `screenshots/`), any test/spec file needed.
  - DevDependency + config + one npm script. Screenshots to gitignored `screenshots/` (not committed).
  - Capture light+dark at 375/768/1280 after build/local run. Show results.
  - Verify: lint/typecheck/test/build; screenshot command succeeds.

- [ ] **P7.3 Final verification report**
  - Run `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` (+ Playwright screenshot command).
  - Report results, files changed, commits, risks/follow-ups.

## Risks / watchlist

- **Credential drift**: mitigated by shared constants file read/derived from `prisma/seed.ts` values.
- **Token/radius collision**: extend tokens carefully; no global radius remap; landing-only explicit radii.
- **next-themes mount/hydration**: use `suppressHydrationWarning` and mounted guards where needed.
- **cacheComponents**: keep server `connection()`/auth patterns compatible.
- **Shader performance/a11y**: lazy-load, reduced-motion, off-screen pause, static fallback, aria-hidden, AA contrast overlay.
- **No dashboard/banking logic changes**: any shared-file touch must be minimal and verified.
