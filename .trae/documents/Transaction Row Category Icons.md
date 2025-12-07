## Objectives
- Replace merchant initial avatar in the first column with a relevant icon based on transaction primary category.
- Keep styling consistent and provide graceful fallbacks for unknown categories.

## Icon Mapping (lucide-react)
- TRANSPORTATION → `Car`
- TRAVEL → `Plane`
- FOOD_AND_DRINK → `Utensils`
- ENTERTAINMENT → `Music2`
- TRANSFER_OUT → `ArrowUpRight`
- INCOME → `ArrowDownRight`
- LOAN_PAYMENTS → `CreditCard`
- GENERAL_MERCHANDISE → `ShoppingBag`
- PERSONAL_CARE → `Heart`
- RENT_AND_UTILITIES → `Home`
- Default (unknown) → `Circle`

## Implementation Steps
1. Imports
- Add needed icons to `src/pages/Transactions.tsx` from `lucide-react`.

2. Helpers
- Use existing `safePrimaryCategory(transaction)` to derive the category.
- Add `getCategoryIcon(category: string)` returning the JSX icon.
- Optionally add `getCategoryColor(category)` class names to color the icon wrapper (e.g., bg/pill tint).

3. Table Cell Update
- In the first column, replace the avatar letter span with:
```
<div className={`w-8 h-8 rounded-full flex items-center justify-center ${getCategoryColor(cat)}`}>
  {getCategoryIcon(cat)}
</div>
```
- `cat` is `safePrimaryCategory(transaction)` normalized to uppercase.

4. Fallbacks
- If category is empty/unknown, show the default icon and neutral colors.

## Verification
- Rows show category-specific icons for the listed categories.
- Unknown categories render a generic icon.
- No runtime errors; filters and pagination continue to work.
