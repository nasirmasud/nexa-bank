# NexaBank QA Checklist

Role-based smoke and regression checklist for NexaBank. Use this for manual QA before release. **No secrets or connection strings.**

## How to Use

- Mark each case: `[x]` pass, `[ ]` not run/fail/pending.
- Record result in **Pass/Fail** as `Pass`, `Fail`, or `N/A`.
- Run with `TEST_DATABASE_URL` configured separately from `DATABASE_URL` for automated tests.

## Automated Checks

| Check                      | Command                           | Pass/Fail | Notes                        |
| -------------------------- | --------------------------------- | --------- | ---------------------------- |
| [ ] TypeScript             | `npx tsc --noEmit --pretty false` |           |                              |
| [ ] ESLint                 | `npx eslint .`                    |           |                              |
| [ ] Unit/Integration tests | `npx vitest run`                  |           | Requires `TEST_DATABASE_URL` |
| [ ] Production build       | `npm run build`                   |           |                              |

## Access Control / RBAC

| Case                               | Role / Context                | Expected                         | Pass/Fail | Notes                                   |
| ---------------------------------- | ----------------------------- | -------------------------------- | --------- | --------------------------------------- |
| [ ] Unauthenticated protected page | Anonymous                     | Redirect to login                |           |                                         |
| [ ] Unauthenticated protected API  | Anonymous                     | `401` JSON error                 |           | `/api/*` except `/api/auth`             |
| [ ] Customer opens admin page      | Customer                      | Redirect/denied per route policy |           |                                         |
| [ ] Customer opens staff page      | Customer                      | Redirect/denied per route policy |           |                                         |
| [ ] Staff opens admin-only page    | Staff                         | Redirect/denied per route policy |           |                                         |
| [ ] Wrong-role admin API           | Customer/Staff                | `403` JSON error                 |           | `/api/admin/*`                          |
| [ ] Wrong-role staff API           | Customer                      | `403` JSON error                 |           | `/api/staff/*` as applicable            |
| [ ] Wrong-role customer API        | Staff/Admin where not allowed | `403` or appropriate deny        |           |                                         |
| [ ] Foreign account access         | Customer                      | `404` (no existence leak)        |           | Account/statement/transaction not owned |
| [ ] Foreign transaction receipt    | Customer                      | `404`/deny, no leak              |           | `/api/transactions/:id/receipt`         |
| [ ] Foreign statement export       | Customer                      | `404`/deny, no leak              |           | `/api/accounts/:id/statement`           |

## Customer Flow Matrix

| Case                        | Steps                                               | Expected                                   | Pass/Fail | Notes |
| --------------------------- | --------------------------------------------------- | ------------------------------------------ | --------- | ----- |
| [ ] Login                   | Valid customer credentials                          | Lands on customer dashboard                |           |       |
| [ ] Dashboard load          | Open customer dashboard                             | Accounts/summary render, no sensitive leak |           |       |
| [ ] Accounts list/detail    | Open accounts and account detail                    | Only own accounts visible                  |           |       |
| [ ] Transaction history     | Filter by type/status/ref                           | Results match filters; pagination works    |           |       |
| [ ] Transaction receipt PDF | Open transaction detail, download PDF               | PDF downloads; correct reference/amount    |           |       |
| [ ] Statement CSV export    | Account detail, pick date range, CSV                | CSV downloads; correct rows/headers        |           |       |
| [ ] Statement PDF export    | Account detail, pick date range, PDF                | PDF downloads; account masked/period shown |           |       |
| [ ] Deposit request         | Submit valid deposit request                        | Request created as pending/expected state  |           |       |
| [ ] Withdrawal request      | Submit valid withdrawal request                     | Request created; validation enforced       |           |       |
| [ ] Loan apply              | Submit valid loan application                       | Application created; visible in loans      |           |       |
| [ ] Loan installment pay    | Pay due installment from eligible account           | Balance/loan state updates correctly       |           |       |
| [ ] Notifications           | Trigger/read notifications                          | Unread count updates; mark read works      |           |       |
| [ ] Settings/profile        | Update profile/password/PIN/theme/2FA as applicable | Changes persist; validation errors clear   |           |       |

## Transfer Edge Cases (Customer)

| Case                               | Preconditions                                                                     | Expected                                                     | Pass/Fail | Notes                     |
| ---------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------- | ------------------------- |
| [ ] Transfer success               | Valid from account, valid recipient, sufficient funds, correct PIN, within limits | Transfer completes; balances update; receipt/reference shown |           |                           |
| [ ] Insufficient funds             | Amount > available balance (respect min balance rules)                            | Request rejected with clear error; no balance change         |           |                           |
| [ ] Frozen account (source)        | Source account frozen                                                             | Transfer rejected; no debit                                  |           |                           |
| [ ] Frozen/ineligible recipient    | Recipient account frozen/invalid as per rules                                     | Transfer rejected; no debit                                  |           |                           |
| [ ] Wrong PIN                      | Incorrect transaction PIN                                                         | Rejected with clear error; no transfer                       |           |                           |
| [ ] PIN lockout                    | Repeated wrong PIN attempts up to limit                                           | PIN/transfer locked per policy; clear message; no transfer   |           |                           |
| [ ] Daily limit exceeded           | Amount exceeds daily transfer limit                                               | Rejected; no debit                                           |           |                           |
| [ ] Per-transaction limit exceeded | Amount exceeds per-tx/max single limit                                            | Rejected; no debit                                           |           |                           |
| [ ] Min balance violation          | Transfer would push balance below min balance                                     | Rejected; no debit                                           |           |                           |
| [ ] Duplicate idempotency key      | Repeat same transfer request with same idempotency key                            | No double debit; same logical result returned/handled safely |           |                           |
| [ ] Invalid recipient number       | Unknown/non-12-digit/invalid account                                              | Lookup/submit rejected; no debit                             |           |                           |
| [ ] Self-transfer (if disallowed)  | Source and recipient same account                                                 | Rejected per business rule                                   |           | Confirm expected behavior |

## Staff Flow Matrix

| Case                  | Steps                       | Expected                                                | Pass/Fail | Notes |
| --------------------- | --------------------------- | ------------------------------------------------------- | --------- | ----- |
| [ ] Login             | Valid staff credentials     | Lands on staff dashboard                                |           |       |
| [ ] Request queue     | View pending requests       | Pending requests listed; filters work                   |           |       |
| [ ] Approve request   | Approve deposit/withdrawal  | Status updates; account balance updates correctly       |           |       |
| [ ] Deny request      | Deny with reason            | Status updates; no unintended balance change            |           |       |
| [ ] Customer lookup   | Search/view customer        | Allowed customer data visible; no admin-only leak       |           |       |
| [ ] Create account    | Create account for customer | Account created with valid number/type                  |           |       |
| [ ] Transactions view | Review transactions         | Allowed data visible; actions per role                  |           |       |
| [ ] Suspicious flag   | Flag suspicious transaction | Flag created; visible in queue                          |           |       |
| [ ] Loans review      | Review/act on loans         | Permitted actions work; audit/notifications as expected |           |       |

## Admin Flow Matrix

| Case                    | Steps                         | Expected                                           | Pass/Fail | Notes |
| ----------------------- | ----------------------------- | -------------------------------------------------- | --------- | ----- |
| [ ] Login               | Valid admin credentials       | Lands on admin dashboard                           |           |       |
| [ ] Analytics           | Open dashboard                | Charts/metrics load without errors                 |           |       |
| [ ] Customer management | View/search customer          | Data loads; actions work                           |           |       |
| [ ] Account management  | Freeze/unfreeze/update limits | State updates; audit log recorded                  |           |       |
| [ ] Request management  | Approve/deny requests         | Correct balance/status transitions                 |           |       |
| [ ] Suspicious queue    | Resolve suspicious item       | Status updates; audit log recorded                 |           |       |
| [ ] Audit logs          | View audit logs               | Recent actions visible; sensitive data not exposed |           |       |
| [ ] Settings            | Update platform settings      | Settings persist; validation enforced              |           |       |

## Mobile / Desktop Responsive Checks

| Case                                | Viewport                   | Expected                                              | Pass/Fail | Notes |
| ----------------------------------- | -------------------------- | ----------------------------------------------------- | --------- | ----- |
| [ ] Login layout                    | Mobile (360x800) / Desktop | Form readable, no horizontal overflow                 |           |       |
| [ ] Dashboard shell/nav             | Mobile                     | Menu opens/closes; skip link works by keyboard        |           |       |
| [ ] Dashboard shell/nav             | Desktop                    | Sidebar fixed; content aligned                        |           |       |
| [ ] Tables/lists                    | Mobile                     | Tables scroll horizontally; key columns readable      |           |       |
| [ ] Filters/toolbars                | Mobile                     | Filters stack/full-width; no clipped controls         |           |       |
| [ ] Forms/dialogs                   | Mobile                     | Labels visible; inputs usable; dialogs scroll if tall |           |       |
| [ ] Forms/dialogs                   | Desktop                    | Layout aligned; no excessive spacing                  |           |       |
| [ ] Transaction/statement downloads | Mobile/Desktop             | Download actions accessible and functional            |           |       |

## Release Sign-off

| Item                                       | Pass/Fail | Notes |
| ------------------------------------------ | --------- | ----- |
| [ ] All critical access-control cases pass |           |       |
| [ ] Transfer edge cases pass               |           |       |
| [ ] Role smoke flows pass                  |           |       |
| [ ] Mobile/desktop checks pass             |           |       |
| [ ] No secrets in repo/logs/screenshots    |           |       |
