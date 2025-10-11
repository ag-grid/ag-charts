# Cognitive Complexity of functions should not be too high

Rule ID: typescript:S3776

Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS3776&organization=ag-grid

Cognitive Complexity is a measure of how hard it is to understand the control flow of a unit of code. Functions with high cognitive complexity are difficult to comprehend, maintain, and test.

**Key Principles:**

-   Cognitive complexity increases when code breaks linear reading flow
-   Each nesting level increases complexity
-   Method calls are generally "free" (except recursive calls)
-   Focuses on how hard code is to understand, not just cyclomatic complexity

**Clean Code Attributes:**

-   Tags: architecture, brain-overload
-   Severity: Critical
-   Type: Code Smell

## Example Violations

```typescript
// Noncompliant: Complex conditions without extraction
function calculateFinalPrice(user, cart) {
    let total = calculateTotal(cart);
    if ((user.hasMembership && user.orders > 10 && user.accountActive && !user.hasDiscount) || user.orders === 1) {
        total = applyDiscount(user, total);
    }
    return total;
}
```

```typescript
// Noncompliant: Large function with repeated patterns
function calculateTotal(cart) {
    let total = 0;
    for (let i = 0; i < cart.length; i++) {
        total += cart[i].price;
    }
    for (let i = 0; i < cart.length; i++) {
        total += 0.2 * cart[i].price;
    }
    total += 5 * cart.length;
    return total;
}
```

## Example Fixes

```typescript
// Compliant: Extract complex condition to named function
function calculateFinalPrice(user, cart) {
    let total = calculateTotal(cart);
    if (isEligibleForDiscount(user)) {
        total = applyDiscount(user, total);
    }
    return total;
}

function isEligibleForDiscount(user) {
    return (user.hasMembership && user.orders > 10 && user.accountActive && !user.hasDiscount) || user.orders === 1;
}
```

```typescript
// Compliant: Break down into smaller functions
function calculateTotal(cart) {
    let total = calculateSubtotal(cart);
    total += calculateSalesTax(cart);
    total += calculateShipping(cart);
    return total;
}

function calculateSubtotal(cart) {
    return cart.reduce((sum, item) => sum + item.price, 0);
}

function calculateSalesTax(cart) {
    return cart.reduce((sum, item) => sum + 0.2 * item.price, 0);
}

function calculateShipping(cart) {
    return 5 * cart.length;
}
```

## AG Charts Context

### Common Patterns in AG Charts

In AG Charts, high cognitive complexity typically appears in:

1. **Series rendering logic:**

    ```typescript
    // Before: Complex rendering with many nested conditions
    function render(ctx, data, options) {
        for (const datum of data) {
            if (datum.valid) {
                if (options.showMarkers) {
                    if (datum.highlighted) {
                        // ... complex highlighting logic
                    } else {
                        // ... normal marker logic
                    }
                }
                if (options.showLabels) {
                    // ... label rendering
                }
            }
        }
    }

    // After: Extracted helper methods
    function render(ctx, data, options) {
        for (const datum of data) {
            if (!datum.valid) continue;
            renderMarkers(ctx, datum, options);
            renderLabels(ctx, datum, options);
        }
    }
    ```

2. **Data processing pipelines:**

    ```typescript
    // Before: Monolithic data processor
    function processData(input) {
        // 100+ lines of transformation logic
    }

    // After: Composed pipeline
    function processData(input) {
        const validated = validateData(input);
        const normalized = normalizeData(validated);
        const aggregated = aggregateData(normalized);
        return transformForRender(aggregated);
    }
    ```

3. **Configuration merging:**
    ```typescript
    // Before: Deep nested option merging
    function mergeOptions(defaults, user) {
        // Complex nested logic
    }
    // After: Recursive helper with clear cases
    function mergeOptions(defaults, user) {
        return deepMerge(defaults, user, mergeStrategy);
    }
    ```

### Refactoring Strategies

1. **Extract complex conditions:**

    ```typescript
    // Before
    if (a && b && c || d && e) { ... }

    // After
    if (shouldProceed(a, b, c, d, e)) { ... }
    ```

2. **Use early returns:**

    ```typescript
    // Before: Deep nesting
    function process(data) {
        if (data.valid) {
            if (data.hasContent) {
                // ... main logic
            }
        }
    }

    // After: Guard clauses
    function process(data) {
        if (!data.valid) return;
        if (!data.hasContent) return;
        // ... main logic at top level
    }
    ```

3. **Replace switch/if chains with lookup tables:**

    ```typescript
    // Before
    function getHandler(type) {
        if (type === 'line') return handleLine;
        if (type === 'bar') return handleBar;
        if (type === 'scatter') return handleScatter;
        // ...
    }

    // After
    const handlers = {
        line: handleLine,
        bar: handleBar,
        scatter: handleScatter,
    };
    function getHandler(type) {
        return handlers[type];
    }
    ```

4. **Compose functions:**
    ```typescript
    // Before: One function doing many things
    function processAndRender(data) {
        // validation
        // transformation
        // rendering
        // cleanup
    }
    // After: Composition
    function processAndRender(data) {
        const validated = validate(data);
        const transformed = transform(validated);
        render(transformed);
        cleanup();
    }
    ```

### When to Refactor

-   **Threshold:** Functions with complexity > 15 should be reviewed
-   **Critical:** Functions with complexity > 25 should be refactored
-   **Effort estimation:**
    -   Complexity 15-20: ~15-30 minutes
    -   Complexity 20-30: ~30-60 minutes
    -   Complexity 30+: ~1-2 hours (consider breaking into subtasks)

### Testing After Refactoring

-   Maintain existing tests (behavior should be unchanged)
-   Add unit tests for new extracted functions
-   Verify test coverage hasn't decreased
-   Run benchmarks if performance-critical code was refactored

### References

-   [Cognitive Complexity: A new way of measuring understandability](https://www.sonarsource.com/resources/cognitive-complexity/)
-   [Refactoring: Improving the Design of Existing Code](https://martinfowler.com/books/refactoring.html)
