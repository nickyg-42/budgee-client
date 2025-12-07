## Summary
Implement a full Dashboard refactor to compute all metrics and charts from actual `transactions` and `accounts` data (store or API fallback), remove static demos, and simplify UI per your requirements.

## Data Sources
- Use `useAppStore()` for `transactions` and `accounts` when available.
- Add a guarded loader in Dashboard: if `transactions` or `accounts` are empty, fetch via `apiService`:
  - `getPlaidItems` → `getAccountsFromDB(item.id)` → `getTransactions(account.id)`.
- Do NOT use `apiService.getDashboardStats` fallback mock.

## Top Cards (Current Month)
- Replace static titles with the current month name: `${monthName} Savings Rate`, `${monthName} Expenses`, `${monthName} Income`.
- Compute values from transactions:
  - Current month filter: `t.date.slice(0, 7) === YYYY-MM`.
  - `income = sum(amount >= 0)`, `expenses = sum(abs(amount < 0))`.
  - `savings = income - expenses`.
  - `savings_rate = income > 0 ? (savings / income) * 100 : 0`.
- Compute previous month similarly for change indicators.
- Replace all uses of `dashboardStats.current_month.*` and `previous_month.*` with computed values.

## Pie Chart (Categories)
- Remove the primary/detailed category tab header.
- Add a month selector (last 12 months) with options like `Nov 2025`, `Oct 2025`, etc.
- On selection, compute category totals for that month:
  - Group by `primary_category` (fallback to `category`).
  - Sum `abs(amount)` per category for expenses and also include income categories if needed; show expenses focus per your current design.
- Update left list and `CategoryChart` with computed `CategorySpending[]`.

## Income/Expense Chart (6 Months)
- Remove the Yearly/Monthly toggle.
- Aggregate `transactions` into monthly buckets for the last 12 months and then slice the last 6:
  - For each month: `{ month: 'Nov 2025', income: sum(amount >= 0), expenses: sum(abs(amount < 0)) }`.
- Pass the 6-month slice to `IncomeExpenseChart`.

## Accounts Card (Real Data)
- Replace `dashboardStats.net_worth` with live sum of `accounts[].balance.current`.
- Remove text referencing `previous_month.net_worth` (no source), or compute change only if we later add historical balances.
- Ensure the accounts list shows actual `accounts` from store (already wired) and remove any leftover static mock usage.

## Remove Recurring Transactions Card
- Delete the recurring transactions card entirely from the bottom row.
- Remove `recurringTransactions` load and state in Dashboard.

## Helper Utilities
- Add small utilities inside Dashboard:
  - `asNumber(v)` safe caster.
  - `safePrimaryCategory(t)`.
  - `monthLabel(date)` → `MMM YYYY`.
  - Shared `monthOptions` (last 12 months) for the pie chart selector.

## Error Handling & Guards
- Wrap API loads in try/catch; show a toast on failure and fall back to empty arrays to keep UI responsive.
- Ensure `date` parsing handles both string ISO dates and Date objects.
- Keep StrictMode double-invoke guard if needed (use a ref) to avoid duplicate loads.

## Verification
- Run dev server and verify:
  - Top cards reflect current month values from real transactions.
  - Pie chart updates when selecting different months.
  - Income/Expense chart shows the last 6 months from actual data.
  - Accounts card shows real accounts and net worth equals sum of balances.
  - Recurring transactions card is gone.

## Files to Update
- `src/pages/Dashboard.tsx`: Replace static data, add loaders and memoized computations, remove tabs and recurring card.
- Optionally: reuse grouping utilities in `src/utils/formatters.ts` or inline grouping consistent with Transactions page.

## Notes
- Income positive, expenses negative convention continues as implemented elsewhere.
- If you prefer a shared selector component for months, we can extract it later once the dashboard refactor is in place.