# 04 — Technical Requirements Document (TRD)

---

## 1. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 15 (App Router)**, React 19 | Required; server routes + middleware |
| Language | **TypeScript** (strict) | Type safety across API & client |
| Styling | **Tailwind CSS** + **shadcn/ui** (Radix) | Fast, consistent design system |
| State | **Redux Toolkit** (mandatory) | Global state, slices |
| Data fetching | **RTK Query** | Caching, tag invalidation, polling |
| Auth | **NextAuth v5 (Auth.js)** Credentials + JWT | Required; role in token |
| Database | **PostgreSQL** (Neon / Supabase for deploy) | ACID transactions, row locks |
| ORM | **Prisma** | Typed queries, `$transaction`, migrations |
| Validation | **Zod** (shared client/server) | Single source of truth |
| Forms | React Hook Form | Performance, Zod resolver |
| Charts | **Recharts** | Required viz |
| PDF | `@react-pdf/renderer` (or `pdfkit`) | Receipts & statements |
| CSV | `papaparse` / manual stream | Statement export |
| Hashing | `bcryptjs` (or `argon2`) | Passwords + PIN |
| Rate limit | `@upstash/ratelimit` (Redis) or in-DB counter | Login/PIN brute-force protection |
| Dates | `date-fns` | Light, tree-shakable |
| Icons | `lucide-react` | |
| Testing | Vitest (unit), Playwright (e2e), Prisma test DB | |
| Hosting | **Vercel** (app) + **Neon** (Postgres) | |

> Extra libraries are documented in README as required.

---

## 2. Architecture Overview

```
Browser ──► Next.js (Vercel)
            ├─ middleware.ts            (route gating – UX layer)
            ├─ app/(role)/…             (React Server/Client Components)
            ├─ app/api/**/route.ts      (REST handlers – authoritative security layer)
            │     └─ lib/services/*     (business logic: transfers, loans, requests)
            │          └─ Prisma ──► PostgreSQL
            └─ Redux store (client) + RTK Query ⇄ /api
```

Layering rule: **Route handler → (auth guard → Zod parse) → service → repository (Prisma)**. Business rules live in `services`, never in components or handlers.

### Folder structure
```
src/
├─ app/                       # routes (see 02_AppFlow.md)
│  └─ api/
├─ components/
│  ├─ ui/                     # shadcn primitives
│  ├─ shared/                 # DataTable, StatusBadge, ChartCard…
│  └─ features/{auth,accounts,transactions,loans,admin,staff}/
├─ store/
│  ├─ index.ts                # configureStore
│  ├─ hooks.ts                # typed useAppDispatch/useAppSelector
│  ├─ api/                    # RTK Query base + injected endpoints
│  │   ├─ baseApi.ts
│  │   ├─ accountsApi.ts
│  │   ├─ transactionsApi.ts
│  │   ├─ transfersApi.ts
│  │   ├─ requestsApi.ts
│  │   ├─ loansApi.ts
│  │   ├─ customersApi.ts
│  │   ├─ analyticsApi.ts
│  │   └─ notificationsApi.ts
│  └─ slices/
│      ├─ authSlice.ts
│      ├─ accountSlice.ts     # activeAccountId, UI selections
│      ├─ transactionSlice.ts # filters, pagination state
│      ├─ loanSlice.ts        # wizard draft, filters
│      ├─ uiSlice.ts          # theme, sidebar, global loading counter, toasts
│      └─ notificationSlice.ts
├─ lib/
│  ├─ auth.ts                 # NextAuth config
│  ├─ guards.ts               # requireAuth, requireRole, assertOwnership
│  ├─ prisma.ts
│  ├─ services/               # transferService, requestService, loanService, accountService, analyticsService, fraudService
│  ├─ validators/             # Zod schemas
│  ├─ money.ts                # Decimal helpers
│  ├─ errors.ts               # AppError + codes
│  ├─ pdf/                    # receipt, statement
│  └─ utils.ts
├─ types/
├─ middleware.ts
prisma/{schema.prisma, migrations, seed.ts}
```

---

## 3. Authentication & Authorization

### Strategy
- NextAuth Credentials provider; `authorize()` verifies bcrypt hash, checks `status === ACTIVE`, applies lockout (5 fails → 15 min).
- **JWT session** with `{ id, role, sessionVersion }`; callbacks `jwt` / `session` expose to client.
- Each API call: `requireAuth()` loads the token and (cheaply) verifies `user.status` & `sessionVersion` so block/deactivate takes effect immediately.
- Cookies: `httpOnly`, `secure`, `sameSite=lax`. CSRF protection via NextAuth + same-origin check on mutating routes (`Origin` header).

### Guards (`lib/guards.ts`)
```ts
requireAuth(): Promise<SessionUser>                      // 401
requireRole(...roles: Role[]): Promise<SessionUser>      // 403
assertAccountOwner(user, accountId)                      // 403/404 – customer must own account
assertNotSelf(user, targetUserId)                        // approver ≠ requester
```
Customers requesting someone else's resource receive **404** (avoid existence leaks).

### Permission matrix enforcement
Defined once in `lib/permissions.ts` as `can(role, action)` and used by handlers + UI (UI only for hiding; server is authoritative).

---

## 4. API Design (REST, JSON)

Common: `Content-Type: application/json`; responses `{ data, meta? }` or `{ error: { code, message, fields? } }`. Pagination: `?page=1&pageSize=10` → `meta: { page, pageSize, total, totalPages }`. Money serialized as **string decimals** (`"1250.50"`).

### Auth
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/api/auth/[...nextauth]` | public | NextAuth |
| POST | `/api/me/pin` | CUSTOMER | Set / change transaction PIN |
| GET | `/api/me` | any | Current user + profile |

### Accounts
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/accounts` | CUSTOMER (own) / STAFF,ADMIN (all, filters) | List |
| POST | `/api/accounts` | STAFF, ADMIN | Create account |
| GET | `/api/accounts/:id` | owner / STAFF / ADMIN | Details |
| PATCH | `/api/accounts/:id` | ADMIN | Update info |
| POST | `/api/accounts/:id/freeze` · `/unfreeze` | ADMIN | Freeze with reason |
| PUT | `/api/accounts/:id/limits` | ADMIN | Set daily / per-tx / min balance |
| GET | `/api/accounts/lookup?number=` | CUSTOMER | Recipient preview (masked name) |
| GET | `/api/accounts/:id/statement?from&to&format=csv\|pdf` | owner / STAFF / ADMIN | Export |

### Transfers & Transactions
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/api/transfers` | CUSTOMER | Execute transfer (atomic) |
| GET | `/api/transactions` | scoped by role | List: `q` (txn ID), `type`, `status`, `from`, `to`, `accountId`, pagination |
| GET | `/api/transactions/:id` | party / STAFF / ADMIN | Detail |
| GET | `/api/transactions/:id/receipt` | party / STAFF / ADMIN | PDF |
| POST | `/api/transactions/:id/flag` | STAFF, ADMIN | Flag suspicious |
| POST | `/api/transactions/:id/reverse` | ADMIN | Reverse (compensating entry) |

### Deposit / Withdrawal Requests
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/api/requests` | CUSTOMER | Create (PENDING) |
| GET | `/api/requests` | CUSTOMER own / STAFF,ADMIN all | List |
| POST | `/api/requests/:id/approve` | STAFF, ADMIN (≠ requester) | Execute ledger update |
| POST | `/api/requests/:id/reject` | STAFF, ADMIN | With reason |
| POST | `/api/requests/:id/cancel` | CUSTOMER owner | Only if PENDING |

### Loans
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/api/loans` | CUSTOMER | Apply |
| GET | `/api/loans` | CUSTOMER own / STAFF,ADMIN | List/filter |
| GET | `/api/loans/:id` | owner / STAFF / ADMIN | Detail + schedule |
| POST | `/api/loans/:id/notes` | STAFF, ADMIN | Internal note |
| POST | `/api/loans/:id/forward` | STAFF, ADMIN | → UNDER_REVIEW |
| POST | `/api/loans/:id/approve` | ADMIN (≠ applicant) | Approve + disburse |
| POST | `/api/loans/:id/reject` | ADMIN | Reject (reason) |
| POST | `/api/loans/:id/installments/:n/pay` | CUSTOMER owner | Repay (PIN) |
| GET | `/api/loans/:id/repayments` | owner / ADMIN / STAFF | History |

### Customers (staff/admin)
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/api/customers` | STAFF, ADMIN | Register |
| GET | `/api/customers?q=&status=&kyc=` | STAFF, ADMIN | Search/list |
| GET | `/api/customers/:id` | STAFF, ADMIN | Detail |
| PATCH | `/api/customers/:id/verify` | STAFF, ADMIN | KYC verify/reject |
| PATCH | `/api/customers/:id/status` | ADMIN | ACTIVE / INACTIVE / BLOCKED |
| GET | `/api/customers/:id/transactions` | STAFF, ADMIN | History |

### Analytics
| Method | Path | Roles |
|---|---|---|
| GET | `/api/admin/analytics/summary` | ADMIN |
| GET | `/api/admin/analytics/monthly-volume` | ADMIN |
| GET | `/api/admin/analytics/deposit-vs-withdrawal` | ADMIN |
| GET | `/api/admin/analytics/account-distribution` | ADMIN |
| GET | `/api/admin/analytics/loan-stats` | ADMIN |
| GET | `/api/admin/analytics/monthly-activity` | ADMIN |
| GET | `/api/me/analytics/{summary,monthly-spending,monthly-deposits,distribution}` | CUSTOMER |

### Misc
`GET/PATCH /api/settings` (GET: STAFF+, PATCH: ADMIN) · `GET /api/notifications` · `PATCH /api/notifications/:id/read` · `GET /api/suspicious` · `PATCH /api/suspicious/:id` (ADMIN) · `GET /api/audit-logs` (ADMIN).

---

## 5. Transaction Processing Logic (critical)

### 5.1 Money handling
- DB type `Decimal(18,2)` (Prisma `Decimal`); never JS floats. Use `decimal.js` helpers in `lib/money.ts`.
- Clients send only `amount` (string). **Balances are never accepted from the client.** Fee computed on server.
- Amount rules: > 0, ≤ 2 decimals, ≤ configured max.

### 5.2 Atomic transfer algorithm
```ts
async function transfer(input, user) {
  // 0. Zod parse; assertAccountOwner(user, fromAccountId)
  // 1. Idempotency: lookup IdempotencyKey(userId, key) → if exists return stored result
  return prisma.$transaction(async (tx) => {
    // 2. Lock rows in deterministic order (prevents deadlocks)
    const ids = [from.id, to.id].sort();
    const rows = await tx.$queryRaw`SELECT * FROM "Account" WHERE id IN (${Prisma.join(ids)}) ORDER BY id FOR UPDATE`;
    // 3. Validate (inside lock, using locked fresh rows)
    //    - PIN (bcrypt compare, attempts counter; lock after 3 fails)
    //    - from/to exist, from.id !== to.id, both ACTIVE (not FROZEN/CLOSED), owners ACTIVE
    //    - amount within perTxLimit; daily sum + amount ≤ dailyLimit
    //    - from.balance - (amount+fee) ≥ minBalance
    // 4. fee = same-owner ? 0 : max(minFee, amount * feePercent)
    // 5. UPDATE Account SET balance = balance - (amount+fee) WHERE id = from  (with CHECK balance >= 0)
    //    UPDATE Account SET balance = balance + amount WHERE id = to
    // 6. INSERT Transaction(status COMPLETED, reference, fee, ...)
    //    INSERT LedgerEntry DEBIT(from, amount+fee, balanceAfter) / CREDIT(to, amount, balanceAfter)
    //    (+ bank fee-income entry if fee > 0)
    // 7. INSERT Notification x2; INSERT IdempotencyKey result; fraudService.evaluate(tx)
    return result;
  }, { isolationLevel: 'Serializable', timeout: 10000 });
}
```
- Any thrown `AppError` → entire tx rolls back → **no partial debit**.
- Failed attempts are logged separately (outside the rolled-back tx) as `Transaction(status FAILED)` **only for domain failures after auth** (e.g., limit exceeded) so history is preserved; no balance impact.
- DB-level safety nets: `CHECK (balance >= 0)`, `CHECK (amount > 0)`, unique `Transaction.reference`, unique `(userId, idempotencyKey)`.
- Retry on serialization failure (Postgres `40001`) up to 3 times with jitter.

### 5.3 Duplicate prevention
1. Client generates UUID `idempotencyKey` per form instance; UI disables submit while pending.
2. Server unique constraint on `(userId, key)`; replay returns the original response.
3. Optional soft guard: identical (from,to,amount) within 10s → `DUPLICATE_REQUEST` warning.

### 5.4 Deposit / withdrawal approval
Single DB tx: lock account → verify request still `PENDING` (`UPDATE … WHERE status='PENDING'` returns 1 row) → verify `approver.id !== request.requesterUserId` → withdrawal: check balance/min-balance/limits → update balance → create Transaction + LedgerEntry → mark request `APPROVED` (`reviewedBy`, `reviewedAt`) → notify.

### 5.5 Loan flow
- **Apply:** validate max amount (≤ `loanMultiplier × monthlyIncome`), duration 3–60, interest rate by loan type (config).
- **Approve (admin ≠ applicant):** tx → ensure status `UNDER_REVIEW`/`PENDING` → create `LOAN_DISBURSEMENT` (from bank `SYSTEM` account → customer account) → generate schedule via EMI formula `EMI = P·r(1+r)^n / ((1+r)^n − 1)` (r = annual/12) → status `ACTIVE`.
- **Repay:** lock account + installment → debit customer, credit bank → `LOAN_REPAYMENT` transaction → installment `PAID` (principal/interest split) → loan.remaining decrement → `COMPLETED` when all paid.

### 5.6 Reversal (admin)
Creates a mirrored transaction with `reversalOf` pointer; original marked `REVERSED`; balances adjusted atomically; only if receiver has sufficient funds (else fails with explanation).

### 5.7 System/bank account
Seeded `SYSTEM` account (type `SYSTEM`, no owner customer) acts as counterparty for deposits, withdrawals, loan disbursements, and fees so every transaction is double-entry balanced.

### 5.8 Transaction ID / reference
`TXN-YYYYMMDD-XXXXXXXX` (8 chars Crockford base32 from CSPRNG), unique-indexed. Account numbers: 12 digits, `branch(3)+type(1)+serial(7)+checksum(1)`; unique-indexed.

---

## 6. Suspicious Transaction Detection (rule-based)
`fraudService.evaluate(tx)` runs after commit (non-blocking, still inside request) and inserts `SuspiciousFlag(source=SYSTEM)` when:
1. amount ≥ 5× 30-day avg outgoing for that account (min 5 samples)
2. > 5 outgoing transfers in 10 minutes
3. amount ≥ 95% of per-tx limit
4. first-time beneficiary and amount ≥ 50% of balance
5. transfer within 5 minutes after ≥ 2 failed PIN attempts

Rules and thresholds are constants in `lib/fraudRules.ts`; each flag stores `ruleCode`.

---

## 7. Redux Toolkit Architecture

### Store
```ts
export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    account: accountReducer,
    transaction: transactionReducer,
    loan: loanReducer,
    notification: notificationReducer,
    ui: uiReducer,
  },
  middleware: (gdm) => gdm().concat(baseApi.middleware, rtkQueryErrorLogger, loadingMatcherMiddleware),
});
```
Provider is a client component in `app/providers.tsx` (with SessionProvider, ThemeProvider).

### Slices (feature-based)
| Slice | State | Notes |
|---|---|---|
| `auth` | `user`, `role`, `status: idle/loading/authenticated`, `error` | Hydrated from NextAuth session; cleared on logout |
| `account` | `activeAccountId`, `view` | Persisted `activeAccountId` (localStorage) |
| `transaction` | `filters {q,type,status,from,to}`, `page`, `pageSize` | Drives list queries; reset on role/account change |
| `loan` | `applyDraft` (wizard data), `filters` | Draft survives step navigation |
| `notification` | `unreadCount`, `panelOpen` | Count derived from RTKQ via `extraReducers` matcher |
| `ui` | `theme`, `sidebarOpen/collapsed`, `pendingRequests` counter, `toasts[]` | **Centralized loading**: matcher on `isPending/isFulfilled/isRejected` of any API action adjusts counter → global top bar |

### Async thunks
Used where RTK Query doesn't fit: `loginThunk` (wraps `signIn`), `logoutThunk` (signOut + reset), `hydrateSessionThunk`, `downloadFileThunk` (statement/receipt blob).

### RTK Query
- `baseApi = createApi({ baseQuery: fetchBaseQuery({ baseUrl:'/api' }) wrapped with re-auth/error handler, tagTypes: ['Me','Account','Transaction','Request','Loan','Customer','Analytics','Notification','Settings','Suspicious'], endpoints: () => ({}) })`.
- Feature APIs use `injectEndpoints`.
- **Error handling:** `baseQueryWithErrors` normalizes `{status, data.error}` → `ApiError`; 401 → dispatch logout + redirect; 403 → toast; 5xx → generic toast. Mutations show success toasts via `onQueryStarted`.
- **Cache tags & invalidation**
  | Mutation | Invalidates |
  |---|---|
  | `createTransfer` | `Account`, `Transaction`, `Analytics`, `Notification` |
  | `createRequest` / `cancelRequest` | `Request` |
  | `approveRequest` / `rejectRequest` | `Request`, `Account`, `Transaction`, `Analytics`, `Notification` |
  | `applyLoan` | `Loan` |
  | `approveLoan` | `Loan`, `Account`, `Transaction`, `Analytics`, `Notification` |
  | `payInstallment` | `Loan`, `Account`, `Transaction` |
  | `updateCustomerStatus` | `Customer`, `Account` |
  | `updateSettings` | `Settings` |
- `providesTags` with ids (`{type:'Transaction', id}` + `LIST`) for granular refresh.
- `pollingInterval: 30000` on notifications; `refetchOnFocus`/`refetchOnReconnect` enabled (`setupListeners`).
- Optimistic update for `markNotificationRead` only (financial mutations are **never** optimistic).

---

## 8. Security Implementation Checklist
| Threat | Control |
|---|---|
| Broken access control | Server guards on every route; ownership checks; 404 for foreign resources |
| Balance tampering | Balance only changed in services inside DB tx; API accepts no balance fields; Prisma input whitelisting via Zod `.strict()` |
| Amount tampering | Server recomputes fee/total; Decimal math; min/max validation |
| Race conditions / double-spend | `FOR UPDATE` row locks + Serializable + idempotency keys + CHECK constraint |
| Self-approval | `assertNotSelf` on requests & loans; also DB check `reviewedBy <> requesterId` |
| Credential attacks | bcrypt (cost 12), lockout, rate limit, generic errors |
| PIN brute force | 3 attempts → 15 min PIN lock; PIN hashed separately |
| XSS | React escaping; no `dangerouslySetInnerHTML`; CSP headers |
| CSRF | NextAuth tokens, SameSite cookies, Origin check |
| Injection | Prisma parameterization; `$queryRaw` only with tagged templates |
| Sensitive data exposure | Never return hashes; mask account numbers/names in lookups; no PII in logs |
| Audit | `AuditLog` for admin/staff actions (who, what, before/after, ip) |
| Headers | `next.config.js` security headers (HSTS, X-Frame-Options, Referrer-Policy, CSP) |
| Secrets | Env vars only, `.env.example` committed, `.env` ignored |

---

## 9. Error Handling
- `AppError(code, httpStatus, message, fields?)` thrown in services; `withApi(handler)` wrapper catches → consistent JSON, logs with request id.
- Zod errors → `422` with `fields`. Unknown errors → `500` generic message (details logged).
- Client: RTKQ error normalizer + `error.tsx`/`not-found.tsx` boundaries + form field mapping.

## 10. Performance
Indexes on `Transaction(fromAccountId, createdAt)`, `(toAccountId, createdAt)`, `reference`, `(type,status,createdAt)`; analytics via SQL `date_trunc` + `GROUP BY`; paginated lists; React Server Components for static shells; dynamic import for Recharts.

## 11. Testing Strategy
- **Unit:** money math, EMI calc, fee calc, fraud rules, permission matrix.
- **Integration (Vitest + test DB):** transfer success, insufficient funds, rollback on forced failure, concurrent 10× transfers (balance invariant), self-approval rejection, ownership 404.
- **E2E (Playwright):** login per role, transfer happy path, request approval, loan apply→approve→repay, RBAC redirects.
- **Invariant check:** `SUM(balances) == SUM(ledger credits − debits)` after seeded test run.

## 12. Environment Variables
```
DATABASE_URL=            # Postgres (pooled)
DIRECT_URL=              # Postgres (direct, for migrations)
NEXTAUTH_URL=            # e.g. https://your-app.vercel.app
AUTH_SECRET=             # openssl rand -base64 32
BANK_CODE=001
BANK_TIMEZONE=Asia/Dhaka
UPSTASH_REDIS_REST_URL=  # optional (rate limit)
UPSTASH_REDIS_REST_TOKEN=
SEED_DEMO_DATA=true
```

## 13. Deployment
1. Create Neon/Supabase Postgres → copy URLs.
2. Push repo to GitHub → import in Vercel → set env vars.
3. Build command: `prisma generate && prisma migrate deploy && next build`.
4. Run seed once: `npx prisma db seed` (locally pointed at prod DB, or Vercel CLI).
5. Verify demo logins; set `NEXTAUTH_URL` to the production URL.

## 14. Local Setup
```bash
git clone <repo> && cd digital-banking
cp .env.example .env
npm i
npx prisma migrate dev
npx prisma db seed
npm run dev   # http://localhost:3000
```

## 15. Demo Credentials (seed)
| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | admin@nexabank.test | Admin@12345 | full access |
| Staff | staff@nexabank.test | Staff@12345 | operations |
| Customer | customer@nexabank.test | Customer@12345 | PIN `123456`, 3 accounts |
| Customer 2 | customer2@nexabank.test | Customer@12345 | PIN `654321`, transfer target |
