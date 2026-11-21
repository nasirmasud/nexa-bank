# 01 — Product Requirements Document (PRD)

**Product:** Advanced Digital Banking Management System ("NexaBank" — working name)
**Type:** Simulated fintech banking platform (assessment project, no real money)
**Stack:** Next.js (App Router), TypeScript, Redux Toolkit + RTK Query, Tailwind CSS, Recharts, NextAuth, PostgreSQL + Prisma

---

## 1. Vision & Goals

Build a realistic, secure, production-feeling banking web app where **Customers**, **Bank Staff** and **Admins** complete full banking workflows: accounts, transfers, deposit/withdrawal requests, loans, transaction monitoring and analytics.

**Primary goals**
1. Correct financial business logic (atomic transfers, no negative balances, no double-spend).
2. Server-enforced role-based authorization (never UI-only).
3. Professional, responsive fintech UX (desktop / tablet / mobile).
4. Clean, modular, documented codebase (Redux Toolkit architecture, RTK Query caching).

**Non-goals:** real payment gateways, real KYC providers, real card/bank credentials, interest-rate market simulation.

---

## 2. Personas

| Persona | Description | Key needs |
|---|---|---|
| **Customer (Rafi)** | Retail/business customer with 1–3 accounts | See balances, transfer money, request deposit/withdrawal, apply for loans, download statements |
| **Bank Staff (Nusrat)** | Branch operator | Onboard customers, open accounts, review pending transactions, flag suspicious activity, assist loans |
| **Admin (Karim)** | Bank manager | Global overview, account/customer control, loan decisions, limits & settings |

---

## 3. Roles & Permission Matrix

| Capability | Customer | Staff | Admin |
|---|:--:|:--:|:--:|
| View own dashboard / accounts / transactions | ✅ | — | — |
| Transfer funds (own accounts, other customers) | ✅ | ❌ | ❌ |
| Submit deposit / withdrawal request | ✅ | ❌ | ❌ |
| Approve / reject deposit & withdrawal requests | ❌ | ✅ (not own) | ✅ (not own) |
| Apply for loan, view schedule, repay | ✅ | ❌ | ❌ |
| Register customer, create account | ❌ | ✅ | ✅ |
| Verify customer information (KYC status) | ❌ | ✅ | ✅ |
| View all customers / accounts | ❌ | ✅ (read) | ✅ |
| Activate / deactivate / block customer | ❌ | ❌ | ✅ |
| Freeze / unfreeze account, set limits | ❌ | ❌ | ✅ |
| View all transactions, search, filter | ❌ | ✅ | ✅ |
| Flag suspicious transaction | ❌ | ✅ | ✅ |
| Resolve suspicious flags | ❌ | ❌ | ✅ |
| Loan: add internal notes, forward | ❌ | ✅ | ✅ |
| Loan: approve / reject | ❌ | ❌ | ✅ (not if applicant is self) |
| Bank-wide settings (fees, limits) | ❌ | ❌ | ✅ |
| Admin analytics dashboard | ❌ | ❌ | ✅ |

> Hard rule: **no user can approve a request/loan where they are the requester or applicant.**

---

## 4. Functional Requirements

### 4.1 Authentication & Authorization (FR-AUTH)
- FR-AUTH-1: Email + password login (NextAuth Credentials, JWT session containing `id`, `role`).
- FR-AUTH-2: Roles `ADMIN`, `STAFF`, `CUSTOMER`.
- FR-AUTH-3: Route protection via middleware **and** per-API-route guards.
- FR-AUTH-4: Customers set a 4–6 digit **Transaction PIN** (hashed) used for transfers.
- FR-AUTH-5: Login rate limiting / lockout after repeated failures.
- FR-AUTH-6 (bonus): OTP-based 2FA for sensitive operations.

### 4.2 Customer Features
- **Dashboard:** total balance (across accounts), total deposits, total withdrawals, recent transactions, active loans, account info, account switcher, charts (monthly spending, monthly deposits, transaction distribution).
- **Accounts:** details, number, type (Savings / Current / Business), available balance, status, statement download (CSV/PDF).
- **Fund Transfer:** own accounts or other customer's account number; fields: recipient account, amount, description, PIN. Validations: sufficient balance, valid recipient, account statuses, limits, PIN. Unique transaction ID; both parties receive transaction records.
- **Deposit / Withdrawal Requests:** account, amount, request date, description; statuses Pending / Approved / Rejected.
- **Loans:** apply (type, amount, duration, monthly income, employment status, description), view status, approved loan details, repayment schedule, remaining balance, repayment history, make installment repayment.
- **Notifications:** money received, transfer completed, deposit approved, withdrawal rejected, loan approved/rejected.

### 4.3 Staff Features
- Register customers (creates User + CustomerProfile), create accounts, verify info.
- View customer/account details (read-only financial data).
- View transactions; search by transaction ID; filter by date & type; review pending; flag suspicious.
- Process deposit/withdrawal requests (not their own).
- Loan assistance: view applications, review customer info, add internal notes, forward to admin (status → `UNDER_REVIEW`).

### 4.4 Admin Features
- Dashboard KPIs: total customers, total accounts, total bank balance, total deposits, total withdrawals, total transactions, pending loans.
- Charts: monthly transaction volume, deposit vs withdrawal, account distribution, loan approval statistics, monthly banking activity.
- Customer management: list, search, details, activate/deactivate, block, view transaction history.
- Account management: create, list, update info, freeze/unfreeze, set per-account limits.
- Loan management: approve (disburses funds via recorded transaction), reject, view repayment history.
- Settings: global daily transfer limit, max single transaction, min balance, transfer fee %.
- Suspicious flag review queue.

### 4.5 Transaction Management
Types: `DEPOSIT`, `WITHDRAWAL`, `TRANSFER`, `LOAN_DISBURSEMENT`, `LOAN_REPAYMENT`.
Statuses: `PENDING`, `COMPLETED`, `FAILED`, `REVERSED`.
Fields: transaction ID (human reference), sender account, receiver account, type, amount, fee, date, status, description.
Features: history, details page, search by ID, date & type filters, pagination, **PDF receipt**.

### 4.6 Loan Management
Statuses: `PENDING → UNDER_REVIEW → APPROVED/REJECTED → ACTIVE → COMPLETED`.
Approval creates a `LOAN_DISBURSEMENT` transaction crediting the borrower's selected account, and generates an amortized repayment schedule.

---

## 5. Non-Functional Requirements
| Area | Requirement |
|---|---|
| Security | Server-side validation; hashed passwords & PINs (bcrypt/argon2); no trust in client-sent balances; RBAC on every API |
| Consistency | All money movement inside DB transactions with row locking; idempotency keys to prevent duplicates |
| Performance | Paginated lists (default 10/20); indexed queries; RTK Query caching |
| Responsiveness | Mobile ≥360px, tablet ≥768px, desktop ≥1280px |
| Accessibility | Keyboard-navigable, labelled inputs, sufficient contrast (WCAG AA) |
| Observability | Audit log for all privileged actions; structured error responses |
| Maintainability | Feature-based folders, typed APIs, Zod schemas shared by client & server |

---

## 6. Business Rules

1. Available balance = `balance` − nothing held (v1); a transfer must leave `balance ≥ minBalance` (configurable, default 0 / 500 for savings).
2. Fee: transfers to other customers charge `feePercent` (default 0.5%, min ৳5? configurable); own-account transfers are free.
3. Daily transfer limit counted over `COMPLETED` outgoing transfers since 00:00 (bank timezone).
4. Max single transaction amount enforced per account (override) or global setting.
5. Frozen account: no debit **and** no credit by customers; blocked/deactivated customer cannot log in.
6. Transfer to the same account is invalid.
7. Deposit/withdrawal requests are *requests*; only an approval creates the ledger transaction.
8. Withdrawal approval re-validates balance at approval time.
9. Approver ≠ requester (enforced server-side).
10. Loan: max amount = 20 × monthly income (configurable); duration 3–60 months; EMI via standard amortization formula.
11. Completed transactions are immutable; corrections happen via `REVERSED` status + compensating entry.

### Suspicious activity rules (bonus)
- Amount ≥ 5× the account's 30-day average outgoing transfer.
- ≥ 5 transfers within 10 minutes.
- Transfer to a new beneficiary immediately after PIN failure streak.
- Round-number transfers just under the single-transaction limit (≥ 95%).

---

## 7. Success Criteria / Acceptance
- [ ] All three roles can log in with demo credentials and see only permitted areas.
- [ ] Direct API calls with wrong role return `403`; unauthenticated `401`.
- [ ] Concurrent double-submit of a transfer results in exactly one debit.
- [ ] Forced failure mid-transfer leaves both balances unchanged.
- [ ] Charts built from real DB aggregates.
- [ ] Deployed live; README complete; seed data present.

---

## 8. Out of Scope / Future
Real payment rails, card issuance, multi-currency, scheduled/recurring transfers, interest accrual on savings, mobile app.
