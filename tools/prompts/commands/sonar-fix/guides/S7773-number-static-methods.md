# Number static methods and properties should be preferred over global equivalents

Rule ID: typescript:S7773

Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS7773&organization=ag-grid

This rule raises an issue when global functions like `parseInt()`, `parseFloat()`, `isNaN()`, `isFinite()` or global values like `NaN`, `Infinity` are used instead of their `Number` constructor equivalents.

**Key Benefits:**

-   **Improved organization:** Groups related functionality under the Number constructor
-   **Reduced global pollution:** Fewer global namespace collisions
-   **Better behavior:** `Number.isNaN()` and `Number.isFinite()` don't coerce types
-   **Modern standards:** Aligns with ES2015+ best practices

**Clean Code Attributes:**

-   Tags: convention, es2015
-   Severity: Minor
-   Type: Code Smell

## Example Violations

```typescript
// Noncompliant: global parsing functions
const num1 = parseInt('42', 10);
const num2 = parseFloat('3.14');
```

```typescript
// Noncompliant: global check functions
if (isNaN(value)) {
    // handle NaN
}
if (!isFinite(value)) {
    // handle infinity
}
```

```typescript
// Noncompliant: global constants
const invalid = NaN;
const infinite = Infinity;
```

## Example Fixes

```typescript
// Compliant: Number static methods
const num1 = Number.parseInt('42', 10);
const num2 = Number.parseFloat('3.14');
```

```typescript
// Compliant: Number static check methods
if (Number.isNaN(value)) {
    // handle NaN
}
if (!Number.isFinite(value)) {
    // handle infinity
}
```

```typescript
// Compliant: Number constants
const invalid = Number.NaN;
const infinite = Number.POSITIVE_INFINITY;
const negInfinite = Number.NEGATIVE_INFINITY;
```

## AG Charts Context

### Common Patterns in AG Charts

In AG Charts, number parsing and validation appears in:

1. **User input parsing:**

    ```typescript
    // Before
    const parsed = parseFloat(userInput);
    if (isNaN(parsed)) {
        return defaultValue;
    }

    // After
    const parsed = Number.parseFloat(userInput);
    if (Number.isNaN(parsed)) {
        return defaultValue;
    }
    ```

2. **Data validation:**

    ```typescript
    // Before
    function isValidNumber(value: unknown): boolean {
        return typeof value === 'number' && isFinite(value);
    }

    // After
    function isValidNumber(value: unknown): boolean {
        return typeof value === 'number' && Number.isFinite(value);
    }
    ```

3. **Boundary checking:**
    ```typescript
    // Before
    if (value === Infinity || value === -Infinity) {
        clamp(value);
    }
    // After
    if (value === Number.POSITIVE_INFINITY || value === Number.NEGATIVE_INFINITY) {
        clamp(value);
    }
    ```

### Special Considerations

-   **Type coercion difference:**

    ```typescript
    // Global isNaN coerces to number first
    isNaN('hello'); // true (coerces 'hello' to NaN)

    // Number.isNaN does NOT coerce
    Number.isNaN('hello'); // false (string is not NaN)
    Number.isNaN(NaN); // true
    ```

-   **isFinite difference:**

    ```typescript
    // Global isFinite coerces to number first
    isFinite('123'); // true (coerces '123' to 123)

    // Number.isFinite does NOT coerce
    Number.isFinite('123'); // false (string is not finite)
    Number.isFinite(123); // true
    ```

-   **Radix parameter:** Always specify radix for `Number.parseInt()`:

    ```typescript
    // Bad: ambiguous base
    Number.parseInt('010'); // Could be 8 or 10

    // Good: explicit base
    Number.parseInt('010', 10); // Always 10
    ```

### Migration Checklist

1. Replace `parseInt()` → `Number.parseInt()`
2. Replace `parseFloat()` → `Number.parseFloat()`
3. Replace `isNaN()` → `Number.isNaN()` (watch for type coercion!)
4. Replace `isFinite()` → `Number.isFinite()` (watch for type coercion!)
5. Replace `NaN` → `Number.NaN`
6. Replace `Infinity` → `Number.POSITIVE_INFINITY` or `Number.NEGATIVE_INFINITY`
7. Test thoroughly, especially validation logic that may rely on type coercion

### References

-   [MDN: Number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number)
-   [MDN: Number.isNaN()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN)
-   [MDN: Number.isFinite()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite)
