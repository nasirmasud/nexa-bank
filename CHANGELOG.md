# Changelog

All notable NexaBank project changes are documented here.

## [Unreleased / Delivered]

### Phase 0–2 — Foundation

- Scaffolded Next.js App Router project with TypeScript, Tailwind, shadcn/ui, Redux Toolkit/RTK Query.
- Added Prisma/Neon schema, migrations, seed, and DB configuration.
- Implemented NextAuth credentials auth, RBAC, protected route shells, and API guard/proxy behavior.

### Phase 3 — Core Banking Engine

- Added account/transfer/request/transaction services, validators, idempotency, serializable transaction handling, and notifications in transactions.
- Added core banking API routes and integration tests.

### Phase 4 — Customer Experience

- Built customer dashboard/accounts/transfers/requests/transactions/notifications/profile/settings flows.
- Added ownership-scoped notification/profile integration coverage.

### Phase 5 — Staff & Loan Flows

- Built staff dashboard/request/customer/account/transaction management.
- Implemented loan backend, RTK Query APIs, and staff/admin/customer loan UI, including apply and installment payment flows.

### Phase 6–7 — Admin & Controls

- Added KYC verify, suspicious flag creation, admin-only negative tests.
- Added admin analytics, customer/account management, suspicious queue resolve, audit logs, settings, and audit-log instrumentation.

### Phase 8 — Exports

- Added PDF transaction receipts.
- Added account statement CSV/PDF exports with auth/ownership checks and tests.

### Phase 9 — Polish

- Responsive layout polish for dashboard shell and key filter/table areas.
- Form/dialog accessibility improvements (labels/ids, error announcements, accessible filter names).
- Table/list readability improvements on key pages.

### Phase 10 — Docs, QA, CI

- Replaced default README with NexaBank setup/deploy/testing guidance.
- Added `DEPLOYMENT.md` and `QA.md` checklists (no secrets).
- Added GitHub Actions CI workflow for lint, typecheck, tests, and build.
- Added repo hygiene and release documentation.
