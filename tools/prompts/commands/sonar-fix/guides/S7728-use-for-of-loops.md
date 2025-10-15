# Use "for...of" loops instead of "forEach" method calls

Rule ID: typescript:S7728

Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS7728&organization=ag-grid

This rule raises an issue when the `forEach` method is called on arrays, as `for...of` loops provide better performance and more control flow options.

**Key Issues with forEach:**

-   Performance overhead compared to native loops
-   Limited control flow options (can't use `break`, `continue`, `return`)
-   Type narrowing disruption in TypeScript
-   Reduced code readability in some contexts

**Clean Code Attributes:**

-   Tags: performance, readability
-   Severity: Minor
-   Type: Code Smell

## Example Violations

```typescript
// Noncompliant: basic forEach
array.forEach((element) => {
    console.log(element);
});
```

```typescript
// Noncompliant: forEach with index
items.forEach((item, index) => {
    process(item, index);
});
```

```typescript
// Noncompliant: forEach with complex callback
data.forEach((entry) => {
    if (entry.valid) {
        transform(entry);
    }
});
```

## Example Fixes

```typescript
// Compliant: basic for...of loop
for (const element of array) {
    console.log(element);
}
```

```typescript
// Compliant: for...of with index using entries()
for (const [index, item] of items.entries()) {
    process(item, index);
}
```

```typescript
// Compliant: for...of with conditional logic
for (const entry of data) {
    if (entry.valid) {
        transform(entry);
    }
}
```

## AG Charts Context

### Common Patterns in AG Charts

In AG Charts, this issue frequently appears in:

1. **Series data processing:**

    ```typescript
    // Before
    seriesData.forEach((datum) => {
        validateDatum(datum);
    });

    // After
    for (const datum of seriesData) {
        validateDatum(datum);
    }
    ```

2. **Node iteration in scene graph:**

    ```typescript
    // Before
    children.forEach((child) => {
        child.update();
    });

    // After
    for (const child of children) {
        child.update();
    }
    ```

3. **Configuration updates:**

    ```typescript
    // Before
    options.forEach((option) => {
        applyOption(option);
    });

    // After
    for (const option of options) {
        applyOption(option);
    }
    ```

### Special Considerations

-   **Early exit:** Use `for...of` when you need to break or return early:

    ```typescript
    for (const item of items) {
        if (item.isTarget) {
            return item; // Can return from parent function
        }
    }
    ```

-   **Continue to next iteration:**

    ```typescript
    for (const item of items) {
        if (!item.valid) {
            continue; // Skip invalid items
        }
        process(item);
    }
    ```

-   **Index access:** When you need the index, use `.entries()`:

    ```typescript
    for (const [index, item] of items.entries()) {
        if (index === 0) {
            // Special handling for first item
        }
    }
    ```

-   **Keep forEach when:** There are rare cases where forEach is acceptable:
    -   When using `this` context binding is critical (prefer arrow functions with for...of instead)
    -   In very simple, trivial cases where readability isn't impacted (though for...of is still preferred)

### Performance Benefits

-   **Faster execution:** Native loops are generally 2-3x faster than forEach
-   **Better optimization:** V8 can optimize for...of more effectively
-   **Lower memory overhead:** No function call overhead per iteration

### References

-   [ESLint Plugin Unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/no-array-for-each.md)
-   [MDN: for...of](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for...of)
-   [MDN: Array.prototype.forEach()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
