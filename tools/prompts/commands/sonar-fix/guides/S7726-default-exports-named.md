# Default exports should be named

Rule ID: javascript:S7726

Rule URL: https://sonarcloud.io/api/rules/show?key=javascript%3AS7726&organization=ag-grid

When you export anonymous functions or classes as default exports, it becomes difficult to search for and identify these components throughout your codebase. Named default exports improve code navigation, maintainability, and developer productivity by making it easier to search for and identify components.

**Key Points:**

-   Discourages anonymous default exports
-   Promotes consistent naming for better code navigation
-   Improves maintainability and debugging with better stack traces

**Clean Code Attributes:**

-   Attribute: Identifiable
-   Category: Consistent
-   Impact on Maintainability: Low

## Example Violations

```javascript
// Noncompliant: anonymous function export
export default function () {
    return 'Hello World';
}
```

```javascript
// Noncompliant: anonymous class export
export default class {
    constructor() {
        this.value = 42;
    }
}
```

```javascript
// Noncompliant: anonymous arrow function assigned to variable
const handler = function () {
    // ...
};
export default handler;
```

## Example Fixes

```javascript
// Compliant: named function export
export default function greet() {
    return 'Hello World';
}
```

```javascript
// Compliant: named class export
export default class MyClass {
    constructor() {
        this.value = 42;
    }
}
```

```javascript
// Compliant: named function expression
const handler = function handler() {
    // ...
};
export default handler;
```

## AG Charts Context

### Common Patterns in AG Charts

In AG Charts, this issue typically appears in:

1. **Event handlers and callbacks:**

    ```typescript
    // Before
    const handler = function (event) {
        // Handle event
    };

    // After
    const handler = function handler(event) {
        // Handle event
    };
    ```

2. **Utility function exports:**

    ```typescript
    // Before
    export default function () {
        return createChart();
    }

    // After
    export default function createChartHelper() {
        return createChart();
    }
    ```

3. **Module exports in test files:**
   While less critical in tests, maintaining consistency helps with stack traces during debugging.

### Special Considerations

-   **Arrow functions:** This rule typically applies to `function` keyword declarations, not arrow functions
-   **Stack traces:** Named functions significantly improve error messages and debugging
-   **Minification:** Modern minifiers handle named functions well, so there's no performance penalty

### References

-   [ESLint Plugin Unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn)
-   [MDN: export](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export)
-   [MDN: import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import)
