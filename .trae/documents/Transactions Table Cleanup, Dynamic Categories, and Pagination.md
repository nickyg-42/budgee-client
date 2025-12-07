## Objectives
- Remove non-functional controls and unused filters.
- Use real categories from loaded transactions for the Primary Category filter.
- Add client-side pagination (25 rows per page by default).
- Align data types (Transaction.category → string).

## Files to Update
- `src/pages/Transactions.tsx`
- `src/types/index.ts`

## Implementation Steps
### 1) Remove Previous/Next Header Controls
- Delete the header block that renders the table's Previous / Next buttons (currently inside the table card header).
- No replacement there; pagination controls will be rendered below the table.

### 2) Remove Unused Filters from the Filter Row
- Remove the UI blocks for:
  - User dropdown
  - Detailed Category dropdown
  - Tags dropdown
- Update the filter logic to stop reading `transactionFilters.user`, `transactionFilters.detailed_category`, and `transactionFilters.tags`.
- Keep Search, Account, and Primary Category filters.

### 3) Primary Category Dropdown → Dynamic Options
- Compute set of categories from the loaded transactions using a safe accessor:
  - `safePrimaryCategory(t) = t.primary_category || t.category || ''`
- Build unique list and render as `<option>`s.
- When filtering, compare `safePrimaryCategory(transaction) === transactionFilters.primary_category` (when not "All").

### 4) Update Transaction.category Type
- In `src/types/index.ts`, change `Transaction.category: string[]` → `string`.
- Adjust any usage expecting an array in `Transactions.tsx` to use `safePrimaryCategory` (already prepared).

### 5) Add Pagination (25 per page)
- State: `currentPage` (already present), `pageSize = 25`.
- Derive `totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize))`.
- Slice: `pageTransactions = filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize)`.
- Render `pageTransactions` in the table.
- Add a simple footer pager below the table:
  - Show `Page X of Y` and `← Previous` / `Next →` buttons.
  - Disable buttons at bounds.
- Reset `currentPage` to 1 whenever filters change (to avoid out-of-range pages).

## Non-Goals
- No backend changes.
- No store schema changes (we will simply ignore removed filter fields in the UI and logic).

## Verification
- Load Transactions page with existing data.
- Confirm header Previous/Next buttons and extra filters are gone.
- Primary Category options match real categories from transactions.
- Table shows 25 rows by default, with working pager controls.
- Filtering by Search / Account / Primary Category updates the table and total pages correctly.
