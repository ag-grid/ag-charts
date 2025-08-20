# Implementation Spike Plan: ADR-001 Series Refactoring

## Executive Summary

This document outlines a structured spike implementation to validate the ADR-001 series refactoring approach through progressive complexity testing. The spike will test composition patterns on three series types (PieSeries, LineSeries, BoxPlotSeries) to validate feasibility, identify risks, and establish concrete metrics for the full refactoring effort.

**Objective**: Validate that composition-based architecture can deliver 30-40% code reduction while maintaining performance, visual consistency, and API compatibility.

**Duration**: 2-3 weeks (1 week per phase)

**Deliverables**: Working prototypes, performance benchmarks, risk assessment, and Go/No-Go recommendation

---

## Success Criteria

### Required (Must Pass All)

-   ✅ **Zero performance regression**: Existing benchmarks maintain current throughput
-   ✅ **Zero visual regression**: Pixel-perfect rendering consistency
-   ✅ **API compatibility**: No breaking changes to public interfaces
-   ✅ **Type safety**: Maintain or improve TypeScript type coverage

### Target Metrics

-   📊 **Code reduction**: 30-40% in refactored series
-   📊 **Bundle size**: 20-30% reduction through improved tree-shaking
-   📊 **Generic parameters**: Reduce from 6-8 to <4 per series
-   📊 **Inheritance depth**: Reduce from 4-5 to ≤2 levels

---

## Phase 1: Low Complexity - PieSeries (Week 1)

### Why PieSeries?

-   Minimal inheritance (only extends DonutSeries)
-   Simple polar coordinates without complex transformations
-   Clear tooltip/legend patterns
-   No stacking or aggregation complexity
-   Ideal for proving basic composition patterns

### Implementation Tasks

#### 1.1 Extract Tooltip Utilities

```typescript
// Location: packages/ag-charts-community/src/chart/series/polar/donutSeries.ts
// Extract from: getTooltipContent() method (lines ~800-900)

// Create: packages/ag-charts-community/src/chart/series/utils/tooltipUtils.ts
interface TooltipProvider<TDatum> {
    getTooltipContent(datum: TDatum, highlight: HighlightState): TooltipContent;
    formatTooltip(value: any, format?: string): string;
    getMarkerStyle(datum: TDatum): MarkerStyle;
}

// Implementation target: 150+ lines → 10 lines in series
```

#### 1.2 Extract Legend Utilities

```typescript
// Location: packages/ag-charts-community/src/chart/series/polar/donutSeries.ts
// Extract from: getLegendData() method (lines ~950-1050)

// Create: packages/ag-charts-community/src/chart/series/utils/legendUtils.ts
interface LegendProvider<TDatum> {
    getLegendData(series: Series): ChartLegendDatum[];
    getCategoryLegendData(data: TDatum[]): ChartLegendDatum[];
    getGradientLegendData(scale: ColorScale): ChartLegendDatum[];
}

// Implementation target: 100+ lines → 5 lines in series
```

#### 1.3 Flatten Inheritance

```typescript
// Current: PieSeries → DonutSeries → PolarSeries → DataModelSeries → Series
// Target: PieSeries → Series (with composed behaviors)

class PieSeriesComposed extends Series {
    private dataProcessor = new PolarDataProcessor();
    private renderer = new SectorRenderer();
    private tooltipProvider = new PolarTooltipProvider();
    private legendProvider = new CategoryLegendProvider();
    private interactionHandler = new PolarInteractionHandler();

    // Simplified, focused class with clear responsibilities
}
```

### Validation Steps

#### Performance Testing

```bash
# Run existing benchmarks
nx benchmark ag-charts-community --filter="pie|donut"

# Expected: ±5% performance variance (within noise)
# Critical metric: fps during 360° rotation animation
```

#### Visual Regression Testing

```bash
# Run visual tests
nx test ag-charts-community --testNamePattern="PieSeries.*visual"

# Expected: Zero pixel differences
# Critical: Label positioning, callout lines, selection states
```

#### Bundle Size Analysis

```bash
# Measure bundle impact
nx build ag-charts-community --bundle-analyze

# Expected: 10-15% size reduction for pie series code
# Target: Better tree-shaking of unused behaviors
```

### Phase 1 Go/No-Go Decision

**Proceed to Phase 2 if:**

-   ✅ Performance benchmarks pass (no regression >5%)
-   ✅ Visual tests pass (zero pixel differences)
-   ✅ Bundle size reduced by >10%
-   ✅ Code reduction achieved >30%

**Stop and reassess if:**

-   ❌ Performance degrades >10%
-   ❌ Visual regressions cannot be resolved
-   ❌ Bundle size increases
-   ❌ Composition creates more complexity than it removes

---

## Phase 2: Medium Complexity - LineSeries (Week 2)

### Why LineSeries?

-   Representative of Cartesian family (most common series type)
-   Has stacking/normalization logic to extract
-   Performance-critical with large datasets
-   Interpolation strategies perfect for strategy pattern
-   Will prove DataProcessor/Renderer separation

### Implementation Tasks

#### 2.1 Extract DataProcessor Component

```typescript
// Location: packages/ag-charts-community/src/chart/series/cartesian/lineSeries.ts
// Extract from: processData() method (lines ~400-600)

interface DataProcessor<TDatum> {
    process(data: unknown[], config: ProcessConfig): Promise<ProcessedData<TDatum>>;
    aggregate(data: TDatum[], mode: AggregationMode): TDatum[];
    stack(data: TDatum[], context: StackContext): TDatum[];
    normalize(data: TDatum[], mode: NormalizeMode): TDatum[];
}

class CartesianDataProcessor implements DataProcessor<CartesianSeriesNodeDatum> {
    // Extract stacking logic (currently duplicated in Line/Area/Bar)
    // Extract normalization logic
    // Extract aggregation filters
}

// Implementation target: 500+ lines → 50 lines in series
```

#### 2.2 Implement Renderer Strategy

```typescript
// Location: packages/ag-charts-community/src/chart/series/cartesian/lineSeries.ts
// Extract from: updatePaths(), updateMarkers() methods

interface RenderStrategy<TNode, TDatum> {
    createNodes(data: TDatum[]): TNode[];
    updateNodes(nodes: TNode[], data: TDatum[], scales: Scales): void;
    animateNodes(nodes: TNode[], animation: AnimationConfig): void;
}

class LineRenderStrategy implements RenderStrategy<Path, CartesianSeriesNodeDatum> {
    constructor(private interpolation: InterpolationStrategy) {}

    updateNodes(paths: Path[], data: CartesianSeriesNodeDatum[], scales: Scales) {
        // Extract path building logic
        // Apply interpolation strategy
        // Handle segmented paths
    }
}

// Strategies for: linear, smooth, step interpolation
```

#### 2.3 Extract Interaction Handling

```typescript
// Location: packages/ag-charts-community/src/chart/series/cartesian/cartesianSeries.ts
// Extract from: pickNode(), pickFocus() methods

interface InteractionHandler<TDatum> {
    pick(point: Point, data: TDatum[]): PickResult<TDatum>;
    focus(datum: TDatum): FocusResult;
    highlight(datum: TDatum, state: HighlightState): void;
}

class CartesianInteractionHandler implements InteractionHandler<CartesianSeriesNodeDatum> {
    // Extract distance calculation logic
    // Extract focus bounds computation
    // Extract highlight state management
}
```

### Performance Validation

#### Large Dataset Testing

```typescript
// Test with realistic data volumes
const testCases = [
    { points: 1000, series: 1 }, // Baseline
    { points: 10000, series: 1 }, // Large single series
    { points: 1000, series: 10 }, // Multiple series
    { points: 10000, series: 10 }, // Stress test
];

// Critical metrics:
// - Initial render time
// - Pan/zoom performance
// - Memory usage
// - Animation frame rate
```

#### Aggregation Performance

```bash
# Test aggregation with large datasets
nx benchmark ag-charts-community --filter="line.*aggregation"

# Expected: No regression in aggregation performance
# Critical: Aggregation should remain O(n) complexity
```

### Phase 2 Go/No-Go Decision

**Proceed to Phase 3 if:**

-   ✅ Large dataset performance maintained (<10% regression)
-   ✅ Stacking/normalization correctly extracted and reusable
-   ✅ Strategy pattern proves flexible for interpolation
-   ✅ Code reduction >40% achieved

**Pivot to hybrid approach if:**

-   ⚠️ Performance regression 10-20% (acceptable with optimization potential)
-   ⚠️ Some behaviors resist extraction (document which ones)
-   ⚠️ Complexity moves rather than reduces

**Stop if:**

-   ❌ Performance regression >20%
-   ❌ DataModel integration breaks
-   ❌ Animation system incompatible

---

## Phase 3: High Complexity - BoxPlotSeries (Week 3)

### Why BoxPlotSeries?

-   Complex statistical validation logic
-   Multi-value data patterns (min/Q1/median/Q3/max)
-   Extends AbstractBarSeries (deep inheritance)
-   Will reveal composition limits
-   Tests feasibility for most complex series

### Implementation Tasks

#### 3.1 Attempt Statistical Logic Extraction

```typescript
// Location: packages/ag-charts-enterprise/src/series/box-plot/boxPlotSeries.ts
// Challenge: Statistical validation in processData()

interface StatisticalProcessor {
    validate(datum: BoxPlotDatum): ValidationResult;
    computeWhiskers(datum: BoxPlotDatum): WhiskerData;
    computeOutliers(data: BoxPlotDatum[]): OutlierData[];
}

// Key challenge: Validation is interleaved with processing
// Test if this can be cleanly separated without performance impact
```

#### 3.2 Multi-Value Data Handling

```typescript
// Current: Complex BoxPlotNodeDatum with 5+ statistical values
// Challenge: Generic components expect simpler datum types

interface MultiValueDatum {
    values: Map<string, number>;
    getStatistic(key: StatisticKey): number;
}

// Test if abstraction maintains type safety and performance
```

#### 3.3 Specialized Rendering Components

```typescript
// BoxPlot has unique rendering requirements:
// - Box (Q1-Q3)
// - Median line
// - Whiskers (min/max)
// - Outlier points

interface CompositeRenderer {
    renderers: Map<string, RenderStrategy>;
    coordinate(renderers: RenderStrategy[]): void;
}

// Test if composite rendering maintains visual consistency
```

### Complexity Assessment

#### What Works with Composition

-   [ ] Tooltip generation
-   [ ] Legend data creation
-   [ ] Basic style management
-   [ ] Selection handling

#### What Resists Composition

-   [ ] Statistical validation logic
-   [ ] Domain calculation with constraints
-   [ ] Multi-value coordinate mapping
-   [ ] Specialized node types

#### Hybrid Approach Evaluation

```typescript
// Option 1: Partial composition
class BoxPlotSeriesHybrid extends AbstractBarSeries {
    // Keep inheritance for core statistical logic
    private tooltipProvider = new StatisticalTooltipProvider();
    private legendProvider = new CategoryLegendProvider();
    // Compose only peripheral behaviors
}

// Option 2: Statistical series base class
abstract class StatisticalSeries extends Series {
    // New base for statistical series family
    // Shared statistical validation and processing
}
```

### Phase 3 Decision Framework

#### Document Composition Boundaries

**Composable Behaviors:**

-   Tooltips, legends, basic interactions
-   Style calculations and theming
-   Animation state machines
-   Event handling

**Non-Composable (Keep in Inheritance):**

-   Statistical algorithms and validation
-   Coordinate system transformations
-   Specialized rendering logic
-   Performance-critical calculations

---

## Risk Assessment & Mitigation

### Performance Risks

| Risk                       | Probability | Impact | Mitigation                                   |
| -------------------------- | ----------- | ------ | -------------------------------------------- |
| Function call overhead     | High        | Medium | Profile hot paths, inline critical functions |
| Memory allocation increase | Medium      | High   | Object pooling, reuse strategies             |
| Animation frame drops      | Medium      | High   | Maintain current animation architecture      |
| Large dataset regression   | Medium      | High   | Keep aggregation in hot path                 |

### Compatibility Risks

| Risk                          | Probability | Impact   | Mitigation                           |
| ----------------------------- | ----------- | -------- | ------------------------------------ |
| Breaking API changes          | Low         | Critical | Adapter pattern, compatibility layer |
| TypeScript type breaks        | Medium      | High     | Gradual migration, type tests        |
| Module system incompatibility | Low         | High     | Test with existing module loader     |
| Custom series breaks          | Medium      | Medium   | Document migration guide             |

### Visual Risks

| Risk                         | Probability | Impact | Mitigation                          |
| ---------------------------- | ----------- | ------ | ----------------------------------- |
| Pixel differences            | High        | Medium | Precision testing, visual snapshots |
| Animation glitches           | Medium      | Medium | Frame-by-frame validation           |
| Label positioning shifts     | Medium      | Low    | Maintain exact algorithms           |
| Interaction feedback changes | Low         | Low    | Preserve event handling             |

---

## Decision Framework

### After Each Phase

**Green Light (Proceed)**

-   Performance within 5% of baseline
-   Visual tests pass 100%
-   Code reduction >30% achieved
-   No blocking architectural issues

**Yellow Light (Proceed with Caution)**

-   Performance regression 5-10%
-   Minor visual issues (fixable)
-   Code reduction 20-30%
-   Some architectural challenges

**Red Light (Stop and Reassess)**

-   Performance regression >10%
-   Unfixable visual regressions
-   Code reduction <20%
-   Fundamental architectural incompatibility

### Final Go/No-Go Decision

After all three phases, make final recommendation based on:

**Full Composition Approach**

-   If all phases pass with green lights
-   Performance maintained across all series
-   40%+ code reduction achieved
-   Clean architectural patterns established

**Hybrid Approach (Recommended if yellow lights)**

-   Extract utilities (tooltips, legends, styles)
-   Keep inheritance for series families
-   Compose only peripheral behaviors
-   30-40% code reduction still achievable

**Abandon Refactoring**

-   If multiple red lights
-   Performance regressions unacceptable
-   Architectural issues insurmountable
-   Risk exceeds benefit

---

## Implementation Timeline

### Week 1: Phase 1 (PieSeries)

-   **Day 1-2**: Extract tooltip/legend utilities
-   **Day 3-4**: Implement composition prototype
-   **Day 5**: Performance testing and validation

### Week 2: Phase 2 (LineSeries)

-   **Day 1-2**: Extract DataProcessor
-   **Day 3-4**: Implement Renderer strategies
-   **Day 5**: Large dataset testing

### Week 3: Phase 3 (BoxPlotSeries)

-   **Day 1-2**: Attempt statistical extraction
-   **Day 3-4**: Evaluate hybrid approaches
-   **Day 5**: Final assessment and recommendations

### Week 4: Documentation and Decision

-   Compile results from all phases
-   Prepare recommendation presentation
-   Document lessons learned
-   Create migration guide if proceeding

---

## Appendix: Testing Commands

### Performance Testing

```bash
# Run all benchmarks
nx benchmark ag-charts-community
nx benchmark ag-charts-enterprise

# Run specific series benchmarks
nx benchmark ag-charts-community --filter="pie|line|scatter"

# Memory + large dataset profiling
nx benchmark ag-charts-community
```

### Visual Testing

```bash
# Run visual regression tests
nx test ag-charts-community

# Update visual snapshots (if intentional changes)
nx test ag-charts-community -u

# Test specific series
nx test ag-charts-community --testNamePattern="PieSeries.*"
```

### Bundle Analysis

```bash
# Analyze bundle size
nx build ag-charts-community

# Compare bundle sizes
du -sh packages/ag-charts-community/dist/**/*.js
```

### Type Safety Validation

```bash
# Type check
nx build:types ag-charts-community
```

---

## Success Metrics Summary

| Metric               | Current    | Target    | Minimum Acceptable |
| -------------------- | ---------- | --------- | ------------------ |
| Code Duplication     | 40-50%     | <10%      | <20%               |
| Bundle Size          | 100%       | 70%       | 85%                |
| Inheritance Depth    | 4-5 levels | ≤2 levels | 3 levels           |
| Generic Parameters   | 6-8        | <4        | <6                 |
| Performance          | Baseline   | Same      | -5%                |
| Visual Regression    | 0          | 0         | 0                  |
| API Breaking Changes | 0          | 0         | 0                  |

---

## Conclusion

This spike implementation plan provides a structured approach to validate the ADR-001 refactoring proposal. By testing progressively complex series types, we can identify the boundaries of composition, validate performance characteristics, and make an informed decision about the architectural direction.

The phased approach with clear Go/No-Go criteria ensures we can pivot quickly if issues arise, while the comprehensive testing strategy validates that any refactoring maintains AG Charts' high quality standards.
