# Use String.replaceAll() instead of replace() with global regex

Rule ID: typescript:S7781
Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS7781&organization=ag-grid

Prefer `String#replaceAll()` over `String#replace()` with global regex patterns (the `/g` flag).

## Why This Matters

-   **Readability**: Intent is clearer with `replaceAll()`
-   **Safety**: Avoids issues with regex special characters
-   **Performance**: Can be more efficient for simple string replacements
-   **Maintainability**: Less error-prone than regex patterns

## Example Violations

```typescript
const result = text.replace(/hello/g, 'hi'); // Noncompliant
const cleaned = str.replace(/\s/g, ''); // Noncompliant
```

## Example Fixes

```typescript
const result = text.replaceAll('hello', 'hi'); // Compliant
const cleaned = str.replaceAll(' ', ''); // Compliant when replacing a specific character

// Note: Keep regex for complex patterns
const cleaned = str.replace(/\s+/g, ' '); // OK - complex pattern (one or more spaces)
```

## AG Charts Context

In AG Charts, string replacement often occurs in:

-   License key validation/sanitization
-   Text formatting for labels and tooltips
-   Data processing and sanitization

**When to apply this rule:**

-   Simple literal string replacements
-   Single character replacements

**When NOT to apply:**

-   Complex regex patterns (character classes, quantifiers, alternations)
-   When you need regex features like capturing groups
-   When the pattern truly needs regex power
