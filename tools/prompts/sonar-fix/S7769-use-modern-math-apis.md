# Use modern Math APIs instead of legacy expressions

Rule ID: typescript:S7769
Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS7769&organization=ag-grid

Use modern Math APIs (ES2015+) instead of legacy mathematical expressions that combine multiple operations.

## Why This Matters

-   **Readability**: Intent is immediately clear
-   **Performance**: Native implementations can be more optimized
-   **Accuracy**: Reduces floating-point rounding errors
-   **Maintainability**: Standard APIs are easier to understand

## Example Violations

```typescript
// Math.log10 equivalents
const result1 = Math.log(x) * Math.LOG10E; // Noncompliant
const result2 = Math.log(x) / Math.LN10; // Noncompliant

// Math.hypot equivalent
const distance = Math.sqrt(x * x + y * y); // Noncompliant
```

## Example Fixes

```typescript
// Use Math.log10
const result1 = Math.log10(x); // Compliant
const result2 = Math.log10(x); // Compliant

// Use Math.hypot
const distance = Math.hypot(x, y); // Compliant
```

## Common Patterns

### Math.log10

**Before:** `Math.log(x) / Math.LN10` or `Math.log(x) * Math.LOG10E`
**After:** `Math.log10(x)`

### Math.log2

**Before:** `Math.log(x) / Math.LN2` or `Math.log(x) * Math.LOG2E`
**After:** `Math.log2(x)`

### Math.hypot (Euclidean distance)

**Before:** `Math.sqrt(x * x + y * y)` or `Math.sqrt(x ** 2 + y ** 2)`
**After:** `Math.hypot(x, y)`

**For 3D:** `Math.hypot(x, y, z)` instead of `Math.sqrt(x * x + y * y + z * z)`

## AG Charts Context

In AG Charts, these patterns often appear in:

-   Vector calculations (distances, magnitudes)
-   Scale transformations (especially logarithmic scales)
-   Collision detection and spatial algorithms
-   Canvas coordinate calculations

**Special attention areas:**

-   Logarithmic axis calculations
-   Distance calculations for hit testing
-   Legend and label positioning algorithms
