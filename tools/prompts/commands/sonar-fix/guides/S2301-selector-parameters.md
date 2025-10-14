# Provide multiple methods instead of using selector parameters

Rule ID: typescript:S2301

Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS2301&organization=ag-grid

This rule raises an issue when methods use boolean parameters to select different execution paths. Selector parameters reduce code clarity and make maintenance more difficult.

**Key Issues with Selector Parameters:**

-   Developers calling the method only see the parameter value, not its name
-   Forces developers to guess the method's intent or look up additional documentation
-   Adding more options requires changing the boolean type, potentially breaking existing code
-   Reduces readability at call sites

**Clean Code Attributes:**

-   Tags: clarity, maintainability, readability
-   Severity: Major
-   Type: Code Smell

## Example Violations

```typescript
// Noncompliant: boolean selector parameter
function feed(name: string, isHuman: boolean) {
    if (isHuman) {
        // implementation for human
    } else {
        // implementation for animal
    }
}

// Intent is not clear at call site
feed('Max', false); // does this mean not to feed Max?
```

```typescript
// Noncompliant: method with selector controlling logic
class Renderer {
    render(data: Data, isVertical: boolean) {
        if (isVertical) {
            // vertical rendering logic
        } else {
            // horizontal rendering logic
        }
    }
}

// Unclear what 'true' means
renderer.render(data, true);
```

## Example Fixes

### Option 1: Split into separate methods (preferred)

```typescript
// Compliant: separate methods for clarity
function feedHuman(name: string) {
    offerSushi(name);
}

function feedAnimal(name: string) {
    offerCarrot(name);
}

// Clear intent at call site
feedHuman('Joe');
feedAnimal('Max');
```

```typescript
// Compliant: separate rendering methods
class Renderer {
    renderVertical(data: Data) {
        // vertical rendering logic
    }

    renderHorizontal(data: Data) {
        // horizontal rendering logic
    }
}

// Clear intent
renderer.renderVertical(data);
```

### Option 2: Use descriptive types

```typescript
// Compliant: descriptive type instead of boolean
type EntityType = 'human' | 'animal';

function feed(name: string, entityType: EntityType) {
    if (entityType === 'human') {
        // implementation for human
    } else {
        // implementation for animal
    }
}

feed('Max', 'animal'); // Clear what this means
```

### Option 3: Use object parameters

```typescript
// Compliant: named parameter via object
function feed(name: string, { human = true }) {
    if (human) {
        // implementation for human
    } else {
        // implementation for animal
    }
}

feed('Max', { human: false }); // Clear what false applies to
```

## AG Charts Context

### Common Patterns in AG Charts

In AG Charts, this issue frequently appears in:

1. **Orientation-dependent rendering:**

    ```typescript
    // Before
    class ChartAxis {
        calculatePosition(value: number, isVertical: boolean) {
            if (isVertical) {
                return this.calculateVerticalPosition(value);
            }
            return this.calculateHorizontalPosition(value);
        }
    }

    // After
    class ChartAxis {
        calculateVerticalPosition(value: number) {
            // vertical calculation
        }

        calculateHorizontalPosition(value: number) {
            // horizontal calculation
        }
    }
    ```

2. **Visibility toggles:**

    ```typescript
    // Before
    class MenuItem {
        filterByVisibility(items: Item[], visible: boolean) {
            return items.filter(item => item.visible === visible);
        }
    }

    // After
    class MenuItem {
        filterVisible(items: Item[]) {
            return items.filter(item => item.visible);
        }

        filterHidden(items: Item[]) {
            return items.filter(item => !item.visible);
        }
    }
    ```

3. **Time encoding (UTC vs local):**

    ```typescript
    // Before
    function encodeTime(date: Date, utc: boolean) {
        return utc ? date.getUTCTime() : date.getTime();
    }

    // After
    function encodeTimeUTC(date: Date) {
        return date.getUTCTime();
    }

    function encodeTimeLocal(date: Date) {
        return date.getTime();
    }
    ```

### Important Exceptions

**Do NOT split methods when:**

1. **The boolean is part of configuration options:**

    ```typescript
    // Acceptable - part of options object
    function configure(options: { enabled: boolean; value: number }) {
        // ...
    }
    ```

2. **The method is very simple with minimal branching:**

    ```typescript
    // Acceptable - simple toggle without complex branching
    function setValue(value: number, negate: boolean) {
        return negate ? -value : value;
    }
    ```

3. **Splitting would create significant code duplication:**

    ```typescript
    // Acceptable if the shared logic is substantial
    function process(data: Data, reverse: boolean) {
        // 50 lines of shared setup
        const result = reverse ? data.reverse() : data;
        // 50 lines of shared processing
        return result;
    }
    ```

4. **The method is private/internal and has few call sites:**
    - If a private method has 1-2 call sites and splitting would not improve clarity, keep it as is
    - However, if the call sites would benefit from clearer intent, still split

### Decision Framework

Ask these questions:

1. **Call site clarity:** Would separate methods make call sites more readable?
2. **Logic separation:** Are the branches doing fundamentally different things?
3. **Code duplication:** Would splitting create excessive duplication?
4. **API surface:** Is this a public API where clarity is critical?

If answers are: Yes, Yes, No, Yes → Split the method
If answers are: No, No, Yes, No → Consider keeping as is

### Special Considerations

-   **Performance:** Method splitting has negligible performance impact in modern JS engines
-   **Polymorphism:** If the selector enables polymorphic behavior, consider using strategy pattern instead
-   **Migration:** When splitting public APIs, deprecate the old method rather than removing it immediately

### References

-   [Clean Code: Avoid Passing Booleans](https://martinfowler.com/bliki/FlagArgument.html)
-   [SonarSource Rule S2301](https://rules.sonarsource.com/typescript/RSPEC-2301)
