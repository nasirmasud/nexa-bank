# NexaBank Deployment Checklist

This checklist covers environment setup, database, auth, build, and smoke verification for deploying NexaBank.

## 1. Environment Variables

Set these in your deployment platform (e.g. Vercel Project Settings). **Never commit secrets.**

| Variable            | Required     | Notes                                                   |
| ------------------- | ------------ | ------------------------------------------------------- |
| `DATABASE_URL`      | Yes          | Neon/Postgres connection string for app runtime         |
| `DIRECT_URL`        | Yes          | Direct Postgres connection string for Prisma migrations |
| `TEST_DATABASE_URL` | For CI/tests | Separate test database; must not equal `DATABASE_URL`   |
| `AUTH_SECRET`       | Yes          | Strong random secret for NextAuth                       |
| `NEXTAUTH_URL`      | Yes          | Public app URL, e.g. `https://your-domain.example`      |
| `BANK_TIMEZONE`     | Recommended  | Default `Asia/Dhaka`                                    |

## 2. Database (Neon/Postgres)

- [ ] Create production Neon/Postgres database.
- [ ] Create a separate test database/branch for integration tests.
- [ ] Ensure SSL is enabled (`sslmode=require` where appropriate).
- [ ] Keep `TEST_DATABASE_URL` separate from production/dev `DATABASE_URL`.
- [ ] Do not print or log connection strings.

## 3. Prisma / Migrations

Before or during deployment:

```bash
npx prisma generate
npx prisma migrate deploy
```

- [ ] Run `prisma migrate deploy` against production DB (not `migrate dev`).
- [ ] Verify migration status after deploy.
- [ ] Seed only when intentionally needed (`npm run db:seed`); avoid accidental production seed unless desired.

## 4. Auth (NextAuth)

- [ ] Set `AUTH_SECRET` to a strong value.
- [ ] Set `NEXTAUTH_URL` to the canonical production URL.
- [ ] Verify credentials login works for seeded/demo users only in intended environments.
- [ ] Confirm protected routes redirect unauthenticated users; API routes return proper 401/403.

## 5. Build & Runtime

```bash
npm install
npm run build
npm run start
```

- [ ] `npm run build` passes in CI/deploy environment.
- [ ] Node/runtime version compatible with Next.js 16.
- [ ] Required env vars present at build/runtime as needed.

## 6. QA Smoke Checklist

### Auth / RBAC

- [ ] Login as Admin/Staff/Customer.
- [ ] Customer cannot access admin/staff pages or APIs.
- [ ] Unauthenticated API access returns 401; wrong-role API access returns 403.

### Customer

- [ ] Dashboard loads; accounts/transactions visible.
- [ ] Transfer flow validates PIN, balance, limits; success receipt shown.
- [ ] Deposit/withdrawal requests can be created.
- [ ] Transaction detail and PDF receipt download work.
- [ ] Account statement CSV/PDF export works with date range.
- [ ] Loan apply and installment pay flows work.

### Staff

- [ ] Requests queue approve/deny works with proper state updates.
- [ ] Customer lookup and account creation work.
- [ ] Suspicious flag/queue visibility works.
- [ ] Loan review actions work as permitted.

### Admin

- [ ] Analytics/dashboard loads.
- [ ] Customer/account management actions work (freeze/unfreeze/limits as applicable).
- [ ] Suspicious queue resolve works.
- [ ] Audit logs page loads and reflects key actions.
- [ ] Settings update works.

## 7. Final Checks

- [ ] `npx tsc --noEmit --pretty false` passes.
- [ ] `npx eslint` passes.
- [ ] `npx vitest run` passes with `TEST_DATABASE_URL` configured.
- [ ] No secrets/connection strings in logs, commits, or screenshots.
- [ ] `docs/` remains local-only and uncommitted.
