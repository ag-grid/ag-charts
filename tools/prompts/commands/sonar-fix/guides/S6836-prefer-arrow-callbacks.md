# Prefer arrow function callbacks

Rule ID: typescript:S6836

Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS6836&organization=ag-grid

Arrow functions provide a more concise syntax for function expressions and don't bind their own `this`, `arguments`, `super`, or `new.target`. For simple callbacks, arrow functions are often preferred for their brevity and lexical `this` binding.

**Clean Code Attributes:**

-   Tags: es2015, modern-syntax
-   Severity: Medium
-   Type: Code Smell

## Example Violations

```typescript
// Noncompliant: Function expression where arrow would suffice
const numbers = [1, 2, 3];
numbers.map(function (n) {
    return n * 2;
});

// Noncompliant: Named function in callback position
setTimeout(function delay() {
    console.log('done');
}, 1000);
```

## Example Fixes

```typescript
// Compliant: Arrow function
const numbers = [1, 2, 3];
numbers.map((n) => n * 2);

// Compliant: Arrow function for callback
setTimeout(() => {
    console.log('done');
}, 1000);
```

## AG Charts Context

### Important Exceptions

⚠️ **CRITICAL: Do NOT convert named function declarations to anonymous arrow functions.**

#### Exception 1: Named Functions for Chrome DevTools Profiling

**Files:**

-   `packages/ag-charts-community/src/util/render.ts`
-   `packages/ag-charts-community/src/chart/legend/legend.ts`
-   Any file with deliberately named inner functions

**Pattern:** Named function declarations inside other functions

**Rationale:**
Named functions appear with their actual names in Chrome DevTools profiler, making performance analysis much easier. Anonymous arrow functions get grouped together under generic names like "(anonymous)" or the variable name, which:

1. **Harms profiling:** Multiple different arrow functions appear as the same entry
2. **Obscures hotspots:** Hard to identify which specific function is causing performance issues
3. **Reduces debuggability:** Stack traces are less informative

**Example - DO NOT CHANGE:**

```typescript
// CORRECT - Keep named functions for profiler visibility
function buildScheduler(scheduleFn, cb, cancelFn) {
    function busy() {
        // Named function shows as "busy" in profiler
        return promiseRunning;
    }

    function done() {
        // Named function shows as "done" in profiler
        promiseRunning = false;
        // ...
    }

    function scheduleCallback() {
        // Named function shows as "scheduleCallback" in profiler
        const count = scheduleCount;
        // ...
    }

    return { schedule, cancel, waitForCompletion };
}
```

```typescript
// WRONG - Arrow functions group together in profiler
function buildScheduler(scheduleFn, cb, cancelFn) {
    const busy = () => promiseRunning; // Shows as "(anonymous)" or "busy" but groups with others

    const done = () => {
        // Profiler may show multiple "(anonymous)" entries
        promiseRunning = false;
    };

    const scheduleCallback = () => {
        // Hard to distinguish from other arrow functions
        const count = scheduleCount;
    };

    return { schedule, cancel, waitForCompletion };
}
```

**Inline Exception Comment:** Added to `render.ts`:

```
// SONARCLOUD EXCEPTION (S6836): Named function declarations are intentionally used throughout
// this file instead of arrow functions. Named functions appear properly in Chrome DevTools
// profiler, whereas anonymous arrow functions get grouped together making profiling difficult.
```

#### Exception 2: Functions Requiring Hoisting

Named function declarations are hoisted, allowing them to be called before their definition. This is sometimes used intentionally for code organization.

```typescript
// CORRECT - Hoisting allows logical code organization
function process(data) {
    return transform(validate(data));

    function validate(d) {
        /* ... */
    }
    function transform(d) {
        /* ... */
    }
}
```

#### Exception 3: TypeScript Control Flow Analysis

In some cases, TypeScript's control flow analysis works differently with named functions vs arrow functions, particularly in exhaustive switch statements with `never` return types.

```typescript
// CORRECT - TypeScript understands exhaustiveness better with function declaration
function calculateDimensions(placement) {
    function unreachable(_a: never): never {
        return undefined as never;
    }

    switch (placement) {
        case 'top':
            return [width, height * 0.2];
        case 'bottom':
            return [width, height * 0.2];
        default:
            unreachable(placement); // TypeScript knows all cases are handled
    }
}
```

### When to Apply This Rule

Safe to convert to arrow functions:

-   Simple inline callbacks (`.map()`, `.filter()`, `.forEach()`)
-   Event handlers where `this` binding is not needed
-   Promise callbacks (`.then()`, `.catch()`)
-   One-liner utility functions

**Do NOT convert when:**

-   Functions are named for profiling/debugging purposes
-   Code relies on function hoisting
-   TypeScript control flow analysis depends on function declarations
-   Functions are in performance-critical paths and naming aids debugging
-   The function has a descriptive name that documents its purpose

### Performance Note

While arrow functions themselves don't have performance overhead, the decision between named functions and arrow functions should consider:

-   **Debugging experience:** Named functions provide better stack traces
-   **Profiling accuracy:** Named functions show distinctly in profilers
-   **Code readability:** Sometimes a named function is more self-documenting

### References

-   [MDN: Arrow functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions)
-   [Chrome DevTools: Performance profiling](https://developer.chrome.com/docs/devtools/performance/)
-   [TypeScript: Control Flow Analysis](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
