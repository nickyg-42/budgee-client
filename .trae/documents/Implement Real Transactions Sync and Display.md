## Goals
- Sync latest transactions per connected institution and display real DB transactions in the Transactions page.
- Remove fallback mock data; use store and API pipeline end-to-end.

## API Calls
- `GET /api/plaid/items` to fetch connected items.
- `GET /api/plaid/accounts/:itemId/db` to fetch accounts from DB for each item.
- `GET /api/plaid/transactions/:itemId/sync` to sync latest transactions from Plaid into DB per item.
- `GET /api/plaid/transactions/:accountId` to fetch transactions from DB per account.

## Transactions Page Changes
1. Data Loading Pipeline
- On mount:
  - Load items → store `plaidItems`.
  - For each item, call sync (`/plaid/transactions/:itemId/sync`).
  - Load accounts for all items → aggregate, store `accounts`.
  - For each account, fetch transactions from DB and aggregate → store `transactions`.
- Use `Promise.all` for parallel fetches; wrap in try/catch with toasts for error feedback.

2. Dynamic Account Names & Filters
- Build a map `accountId → account.name` from store `accounts`.
- Replace static `getAccountName` with dynamic lookup.
- Populate Account filter options from `accounts` (`All` + each account's `name` with `value=account.id`).

3. Remove Mock Data
- Delete fallback mock array; if API errors, surface toast and keep current transactions state.

4. Loading/Errors UX
- Show a spinner or status message while syncing and fetching.
- Use success/error toasts: "Transactions synced", "Failed to sync for {institution}".

## Code Touch Points
- `src/pages/Transactions.tsx`
  - Replace `useEffect` loading block with the sync+fetch pipeline.
  - Add dynamic account name map and filter options.
- `src/stores/appStore.ts`
  - No structural changes; reuse existing `accounts`, `plaidItems`, and setters.
- `src/services/api.ts`
  - Use existing methods: `getPlaidItems`, `getAccountsFromDB`, `syncTransactions`, `getTransactions`.

## Verification
- With connected items and accounts:
  - Trigger Transactions mount → see toast "Transactions synced".
  - Table shows transaction rows retrieved from DB.
  - Account filter lists real account names; selecting an account filters rows by `account_id`.

## Edge Cases
- No items/accounts: show empty state with 0 transactions; skip sync.
- Partial failures: continue syncing others; log and toast failed items; still show fetched transactions.

## Deliverables
- Updated `Transactions.tsx` implementing the pipeline.
- UI uses dynamic data with no hardcoded mocks.
