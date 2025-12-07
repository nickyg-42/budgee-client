## Objectives
- Add clear column headers to the transactions table.
- Remove the Detailed Category column entirely from table rows.
- Make Date and Amount filters functional using range inputs.

## UI and Logic Changes
### 1) Table Headers
- Add a `<thead>` with columns:
  - Select, Name, Account, Owner, Primary Category, Date, Amount, Actions
- Keep current row order consistent with headers.

### 2) Remove Detailed Category from Rows
- Delete the table cell that renders `detailed_category`.
- No changes to filtering for detailed category (already removed earlier).

### 3) Functional Date and Amount Filters (Ranges)
- Replace single inputs with two inputs each:
  - Date: `From` (`date_from`) and `To` (`date_to`)
  - Amount: `Min` (`amount_min`) and `Max` (`amount_max`)
- Wire `onChange` to `setTransactionFilters` using these keys (already present in store).
- Update the filtering logic:
  - Date: parse `transaction.date` and compare against `date_from`/`date_to` if present
  - Amount: use `asNumber(transaction.amount)` and compare against `amount_min`/`amount_max` if present
- Reset `currentPage` to 1 whenever filters change (prevent out-of-range pages).

## Files to Update
- `src/pages/Transactions.tsx` (table `<thead>`, row removal, filter inputs and logic)

## Verification
- Table displays headers
- No detailed category cells present
- Date/Amount inputs filter rows:
  - Setting only From/Min restricts lower bound
  - Setting only To/Max restricts upper bound
  - Both apply inclusive range
- Pagination updates to reflect filtered totals and stays within bounds