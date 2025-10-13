# Use Unicode-aware string methods for proper character handling

Rule ID: typescript:S7758
Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS7758&organization=ag-grid

Use Unicode-aware methods `codePointAt()` and `String.fromCodePoint()` instead of legacy `charCodeAt()` and `String.fromCharCode()` to properly handle Unicode characters that require surrogate pairs.

## Why This Matters

-   **Correctness**: Handles emoji, mathematical symbols, and other Unicode properly
-   **Internationalization**: Essential for proper multilingual support
-   **Data integrity**: Prevents character corruption
-   **Modern standards**: Follows ES2015+ best practices

## Example Violations

```typescript
const code = '🦄'.charCodeAt(0); // Noncompliant - only gets first surrogate
const char = String.fromCharCode(0x1f984); // Noncompliant - doesn't work for astral plane
```

## Example Fixes

```typescript
const code = '🦄'.codePointAt(0); // Compliant - gets full code point
const char = String.fromCodePoint(0x1f984); // Compliant - creates correct character
```

## Understanding the Issue

### The Problem with charCodeAt()

```typescript
'🦄'.charCodeAt(0); // Returns 55356 (high surrogate only)
'🦄'.charCodeAt(1); // Returns 56836 (low surrogate only)
// Neither value represents the actual character!
```

### The Solution with codePointAt()

```typescript
'🦄'.codePointAt(0); // Returns 129412 (correct code point)
```

## Common Patterns

### Getting character code

**Before:** `str.charCodeAt(index)`
**After:** `str.codePointAt(index)`

### Creating character from code

**Before:** `String.fromCharCode(code)`
**After:** `String.fromCodePoint(code)`

### Iterating over characters

**Before:**

```typescript
for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
}
```

**After:**

```typescript
for (const char of str) {
    const code = char.codePointAt(0);
}
```

## AG Charts Context

In AG Charts, character handling appears in:

-   License key validation and encoding
-   Text measurement and rendering
-   Label truncation and ellipsis
-   Custom text formatting

**Critical areas:**

-   License key processing (packages/ag-charts-enterprise/src/license/)
-   Text rendering in canvas (ensure proper character support)
-   String sanitization and validation

**Note:** For performance-critical code paths dealing with ASCII-only text, `charCodeAt()` may be acceptable with a comment explaining why.
