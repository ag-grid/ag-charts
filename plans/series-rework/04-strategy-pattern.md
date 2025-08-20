# 04: Strategy Pattern Implementation

**Goal**: Enable flexible behavior customization through runtime strategy switching

## 📋 Overview

This document details the implementation of the Strategy pattern to enable runtime behavior customization and flexible series configuration.

## Strategy Interfaces

### 1. Data Aggregation Strategy

```typescript
interface DataAggregationStrategy<TDatum, TProcessed> extends SeriesStrategy {
    aggregate(
        data: TDatum[],
        options: {
            xKey: string;
            yKey?: string;
            aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
            groupBy?: string[];
        }
    ): TProcessed[];

    incrementalUpdate?(existingData: TProcessed[], newData: TDatum[], removedData: TDatum[]): TProcessed[];
}

// Line data aggregation strategy
class LineDataAggregationStrategy implements DataAggregationStrategy<RawDatum, ProcessedLineDatum> {
    readonly id = 'line-aggregation';
    readonly cacheable = true;

    aggregate(data: RawDatum[], options: AggregationOptions): ProcessedLineDatum[] {
        const { xKey, yKey, aggregation = 'none' } = options;

        if (aggregation === 'none') {
            return data.map((d, i) => ({
                id: i,
                x: d[xKey],
                y: d[yKey],
                point: null,
                raw: d,
            }));
        }

        // Group and aggregate
        const grouped = this.groupBy(data, xKey);
        return Array.from(grouped.entries()).map(([x, items]) => ({
            id: x,
            x,
            y: this.aggregateValues(
                items.map((i) => i[yKey]),
                aggregation
            ),
            point: null,
            raw: items[0],
        }));
    }
}
```

### 2. Path Rendering Strategy

```typescript
interface PathRenderingStrategy<TDatum> extends SeriesStrategy {
    readonly supportsSegmentation: boolean;
    readonly supportsInterpolation: boolean;

    generatePath(
        data: TDatum[],
        scales: { x: Scale; y: Scale },
        options: {
            interpolation?: 'linear' | 'smooth' | 'step';
            connectMissingData?: boolean;
            segmentGaps?: boolean;
        }
    ): PathCommand[];
}

// Smooth path rendering strategy
class SmoothPathRenderingStrategy implements PathRenderingStrategy<ProcessedLineDatum> {
    readonly id = 'smooth-path';
    readonly cacheable = true;
    readonly supportsSegmentation = true;
    readonly supportsInterpolation = true;

    private pathCache = new LRUCache<string, PathCommand[]>(100);

    generatePath(data: ProcessedLineDatum[], scales: { x: Scale; y: Scale }, options: PathOptions): PathCommand[] {
        const cacheKey = this.generateCacheKey(data, scales, options);

        if (this.pathCache.has(cacheKey)) {
            return this.pathCache.get(cacheKey)!;
        }

        const path = this.computeSmoothPath(data, scales, options);
        this.pathCache.set(cacheKey, path);

        return path;
    }

    private computeSmoothPath(
        data: ProcessedLineDatum[],
        scales: { x: Scale; y: Scale },
        options: PathOptions
    ): PathCommand[] {
        if (data.length === 0) return [];

        const points = data.map((d) => ({
            x: scales.x.convert(d.x),
            y: scales.y.convert(d.y),
        }));

        // Use smooth curve interpolation (e.g., Catmull-Rom splines)
        return this.generateSmoothCurve(points, options);
    }
}
```

### 3. Interaction Strategy

```typescript
interface InteractionStrategy<TDatum> extends SeriesStrategy {
    readonly supportedIntents: SeriesNodePickIntent[];

    calculateDistance(point: Point, datum: TDatum, intent: SeriesNodePickIntent): number;

    getInteractionBounds(datum: TDatum): BBox;

    handleHover?(datum: TDatum, event: MouseEvent): void;

    handleClick?(datum: TDatum, event: MouseEvent): void;
}

// Exact shape interaction strategy
class ExactShapeInteractionStrategy implements InteractionStrategy<RectangleDatum> {
    readonly id = 'exact-shape';
    readonly supportedIntents = [SeriesNodePickIntent.EXACT];

    calculateDistance(point: Point, datum: RectangleDatum, intent: SeriesNodePickIntent): number {
        const bounds = this.getInteractionBounds(datum);

        if (this.pointInBounds(point, bounds)) {
            return 0; // Inside the shape
        }

        // Calculate distance to nearest edge
        return this.distanceToRectangle(point, bounds);
    }

    getInteractionBounds(datum: RectangleDatum): BBox {
        return {
            x: datum.x,
            y: datum.y,
            width: datum.width,
            height: datum.height,
        };
    }
}
```

## Runtime Strategy Management

```typescript
// Strategy registry for runtime switching
class StrategyRegistry {
    private strategies = new Map<string, Map<string, SeriesStrategy>>();

    register<T extends SeriesStrategy>(type: string, strategy: T): void {
        if (!this.strategies.has(type)) {
            this.strategies.set(type, new Map());
        }
        this.strategies.get(type)!.set(strategy.id, strategy);
    }

    get<T extends SeriesStrategy>(type: string, id: string): T | undefined {
        return this.strategies.get(type)?.get(id) as T;
    }

    list(type: string): SeriesStrategy[] {
        return Array.from(this.strategies.get(type)?.values() || []);
    }
}

// Strategy-enabled series
class ModernLineSeries implements Series {
    private aggregationStrategy: DataAggregationStrategy<any, any>;
    private pathRenderingStrategy: PathRenderingStrategy<any>;

    constructor(config: LineSeriesConfig) {
        // Default strategies
        this.aggregationStrategy = StrategyRegistry.get('aggregation', 'line-aggregation')!;
        this.pathRenderingStrategy = StrategyRegistry.get('pathRendering', 'smooth-path')!;
    }

    // Runtime strategy switching
    setAggregationStrategy(strategyId: string): void {
        const strategy = StrategyRegistry.get('aggregation', strategyId);
        if (strategy) {
            this.aggregationStrategy = strategy;
            this.invalidateData(); // Trigger reprocessing
        }
    }

    setPathRenderingStrategy(strategyId: string): void {
        const strategy = StrategyRegistry.get('pathRendering', strategyId);
        if (strategy) {
            this.pathRenderingStrategy = strategy;
            this.invalidateRender(); // Trigger re-render
        }
    }
}
```

## Strategy Registration and Initialization

```typescript
// Register default strategies at startup
function registerDefaultStrategies() {
    const registry = StrategyRegistry.getInstance();

    // Data aggregation strategies
    registry.register('aggregation', new LineDataAggregationStrategy());
    registry.register('aggregation', new BarDataAggregationStrategy());
    registry.register('aggregation', new TimeSeriesAggregationStrategy());

    // Path rendering strategies
    registry.register('pathRendering', new LinearPathStrategy());
    registry.register('pathRendering', new SmoothPathRenderingStrategy());
    registry.register('pathRendering', new StepPathRenderingStrategy());

    // Interaction strategies
    registry.register('interaction', new NearestPointInteractionStrategy());
    registry.register('interaction', new ExactShapeInteractionStrategy());
    registry.register('interaction', new ToleranceBasedInteractionStrategy());
}
```

## Custom Strategy Example

Users can create and register custom strategies:

```typescript
// Custom interpolation strategy
class CustomSplineStrategy implements PathRenderingStrategy<ProcessedLineDatum> {
    readonly id = 'custom-spline';
    readonly cacheable = true;
    readonly supportsSegmentation = true;
    readonly supportsInterpolation = true;

    generatePath(data: ProcessedLineDatum[], scales: ScaleMap, options: PathOptions): PathCommand[] {
        // Custom spline implementation
        const points = data.map((d) => ({
            x: scales.x.convert(d.x),
            y: scales.y.convert(d.y),
        }));

        return this.generateCustomSpline(points, options);
    }

    private generateCustomSpline(points: Point[], options: PathOptions): PathCommand[] {
        // Custom spline algorithm implementation
        // ...
    }
}

// Register and use custom strategy
StrategyRegistry.getInstance().register('pathRendering', new CustomSplineStrategy());
lineSeries.setPathRenderingStrategy('custom-spline');
```

## Performance Optimizations

### Strategy Caching

```typescript
class CachedStrategy<T, R> implements SeriesStrategy {
    private cache = new LRUCache<string, R>(100);

    constructor(
        private baseStrategy: SeriesStrategy,
        private keyGenerator: (input: T) => string
    ) {}

    execute(input: T): R {
        const key = this.keyGenerator(input);

        if (this.cache.has(key)) {
            return this.cache.get(key)!;
        }

        const result = this.baseStrategy.execute(input);
        this.cache.set(key, result);

        return result;
    }
}
```

### Object Pooling for Strategies

```typescript
class StrategyPool<T extends SeriesStrategy> {
    private pool: T[] = [];
    private factory: () => T;

    constructor(factory: () => T, initialSize: number = 10) {
        this.factory = factory;

        // Pre-populate pool
        for (let i = 0; i < initialSize; i++) {
            this.pool.push(factory());
        }
    }

    acquire(): T {
        return this.pool.pop() || this.factory();
    }

    release(strategy: T): void {
        if (strategy.reset) {
            strategy.reset();
        }
        this.pool.push(strategy);
    }
}
```

## Benefits of Strategy Pattern

### Flexibility

-   Change behavior at runtime without modifying series code
-   Support multiple rendering modes (performance vs quality)
-   Easy A/B testing of different algorithms

### Extensibility

-   Users can add custom strategies
-   Plugin architecture for third-party extensions
-   New behaviors without touching core code

### Performance

-   Cache strategy results
-   Object pooling reduces allocation overhead
-   Specialized strategies for specific use cases

### Maintainability

-   Isolated algorithm implementations
-   Easy to test strategies independently
-   Clear separation between strategy and context

---

**Next**: [05: Type System Simplification](05-type-system.md) - Reduce complexity while maintaining type safety
