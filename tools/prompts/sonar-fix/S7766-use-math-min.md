# Use Math.min()/Math.max() to Simplify Ternary Expressions

Rule ID: typescript:S7766
Rule URL: https://sonarcloud.io/api/rules/show?key=typescript:S7766&organization=ag-grid

Replace ternary expressions that implement min/max logic with `Math.min()` or `Math.max()` for better readability and maintainability.

## Example Violations

```typescript
// Noncompliant - using ternary for min logic
const clampedHeight = height > 50 ? 50 : height;
const limitedWidth = width >= 100 ? 100 : width;

// Noncompliant - using ternary for max logic
const minHeight = height < 10 ? 10 : height;
const minWidth = width <= 5 ? 5 : width;
```

## Example Fixes

```typescript
// Compliant - using Math.min()
const clampedHeight = Math.min(height, 50);
const limitedWidth = Math.min(width, 100);

// Compliant - using Math.max()
const minHeight = Math.max(height, 10);
const minWidth = Math.max(width, 5);
```

## Pattern Recognition

-   `x > y ? y : x` → `Math.min(x, y)` (returns the smaller value)
-   `x >= y ? y : x` → `Math.min(x, y)` (returns the smaller value)
-   `x < y ? y : x` → `Math.max(x, y)` (returns the larger value)
-   `x <= y ? y : x` → `Math.max(x, y)` (returns the larger value)

## AG Charts Context

These patterns are common in chart rendering code for:

-   Clamping coordinates to visible bounds
-   Calculating intersection points
-   Determining chart dimensions
-   Computing angle ranges in polar charts

Benefits of using Math.min/max:

-   **Clearer intent**: Immediately obvious what value is being selected
-   **Less error-prone**: No risk of swapping ternary branches
-   **Extensible**: Easy to add more values if needed
-   **Consistent**: Standard pattern across the codebase
