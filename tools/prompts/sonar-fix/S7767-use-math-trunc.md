# Use Math.trunc() instead of bitwise operators

Rule ID: typescript:S7767
Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS7767&organization=ag-grid

Bitwise operators like `| 0`, `~~`, `>> 0`, `<< 0`, or `^ 0` should not be used to truncate numbers. Use `Math.trunc()` instead for clearer, more reliable number truncation.

## Why This Matters

-   **Clarity**: `Math.trunc()` explicitly states the intent to truncate
-   **Reliability**: Bitwise operators only work reliably for 32-bit integers
-   **Maintainability**: Future developers immediately understand the code's purpose

## Example Violations

```typescript
const result = value | 0; // Noncompliant
const truncated = ~~value; // Noncompliant
const integer = value >> 0; // Noncompliant
```

## Example Fixes

```typescript
const result = Math.trunc(value); // Compliant
const truncated = Math.trunc(value); // Compliant
const integer = Math.trunc(value); // Compliant
```

## AG Charts Context

In AG Charts, number truncation often occurs in:

-   Canvas coordinate calculations
-   Index calculations for data arrays
-   Dimension calculations for chart elements

Always prefer `Math.trunc()` for clarity and to avoid issues with large numbers outside the 32-bit integer range.
