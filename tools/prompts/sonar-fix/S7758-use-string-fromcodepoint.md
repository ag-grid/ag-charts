# S7758: Use String.fromCodePoint() instead of String.fromCharCode()

## Rule Description

`String.fromCharCode()` is limited to Unicode characters in the Basic Multilingual Plane (BMP), which covers code points from U+0000 to U+FFFF. Characters outside this range (such as emoji, some mathematical symbols, and rare CJK characters) require surrogate pairs and are not correctly handled by `fromCharCode()`.

`String.fromCodePoint()` was introduced in ES2015 and correctly handles all Unicode code points, including those outside the BMP.

## Why This Matters

-   **Correctness**: `fromCodePoint()` correctly handles all Unicode code points
-   **Future-proofing**: Works with supplementary characters without surrogate pair logic
-   **Modern standard**: ES2015+ standard method for character creation

## Fix Pattern

```typescript
// Before
String.fromCharCode(0x1f600); // ❌ Incorrect - produces surrogate pairs incorrectly
String.fromCharCode(codePoint);

// After
String.fromCodePoint(0x1f600); // ✅ Correct - produces 😀
String.fromCodePoint(codePoint);
```

## Common Cases

1. **Single character creation**:

    ```typescript
    // Before
    const char = String.fromCharCode(code);

    // After
    const char = String.fromCodePoint(code);
    ```

2. **Multiple code points**:

    ```typescript
    // Before
    const str = String.fromCharCode(code1, code2, code3);

    // After
    const str = String.fromCodePoint(code1, code2, code3);
    ```

## Notes

-   This is a safe replacement in all cases where code points are expected
-   Performance impact is negligible
-   No behavior change for BMP characters (U+0000 to U+FFFF)
-   Provides correct behavior for supplementary characters
