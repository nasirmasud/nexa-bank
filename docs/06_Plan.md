# 06 — Implementation Plan

Phased plan so that **core banking correctness comes before polish**, and a deployable app exists early.
Estimated total: **~14 working days** (solo developer). Adjust to the real deadline ("to be announced").

Legend: 🔴 must-have (required by task) · 🟡 should-have · 🟢 bonus

---

## Phase 0 — Project Setup (Day 1) — **In progress**
- [x] 🔴 `create-next-app` (TypeScript, App Router, Tailwind, ESLint, `src/` dir)
- [x] 🔴 Install: `@reduxjs/toolkit react-redux next-auth@beta prisma @prisma/client zod react-hook-form @hookform/resolvers recharts bcryptjs decimal.js date-fns lucide-react clsx tailwind-merge` *(installed; workspace currently on Next 16/Prisma 6 — verify against deployment target)*
- [ ] 🔴 shadcn/ui init + base components (button, input, card, dialog, table, tabs, badge, dropdown, select, toast/sonner, sheet, skeleton) *(partial: `components.json`, `src/lib/utils.ts`; base components not added yet)*
- [x] 🔴 Prisma + Postgres (Neon) connection; `.env.example` *(Prisma schema/config + `.env.example`/local `.env` created; DB not provisioned/migrated)*
- [ ] 🔴 Prettier/ESLint rules, path alias, Husky (optional), folder structure from TRD §2 *(base folder structure created; Prettier/Husky not configured)*
- [ ] 🔴 GitHub repo (public), first commit, Vercel project linked (deploy empty shell early) *(local git initialized + initial commit done; GitHub/Vercel not linked)*
- [ ] 🔴 Design system foundation: adopt `docs/DESIGN.md` tokens and use `docs/code.html` as visual reference; map into Tailwind/CSS variables and reusable Next.js/shadcn components (no monolithic HTML copy-paste)
- **Done when:** blank app deploys on Vercel and connects to DB.

## Phase 1 — Database & Seed (Day 2) — **In progress**
- [x] 🔴 Implement full Prisma schema (05_schema.md) + migration *(schema implemented in `prisma/schema.prisma`; migration not created/applied yet)*
- [ ] 🔴 Custom SQL migration: CHECK constraints, ledger delete-block trigger
- [x] 🔴 `lib/money.ts`, `lib/errors.ts`, `lib/ids.ts` (reference & account number generators)
- [ ] 🔴 Seed script (users, accounts, settings, SYSTEM account) — transactions seeded later via services
- **Done when:** `prisma migrate dev && prisma db seed` works from scratch.

## Phase 2 — Auth & RBAC (Day 3) — **In progress**
- [x] 🔴 NextAuth Credentials + JWT (id, role, sessionVersion); lockout logic *(skeleton in `src/lib/auth.ts`; end-to-end hardening/tests pending)*
- [x] 🔴 `middleware.ts` route gating by role *(implemented as `src/proxy.ts` for Next 16; verify runtime behavior)*
- [ ] 🔴 `lib/guards.ts` (`requireAuth`, `requireRole`, `assertAccountOwner`, `assertNotSelf`) + `withApi` wrapper + Zod error mapper *(guards implemented in `src/lib/guards.ts`; `withApi` wrapper + Zod error mapper pending)*
- [x] 🔴 Login page with demo credential autofill *(UI autofill present; seeded demo credentials pending)*
- [ ] 🔴 Role-based layouts: Admin / Staff / Customer shells with sidebar + topbar (responsive drawer) *(placeholder dashboards exist)*
- [x] 🔴 Redux store, providers, typed hooks, `auth` + `ui` slices, `baseApi` with error handling & centralized loading middleware *(base store/providers/hooks/slices/baseApi implemented; centralized error/loading middleware pending)*
- **Done when:** 3 roles log in, land on their dashboard, forbidden routes redirect, API returns 401/403 correctly (verified with curl).

## Phase 3 — Core Banking Engine (Days 4–5) ⭐ most important
- [ ] 🔴 `accountService` (create, list, freeze/unfreeze, limits, lookup)
- [ ] 🔴 `transferService` (atomic, row locks, PIN, limits, fee, idempotency, retry on 40001)
- [ ] 🔴 `requestService` (create/cancel/approve/reject; not-self rule)
- [ ] 🔴 `transactionService` (list with filters/pagination, detail, ownership scoping, reversal)
- [ ] 🔴 Notifications created inside same DB tx
- [ ] 🔴 **Vitest integration tests:** success; insufficient funds; frozen; PIN wrong/lockout; limits; forced rollback mid-tx; 20 concurrent transfers keep balance invariant; duplicate idempotency key; self-approval blocked; foreign account → 404
- [ ] 🔴 API routes for accounts, transfers, transactions, requests
- **Done when:** all engine tests are green; ledger invariant query passes.

## Phase 4 — Customer Experience (Days 6–7)
- [ ] 🔴 RTKQ endpoints: accounts, transactions, transfers, requests, notifications, analytics (customer)
- [ ] 🔴 Slices: `account` (activeAccountId), `transaction` (filters/pagination), `notification`
- [ ] 🔴 Customer dashboard (stat cards, account switcher, recent tx, active loan widget)
- [ ] 🔴 Charts: monthly spending, monthly deposits, transaction distribution (real aggregates)
- [ ] 🔴 Accounts list/detail
- [ ] 🔴 Transfer stepper (lookup → review → PIN → result) with Zod + RHF
- [ ] 🔴 Deposit/withdraw request form + list + cancel
- [ ] 🔴 Transactions page (search by ID, type/date filters, pagination) + detail page
- [ ] 🔴 PIN setup in settings
- **Done when:** a customer can complete every banking action end-to-end in the UI.

## Phase 5 — Loans (Day 8)
- [ ] 🔴 `loanService`: apply, notes, forward, approve (disburse tx + schedule), reject, pay installment
- [ ] 🔴 Tests: EMI math, self-approval block, disbursement atomicity, repayment completion
- [ ] 🔴 Loan API routes + `loansApi` RTKQ + `loan` slice (wizard draft)
- [ ] 🔴 Customer: apply wizard with EMI preview, list, detail (schedule, history, remaining balance, pay)
- [ ] 🔴 Staff/Admin loan queues & detail (notes, forward, approve/reject with dialogs)

## Phase 6 — Staff Module (Day 9)
- [ ] 🔴 Register customer (user + profile), KYC verify
- [ ] 🔴 Create customer account (staff)
- [ ] 🔴 Staff dashboard (queues)
- [ ] 🔴 Customers list/detail (read-only financial data)
- [ ] 🔴 Transactions: search/filter/pending review; flag suspicious; process requests
- [ ] 🔴 Verify staff cannot hit admin-only endpoints (negative tests)

## Phase 7 — Admin Module & Analytics (Days 10–11)
- [ ] 🔴 Analytics service + endpoints (summary KPIs, monthly volume, deposit vs withdrawal, account distribution, loan stats, monthly activity)
- [ ] 🔴 Admin dashboard with 7 KPI cards + 5 charts
- [ ] 🔴 Customer management: search, details, activate/deactivate/block (bump `sessionVersion`), tx history
- [ ] 🔴 Account management: create, update, freeze/unfreeze, limits
- [ ] 🔴 Loan management incl. repayment history
- [ ] 🟡 Suspicious queue (review/dismiss/escalate), audit logs page
- [ ] 🟢 Settings page (global limits, fee, min balance)

## Phase 8 — Bonus Features (Day 12)
Priority order (most value / least effort first):
1. [ ] 🟢 PDF receipt (`@react-pdf/renderer`)
2. [ ] 🟢 Statement export CSV + PDF
3. [ ] 🟢 Notification bell + polling + mark read
4. [ ] 🟢 Transaction limits UI (settings + per-account)
5. [ ] 🟢 Dark mode complete pass
6. [ ] 🟢 Rule-based suspicious detection (`fraudService`)
7. [ ] 🟢 2FA (email/TOTP OTP for PIN-sensitive ops) — only if time remains

## Phase 9 — Polish, Responsiveness, Accessibility (Day 13)
- [ ] 🔴 Apply `docs/DESIGN.md` tokens and `docs/code.html` visual patterns consistently across all role shells and feature screens (no monolithic HTML copy-paste)
- [ ] 🔴 Test on 360 / 768 / 1280 widths; tables → cards on mobile; bottom tab bar for customer
- [ ] 🔴 Loading skeletons, empty states, error boundaries, 403/404 pages
- [ ] 🔴 Confirmation dialogs for all financial/destructive actions
- [ ] 🟡 Lighthouse (a11y ≥ 90), keyboard navigation pass, reduced motion
- [ ] 🟡 Security headers, rate limiting, remove console logs
- [ ] 🟡 Seed realistic historical data via services; verify charts look meaningful

## Phase 10 — Documentation, QA & Deployment (Day 14)
- [ ] 🔴 Playwright smoke e2e: login ×3, transfer, request approval, loan lifecycle, RBAC redirect
- [ ] 🔴 Run manual security checklist (below)
- [ ] 🔴 Production deploy (Vercel + Neon), run migrations & seed, verify demo creds
- [ ] 🔴 README.md with all required sections (see §3)
- [ ] 🔴 Record short demo GIFs/screenshots in README; final repo cleanup

---

## 1. Dependency Order (critical path)
```
Setup → DB/Schema → Auth/RBAC → Banking Engine → Customer UI → Loans → Staff → Admin/Analytics → Bonus → Polish → Docs/Deploy
```
Parallelizable once Phase 3 is done: Customer UI, Staff UI, Admin analytics.

## 2. Definition of Done (per feature)
1. Zod schema shared by client + server
2. Server-side role + ownership check
3. Service logic covered by at least one test (financial paths: ≥ 3)
4. RTK Query endpoint with correct tags
5. Loading, empty, and error states in the UI
6. Responsive at mobile / tablet / desktop
7. Light + dark theme verified

## 3. README Outline (required by submission)
1. Project Overview · 2. Live link & screenshots · 3. Features · 4. Roles & Permissions table · 5. Tech stack & extra libraries · 6. Redux Toolkit Architecture (store diagram, slices) · 7. RTK Query implementation (tags/invalidation table) · 8. Authentication Strategy · 9. Transaction Processing Logic (atomic transfer steps) · 10. Database Structure (ERD) · 11. Security Implementation · 12. Environment Variables · 13. Local Setup · 14. Deployment · 15. Demo Credentials · 16. Testing · 17. Known limitations / future work.

## 4. Pre-submission Security Checklist
- [ ] Customer calling `/api/admin/*` → 403; staff calling admin-only mutations → 403
- [ ] Customer requesting another user's account/transaction/loan → 404
- [ ] Sending `balance` or `fee` in a request body has no effect (strict Zod rejects)
- [ ] Transfer > balance → rejected; balance unchanged
- [ ] Double-click / replayed request → single debit
- [ ] Forced error mid-transfer → both balances unchanged
- [ ] Staff cannot approve own request; admin cannot approve own loan
- [ ] Blocked user's existing session stops working immediately
- [ ] Frozen account cannot send or receive
- [ ] No password/PIN hashes in any API response
- [ ] `.env` not committed; secrets only in Vercel env

## 5. Risk Register
| Risk | Impact | Mitigation |
|---|---|---|
| Serverless + Prisma interactive transactions timeouts / pooling issues | Failed transfers on Vercel | Use Neon pooled `DATABASE_URL` + `DIRECT_URL`; keep tx short; `maxWait/timeout` tuned; test on prod early (Phase 0 deploy) |
| Concurrency bugs in balance logic | Fatal for evaluation | Row locks + Serializable + tests with parallel calls |
| Scope too large | Unfinished features | Strict phase order; bonuses only after Phase 7 complete |
| PDF generation in serverless | Build/runtime errors | Use `@react-pdf/renderer` in Node runtime route (`export const runtime='nodejs'`); fall back to `pdfkit` |
| Seed data inconsistent | Wrong charts / invariants | Seed through the same services; run invariant check |
| Time overrun on UI polish | Weak UX score | Reuse shared `DataTable`, `StatCard`, `StatusBadge`, `ChartCard` from day 3 |

## 6. Suggested Git Workflow
`main` (deployable) ← feature branches `feat/auth`, `feat/transfer-engine`, `feat/loans`, … ; conventional commits (`feat:`, `fix:`, `test:`, `docs:`); PR-style squash merges to keep history clean for evaluators.
