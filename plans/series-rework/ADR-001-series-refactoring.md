# ADR-001: Series Class Hierarchy Refactoring

**Date**: 2025-08-20  
**Status**: Proposed  
**Authors**: AG Charts Engineering Team  
**Review Status**: Draft

## Summary

Transform the AG Charts Series class hierarchy from deep inheritance to composition-based architecture to improve maintainability, reduce code duplication, and enable more flexible series development. This refactoring will be delivered as a single, comprehensive update using AI-assisted development for rapid implementation.

## Problem Statement

The current AG Charts Series class hierarchy suffers from several architectural issues:

### Deep Inheritance Hierarchy

-   **4-5 levels of inheritance** create cognitive overhead and make functionality difficult to trace
-   Base `Series` class contains **1200+ lines** exhibiting God Object anti-pattern
-   **42+ generic parameters** across the hierarchy create complex type signatures

### Code Duplication

-   **Stacking/normalization logic** duplicated across Line, Area, and Bar series
-   **Tooltip implementation** follows nearly identical patterns in all series
-   **Data processing pipeline** repeated with minor variations
-   **Constructor patterns** heavily duplicated

### Maintainability Issues

-   Adding new series types requires understanding entire hierarchy
-   Tight coupling between series classes and rendering infrastructure
-   Difficult to test business logic in isolation
-   Complex generic type system makes code hard to understand

### Current Architecture Impact

```typescript
// Current complexity example
export abstract class CartesianSeries<
    TNode extends Node<any>,
    TOpts extends object,
    TProps extends CartesianSeriesProperties<TOpts>,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number> = TDatum,
    TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel>,
    TStackContext = never,
> extends DataModelSeries<...> {
    // 500+ lines of mixed responsibilities
}
```

## Decision

**We will refactor the Series architecture through a comprehensive transformation from deep inheritance to composition-based design, delivered as a single atomic update with full backward compatibility.**

### Target Architecture

```typescript
// Target: Simple composition-based architecture
interface Series {
    readonly type: SeriesType;
    readonly properties: SeriesProperties;

    // Composed behaviors
    readonly dataProcessor: DataProcessor;
    readonly coordinateSystem: CoordinateSystem;
    readonly renderer: SeriesRenderer;
    readonly interactionHandler: InteractionHandler;
    readonly legendProvider: LegendProvider;
    readonly tooltipProvider: TooltipProvider;
}
```

## Implementation Approach

The refactoring encompasses four key areas that will be implemented as a unified effort:

### 1. Utility Extraction

**Goal**: Eliminate 30-40% of code duplication through shared utilities

-   Extract stacking/normalization utilities
-   Create shared tooltip builders
-   Consolidate data processing patterns
-   Build legend and animation utilities

### 2. Composition Architecture

**Goal**: Replace inheritance with composable behavior components

-   Create composable behavior components (DataProcessor, Renderer, InteractionHandler)
-   Implement component registry and coordination system
-   Build adapter layer for backward compatibility
-   Transform all series to use composition pattern

### 3. Strategy Pattern Implementation

**Goal**: Enable flexible behavior customization

-   Implement strategy interfaces for variable behaviors
-   Add runtime strategy switching capabilities
-   Optimize performance with object pooling and caching

### 4. Type System Simplification

**Goal**: Reduce complexity while maintaining type safety

-   Flatten inheritance hierarchy to ≤2 levels
-   Simplify generic type system from 42+ to <10 parameters
-   Use runtime type guards for complex type relationships
-   Maintain full TypeScript type safety

## Expected Benefits

### Code Quality

-   **60-70% reduction in duplicated code**
-   **Easier to add new series types** - composition vs inheritance
-   **Better testability** - isolated component testing
-   **Clearer separation of concerns**

### Performance

-   **52% bundle size reduction** - shared components, tree-shaking
-   **33% memory overhead reduction** - flatter object structure
-   **Improved JIT optimization** - simpler types, better inline caching

### Developer Experience

-   **Simplified type system** - reduce from 42+ to <10 generic parameters
-   **Clear component boundaries** - easier to understand and debug
-   **Flexible architecture** - mix and match behaviors

## Backward Compatibility Strategy

The refactoring maintains 100% backward compatibility through:

-   **Adapter Pattern**: Existing public APIs preserved through adapter layer
-   **Zero Breaking Changes**: All existing user code continues to work unchanged
-   **Comprehensive Testing**: Full regression test suite validates compatibility

## Success Metrics

### Code Quality Targets

-   **60%+ reduction** in code duplication
-   **≤2 levels** of inheritance hierarchy depth
-   **<10 generic parameters** per class (down from 42+)
-   **>95% test coverage** for all new utilities

### Performance Validation

-   **Zero performance regression** validated by existing `nx benchmark` suite
-   **Zero pixel difference** confirmed by existing visual regression tests
-   **Bundle size reduction** of 40%+ through improved tree-shaking

### Developer Experience

-   **50% faster** new series implementation
-   **Clear separation** of concerns through composition
-   **Improved debugging** with isolated component testing

## Risk Assessment

### Primary Risks

-   **Performance regression**: Mitigated by existing `nx benchmark` validation
-   **Behavioral changes**: Prevented by comprehensive visual regression testing
-   **Complex series compatibility**: Validated through enterprise series testing (BoxPlot, Hierarchical)

### Mitigation Strategy

-   **Existing test infrastructure** provides comprehensive validation
-   **Adapter pattern** ensures zero breaking changes
-   **Clear architectural documentation** guides implementation

## Decision Rationale

### Why Composition Over Inheritance?

1. **Flexibility**: Mix and match behaviors without inheritance constraints
2. **Testability**: Test individual components in isolation
3. **Maintainability**: Clear separation of concerns, single responsibility
4. **Performance**: Shared components, better memory locality (with caveats for function call overhead)

### Why Single Comprehensive Update?

1. **Atomic Delivery**: Ensures architectural consistency across all components
2. **Clear Vision**: Provides complete picture of the target architecture
3. **Simplified Testing**: Single validation cycle rather than multiple phases
4. **Team Alignment**: Unified understanding of the new patterns

### Alternative Architectures Considered

#### Hybrid Architecture (Recommended Alternative)

-   Keep inheritance for series families (Cartesian, Polar, Hierarchical)
-   Use composition only for truly independent behaviors (tooltips, legends)
-   Lower risk, captures most benefits without wholesale change
-   Better suited to AG Charts' performance constraints

#### Mixin-based Approach

-   TypeScript mixins provide flexibility without runtime overhead
-   Maintains some inheritance benefits
-   Less disruption to existing DataModel integration

#### Code Generation

-   Generate boilerplate from templates
-   Reduces duplication without runtime cost
-   Leverages existing Nx infrastructure

## Performance Validation

Performance will be validated using existing infrastructure:

-   **Existing benchmarks**: `nx benchmark` suite provides comprehensive performance validation
-   **Visual regression tests**: Existing test suite ensures pixel-perfect rendering consistency
-   **Memory profiling**: Standard memory usage validation during development

## Related Documents

### Implementation Guide (Sharded)

The implementation guide has been organized into focused, digestible sections:

1. **[Philosophy - Composition Over Inheritance](01-philosophy-composition.md)**

    - Core architectural philosophy and principles
    - Why composition beats inheritance
    - Key design principles and expected impact

2. **[Utility Extraction](02-utility-extraction.md)**

    - Legend, tooltip, stacking, and highlight utilities
    - Code reduction examples (150+ lines → 5 lines)
    - ~1,400 lines eliminated across implementations

3. **[Composition Architecture](03-composition-architecture.md)**

    - Core component interfaces (DataProcessor, Renderer, InteractionHandler)
    - Modern series factory patterns
    - Adapter pattern for backward compatibility

4. **[Strategy Pattern Implementation](04-strategy-pattern.md)**

    - Data aggregation, path rendering, and interaction strategies
    - Runtime strategy management and registration
    - Performance optimizations with caching and pooling

5. **[Type System Simplification](05-type-system.md)**

    - Reduction from 42+ to <10 generic parameters
    - Runtime type guards and validators
    - Type-safe component factory

6. **[Testing and Migration](06-testing-migration.md)**

    - Component, integration, and visual regression testing
    - Migration examples (LineSeries, new series types)
    - Migration checklist and backward compatibility

7. **[Summary and Benefits](07-summary-benefits.md)**
    - Quantitative metrics (60% code reduction, 52% bundle size reduction)
    - Qualitative benefits and strategic value
    - ROI analysis and future opportunities

### Other Documents

-   [README](README.md) - Navigation and overview

## Future Considerations

### Extension Points

-   Plugin architecture for third-party series
-   Dynamic behavior loading for enterprise features
-   Runtime series type registration

### Technology Evolution

-   Consider future TypeScript features for type safety
-   Evaluate WebAssembly for performance-critical paths
-   Plan for WebGPU rendering pipeline integration

---

**Next Steps**: Begin implementation following the patterns and examples in the [Implementation Guide](implementation-guide.md).
