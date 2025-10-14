# SonarCloud Rule S1788: Default parameters should be last

## Rule Description

Function parameters with default values should be declared after the function parameters without default values.

## Rationale

Default parameters are meant to provide flexibility in function calls, allowing callers to specify fewer arguments while maintaining functionality. When default parameters are placed before non-default parameters, it becomes problematic because:

1. Callers must re-specify defaulted values
2. They must pass `undefined` to use non-default parameters

This reduces code readability and makes the API harder to use correctly.

## Examples

### Noncompliant Code

```typescript
function multiply(a = 1, b: number) {
    // Noncompliant
    return a * b;
}

// Caller must use undefined to use the default
multiply(undefined, 5); // Awkward
```

### Compliant Code

```typescript
function multiply(b: number, a = 1) {
    return a * b;
}

// Caller can simply omit the default parameter
multiply(5); // Clean
```

## Important Exceptions

### Redux Reducers

In Redux reducers, it's conventional to use default argument syntax for initial state, with the action parameter being mandatory:

```typescript
export default function appReducer(state = initialState, action) {
    switch (action.type) {
        default:
            return state;
    }
}
```

This pattern is widely accepted in the Redux community and should not be changed.

## Fix Pattern

1. Identify parameters with default values
2. Reorder parameters so all required (non-default) parameters come first
3. Place all parameters with default values at the end
4. **Critical**: Update ALL call sites to match the new parameter order

## Common Pitfalls

-   Forgetting to update call sites after reordering parameters
-   Not considering the semantic meaning of parameter positions
-   Changing parameter order in a way that breaks the function's intuitive API

## Impact

-   **Severity**: Major
-   **Clean Code Attribute**: Focused
-   **Impact on Maintainability**: Medium
