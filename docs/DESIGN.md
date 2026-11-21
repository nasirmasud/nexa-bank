---
name: Institutional FinTech
colors:
  surface: '#f8f9fb'
  surface-dim: '#d9dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#edeef0'
  surface-container-high: '#e7e8ea'
  surface-container-highest: '#e1e2e4'
  on-surface: '#191c1e'
  on-surface-variant: '#3e4945'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f3'
  outline: '#6e7a75'
  outline-variant: '#bdc9c4'
  surface-tint: '#006b57'
  primary: '#00614f'
  on-primary: '#ffffff'
  primary-container: '#0e7c66'
  on-primary-container: '#bcffe9'
  inverse-primary: '#7bd7bd'
  secondary: '#465f86'
  on-secondary: '#ffffff'
  secondary-container: '#b6d0fd'
  on-secondary-container: '#3f5980'
  tertiary: '#894032'
  on-tertiary: '#ffffff'
  tertiary-container: '#a75748'
  on-tertiary-container: '#ffeeea'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#97f4d9'
  primary-fixed-dim: '#7bd7bd'
  on-primary-fixed: '#002019'
  on-primary-fixed-variant: '#005141'
  secondary-fixed: '#d5e3ff'
  secondary-fixed-dim: '#aec8f4'
  on-secondary-fixed: '#001c3b'
  on-secondary-fixed-variant: '#2d476d'
  tertiary-fixed: '#ffdad3'
  tertiary-fixed-dim: '#ffb4a6'
  on-tertiary-fixed: '#3d0702'
  on-tertiary-fixed-variant: '#763125'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e1e2e4'
typography:
  display-lg:
    fontFamily: Manrope
    fontSize: 3rem
    fontWeight: '700'
    lineHeight: 3.5rem
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Manrope
    fontSize: 2rem
    fontWeight: '700'
    lineHeight: 2.5rem
    letterSpacing: -0.01em
  headline-xl:
    fontFamily: Manrope
    fontSize: 2.25rem
    fontWeight: '600'
    lineHeight: 2.75rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 1.75rem
    fontWeight: '600'
    lineHeight: 2.25rem
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.75rem
  title-sm:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.5rem
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
  data-tabular-lg:
    fontFamily: Manrope
    fontSize: 1.5rem
    fontWeight: '700'
    lineHeight: 2rem
  data-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.8125rem
    fontWeight: '500'
    lineHeight: 1.125rem
  data-mono-xs:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '500'
    lineHeight: 0.875rem
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes an institutional-grade digital banking environment tailored for high-volume treasury operations, institutional accounts, and regulatory compliance workflows. The aesthetic conveys unwavering stability, fiduciary security, and operational clarity.

Drawing from modern corporate architecture and disciplined Swiss typography, the design rejects ephemeral tech trends in favor of structural authority. Visual density is balanced to facilitate high-frequency monitoring and swift reconciliation without user fatigue. The user interface projects calm precision under market volatility through restrained color usage, deliberate visual weight, and unambiguous typographic hierarchy.

## Colors

The palette leverages high-integrity financial tones. The primary brand color, Deep Emerald (`#0E7C66`), denotes fiscal stability and deliberate action, complemented by Institutional Navy (`#1F3A5F`) for structured governance layers.

### Light Mode Foundations
- **Canvas Surface**: `#F7F8FA`
- **Surface Elevation 1 (Cards, Modals)**: `#FFFFFF` with outline `#E4E7EC`
- **Text Primary**: `#0F172A`
- **Text Secondary / Muted**: `#475467`
- **Text Tertiary / Disabled**: `#98A2B3`
- **Interactive Primary**: Default `#0E7C66`, Hover `#0A5C4C`, Active `#074337`, Surface Subdued `#E6F5F2`
- **Interactive Secondary**: Default `#1F3A5F`, Hover `#162B46`

### Dark Mode Foundations
- **Canvas Surface**: `#0B0F14`
- **Surface Elevation 1**: `#121821` with outline `#1E293B`
- **Text Primary**: `#F1F5F9`
- **Text Secondary / Muted**: `#94A3B8`
- **Text Tertiary / Disabled**: `#64748B`
- **Interactive Primary**: `#2FBF9F` (Accessible contrast on deep slate)

### Status & Audit Signals
Status colors are reserved strictly for operational states, account health indicators, and verification checkpoints:
- **Success / Active / Cleared**: Foreground `#15803D`, Background `#DCFCE7`, Border `#86EFAC`
- **Warning / Pending / Escrow**: Foreground `#B45309`, Background `#FEF3C7`, Border `#FCD34D`
- **Danger / Blocked / Frozen / Critical**: Foreground `#B91C1C`, Background `#FEE2E2`, Border `#FCA5A5`
- **Info / Processing / Settlement**: Foreground `#1D4ED8`, Background `#DBEAFE`, Border `#93C5FD`

## Typography

The type hierarchy segregates analytical display, general UI legibility, and auditable identification:

- **Manrope**: Applied to high-level portfolio balance headlines, primary section titles, and aggregated stat cards. Enforce font-feature settings `'cv02'`, `'cv03'`, `'cv04'`, `'cv11'`, and `'tnum'` globally to ensure alignment and modern terminal shaping.
- **Inter**: Drives operational UI, table cell contents, form inputs, metadata, and systemic narrative. Standard tracking with optimized x-height guarantees readability during dense data scans.
- **JetBrains Mono**: Strictly utilized for cryptographic hashes, SWIFT/BIC codes, transaction references, UUIDs, account routing numbers, and inline audit logs.

### Numeric Display Rules
All numerical values representing monetary assets, foreign exchange rates, and ledger figures must leverage tabular figures (`tnum`). All monetary values must be right-aligned in tables, lists, and summary cards. Currency prefixes (such as the Bangladeshi Taka symbol `৳`) must maintain a single non-breaking space before the integer group.

## Layout & Spacing

The layout model is built on an adaptive 12-column grid prioritizing data visibility and continuous workspace utility.

### Grid & Breakpoints
- **Desktop (1280px and above)**: 12 columns, 24px (`1.5rem`) gutters, 32px (`2rem`) outer margin. The primary content canvas is capped with an inner minimum width of 1024px to prevent metric collapse.
- **Tablet (768px - 1279px)**: 8 columns, 16px (`1rem`) gutters, 24px (`1.5rem`) outer margin. Side navigation contracts to an 80px static icon rail.
- **Mobile (Below 768px)**: 4 columns, 16px (`1rem`) gutters, 16px (`1rem`) outer margin. Side navigation collapses into an off-canvas drawer accessed via the global header.

### Shell Dimensions
- **Sidebar Desktop Width**: Exactly 264px fixed width.
- **Sidebar Rail Tablet Width**: 80px fixed width.
- **Top Application Bar**: 64px fixed height with sticky positioning (`z-index: 50`).
- **Standard Vertical Rhythm**: Modular scale increments based on 4px units (`0.25rem`), utilizing `space-sm` for adjacent form items, `space-md` for internal component padding, and `space-xl` for major grid module separations.

## Elevation & Depth

To maintain institutional authority, this design system limits dramatic, deep shadows and glowing blur effects. Depth is communicated primarily through distinct tonal layering coupled with ultra-subtle, low-opacity ambient shadows and crisp hairline borders.

### Surface Tiers
- **Canvas Level (0dp)**: Surface background base (`#F7F8FA` Light / `#0B0F14` Dark).
- **Surface Elevation 1 (Card/Container)**: Resting cards, stat blocks, data tables. Utilizes a 1px solid border (`#E4E7EC` Light / `#1E293B` Dark) paired with an ambient shadow: `0 1px 3px rgba(16, 24, 40, 0.05)`.
- **Surface Elevation 2 (Dropdowns & Popovers)**: Context menus, autocomplete panels, role-switcher menus. Supported by `0 4px 6px -2px rgba(16, 24, 40, 0.03), 0 12px 16px -4px rgba(16, 24, 40, 0.08)`.
- **Surface Elevation 3 (Overlays & Modals)**: Critical transaction authorizations, Wire transfer confirmations. Features a dark backdrop dim (`rgba(11, 15, 20, 0.6)`) with `0 20px 24px -4px rgba(16, 24, 40, 0.08), 0 8px 8px -4px rgba(16, 24, 40, 0.03)`.

## Shapes

The geometric vocabulary communicates discipline and efficiency through soft, restrained corner treatments (Radius Level 1):

- **Default Form & Interactive Elements (Buttons, Inputs, Selects)**: 4px (`0.25rem`) border radius. This conveys structural precision without aggressive brutalist edges.
- **Medium Panels & Cards (`rounded-lg`)**: 8px (`0.5rem`) border radius, framing major analytical clusters and data tables.
- **Large Overlays (`rounded-xl`)**: 12px (`0.75rem`) border radius for modal dialogs and alert surfaces.
- **Pill Exceptions**: Status badges, verification chips, and active indicator dots use fully rounded caps (`9999px`) to immediately distinguish contextual metadata from clickable rectangular interactive targets.

## Components

### Buttons
- **Primary**: Background Deep Emerald (`#0E7C66`), label White (`#FFFFFF`), 4px border radius, font-weight 600. Hover: `#0A5C4C`, Active: `#074337`.
- **Secondary / Institutional**: Background `#FFFFFF`, border 1px solid `#D0D5DD`, text `#1F3A5F`. Hover: Background `#F8FAFC`.
- **Destructive**: Background `#B91C1C`, label White (`#FFFFFF`). Hover: `#991B1B`.

### Navigation Shell
- **Sidebar**: Dark Institutional Navy (`#162338`). Primary navigational links feature high-contrast states: active links present a left vertical accent marker (3px solid `#2FBF9F`) with a subtle tinted background fill (`rgba(255, 255, 255, 0.08)`).
- **Top Bar**: Crisp border-bottom (`1px solid #E4E7EC`). Houses breadcrumbs in `Inter`, a compact search input with quick-key indicators (`⌘K`), a global system status indicator, notification bell with unread dot, and the administrator profile switcher.

### Stat & KPI Cards
Structured with a 1px border on surface `#FFFFFF`. Includes a top row with metric label (`Inter`, muted) and category icon, followed by the primary balance or metric in `Manrope` (`display-sm` or `headline-lg`, tabular figures). The footer encapsulates percentage changes alongside an inline SVG sparkline (emerald for positive yield, muted red for negative outflow).

### Data Tables
- **Header**: Sticky `top-0`, background `#F8FAFC`, uppercase `0.75rem` labels (`Inter`, 600 weight), 1px solid bottom border (`#E4E7EC`).
- **Rows**: Explicit 52px minimum height, alternating background or hover state `#F9FAFB`.
- **Cells**: Monetary values strictly right-aligned, monospaced ID badges (`JetBrains Mono`, 12px) wrapped in subtle gray tags.
- **Pagination & Filters**: Inline bottom bar displaying total record range, page sizing controls, and discrete previous/next action buttons.

### Status Badges
Pill-shaped containers (`rounded-full`), padding `2px 8px`, `0.75rem` font size, semi-bold:
- **Completed / Active / Approved**: `#DCFCE7` background, `#15803D` text, `#86EFAC` border.
- **Pending / In Review / Escrow**: `#FEF3C7` background, `#B45309` text, `#FCD34D` border.
- **Failed / Blocked / Frozen**: `#FEE2E2` background, `#B91C1C` text, `#FCA5A5` border.
- **Processing / Transit**: `#DBEAFE` background, `#1D4ED8` text, `#93C5FD` border.

### Input Fields & Controls
Height 40px, 1px solid border `#D0D5DD`, background `#FFFFFF`. Focus ring: 2px solid `#0E7C66` with a 2px offset. Monospaced numeric inputs for direct routing, account lookups, and SWIFT verification. Checkboxes and radio buttons use the primary brand hue when checked with standard 2px micro-radii.