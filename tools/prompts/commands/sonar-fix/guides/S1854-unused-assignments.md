# Unused assignments should be removed

Rule ID: typescript:S1854

Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS1854&organization=ag-grid

Dead stores refer to assignments made to local variables that are subsequently never used or immediately overwritten. Such assignments are unnecessary and don't contribute to the functionality or clarity of the code.

**Key Issues:**

-   Wastes computation resources
-   Confuses code readers about intent
-   May indicate logic errors
-   Clutters the codebase with unused code

**Clean Code Attributes:**

-   Tags: cwe, unused
-   Severity: Major
-   Type: Code Smell
-   Related: CWE-563 (Assignment to Variable without Use)
-   Impact on Maintainability: Medium

## Example Violations

```typescript
// Noncompliant: Variable assigned but immediately overwritten
function foo(y) {
    let x = 100; // Dead store - never used
    x = 150; // Dead store - overwritten before use
    x = 200;
    return x + y;
}
```

```typescript
// Noncompliant: Assignment made but variable not used
function process(data) {
    let result = transform(data); // Assigned but never read
    result = calculate(data); // Previous assignment was wasted
    return result;
}
```

```typescript
// Noncompliant: Parameter reassigned without using original
function compute(value) {
    value = value * 2; // Original value never used before overwrite
    value = value + 10;
    return value;
}
```

## Example Fixes

```typescript
// Compliant: Remove unnecessary assignments
function foo(y) {
    let x = 200; // Only assign the final value
    return x + y;
}
```

```typescript
// Compliant: Remove the unused first assignment
function process(data) {
    let result = calculate(data);
    return result;
}
```

```typescript
// Compliant: Directly compute without intermediate assignments
function compute(value) {
    return value * 2 + 10;
}
```

## AG Charts Context

### Common Patterns in AG Charts

In AG Charts, unused assignments typically appear in:

1. **Data processing pipelines:**

    ```typescript
    // Before
    function processData(input) {
        let data = input; // Unused if immediately overwritten
        data = validate(input);
        data = transform(data);
        return data;
    }

    // After
    function processData(input) {
        let data = validate(input);
        data = transform(data);
        return data;
    }

    // Or even better:
    function processData(input) {
        return transform(validate(input));
    }
    ```

2. **Coordinate calculations:**

    ```typescript
    // Before
    function calculatePosition(datum) {
        let x = 0; // Dead store
        let y = 0; // Dead store
        x = scaleX(datum.x);
        y = scaleY(datum.y);
        return { x, y };
    }

    // After
    function calculatePosition(datum) {
        const x = scaleX(datum.x);
        const y = scaleY(datum.y);
        return { x, y };
    }
    ```

3. **Accumulator initialization:**
    ```typescript
    // Before
    function sumValues(data) {
        let sum = 0;
        sum = data.reduce((acc, val) => acc + val, 0); // Initial 0 unused
        return sum;
    }
    // After
    function sumValues(data) {
        return data.reduce((acc, val) => acc + val, 0);
    }
    ```

### Exceptions (NOT Flagged by This Rule)

The following patterns are explicitly allowed and will not trigger violations:

1. **Common initialization values:**

    ```typescript
    let x = 0; // Allowed
    let y = 1; // Allowed
    let z = -1; // Allowed
    let obj = {}; // Allowed
    let arr = []; // Allowed
    let str = ''; // Allowed
    let flag = true; // Allowed
    let flag2 = false; // Allowed
    let maybe = undefined; // Allowed
    ```

2. **Variables starting with underscore:**

    ```typescript
    let _temp = calculate(); // Allowed - underscore prefix indicates intentional
    ```

3. **Assignment of null:**

    ```typescript
    let element = null; // Allowed
    ```

4. **Increment/decrement expressions:**

    ```typescript
    let count = 0;
    count++; // Allowed even if not read before next assignment
    ```

5. **Object destructuring with rest:**
    ```typescript
    const { used, ...rest } = obj; // Allowed
    ```

### How to Fix

1. **Identify the dead store:** Look for assignments that are never read before being overwritten
2. **Remove unnecessary assignment:** Delete the line if it serves no purpose
3. **Simplify logic:** Consider if the variable is needed at all
4. **Check for side effects:** Ensure the removed code didn't have important side effects

### Example Refactoring

```typescript
// Before: Multiple dead stores
function calculateBounds(data) {
    let minX = 0; // Dead store
    let maxX = 0; // Dead store
    let minY = 0; // Dead store
    let maxY = 0; // Dead store

    minX = Math.min(...data.map((d) => d.x));
    maxX = Math.max(...data.map((d) => d.x));
    minY = Math.min(...data.map((d) => d.y));
    maxY = Math.max(...data.map((d) => d.y));

    return { minX, maxX, minY, maxY };
}

// After: Direct initialization
function calculateBounds(data) {
    const minX = Math.min(...data.map((d) => d.x));
    const maxX = Math.max(...data.map((d) => d.x));
    const minY = Math.min(...data.map((d) => d.y));
    const maxY = Math.max(...data.map((d) => d.y));

    return { minX, maxX, minY, maxY };
}
```

### Watch Out For

-   **Side effects:** Ensure removed assignments didn't have side effects (function calls, etc.)
-   **Debugging code:** Sometimes developers add assignments for debugging; remove these in production code
-   **Logic errors:** A dead store might indicate a logic bug where a value should have been used

### Testing After Changes

-   Existing tests should continue to pass
-   No behavior should change
-   If tests fail, investigate whether the "dead" assignment had hidden side effects

### References

-   [CWE-563: Assignment to Variable without Use](https://cwe.mitre.org/data/definitions/563.html)
-   [Clean Code: Meaningful Names](https://github.com/ryanmcdermott/clean-code-javascript#meaningful-and-pronounceable-variable-names)
