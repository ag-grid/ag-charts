# Shorthand object properties should be used

Rule ID: typescript:S6550

Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS6550&organization=ag-grid

ECMAScript 2015 introduced shorthand syntax for object literals, allowing you to omit the property value when it matches the property name. This makes code more concise and reduces redundancy.

**Clean Code Attributes:**

-   Tags: es2015, modern-syntax
-   Severity: Medium
-   Type: Code Smell

## Example Violations

```typescript
// Noncompliant: Redundant property assignment
const name = 'Alice';
const age = 30;
const person = {
    name: name,
    age: age,
};
```

```typescript
// Noncompliant: Enum values with computed expressions
enum Flags {
    A = 1,
    B = 2,
    Combined = A | B, // SonarCloud may flag this as non-shorthand
}
```

## Example Fixes

```typescript
// Compliant: Shorthand syntax
const name = 'Alice';
const age = 30;
const person = {
    name,
    age,
};
```

## AG Charts Context

### Important Exceptions

⚠️ **CRITICAL: Do NOT apply this rule to computed enum values with bitwise operations.**

#### Exception 1: Bitflag Enum Values in InteractionManager

**File:** `packages/ag-charts-community/src/chart/interaction/interactionManager.ts`

**Pattern:** Computed enum values using bitwise OR expressions (`Default | Annotations | AnnotationsSelected`)

**Rationale:**
The `InteractionState` enum uses bitflag patterns where combined states are expressed as bitwise OR of base states. This is intentional for:

1. **Maintainability:** Changing a base value automatically updates all dependent combined values
2. **Self-documentation:** The expression `Default | Annotations | AnnotationsSelected` clearly shows which flags are combined
3. **Error prevention:** Manually computing literal values (e.g., `41` instead of `32 | 8 | 1`) is error-prone and hides intent

**Example - DO NOT CHANGE:**

```typescript
// CORRECT - Keep computed expressions for readability
export enum InteractionState {
    Default = 32,
    ZoomDrag = 16,
    Annotations = 8,
    ContextMenu = 4,
    Animation = 2,
    AnnotationsSelected = 1,

    Clickable = Default | Annotations | AnnotationsSelected, // Keep this form!
    Focusable = Default | Animation,
    // ... etc
}
```

```typescript
// WRONG - Do NOT convert to literal values
export enum InteractionState {
    // ...
    Clickable = 41, // Unclear what flags are combined
    Focusable = 34, // Magic number, easy to get wrong
}
```

**Inline Exception Comment:** Added to `interactionManager.ts`:

```
// SONARCLOUD EXCEPTION (S6550): Computed enum values using bitwise OR expressions are
// intentionally kept for maintainability and self-documentation. Converting to literal
// numbers would harm readability and make the bitflag combinations harder to understand.
```

### When to Apply This Rule

Safe to apply in these cases:

-   Simple object literal properties where variable name matches property name
-   Method definitions in object literals
-   Standard property assignments

**Do NOT apply when:**

-   Enum values use computed expressions (bitwise OR, arithmetic, etc.)
-   The "redundant" assignment actually serves documentation purposes
-   The pattern is in performance-critical code where explicit form aids debugging

### References

-   [MDN: Shorthand property names](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#property_definitions)
-   [TypeScript: Enums](https://www.typescriptlang.org/docs/handbook/enums.html)
