# Don't use "this" alias

Rule ID: typescript:S7740

Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS7740&organization=ag-grid

This rule suggests using arrow functions instead of assigning `this` to a variable (like `const self = this` or `const that = this`). Arrow functions lexically bind `this`, eliminating the need for such aliases.

**Clean Code Attributes:**

-   Tags: es2015, modern-syntax
-   Severity: Medium
-   Type: Code Smell

## Example Violations

```typescript
// Noncompliant: Using this alias
class MyClass {
    value = 42;

    getValue() {
        const self = this;
        return function () {
            return self.value;
        };
    }
}
```

## Example Fixes

```typescript
// Compliant: Using arrow function
class MyClass {
    value = 42;

    getValue() {
        return () => {
            return this.value;
        };
    }
}
```

## AG Charts Context

### Important Exceptions

⚠️ **CRITICAL: Do NOT apply this rule in performance-critical paths.**

#### Exception 1: Series Rendering Code

**Affected Patterns:**

-   Series classes (`*Series.ts`)
-   Hot rendering paths
-   Animation callbacks
-   Data processing loops

**Rationale:**
Arrow functions as class methods create a new function instance for each object instance, which:

1. **Increases memory usage:** Each instance has its own copy of the function
2. **Breaks prototype chain:** Methods cannot be inherited efficiently
3. **Harms V8 optimization:** Inline caches work better with prototype methods
4. **Impacts GC:** More objects to garbage collect in hot paths

**Example - DO NOT CHANGE:**

```typescript
// CORRECT - Keep `this` assignment in performance-critical code
class LineSeries {
    render() {
        const series = this; // Intentional for performance

        for (const datum of this.data) {
            // Using `series` instead of arrow function
            // to avoid creating closures in hot loop
            processPoint(datum, series.options);
        }
    }
}
```

```typescript
// WRONG - Arrow functions harm performance in hot paths
class LineSeries {
    render = () => {
        // Creates new function per instance
        // Breaks prototype inheritance
        // Worse V8 optimization
    };
}
```

#### Exception 2: Recently Added Series Code

Series code added in recent release cycles (v12.0+) often uses `this` assignment patterns intentionally. These are **especially performance-sensitive** and should not be converted.

**Files to avoid modifying:**

-   `packages/ag-charts-community/src/chart/series/**/*.ts`
-   `packages/ag-charts-enterprise/src/series/**/*.ts`
-   Any file with rendering loops or animation callbacks

#### Exception 3: Callback Registration

When registering callbacks that will be called many times, `this` aliases can be more efficient than arrow functions:

```typescript
// CORRECT - Avoids creating closure on each registration
class Manager {
    register() {
        const manager = this;
        eventEmitter.on('update', function () {
            manager.handleUpdate();
        });
    }
}
```

### When to Apply This Rule

Safe to convert to arrow functions:

-   One-time initialization callbacks
-   Event handlers that fire infrequently
-   Promise callbacks in non-hot paths
-   Test code

**Do NOT convert when:**

-   Code is in a rendering hot path
-   Function is called in a tight loop
-   Code is in series rendering classes
-   Function is a class method that benefits from prototype inheritance
-   Memory/GC pressure is a concern
-   V8 optimization is critical

### Performance Benchmark Notes

If uncertain whether code is performance-critical:

```bash
# Run benchmarks before and after changes
yarn nx benchmark ag-charts-community -- -t "series"
yarn nx benchmark ag-charts-enterprise -- -t "series"
```

Compare memory allocation and frame times to verify no regression.

### Mark as Exception in SonarCloud

For S7740 issues in series code, mark them as **Won't Fix** in SonarCloud with this comment:

```
Exception - arrow functions harm performance in these hot paths.
The `this` assignment pattern is intentional for performance optimization
in series rendering code.
```

### References

-   [V8 Blog: Optimizing prototypes](https://v8.dev/blog/fast-properties)
-   [JavaScript Memory Management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management)
