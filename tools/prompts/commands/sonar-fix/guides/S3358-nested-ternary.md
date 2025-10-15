# Ternary operators should not be nested

Rule ID: typescript:S3358

Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS3358&organization=ag-grid

Nested ternaries are hard to read and can make the order of operations complex to understand. They should be refactored into if/else statements or extracted into separate functions.

**Key Issues:**

-   Difficult to understand operator precedence and evaluation order
-   Hard to debug and maintain
-   Reduces code readability significantly
-   Makes testing and edge case analysis more difficult

**Clean Code Attributes:**

-   Tags: confusing
-   Severity: Major
-   Type: Code Smell
-   Impact on Maintainability: Medium

## Example Violations

```typescript
// Noncompliant: Nested ternary in single expression
function getReadableStatus(job) {
    return job.isRunning() ? 'Running' : job.hasErrors() ? 'Failed' : 'Succeeded';
}
```

```typescript
// Noncompliant: Complex nested ternary with multiple levels
const value = condition1 ? result1 : condition2 ? result2 : condition3 ? result3 : defaultResult;
```

```typescript
// Noncompliant: Nested ternary with side effects
const action = user.isAdmin() ? performAdminAction() : user.isModerator() ? performModAction() : performUserAction();
```

## Example Fixes

```typescript
// Compliant: Using if/else statements
function getReadableStatus(job) {
    if (job.isRunning()) {
        return 'Running';
    }
    return job.hasErrors() ? 'Failed' : 'Succeeded';
}
```

```typescript
// Compliant: Extract to function with clear logic
function getReadableStatus(job) {
    if (job.isRunning()) return 'Running';
    if (job.hasErrors()) return 'Failed';
    return 'Succeeded';
}
```

```typescript
// Compliant: Multiple clear if/else blocks
let value;
if (condition1) {
    value = result1;
} else if (condition2) {
    value = result2;
} else if (condition3) {
    value = result3;
} else {
    value = defaultResult;
}
```

## AG Charts Context

### Common Patterns in AG Charts

In AG Charts, nested ternaries often appear in:

1. **Conditional rendering logic:**

    ```typescript
    // Before
    const marker = series.visible
        ? datum.highlighted
            ? highlightedMarker
            : datum.selected
              ? selectedMarker
              : normalMarker
        : null;

    // After
    function getMarker(series, datum) {
        if (!series.visible) return null;
        if (datum.highlighted) return highlightedMarker;
        if (datum.selected) return selectedMarker;
        return normalMarker;
    }
    const marker = getMarker(series, datum);
    ```

2. **Value defaulting with multiple fallbacks:**

    ```typescript
    // Before
    const color = options.color ? options.color : datum.color ? datum.color : defaultColor;

    // After
    const color = options.color ?? datum.color ?? defaultColor;
    // Or with explicit logic:
    function resolveColor(options, datum) {
        if (options.color) return options.color;
        if (datum.color) return datum.color;
        return defaultColor;
    }
    ```

3. **Status determination:**

    ```typescript
    // Before
    const status = data.length > 0 ? (data.every((d) => d.valid) ? 'valid' : 'partial') : 'empty';

    // After
    function determineStatus(data) {
        if (data.length === 0) return 'empty';
        if (data.every((d) => d.valid)) return 'valid';
        return 'partial';
    }
    ```

### Refactoring Strategies

1. **Use early returns:**

    ```typescript
    // Instead of nested ternaries
    function getValue() {
        if (condition1) return value1;
        if (condition2) return value2;
        return defaultValue;
    }
    ```

2. **Use nullish coalescing for defaults:**

    ```typescript
    // Simple default chains
    const value = options.value ?? datum.value ?? DEFAULT_VALUE;
    ```

3. **Use lookup tables for mappings:**

    ```typescript
    // Before
    const label = type === 'bar' ? 'Bar' : type === 'line' ? 'Line' : 'Unknown';

    // After
    const TYPE_LABELS = { bar: 'Bar', line: 'Line' };
    const label = TYPE_LABELS[type] ?? 'Unknown';
    ```

4. **Extract to named function:**
    ```typescript
    // Makes intent clear and testable
    function getSeriesLabel(type) {
        if (type === 'bar') return 'Bar';
        if (type === 'line') return 'Line';
        return 'Unknown';
    }
    ```

### Exceptions

In React/JSX contexts, nested ternaries in separate expression containers are allowed:

```tsx
// Acceptable in JSX with clear structure
return (
    <div>
        {condition1 ? <ComponentA /> : <ComponentB />}
        {condition2 ? <ComponentC /> : <ComponentD />}
    </div>
);
```

However, even in JSX, prefer extracting complex logic:

```tsx
// Better: Extract rendering logic
function renderComponent() {
    if (condition1) return <ComponentA />;
    if (condition2) return <ComponentB />;
    return <ComponentC />;
}

return <div>{renderComponent()}</div>;
```

### Testing Considerations

-   Ensure all branches are covered in tests
-   Test edge cases for each condition
-   Verify default/fallback values are correct
-   After refactoring, tests should still pass without modification

### References

-   [Sonar Blog: Stop nesting ternaries in JavaScript](https://www.sonarsource.com/blog/stop-nesting-ternaries-in-javascript/)
-   [MDN: Conditional (ternary) operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Conditional_operator)
