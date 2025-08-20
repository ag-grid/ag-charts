# 06: Testing and Migration

## 🧪 Testing Strategy

This document outlines the comprehensive testing approach and migration examples for the series refactoring.

## Component Testing

Test individual components in isolation:

```typescript
// Test individual components in isolation
describe('CartesianDataProcessor', () => {
    let processor: CartesianDataProcessor;

    beforeEach(() => {
        processor = new CartesianDataProcessor({ x: (d) => d.x, y: (d) => d.y }, [new NumericValidator()]);
    });

    it('should process valid cartesian data', async () => {
        const data = [
            { x: 1, y: 10 },
            { x: 2, y: 20 },
        ];
        const result = await processor.process(data, config);

        expect(result.nodeData).toHaveLength(2);
        expect(result.nodeData[0]).toMatchObject({ xValue: 1, yValue: 10 });
    });

    it('should validate required fields', () => {
        const invalidData = { nodeData: [{ x: 1 }] }; // missing y
        const result = processor.validate(invalidData);

        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Missing required fields');
    });
});
```

## Integration Testing

Test composed behavior:

```typescript
// Test composed behavior
describe('Modern Line Series', () => {
    let series: Series;

    beforeEach(() => {
        series = SeriesFactory.create('line', {
            properties: { type: 'line', stroke: '#ff0000' },
            axes: createTestAxes(),
        });
    });

    it('should generate legend data using composition', () => {
        const legendData = series.legendProvider.getLegendData(testContext);

        expect(legendData).toHaveLength(1);
        expect(legendData[0].marker.fill).toBe('#ff0000');
    });

    it('should handle interaction through composed handler', () => {
        const matches = series.interactionHandler.pick({ x: 100, y: 100 }, intent);

        expect(matches).toBeDefined();
        // Test interaction behavior
    });
});
```

## Visual Regression Testing

Zero pixel difference validation:

```typescript
// Zero pixel difference validation
describe('Visual Regression Tests', () => {
    it('should produce identical output after refactoring', async () => {
        // Create chart with legacy series
        const legacyChart = createLegacyChart('line', testData);
        const legacySnapshot = await captureSnapshot(legacyChart);

        // Create chart with modern series
        const modernChart = createModernChart('line', testData);
        const modernSnapshot = await captureSnapshot(modernChart);

        // Zero tolerance for pixel differences
        expect(modernSnapshot).toMatchImageSnapshot(legacySnapshot, {
            failureThresholdType: 'pixel',
            failureThreshold: 0,
        });
    });
});
```

## Performance Testing

Validate no performance regression:

```typescript
describe('Performance Benchmarks', () => {
    it('should maintain or improve rendering performance', () => {
        const dataSize = 10000;
        const data = generateTestData(dataSize);

        // Measure legacy performance
        const legacyStart = performance.now();
        renderLegacySeries(data);
        const legacyTime = performance.now() - legacyStart;

        // Measure modern performance
        const modernStart = performance.now();
        renderModernSeries(data);
        const modernTime = performance.now() - modernStart;

        // Modern should be at least as fast
        expect(modernTime).toBeLessThanOrEqual(legacyTime * 1.1); // Allow 10% margin
    });

    it('should reduce memory usage', () => {
        const data = generateTestData(1000);

        // Measure legacy memory
        const legacyMemory = measureMemoryUsage(() => {
            return createLegacySeries(data);
        });

        // Measure modern memory
        const modernMemory = measureMemoryUsage(() => {
            return createModernSeries(data);
        });

        // Expect memory reduction
        expect(modernMemory).toBeLessThan(legacyMemory * 0.7); // 30% reduction expected
    });
});
```

## 🚀 Migration Examples

### Example 1: Migrating LineSeries

**Before (Current Implementation):**

```typescript
export class LineSeries extends CartesianSeries<Path, LineSeriesOptions, LineSeriesProperties, ...> {
    constructor(moduleCtx: ModuleContext) {
        super(moduleCtx);
        // 100+ lines of constructor logic
    }

    protected createNode(): Path {
        return new Path();
    }

    protected updateNode(node: Path, datum: LineSeriesNodeDatum, highlight: boolean): void {
        // 50+ lines of rendering logic
    }

    getLegendData(): ChartLegendDatum[] {
        // 30+ lines of legend generation
    }

    getTooltipHtml(datum: LineSeriesNodeDatum): string {
        // 40+ lines of tooltip generation
    }

    // ... 500+ more lines
}
```

**After (Composition-Based):**

```typescript
export class ModernLineSeries implements Series {
    readonly type = 'line';
    readonly properties: LineSeriesProperties;

    readonly dataProcessor: CartesianDataProcessor;
    readonly coordinateSystem: CartesianCoordinateSystem;
    readonly renderer: PathRenderingBehavior;
    readonly interactionHandler: NearestNodeInteraction;
    readonly legendProvider: SimpleColorLegendProvider;
    readonly tooltipProvider: CartesianTooltipProvider;

    constructor(config: LineSeriesConfig) {
        this.properties = config.properties;

        // Compose behaviors
        this.dataProcessor = new CartesianDataProcessor(config.keyExtractors);
        this.coordinateSystem = new CartesianCoordinateSystem(config.axes);
        this.renderer = new PathRenderingBehavior();
        this.interactionHandler = new NearestNodeInteraction(config.interactionContext);
        this.legendProvider = new SimpleColorLegendProvider(config.legendConfig);
        this.tooltipProvider = new CartesianTooltipProvider(config.tooltipConfig, config.axes);
    }

    // Delegate to composed behaviors
    getLegendData(): ChartLegendDatum[] {
        return this.legendProvider.getLegendData(this.getLegendContext());
    }

    getTooltipHtml(datum: any): string {
        const content = this.tooltipProvider.getTooltipContent(datum, this.getHighlightState());
        return renderTooltipHtml(content);
    }
}
```

**Benefits Achieved:**

-   **90% less code** in the main series class
-   **Clear separation** of concerns
-   **Reusable components** across multiple series
-   **Easy to test** individual behaviors
-   **Flexible composition** for new variants

### Example 2: Creating New Series Type

With composition, creating a new series type becomes much simpler:

```typescript
// New candlestick series using existing components
export class CandlestickSeries implements Series {
    readonly type = 'candlestick';

    constructor(config: CandlestickSeriesConfig) {
        // Reuse existing cartesian components
        this.dataProcessor = new CartesianDataProcessor(config.keyExtractors);
        this.coordinateSystem = new CartesianCoordinateSystem(config.axes);
        this.interactionHandler = new NearestNodeInteraction(config.interactionContext);
        this.legendProvider = new SimpleColorLegendProvider(config.legendConfig);
        this.tooltipProvider = new CartesianTooltipProvider(config.tooltipConfig, config.axes);

        // Only need custom renderer for candlestick-specific visuals
        this.renderer = new CandlestickRenderingBehavior({
            bodyFill: config.properties.bodyFill,
            wickStroke: config.properties.wickStroke,
            upColor: config.properties.upColor,
            downColor: config.properties.downColor,
        });
    }
}

// Just implement the candlestick-specific rendering behavior
class CandlestickRenderingBehavior implements RenderingBehavior<Group, CandlestickDatum> {
    createNodes(data: CandlestickDatum[]): Selection<Group, CandlestickDatum> {
        return data.map((datum) => {
            const group = new Group();
            group.append(new Rect()); // body
            group.append(new Line()); // upper wick
            group.append(new Line()); // lower wick
            return group;
        });
    }

    updateNodes(selection: Selection<Group, CandlestickDatum>, context: RenderContext): void {
        selection.each((group, datum) => {
            const [body, upperWick, lowerWick] = group.children;

            // Update candlestick visual elements
            this.updateBody(body as Rect, datum, context.scales);
            this.updateWick(upperWick as Line, datum.high, datum.open, context.scales);
            this.updateWick(lowerWick as Line, datum.low, datum.close, context.scales);
        });
    }
}
```

**Result**: New series type implemented with **80% less code** by reusing existing components.

## Migration Checklist

### Phase 1: Preparation

-   [ ] Identify all series types to migrate
-   [ ] Document current public APIs
-   [ ] Create comprehensive test suite
-   [ ] Set up performance benchmarks

### Phase 2: Implementation

-   [ ] Extract utility functions
-   [ ] Create component interfaces
-   [ ] Implement core components
-   [ ] Build adapter layer
-   [ ] Migrate each series type

### Phase 3: Validation

-   [ ] Run all unit tests
-   [ ] Execute visual regression tests
-   [ ] Validate performance benchmarks
-   [ ] Test backward compatibility
-   [ ] Review bundle size impact

### Phase 4: Deployment

-   [ ] Update documentation
-   [ ] Create migration guide
-   [ ] Deploy with feature flag (if needed)
-   [ ] Monitor for issues
-   [ ] Remove legacy code (after stabilization)

## Backward Compatibility

The adapter pattern ensures zero breaking changes:

```typescript
// Legacy adapter maintains all existing APIs
class LegacySeriesAdapter {
    private modernSeries: Series;

    constructor(legacyConfig: any) {
        // Convert legacy config to modern
        this.modernSeries = this.createModernSeries(legacyConfig);
    }

    // All legacy methods continue to work
    getLegendData(): ChartLegendDatum[] {
        return this.modernSeries.legendProvider.getLegendData(this.context);
    }

    getTooltipHtml(datum: any): string {
        const content = this.modernSeries.tooltipProvider.getTooltipContent(datum);
        return this.formatLegacyTooltip(content);
    }
}
```

## Risk Mitigation

### Automated Validation

-   Comprehensive test coverage (>95%)
-   Visual regression testing (zero pixel tolerance)
-   Performance benchmarks (no regression allowed)
-   Bundle size monitoring

### Gradual Rollout

-   Feature flag for new architecture
-   A/B testing capability
-   Easy rollback mechanism
-   Monitoring and alerting

### Documentation

-   Detailed migration guide
-   API compatibility matrix
-   Performance comparison
-   Troubleshooting guide

---

**Next**: [07: Summary and Benefits](07-summary-benefits.md) - Final summary of the refactoring benefits
