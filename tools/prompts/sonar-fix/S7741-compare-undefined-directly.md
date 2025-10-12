# Compare with undefined directly instead of using typeof

Rule ID: typescript:S7741
Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS7741&organization=ag-grid

Using `typeof` to check for `undefined` values is unnecessarily verbose. Direct comparison with `undefined` is clearer and more idiomatic in modern JavaScript/TypeScript.

## Why This Matters

-   **Readability**: `value === undefined` is clearer than `typeof value === 'undefined'`
-   **Simplicity**: One less layer of indirection
-   **Modern practice**: Direct comparison is standard in ES5+ environments

## Example Violations

```typescript
if (typeof value === 'undefined') {
    // Noncompliant
    // ...
}

const hasValue = typeof data !== 'undefined'; // Noncompliant
```

## Example Fixes

```typescript
if (value === undefined) {
    // Compliant
    // ...
}

const hasValue = data !== undefined; // Compliant
```

## AG Charts Context

In AG Charts codebase, this pattern may appear in:

-   Optional parameter checks
-   Configuration value validation
-   Default value assignments

### Important Exceptions

Accesses to `globalThis.window` and `globalThis.document` are intentionally checked with `typeof` to ensure they are defined - this is VERY IMPORTANT for the proper functioning of the codebase, DO NOT FIX IN THESE FILES as it will break server-side rendering support in Astro.

**Historical context:**
The `typeof` approach was necessary in pre-ES5 JavaScript to safely check undeclared variables. In modern TypeScript with proper typing, direct comparison is safe and preferred.

**Note:**

-   Use `=== undefined` (not `== undefined`) to avoid matching `null`
-   If checking for both null and undefined, use `== null` (intentional loose equality)
