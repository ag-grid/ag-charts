# 05: Type System Simplification

**Goal**: Reduce complexity while maintaining type safety

## 📋 Overview

This document details the simplification of the type system from 42+ generic parameters to less than 10, while maintaining full type safety.

## The Problem: Complex Generic Hierarchy

### Current Complexity

```typescript
// Current: 42+ generic parameters across hierarchy
export abstract class CartesianSeries<
        TNode extends Node<any>,
        TOpts extends object,
        TProps extends CartesianSeriesProperties<TOpts>,
        TDatum extends CartesianSeriesNodeDatum,
        TLabel extends SeriesNodeDatum<number> = TDatum,
        TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel>,
        TStackContext = never,
    >
    extends DataModelSeries<TDatum[], TProps, TDatum, TLabel, TContext>
    implements CartesianSeriesApi<TOpts> {
    // Implementation details buried in generics
}
```

### Issues with Current Approach

-   **Cognitive Overload**: Developers must understand all generic parameters
-   **Type Inference Problems**: TypeScript struggles with deep generic chains
-   **Maintenance Burden**: Changes require updating multiple generic signatures
-   **Poor Developer Experience**: Cryptic error messages, slow IDE performance

## The Solution: Simplified with Runtime Guards

### Target Architecture

```typescript
// Target: Simple interfaces with runtime type checking
interface Series {
    readonly type: SeriesType;
    readonly properties: SeriesProperties;

    // Component composition - no complex generics needed
    readonly dataProcessor: DataProcessor;
    readonly coordinateSystem: CoordinateSystem;
    readonly renderer: SeriesRenderer;
    readonly interactionHandler: InteractionHandler;
}

// Use discriminated unions for type safety
type SeriesType = 'line' | 'bar' | 'area' | 'scatter' | 'bubble' | 'pie';

interface LineSeriesProperties extends SeriesProperties {
    type: 'line';
    stroke: string;
    strokeWidth: number;
    interpolation: 'linear' | 'smooth' | 'step';
}

interface BarSeriesProperties extends SeriesProperties {
    type: 'bar';
    fill: string;
    cornerRadius: number;
    spacing: number;
}

// Runtime type guards replace complex generics
function isLineSeries(series: Series): series is Series & { properties: LineSeriesProperties } {
    return series.type === 'line';
}

function isCartesianSeries(series: Series): boolean {
    return ['line', 'bar', 'area', 'scatter'].includes(series.type);
}
```

## Coordinate System Abstraction

```typescript
// Coordinate system handles type-specific behavior
interface CoordinateSystem {
    type: 'cartesian' | 'polar' | 'hierarchy';
    transformPoint(datum: any): Point;
    inverseTransform(point: Point): any;

    // Type guards
    isCartesian(): this is CartesianCoordinateSystem;
    isPolar(): this is PolarCoordinateSystem;
}

class CartesianCoordinateSystem implements CoordinateSystem {
    readonly type = 'cartesian';

    constructor(public readonly axes: Map<AxisDirection, ChartAxis>) {}

    transformPoint(datum: CartesianDatum): Point {
        const xAxis = this.axes.get(ChartAxisDirection.X)!;
        const yAxis = this.axes.get(ChartAxisDirection.Y)!;

        return {
            x: xAxis.scale.convert(datum.x),
            y: yAxis.scale.convert(datum.y),
        };
    }

    isCartesian(): this is CartesianCoordinateSystem {
        return true;
    }

    isPolar(): this is PolarCoordinateSystem {
        return false;
    }
}
```

## Type-Safe Component Factory

```typescript
// Factory with proper type inference
class SeriesFactory {
    static create<T extends SeriesType>(type: T, config: SeriesConfigMap[T]): SeriesMap[T] {
        switch (type) {
            case 'line':
                return this.createLineSeries(config as LineSeriesConfig) as SeriesMap[T];
            case 'bar':
                return this.createBarSeries(config as BarSeriesConfig) as SeriesMap[T];
            case 'scatter':
                return this.createScatterSeries(config as ScatterSeriesConfig) as SeriesMap[T];
            default:
                throw new Error(`Unknown series type: ${type}`);
        }
    }

    private static createLineSeries(config: LineSeriesConfig): LineSeries {
        return new ModernLineSeries({
            properties: config.properties,
            dataProcessor: new CartesianDataProcessor(),
            coordinateSystem: new CartesianCoordinateSystem(config.axes),
            renderer: new PathRenderingBehavior(),
            // ... other components
        });
    }
}

// Usage with full type safety
const lineSeries = SeriesFactory.create('line', {
    properties: { type: 'line', stroke: '#ff0000', strokeWidth: 2 },
    axes: axesMap,
    // TypeScript knows this must be LineSeriesConfig
});
```

## Simplified Data Types

### Before: Complex Generic Data Types

```typescript
// Current: Complex nested generics
type CartesianSeriesNodeDatum<TDatum = any> = SeriesNodeDatum<number> & {
    readonly xValue: number;
    readonly yValue: number;
    readonly xKey?: string;
    readonly yKey?: string;
};

type CartesianSeriesNodeDataContext<
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number>,
> = SeriesNodeDataContext<TDatum, TLabel> & {
    scales: { x: Scale; y: Scale };
};
```

### After: Simple Concrete Types

```typescript
// Target: Simple, concrete types
interface CartesianDatum {
    x: number | string | Date;
    y: number;
    [key: string]: any; // Additional properties
}

interface ProcessedCartesianDatum extends CartesianDatum {
    xScaled: number;
    yScaled: number;
    valid: boolean;
}

interface RenderContext {
    scales: ScaleMap;
    highlightState: HighlightState;
    animationPhase: number;
}
```

## Type Guards and Validators

```typescript
// Runtime type validation
class TypeValidator {
    static isValidCartesianData(data: unknown[]): data is CartesianDatum[] {
        return data.every(
            (d) => typeof d === 'object' && d !== null && 'x' in d && 'y' in d && typeof (d as any).y === 'number'
        );
    }

    static assertSeriesType<T extends SeriesType>(series: Series, expectedType: T): asserts series is SeriesMap[T] {
        if (series.type !== expectedType) {
            throw new Error(`Expected ${expectedType} series, got ${series.type}`);
        }
    }
}

// Usage
function processLineSeries(series: Series) {
    TypeValidator.assertSeriesType(series, 'line');
    // TypeScript now knows series is LineSeries
    const strokeWidth = series.properties.strokeWidth;
}
```

## Migration Path

### Step 1: Create Type Mappings

```typescript
// Map old generic types to new simple types
type LegacyToModernTypeMap = {
    CartesianSeries<Path, any, any, any>: LineSeries;
    CartesianSeries<Rect, any, any, any>: BarSeries;
    PolarSeries<Sector, any, any, any>: PieSeries;
};
```

### Step 2: Adapter with Type Conversion

```typescript
class TypeAdapter {
    static modernizeSeriesType(legacySeries: any): Series {
        // Detect legacy series type
        const seriesType = this.detectSeriesType(legacySeries);

        // Convert to modern type
        return this.createModernSeries(seriesType, legacySeries);
    }

    private static detectSeriesType(legacySeries: any): SeriesType {
        // Use runtime checks to determine type
        if (legacySeries instanceof LineSeries) return 'line';
        if (legacySeries instanceof BarSeries) return 'bar';
        // ... etc
    }
}
```

## Benefits of Simplified Type System

### Developer Experience

-   **Clearer Error Messages**: Simple types produce readable errors
-   **Faster IDE Performance**: Less complex type inference
-   **Easier Debugging**: Types are intuitive and predictable
-   **Better Documentation**: Simple types are self-documenting

### Maintainability

-   **Reduced Complexity**: From 42+ to <10 generic parameters
-   **Easier Refactoring**: Changes don't cascade through generic chains
-   **Clear Contracts**: Interfaces are explicit and simple
-   **Better Testing**: Easy to mock and test with simple types

### Performance

-   **Faster Compilation**: TypeScript processes simple types faster
-   **Better Tree-Shaking**: Clear type boundaries enable optimization
-   **Reduced Bundle Size**: Less type metadata in production

## Examples

### Creating a New Series

```typescript
// Before: Complex generic signature
class CustomSeries extends CartesianSeries<
    CustomNode,
    CustomOptions,
    CustomProperties<CustomOptions>,
    CustomDatum,
    CustomLabel,
    CustomContext<CustomDatum, CustomLabel>,
    never
> {
    // Implementation
}

// After: Simple and clear
class CustomSeries implements Series {
    readonly type = 'custom';
    readonly properties: CustomSeriesProperties;

    constructor(config: CustomSeriesConfig) {
        this.properties = config.properties;
        // Simple composition
    }
}
```

### Using Series in Application Code

```typescript
// Before: Complex type annotations
function processChart(
    series: CartesianSeries<any, any, any, any, any, any, any>[]
): void {
    // Processing logic
}

// After: Simple and clear
function processChart(series: Series[]): void {
    series.forEach(s => {
        if (isCartesianSeries(s)) {
            // Handle cartesian series
        } else if (isPolarSeries(s)) {
            // Handle polar series
        }
    });
}
```

---

**Next**: [06: Testing and Migration](06-testing-migration.md) - Testing strategy and migration examples
