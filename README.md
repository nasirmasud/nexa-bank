# NexaBank

NexaBank is a role-based banking web application built with Next.js (App Router), Prisma, Neon/Postgres, NextAuth, Redux Toolkit/RTK Query, Tailwind, and shadcn/ui.

## Roles

- **ADMIN**: analytics, customer/account management, requests, loans, suspicious activity, audit logs, settings.
- **STAFF**: dashboard, request review, customer/account support, transactions, suspicious flags, loans.
- **CUSTOMER**: accounts, transfers, requests, transactions, loans, notifications, profile/settings.

## Tech Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Data**: Prisma ORM, Neon/Postgres
- **Auth**: NextAuth (credentials)
- **State/API**: Redux Toolkit, RTK Query
- **UI**: Tailwind CSS, shadcn/ui, Lucide icons, Recharts, `@paper-design/shaders-react` (landing page shader backgrounds)
- **PDF/Export**: `@react-pdf/renderer`, CSV export
- **Testing**: Vitest, Testing Library

## Prerequisites

- Node.js 20+ (recommended)
- npm
- Neon/Postgres database (or compatible Postgres)
- Separate test database for integration tests (`TEST_DATABASE_URL`)

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local `.env` file (see **Environment Variables** below). Do not commit secrets.

3. Generate Prisma client and run migrations:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. Seed demo data (optional, for local development):

   ```bash
   npm run db:seed
   ```

5. Start the dev server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Configure these in `.env` (names only; use real values locally/deployment):

| Variable            | Purpose                                               |
| ------------------- | ----------------------------------------------------- |
| `DATABASE_URL`      | Primary Postgres connection string                    |
| `DIRECT_URL`        | Direct Postgres connection string (Prisma/migrations) |
| `TEST_DATABASE_URL` | Separate test database for integration tests          |
| `AUTH_SECRET`       | NextAuth secret                                       |
| `NEXTAUTH_URL`      | App base URL (e.g. `http://localhost:3000`)           |
| `BANK_TIMEZONE`     | Banking timezone (default: `Asia/Dhaka`)              |

> `.env.example` may exist locally as a template, but `.env*` secrets must never be committed.

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run format       # Prettier write
npm run format:check # Prettier check
npm run test         # Vitest run
npm run test:watch   # Vitest watch
npm run db:migrate   # Prisma migrate dev
npm run db:seed      # Prisma seed
```

## Testing

- Unit/integration tests use **Vitest**.
- Integration tests should use `TEST_DATABASE_URL`, separate from `DATABASE_URL`.
- Do not weaken tests to make them pass; fix the underlying issue or environment.

```bash
npx vitest run
```

## Demo Accounts (Seed)

If you ran `npm run db:seed`, use these local development demo credentials (also defined in `src/lib/demo-credentials.ts`, used by the landing page and `/login?role=` prefill):

| Role     | Email                 | Password       |
| -------- | --------------------- | -------------- |
| Admin    | `admin@nexabank.com`  | `Password@123` |
| Staff    | `staff1@nexabank.com` | `Password@123` |
| Customer | `customer1@nexabank.com` | `Password@123` |

> Local development/demo only. Not real banking credentials. No real money involved.

## Deployment Notes

- **App**: Deploy Next.js app (e.g. Vercel). Set all required env vars in deployment environment.
- **Database**: Use Neon/Postgres. Run migrations before/with deploy (`prisma migrate deploy` in CI/CD as appropriate).
- **Auth**: Set `AUTH_SECRET` and `NEXTAUTH_URL` to production values.
- **Tests**: Keep `TEST_DATABASE_URL` separate from production/dev DB.
- **Docs**: `docs/` is local-only and gitignored; do not commit planning/internal docs.

## CI

GitHub Actions workflow: `.github/workflows/ci.yml` runs lint, typecheck, tests, and build on push/PR.

Configure repository secrets (names only, no values committed):

- `DATABASE_URL`
- `DIRECT_URL`
- `TEST_DATABASE_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `BANK_TIMEZONE` (optional)

## Project Notes

- Make changes in small, approved steps; commit each changed file separately.
- Do not print connection strings or secrets.
- Keep `docs/` local-only.
