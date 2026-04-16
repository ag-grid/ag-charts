# Rule-Specific Fix Patterns

Common fix patterns for frequently encountered SonarCloud rules. For detailed per-rule guidance, check the rule guides in `.rulesync/skills/sonar-fix/guides/`.

---

## S7728: Use for...of instead of .forEach()

**Before:**

```typescript
items.forEach((item) => {
    process(item);
});
```

**After:**

```typescript
for (const item of items) {
    process(item);
}
```

**Special cases:**

-   If callback uses `this` context → Keep `.forEach()` with arrow function or add comment
-   If callback has early returns → Use `for...of` with continue/break
-   If index is needed → Use `for (const [index, item] of items.entries())`

---

## S7726: Name anonymous functions

**Before:**

```typescript
const handler = function () {
    // ...
};
```

**After:**

```typescript
const handler = function handler() {
    // ...
};
```

**Context:** Improves stack traces and debugging

---

## S3776: Reduce cognitive complexity

This is a **Tier 3** issue requiring careful refactoring. Common approaches:

1. **Extract helper functions:**

    ```typescript
    // Before: One large function with nested ifs
    function process(data) {
        if (condition1) {
            if (condition2) {
                if (condition3) {
                    // ... deep nesting
                }
            }
        }
    }

    // After: Extracted helpers
    function process(data) {
        if (!shouldProcess(data)) return;
        processValidData(data);
    }

    function shouldProcess(data) {
        return condition1 && condition2 && condition3;
    }
    ```

2. **Use early returns:**

    ```typescript
    // Before: Deep nesting
    if (valid) {
        if (hasData) {
            // ... lots of logic
        }
    }

    // After: Early returns
    if (!valid) return;
    if (!hasData) return;
    // ... logic at top level
    ```

3. **Simplify boolean logic:**

    ```typescript
    // Before: Complex conditions
    if (a && b || c && d || e && f) { ... }

    // After: Named helper
    const shouldProceed = meetsConditionA() || meetsConditionB() || meetsConditionC();
    if (shouldProceed) { ... }
    ```

**Note:** Only attempt S3776 fixes if effort estimate is < 15 minutes. Larger refactors should be done in dedicated tasks.

---

## S3358: Ternary operators should not be nested

**Before:**

```typescript
const result = condition1 ? (condition2 ? value1 : value2) : condition3 ? value3 : value4;
```

**After:**

```typescript
let result;
if (condition1 && condition2) {
    result = value1;
} else if (condition1) {
    result = value2;
} else if (condition3) {
    result = value3;
} else {
    result = value4;
}
```

Or extract to a helper function:

```typescript
const result = determineResult(condition1, condition2, condition3);
```

---

## S1854: Remove unused assignments

**Before:**

```typescript
let value = calculateInitial();
value = calculateFinal(); // First assignment never used
```

**After:**

```typescript
let value = calculateFinal();
```

**Note:** Ensure removing the assignment doesn't affect side effects.
