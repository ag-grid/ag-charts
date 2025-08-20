# 03: Composition Architecture

**Goal**: Replace inheritance with composable behavior components

## 📋 Overview

This document details the composition-based architecture that replaces deep inheritance with modular, composable components.

## Core Component Interfaces

### 1. Data Processor Component

```typescript
interface DataProcessor<TDatum, TProcessed> {
    readonly id: string;
    process(data: unknown[], config: DataProcessConfig): Promise<ProcessedData<TProcessed>>;
    validate(data: ProcessedData<TProcessed>): ValidationResult;
    getDatumId(datum: TDatum, index: number): string;
    isAnimatable(data: ProcessedData<TProcessed>): boolean;
}

// Cartesian data processor implementation
class CartesianDataProcessor<TDatum extends CartesianSeriesNodeDatum>
    implements DataProcessor<TDatum, ProcessedData<TDatum>>
{
    constructor(
        private keyExtractors: KeyExtractors,
        private validators: DataValidator[]
    ) {}

    async process(data: unknown[], config: DataProcessConfig): Promise<ProcessedData<TDatum>> {
        // Build property definitions for DataModel
        const props = this.buildPropertyDefinitions(config);

        // Leverage existing DataModel infrastructure
        const dataModel = new DataModel({
            data,
            props,
            groupByKeys: this.getGroupKeys(props),
            aggregateKeys: this.getAggregateKeys(props),
        });

        return this.processDataModel(dataModel);
    }

    validate(data: ProcessedData<TDatum>): ValidationResult {
        const errors: string[] = [];
        for (const datum of data.nodeData) {
            if (!this.hasRequiredFields(datum)) {
                errors.push(`Missing required fields in datum: ${JSON.stringify(datum)}`);
            }
        }
        return { valid: errors.length === 0, errors };
    }
}
```

### 2. Rendering Behavior Component

```typescript
interface RenderingBehavior<TNode extends Node, TDatum> {
    readonly sceneGroups: SceneGroupConfig;
    createNodes(data: TDatum[]): Selection<TNode, TDatum>;
    updateNodes(selection: Selection<TNode, TDatum>, context: RenderContext): void;
    destroyNodes(selection: Selection<TNode, TDatum>): void;
    getNodeBounds(node: TNode): BBox;
}

// Path rendering behavior for line/area series
class PathRenderingBehavior implements RenderingBehavior<Path, CartesianSeriesNodeDatum> {
    readonly sceneGroups: SceneGroupConfig = {
        main: 'paths',
        background: 'path-background',
        highlight: 'path-highlight',
    };

    createNodes(data: CartesianSeriesNodeDatum[]): Selection<Path, CartesianSeriesNodeDatum> {
        const segments = this.segmentData(data);
        const paths = segments.map(() => new Path());
        return Selection.from(paths, segments);
    }

    updateNodes(selection: Selection<Path, CartesianSeriesNodeDatum>, context: RenderContext): void {
        selection.each((path, datum) => {
            path.path = this.buildPath(datum, context.scales);
            path.stroke = this.getStroke(datum, context.highlightState);
            path.strokeWidth = this.getStrokeWidth(datum, context.highlightState);
            path.fill = this.getFill(datum);
            path.opacity = this.getOpacity(datum, context.highlightState);
        });
    }

    private buildPath(data: CartesianSeriesNodeDatum[], scales: ScaleMap): string {
        if (data.length === 0) return '';

        const commands: string[] = [];
        data.forEach((datum, index) => {
            const x = scales.x.convert(datum.xValue);
            const y = scales.y.convert(datum.yValue);

            if (index === 0) {
                commands.push(`M ${x} ${y}`);
            } else {
                commands.push(`L ${x} ${y}`);
            }
        });

        return commands.join(' ');
    }
}
```

### 3. Interaction Handler Component

```typescript
interface InteractionBehavior<TDatum> {
    readonly pickModes: SeriesNodePickMode[];
    pick(point: Point, intent: SeriesNodePickIntent): SeriesNodePickMatch[];
    pickFocus(inputs: PickFocusInputs): PickFocusOutputs | undefined;
    handleEvent(event: Event, datum: TDatum): void;
    getCursor(datum: TDatum): string | undefined;
}

// Nearest node interaction behavior
class NearestNodeInteraction<TDatum extends CartesianSeriesNodeDatum> implements InteractionBehavior<TDatum> {
    readonly pickModes: SeriesNodePickMode[] = [
        SeriesNodePickMode.NEAREST_BY_MAIN_CATEGORY_AXIS_FIRST,
        SeriesNodePickMode.NEAREST_BY_MAIN_AXIS_FIRST,
    ];

    pick(point: Point, intent: SeriesNodePickIntent): SeriesNodePickMatch[] {
        const { data, scales, tolerance } = this.context;
        let minDistance = Infinity;
        let closestMatch: SeriesNodePickMatch | undefined;

        for (let i = 0; i < data.length; i++) {
            const datum = data[i];
            if (!datum.valid) continue;

            const nodePoint = this.getNodePoint(datum, scales);
            const distance = this.calculateDistance(point, nodePoint, intent);

            if (distance <= tolerance && distance < minDistance) {
                minDistance = distance;
                closestMatch = {
                    datum,
                    distance,
                    point: nodePoint,
                    series: this.context.seriesId,
                };
            }
        }

        return closestMatch ? [closestMatch] : [];
    }
}
```

## Modern Series Factory

```typescript
// Modern series using composition
class ModernSeriesFactory {
    static createLineSeries(config: LineSeriesConfig): Series {
        return {
            type: 'line',
            properties: config.properties,

            dataProcessor: new CartesianDataProcessor(config.keyExtractors, [
                new NumericValidator(),
                new RequiredFieldValidator(),
            ]),

            coordinateSystem: new CartesianCoordinateSystem(config.axes),

            renderer: new PathRenderingBehavior(),

            interactionHandler: new NearestNodeInteraction(config.interactionContext),

            legendProvider: new SimpleColorLegendProvider(config.legendConfig),

            tooltipProvider: new CartesianTooltipProvider(config.tooltipConfig, config.axes),
        };
    }

    static createBarSeries(config: BarSeriesConfig): Series {
        return {
            type: 'bar',
            properties: config.properties,

            dataProcessor: new CartesianDataProcessor(config.keyExtractors, [
                new NumericValidator(),
                new CategoryValidator(),
            ]),

            coordinateSystem: new CartesianCoordinateSystem(config.axes),

            renderer: new RectangleRenderingBehavior(), // Different renderer

            interactionHandler: new RectangleInteraction(config.interactionContext), // Different interaction

            legendProvider: new SimpleColorLegendProvider(config.legendConfig),

            tooltipProvider: new CartesianTooltipProvider(config.tooltipConfig, config.axes),
        };
    }
}
```

## Adapter Pattern for Backward Compatibility

```typescript
// Legacy series adapter maintains existing API
class LegacySeriesAdapter extends AbstractSeries {
    private modernSeries: Series;

    constructor(config: LegacySeriesConfig) {
        super(config);

        // Create modern series internally
        this.modernSeries = ModernSeriesFactory.createLineSeries({
            properties: this.properties,
            axes: this.axes,
            // ... map legacy config to modern config
        });
    }

    // Existing methods delegate to modern implementation
    getLegendData(): ChartLegendDatum[] {
        return this.modernSeries.legendProvider.getLegendData(this.getLegendContext());
    }

    getTooltipHtml(datum: any): string {
        const content = this.modernSeries.tooltipProvider.getTooltipContent(datum, this.highlightState);
        return this.renderTooltipHtml(content);
    }

    // All existing APIs continue to work unchanged
}
```

## Creating New Series Types

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

## Benefits of Composition

### Clear Separation of Concerns

-   Each component has one responsibility
-   Easy to understand what each component does
-   Changes isolated to specific components

### Reusability

-   Components shared across multiple series types
-   New series types reuse existing components
-   Only implement what's unique

### Testability

-   Components tested in isolation
-   Mock dependencies easily
-   Better test coverage

### Flexibility

-   Mix and match behaviors
-   Runtime behavior switching
-   Easy customization

---

**Next**: [04: Strategy Pattern](04-strategy-pattern.md) - Enable flexible behavior customization through runtime strategy switching
