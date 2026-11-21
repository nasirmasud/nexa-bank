# 03 — UI / UX Specification

Goal: a calm, trustworthy, **non-template** fintech look. Dense where it helps (tables), spacious where it matters (balances, forms).

---

## 1. Design Principles
1. **Trust first** — clear hierarchy, money always right-aligned, tabular numerals, no decorative noise.
2. **One primary action per screen** (Transfer, Approve, Apply).
3. **Always show state** — status badges, loading skeletons, empty states, inline errors.
4. **Safe by design** — destructive/financial actions behind confirmation dialogs with a summary.
5. **Responsive-native** — tables collapse to cards on mobile; sidebar becomes bottom sheet/drawer.

---

## 2. Design Tokens

### Color (HSL CSS variables, shadcn-style; Tailwind maps to them)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#F7F8FA` | `#0B0F14` | App bg |
| `--surface` | `#FFFFFF` | `#121821` | Cards |
| `--surface-2` | `#F0F2F5` | `#18202B` | Table header, inset |
| `--border` | `#E4E7EC` | `#232C39` | Dividers |
| `--text` | `#0F172A` | `#E6EAF0` | Primary text |
| `--text-muted` | `#5B6676` | `#8B97A8` | Secondary |
| `--primary` | `#0E7C66` (deep teal-green) | `#2FBF9F` | Brand, CTAs |
| `--primary-fg` | `#FFFFFF` | `#04130F` | On primary |
| `--accent` | `#1F3A5F` (navy) | `#7FA6D9` | Sidebar, links |
| `--success` | `#15803D` | `#4ADE80` | Completed, Approved |
| `--warning` | `#B45309` | `#FBBF24` | Pending, Under Review |
| `--danger` | `#B91C1C` | `#F87171` | Failed, Rejected, Blocked |
| `--info` | `#1D4ED8` | `#60A5FA` | Active, Info |

**Chart palette (validated for contrast, colour-blind-safe order):** teal `#0E7C66`, navy `#1F3A5F`, amber `#D97706`, rose `#BE123C`, violet `#6D28D9`, slate `#64748B`. Always pair color with label/pattern; never rely on color alone.

### Typography
| Role | Font | Size / Weight |
|---|---|---|
| Display / balances | **Inter Tight** or *Manrope* (tabular-nums) | 32–40 / 700 |
| Headings | Manrope | H1 28/700, H2 22/600, H3 18/600 |
| Body | Inter | 14–15/400 |
| Mono (txn IDs, account no.) | JetBrains Mono | 13/500 |

Currency formatting: `Intl.NumberFormat('en-BD', {style:'currency', currency:'BDT'})` (৳). Monospace + `font-variant-numeric: tabular-nums` for amounts.

### Spacing, radius, elevation
- 4px base grid: 4 / 8 / 12 / 16 / 24 / 32 / 48.
- Radius: `sm 6`, `md 10`, `lg 14` (cards), `full` (badges/avatars).
- Elevation: cards use 1px border + very soft shadow (`0 1px 2px rgba(16,24,40,.04)`); modals `0 12px 32px rgba(16,24,40,.18)`.
- Breakpoints: `sm 640`, `md 768`, `lg 1024`, `xl 1280`.

---

## 3. App Shell

### Desktop (≥1024px)
```
┌───────────┬───────────────────────────────────────────────┐
│ Sidebar   │ Topbar: breadcrumb · search · theme · 🔔 · avatar│
│ 264px     ├───────────────────────────────────────────────┤
│ (collaps- │ Page header (title + primary action)           │
│ ible to   │ Content (max-w 1280, 24px gutters)             │
│ 72px)     │                                               │
└───────────┴───────────────────────────────────────────────┘
```
- Sidebar: logo, role label chip, nav groups, bottom: user card + logout.
- Active item: left 3px primary bar + tinted bg.

### Tablet (768–1023)
- Sidebar collapsed to icon rail (72px); expands as overlay on hover/tap.

### Mobile (<768)
- Top app bar (menu, title, bell). Navigation in a slide-in **Drawer**.
- Customer role additionally gets a **bottom tab bar**: Home · Accounts · Transfer (center, emphasized) · Transactions · Loans.
- Tables → stacked cards (`TransactionCard`), filters → bottom sheet.

### Navigation per role
| Customer | Staff | Admin |
|---|---|---|
| Dashboard | Dashboard | Dashboard |
| Accounts | Customers | Customers |
| Transfer | Open Account | Accounts |
| Requests | Requests | Requests |
| Transactions | Transactions | Transactions |
| Loans | Loan Applications | Suspicious |
| Notifications | — | Loans |
| Settings | — | Staff · Settings · Audit Logs |

---

## 4. Component Library (reusable, in `components/ui` & `components/shared`)

| Component | Notes |
|---|---|
| `Button` | variants: primary, secondary, outline, ghost, destructive; sizes sm/md/lg; loading state w/ spinner |
| `Input`, `PasswordInput`, `PinInput` (OTP-style, masked), `CurrencyInput`, `Select`, `Textarea`, `DatePicker`, `DateRangePicker` | label + hint + error slots; RHF + Zod integration |
| `Card`, `StatCard` | StatCard: label, value, delta chip, sparkline slot, icon |
| `AccountCard` | gradient-free card: type chip, masked number (copy button), balance (eye toggle), status badge |
| `StatusBadge` | maps status → color + icon + label (see §5) |
| `DataTable` | sortable headers, sticky header, row actions menu, skeleton rows, empty state, **server-side pagination**, density toggle |
| `FilterBar` | search (txn ID), type select, status select, date range, "Clear" chip list |
| `Pagination` | page, page size, total, keyboard accessible |
| `Dialog`, `ConfirmDialog`, `Drawer`, `Sheet` | focus trap, ESC to close |
| `Toast` | success/error/info, auto-dismiss 5s |
| `Tabs`, `Stepper` (transfer, loan apply), `Timeline` (loan status, transaction audit) |
| `ChartCard` | title, range switcher (6M/12M), legend, empty/loading states |
| `Skeleton`, `EmptyState`, `ErrorState` |
| `ThemeToggle`, `NotificationBell` (popover), `AccountSwitcher` (combobox) |
| `Receipt` (PDF layout) | logo, reference no., parties, amount, fee, date, status, QR/reference |

Use **shadcn/ui + Radix primitives** (copied into repo, fully themable) with Tailwind; icons from **lucide-react**.

---

## 5. Status Badges

| Domain | Status → Color |
|---|---|
| Transaction | Pending (warning) · Completed (success) · Failed (danger) · Reversed (slate/purple) |
| Request | Pending (warning) · Approved (success) · Rejected (danger) · Cancelled (slate) |
| Loan | Pending (warning) · Under Review (info) · Approved (success) · Rejected (danger) · Active (primary) · Completed (slate-success) |
| Account | Active (success) · Frozen (info-ice) · Closed (slate) |
| Customer | Active · Inactive (slate) · Blocked (danger) |
| KYC | Pending · Verified · Rejected |
| Suspicious flag | Open (warning) · Dismissed (slate) · Escalated (danger) |

Badge = soft tinted background + 1px border + dot/icon + text (AA contrast both themes).

---

## 6. Screen Specs

### 6.1 Login
- Split layout: left brand panel (headline, 3 trust bullets, subtle pattern); right form card.
- Fields: Email, Password (show/hide), "Remember me". Errors inline + generic message on auth fail.
- **Demo credentials panel** (collapsible) with 3 "Use these" buttons that autofill Admin / Staff / Customer.

### 6.2 Customer Dashboard
1. **Header row:** greeting, `AccountSwitcher`, primary CTA "Send money".
2. **Stat cards (4):** Total Balance (across accounts, large) · Total Deposits · Total Withdrawals · Active Loans (count + outstanding).
3. **Account carousel/cards:** each account with type, masked number, balance, status.
4. **Charts (2-col):** Monthly Spending (bar) · Monthly Deposit History (area/line) · Transaction Distribution (donut by type) — filter 3M/6M/12M.
5. **Recent Transactions** table (5 rows) + "View all".
6. **Active loan widget:** progress bar of repayment, next due date/amount.
- Mobile: stat cards in 2×2 grid, charts stacked, transactions as cards.

### 6.3 Accounts / Account Detail
- Account tabs or switcher. Detail: big balance, number (copy), type, status badge, limits (daily/per-tx/min balance) as read-only info, opening date.
- Actions: Transfer from, Request deposit/withdrawal, **Download statement** (modal: range + CSV/PDF).
- Mini balance trend chart (running balance, 30 days).

### 6.4 Transfer (Stepper: Details → Review → PIN → Result)
- **Details:** From account (select with balances), Recipient tab: "My accounts" | "Other customer"; account number input with live lookup → shows masked holder name ("R*** A****") and type; Amount (CurrencyInput) with fee preview + "available after transfer"; Description.
- **Review:** summary card (from, to, amount, fee, total debit) + Confirm.
- **PIN:** 6-box masked PinInput; error shake + remaining attempts.
- **Result:** success (animated check, Txn ID, "Download receipt", "Make another") or failure with specific reason.
- Disabled submit until valid; double-click protected (button locks, idempotency key).

### 6.5 Deposit / Withdrawal Requests
- List with filter tabs: All · Pending · Approved · Rejected. "New request" opens form (type toggle, account, amount, request date, description).
- Pending rows have **Cancel** action.

### 6.6 Transactions (all roles, scoped)
- `FilterBar`: search by Transaction ID, Type, Status, Date range, (Admin/Staff: account number / customer).
- Table columns: Txn ID (mono + copy) · Date · Type · From → To · Amount (± color/sign for customer) · Fee · Status · ⋯.
- Server-side pagination (10/25/50). Row click → **Transaction Detail** page: summary, timeline, parties, fee, status, **Download receipt**, (Staff/Admin) **Flag suspicious**.

### 6.7 Loans (Customer)
- Loans list as cards with status badge, amount, remaining balance, progress.
- **Apply:** 3-step form (Loan details → Financials → Review & submit); live EMI estimate.
- **Loan detail:** tabs — Overview (amount, rate, term, remaining balance, next due) · Repayment Schedule (table: #, due date, principal, interest, EMI, status) · Repayment History · Status timeline. "Pay installment" CTA (PIN dialog).

### 6.8 Staff screens
- **Dashboard:** KPI (pending requests, pending KYC, loans to review, flagged today) + work queue tables.
- **Customers:** table with search, KYC badge, status; detail with tabs Profile · Accounts · Transactions · Loans.
- **Register customer:** multi-section form (Personal, Contact, Identity, Address) with validation.
- **Loan review:** left: applicant summary + financial snapshot; right: internal notes thread + "Forward to admin" button.

### 6.9 Admin screens
- **Dashboard:** KPI row (7 cards) + chart grid: Monthly Transaction Volume (bar), Deposit vs Withdrawal (grouped bar), Account Distribution (donut), Loan Approval Stats (stacked bar/donut), Monthly Banking Activity (line/area, multi-series). Date-range selector.
- **Customers / Accounts / Loans / Suspicious / Settings / Audit logs:** consistent table pages with filters; detail pages with action panels and confirmation dialogs (reason textarea required for block/freeze/reject).
- **Settings:** form sections — Transfer limits, Minimum balance, Fee configuration; "Save" requires confirm; shows last-updated by.

---

## 7. Forms & Validation UX
- React Hook Form + Zod resolver; same Zod schemas used by API.
- Validate on blur, summarize on submit; first invalid field focused.
- Amount inputs: numeric keypad on mobile, 2 decimals max, thousand separators.
- Messages are specific ("Amount exceeds your daily limit of ৳50,000").

## 8. Charts
- Recharts, wrapped in `ChartCard`; responsive container; tooltips with formatted currency; legends clickable; skeleton while loading; "No data yet" empty state.
- Data comes from aggregate endpoints (never hardcoded). Respect dark mode via CSS variables.

## 9. Accessibility
- Semantic landmarks, skip-to-content, visible focus rings (2px primary offset).
- All icons-only buttons have `aria-label`; badges include text.
- Dialogs trap focus; forms associate labels/errors (`aria-describedby`).
- Contrast ≥ 4.5:1 body, ≥ 3:1 UI; `prefers-reduced-motion` respected.

## 10. Micro-interactions
Subtle: button press scale 0.98, skeleton shimmer, success check draw, toast slide, balance count-up (only on first load, skipped for reduced motion). No heavy animation.

## 11. Print / PDF
Receipt (A5) and Statement (A4) share a layout: header with bank mark, reference no., table, footer disclaimer "Simulated banking system — not a real financial document."
