# Functions should not have too many parameters

Rule ID: typescript:S107

Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS107&organization=ag-grid

Functions with a long parameter list are difficult to use because maintainers must figure out the role of each parameter and keep track of their position.

**Key Benefits:**

-   **Maintainability:** Easier to understand function purpose and usage
-   **Flexibility:** Options objects allow adding new parameters without breaking existing calls
-   **Clarity:** Named properties are more self-documenting than positional parameters
-   **Refactoring:** Easier to group related parameters and extract reusable types

**Clean Code Attributes:**

-   Tags: convention, maintainability, readability
-   Severity: Major
-   Type: Code Smell
-   Threshold: 7 parameters (default)

## Example Violations

```typescript
// Noncompliant: 8 parameters
function setCoordinates(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number,
    color: string,
    opacity: number
) {
    // ...
}
```

```typescript
// Noncompliant: 9 parameters
function drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: string,
    opacity: number,
    rotation: number,
    scale: number,
    visible: boolean
) {
    // ...
}
```

```typescript
// Noncompliant: 10 parameters - aggregation function
function aggregate(
    data: any[],
    key: string,
    value: string,
    sum: number,
    count: number,
    min: number,
    max: number,
    avg: number,
    grouped: boolean,
    sorted: boolean
) {
    // ...
}
```

## Example Fixes

### Fix 1: Group Related Parameters

```typescript
// Compliant: group coordinates into point objects
interface Point3D {
    x: number;
    y: number;
    z: number;
}

interface RenderStyle {
    color: string;
    opacity: number;
}

function setCoordinates(point1: Point3D, point2: Point3D, style: RenderStyle) {
    // ...
}
```

### Fix 2: Use Options Object

```typescript
// Compliant: use options object
interface DrawOptions {
    position: { x: number; y: number };
    size: { width: number; height: number };
    style: { color: string; opacity: number };
    transform: { rotation: number; scale: number };
    visible: boolean;
}

function drawRect(options: DrawOptions) {
    // ...
}
```

### Fix 3: Split Complex Functions

```typescript
// Compliant: split into focused functions
interface AggregationData {
    sum: number;
    count: number;
    min: number;
    max: number;
    avg: number;
}

function createAggregation(data: any[], key: string, value: string): AggregationData {
    // ...
}

function sortAggregation(agg: AggregationData, sorted: boolean) {
    // ...
}

function groupAggregation(agg: AggregationData, grouped: boolean) {
    // ...
}
```

## AG Charts Context

### Important Exceptions

In AG Charts, some functions are low-level utilities where parameter count is acceptable:

1. **Geometry/Math Functions:** Functions implementing mathematical algorithms (Bezier curves, intersections, etc.) where parameters map directly to mathematical notation should generally NOT be refactored, as:

    - Parameters follow standard mathematical conventions
    - Refactoring would obscure the mathematical relationship
    - Performance-critical code benefits from direct parameter passing
    - Examples: `cubicBezier(x1, y1, cx1, cy1, cx2, cy2, x2, y2)`, `lineIntersection(x1, y1, x2, y2, x3, y3, x4, y4)`

2. **Low-Level Rendering:** Canvas/WebGL drawing primitives that mirror standard APIs

3. **Performance-Critical Code:** Hot paths where object creation overhead matters (benchmark-verified)

### Where to Apply

-   ✅ **High priority:** Public APIs, aggregation functions, frequently-called methods
-   ✅ **Medium priority:** Internal utilities with complex parameter relationships
-   ⚠️ **Low priority:** Low-level math/geometry functions (consider case-by-case)
-   ❌ **Skip:** Functions where parameters follow mathematical conventions and refactoring reduces clarity

### Common Patterns in AG Charts

1. **Axis Formatting:**

    ```typescript
    // Before: 10 parameters
    function formatTick(value, index, fractionDigits, prefix, suffix, locale, date, time, custom, cache) { }

    // After: options object
    interface TickFormatOptions {
        value: any;
        index: number;
        format: {
            fractionDigits?: number;
            prefix?: string;
            suffix?: string;
            locale?: string;
        };
        type: {
            date?: boolean;
            time?: boolean;
        };
        custom?: Function;
        cache?: Map<any, any>;
    }
    function formatTick(options: TickFormatOptions) { }
    ```

2. **Aggregation Functions:**

    ```typescript
    // Before: 13 parameters
    function bubbleAggregate(data, xKey, yKey, sizeKey, xSum, ySum, sizeSum, count, xMin, yMin, sizeMin, xMax, yMax) { }

    // After: grouped parameters
    interface AggregateKeys {
        x: string;
        y: string;
        size: string;
    }

    interface AggregateValues {
        sum: { x: number; y: number; size: number };
        min: { x: number; y: number; size: number };
        max: { x: number; y: number; size: number };
        count: number;
    }

    function bubbleAggregate(data: any[], keys: AggregateKeys, values: AggregateValues) { }
    ```

3. **Constructor Parameters:**
    ```typescript
    // Note: TypeScript parameter properties are IGNORED by this rule
    // This is compliant even with 8+ parameters:
    constructor(
        private readonly id: string,
        protected name: string,
        public value: number,
        // ... more parameter properties
    ) {}
    ```

### Migration Strategy

1. **Identify candidates:**

    - Prioritize functions with 10+ parameters
    - Focus on public APIs and frequently-called methods
    - Skip low-level math/geometry utilities

2. **Group parameters:**

    - Identify logical groupings (coordinates, styles, transforms, etc.)
    - Create well-named interfaces for options objects
    - Consider reusability across similar functions

3. **Refactor systematically:**

    - Create options interface
    - Update function signature
    - Update ALL call sites
    - Run tests to verify behavior unchanged

4. **Performance validation:**
    - For hot paths, benchmark before/after
    - If performance degrades significantly, consider exceptions

### References

-   [Clean Code: Function Arguments](https://learning.oreilly.com/library/view/clean-code-a/9780136083238/) - Robert C. Martin
-   TypeScript Handbook: [Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html)
-   ESLint rule: [max-params](https://eslint.org/docs/latest/rules/max-params)
