# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start        # dev server at http://localhost:3000
npm run build    # production build
npm test         # run tests in watch mode
npm test -- --watchAll=false                        # run all tests once
npm test -- --testNamePattern "MyTest"              # run a specific test
npm test -- --testPathPattern "ComponentName"       # run tests in a specific file
```

The project uses Create React App (react-scripts). There is no eject — all webpack/babel config is managed by react-scripts.

## Environment

Requires a `.env` file with:
```
REACT_APP_API_BASE_URL=<backend URL>
```

## Architecture

**Stack**: React 19, TypeScript, Redux Toolkit + RTK Query, redux-persist, React Router v7, Tailwind CSS v3, Formik/Yup, Recharts, `@react-pdf/renderer`, `@tanstack/react-table`, Sentry.

### Routing and Role-Based Access

Routes are split by role prefix. After login, the backend response determines which prefix the user lands on:

| Prefix | Accessible pages |
|--------|-----------------|
| `/admin` | dashboard, inventory, add/edit product, SKUs, search, users, account, POS |
| `/cashier` | search, inventory, view-product, account, POS |
| `/partsman` | search, inventory, view-product, account |
| `/custom` | search, inventory, view-product, account |

All authenticated pages share `AuthorizedLayout` ([src/app/pages/authorized/shared/authorized-layout.tsx](src/app/pages/authorized/shared/authorized-layout.tsx)), which runs an admin session check on mount and renders the responsive shell (sidebar on desktop, mobile header + drawer on mobile).

### State Management

Redux store is in [src/store/](src/store/). Key slices:

- **user** — JWT token and session info; persisted to `sessionStorage`. The `clearSession` action triggers full logout: clears localStorage, purges persist store, and redirects to `/`. Any 401 API response auto-dispatches `clearSession` via the base query handler.
- **app** — global UI flags (`isMobile`, `isThresholdResponsive`, `isAppLoading`). Mobile breakpoint is 1020px; secondary threshold is 630px.
- **pos** — cart state, search results, active tab, partsman assignment, discount, and active transaction ID. Not persisted (in-memory only).
- **inventory / search / editProduct / addProduct / viewProduct / dashboard** — page-level UI state, most persisted to `sessionStorage`.

### API Layer

All API modules live in [src/store/apis/](src/store/apis/) and are built with RTK Query (`createApi`). Every request goes through `baseQueryWithAuthHandler` ([src/store/rtk-base-query.ts](src/store/rtk-base-query.ts)), which injects the Bearer token from `store.user.token` and dispatches `clearSession` on 401.

APIs:
- **productsApi** — CRUD for products, includes image upload via `FormData`
- **userApi** — auth (login/logout/signup), user management, password change
- **skusApi** — SKU management (bulk create, check existence, delete)
- **transactionsApi** — create/update/cancel/return transactions, statistics
- **adminApi** — single `adminCheck` endpoint called on admin layout mount

### Key Patterns

**Absolute imports** are configured via `tsconfig.json` — import paths like `store/apis/productsApi`, `app/pages/shared/loading.component`, etc. are all relative to `src/`.

**Responsive layout**: The `app` slice tracks `isMobile` and `isThresholdResponsive` globally. Components read these from Redux rather than using CSS-only breakpoints for layout-level branching.

**Toasts**: Use `react-hot-toast` (`import toast from 'react-hot-toast'`) for all user-facing success/error messages.

**Error tracking**: Sentry is initialized in [src/index.tsx](src/index.tsx). Catch blocks in async handlers should call `Sentry.captureException(error)`.

**PDF export**: `@react-pdf/renderer` is used for invoice and product PDF generation in [src/app/pages/shared/](src/app/pages/shared/).

### Tailwind Theme

Custom design tokens are defined in [tailwind.config.js](tailwind.config.js). The primary color palette uses `text-primary`, `bg-primary`, etc. — the base `primary` color is `#253858` (dark navy). Secondary grays use the `secondary` namespace.
