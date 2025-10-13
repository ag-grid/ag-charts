# SonarCloud Rule S7749: Invalid group length in numeric value

## Rule Description

Numeric separators (underscores) in numeric literals must use consistent grouping. The standard convention is to group digits in sets of 3 from the decimal point.

## Why This Matters

-   **Readability**: Consistent grouping makes large numbers easier to read and understand
-   **Convention**: Groups of 3 match standard comma placement (1,000,000)
-   **Clarity**: Inconsistent grouping can indicate a typo or error in the number

## Invalid Patterns

```typescript
// Inconsistent grouping
const x = 1_00_000; // Mixed groups of 2 and 3
const y = 10_0000; // Mixed groups of 1 and 4
const z = 1_234_56789; // Inconsistent at the end

// Single-digit groups (pointless separator usage)
const a = 1_2_3_4_5;
```

## Valid Patterns

```typescript
// Consistent groups of 3 from decimal point
const x = 100_000; // 100 thousand
const y = 1_000_000; // 1 million
const z = 1_234_567_890; // 1.23 billion

// For decimal numbers, group from the decimal point
const pi = 3.141_592_653_589;

// Hexadecimal: typically groups of 2 or 4
const hex1 = 0xdead_beef;
const hex2 = 0xff_ff_ff_ff;

// Binary: typically groups of 4 or 8
const bin = 0b1111_0000_1010_0101;

// No separator needed for small numbers
const small = 1000; // Fine without separator
```

## How to Fix

1. **Identify the numeric base**: Decimal, hex, binary, etc.
2. **Apply consistent grouping**:
    - Decimal: groups of 3 from the decimal point (right to left)
    - Hexadecimal: groups of 2 or 4 (be consistent)
    - Binary: groups of 4 or 8 (be consistent)
3. **Consider removing separators** for numbers < 10,000 where readability isn't impacted

## Examples from Codebase

### Before

```typescript
// Inconsistent grouping of 2 and 3
const MAX_ITEMS = 1_00_000;
```

### After

```typescript
// Consistent grouping of 3
const MAX_ITEMS = 100_000;
```

## References

-   [SonarSource Rule S7749](https://rules.sonarsource.com/typescript/RSPEC-7749)
-   [TC39 Numeric Separators Proposal](https://github.com/tc39/proposal-numeric-separator)
