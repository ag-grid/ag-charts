# Use .flatMap() instead of .map().flat()

Rule ID: typescript:S7752
Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS7752&organization=ag-grid

Array methods `.map().flat()` should be replaced with `.flatMap()` for better performance and clearer intent.

## Why This Matters

-   **Performance**: Avoids creating intermediate arrays
-   **Memory**: Reduces memory allocation
-   **Readability**: Single operation is clearer than chained operations
-   **Intent**: Explicitly shows you're mapping and flattening

## Example Violations

```typescript
const result = items.map((item) => transform(item)).flat(); // Noncompliant
const processed = data.map((d) => d.values).flat(); // Noncompliant
```

## Example Fixes

```typescript
const result = items.flatMap((item) => transform(item)); // Compliant
const processed = data.flatMap((d) => d.values); // Compliant
```

## Important Notes

### When to use flatMap

-   When you're mapping to arrays and want to flatten one level
-   When the mapping function returns an array (or multiple values)

### When NOT to replace

```typescript
// DON'T replace if flat() has a depth argument > 1
items.map((x) => transform(x)).flat(2); // Keep as-is

// DON'T replace if operations are separated by other operations
items
    .map((x) => transform(x))
    .filter((x) => x)
    .flat(); // Keep as-is
```

## AG Charts Context

In AG Charts, this pattern may appear in:

-   Data processing pipelines (transforming series data)
-   Collecting child nodes from scene graph traversal
-   Processing stacked bar/area chart data
-   Aggregating values from grouped data

Example from AG Charts context:

```typescript
// Before
const allPoints = series.map(s => s.getDataPoints()).flat();

// After
const allPoints = series.flatMap(s => s.getDataPoints());
```
