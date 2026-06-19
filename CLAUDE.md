# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server (binds to 0.0.0.0:5173)
npm run build      # Type-check + Vite production build → dist/
npm run check      # TypeScript type-check only (no emit)
npm run lint       # ESLint
npm run preview    # Serve the production build locally
```

No test suite exists in this repo.

## Environment

Copy `.env` and set:
```
VITE_API_URL=http://localhost:3000
```

All API calls go to `${VITE_API_URL}/api/...`. The backend is a separate service (not in this repo).

## Architecture

### Provider hierarchy (`src/main.tsx` → `src/App.tsx`)

```
AuthProvider          ← JWT lifecycle (localStorage "token"), expiry check, user extraction
  ThemeProvider       ← color palette + category colors, persisted to localStorage + backend
    Router
      ProtectedRoute  ← redirects unauthenticated users to /login
      SuperAdminRoute ← additionally checks user.super_admin
```

### State management — two separate stores

| Store | Location | Purpose |
|---|---|---|
| **AuthContext** | `src/contexts/AuthContext.tsx` | Auth state: `user`, `token`, `login`, `logout`, `register`. JWT decoded client-side via `src/utils/jwt.ts`; no `/me` endpoint call. |
| **Zustand appStore** | `src/stores/appStore.ts` | All app data: transactions, accounts, plaidItems, dashboardStats, filters, UI state. Two fields are persisted to `localStorage`: `transactionTableColumns` and `sidebarCollapsedDesktop`. |

Pages fetch their own data and write into `appStore` — there is no centralized data fetching layer.

### API layer (`src/services/api.ts`)

Single `ApiService` class, singleton exported as `apiService`. All requests go through `fetchWithErrorHandling` which:
- Attaches `Authorization: Bearer <token>` header
- On 401: clears token from memory and localStorage (no redirect)
- On 403 with "locked" in body: clears token and redirects to `/login`
- Returns `null` for 204 / empty responses

### Plaid integration

`PlaidLinkButton` (`src/components/PlaidLinkButton.tsx`) handles the full OAuth flow:
- On click: calls `/api/plaid/create-link-token`, mounts `usePlaidLink` hook
- Stores `link_token` in `localStorage` under `"plaid_link_token"` for OAuth redirect resume
- On OAuth return (`?oauth_state_id=` in URL): auto-opens the link UI with the stored token
- On success: calls parent `onSuccess(publicToken)` which should call `apiService.exchangePublicToken`

### Theming (`src/theme/`)

`ThemeId` = `'default' | 'earth' | 'pastel' | 'slate' | 'aurora' | 'monochrome'`.

Persisted as a string in `localStorage` key `"colorTheme"` and synced to `user.theme` via `PUT /api/user`. Monochrome is serialized as `"monochrome:#<hex>"`.

`useTheme()` exposes `palette` (semantic colors + progress tier colors + per-category colors) and `getCategoryColor(cat)`. Charts and UI components should consume colors from `useTheme()` rather than hardcoding hex values.

### Transaction categories

Plaid personal finance categories (e.g. `FOOD_AND_DRINK`, `TRANSPORTATION`) are the canonical categorization type. Defined as a TypeScript union in `src/constants/personalFinanceCategories.ts`. `TransactionRule` records map conditions → `personal_finance_category`.

### Transaction rules

Rules (`src/pages/TransactionRules.tsx`) apply a `ConditionNode` tree (AND/OR of leaf conditions on `name | merchant_name | amount | account`) to recategorize transactions. The condition builder UI is in `src/components/transactionRules/ConditionsBuilder.tsx`. Rules are triggered server-side via `POST /api/transaction-rules/trigger`.

### Layout

`Layout` (`src/components/Layout.tsx`) renders a collapsible sidebar on `md+` and a `BottomNav` on mobile. The Admin nav item only appears for `user.super_admin === true`. Pages wrap their content in `<Layout>` directly.

### Path aliases

`vite-tsconfig-paths` is configured, so `tsconfig.json` path aliases resolve in Vite. Check `tsconfig.json` for any configured aliases before adding new import paths.
