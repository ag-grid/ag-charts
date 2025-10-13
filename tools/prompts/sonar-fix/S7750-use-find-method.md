# Use .find() instead of .filter()[0] for single element retrieval

Rule ID: typescript:S7750
Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS7750&organization=ag-grid

Array methods `.find()` and `.findLast()` should be preferred over `.filter()` followed by array access for retrieving single elements.

## Why This Matters

-   **Performance**: `.find()` stops at first match; `.filter()` processes entire array
-   **Efficiency**: No intermediate array creation
-   **Intent**: Explicitly shows you want one element, not a filtered list
-   **Readability**: More semantic and easier to understand

## Example Violations

```typescript
const item = array.filter((x) => isUnicorn(x))[0]; // Noncompliant
const last = array.filter((x) => isValid(x)).at(-1); // Noncompliant
const first = array.filter((x) => matches(x)).shift(); // Noncompliant
```

## Example Fixes

```typescript
const item = array.find((x) => isUnicorn(x)); // Compliant
const last = array.findLast((x) => isValid(x)); // Compliant (ES2023)
const first = array.find((x) => matches(x)); // Compliant
```

## Common Patterns

### First matching element

**Before:** `.filter(predicate)[0]` or `.filter(predicate).shift()`
**After:** `.find(predicate)`

### Last matching element

**Before:** `.filter(predicate).at(-1)` or `.filter(predicate).pop()`
**After:** `.findLast(predicate)` (ES2023) or keep filter if not available

### With destructuring

**Before:** `const [first] = array.filter(predicate)`
**After:** `const first = array.find(predicate)`

## AG Charts Context

In AG Charts, this pattern commonly appears in:

-   Finding specific series by type or ID
-   Locating chart elements (axes, legends) by condition
-   Searching for specific data points
-   Looking up configuration options

Example scenarios:

```typescript
// Before
const xAxis = axes.filter(a => a.direction === 'x')[0];

// After
const xAxis = axes.find(a => a.direction === 'x');
```

**Important notes:**

-   `.find()` returns `undefined` if no match found (same as `[0]` on empty array)
-   `.findLast()` requires ES2023 target; check tsconfig before using
-   For performance-critical paths with small arrays, the benefit is minimal but code is still clearer
