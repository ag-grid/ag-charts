# SonarCloud Rule S7722: Pass a message to the Error constructor

## Rule Overview

**Rule ID:** `typescript:S7722`
**Severity:** MINOR
**Type:** Code Smell

Constructing an Error without a message reduces code readability and makes debugging harder.

## Examples

### Bad Practice

```typescript
throw new Error();
const stack = new Error().stack;
```

### Good Practice

```typescript
throw new Error('Operation failed');
const stack = new Error('Stack trace for debugging').stack;
```

## Common Patterns in AG Charts

### Pattern 1: Stack Trace Capture for Debugging

When capturing stack traces for debugging purposes, provide a descriptive message:

```typescript
// Before:
const stack = new Error().stack;

// After:
const stack = new Error('Stack trace for debugging').stack;
```

### Pattern 2: Throwing Errors

When throwing errors, always provide context about what went wrong:

```typescript
// Before:
throw new Error();

// After:
throw new Error('Invalid configuration: width must be greater than 0');
```

## Fix Strategy

1. **For debugging stack traces**: Use `'Stack trace for debugging'` or a more specific message if the context is clear
2. **For thrown errors**: Analyze the surrounding code to understand what went wrong and provide a descriptive message
3. **For validation errors**: Include what was expected vs. what was received

## Notes

-   Even when an Error is only used for its stack trace (not thrown), a message improves code clarity
-   The message should help developers understand why the Error was created
-   For debug-only code, a simple message like "Stack trace for debugging" is acceptable
