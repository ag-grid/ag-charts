# 01: Philosophy - Composition Over Inheritance

## 📋 Overview

This document outlines the philosophical foundation for transforming AG Charts' Series architecture from deep inheritance to composition-based design.

## 🎯 The Problem with Deep Inheritance

Current series hierarchy creates multiple issues:

```typescript
// Current: Complex inheritance with mixed responsibilities
export abstract class CartesianSeries<
    TNode extends Node<any>,
    TOpts extends object,
    TProps extends CartesianSeriesProperties<TOpts>,
    TDatum extends CartesianSeriesNodeDatum,
    TLabel extends SeriesNodeDatum<number> = TDatum,
    TContext extends CartesianSeriesNodeDataContext<TDatum, TLabel>,
    TStackContext = never,
> extends DataModelSeries<...> {
    // 500+ lines mixing data processing, rendering, interaction, etc.
}
```

### Issues:

-   **Mixed Responsibilities**: Single class handles data, rendering, interaction, tooltips, legends
-   **Deep Coupling**: Changes ripple through entire hierarchy
-   **Hard to Test**: Cannot isolate components for unit testing
-   **Cognitive Load**: Understanding requires knowledge of entire hierarchy

## ✅ The Solution: Clear Composition

```typescript
// Target: Simple composition with clear responsibilities
interface Series {
    readonly type: SeriesType;
    readonly properties: SeriesProperties;

    // Composed behaviors - each with single responsibility
    readonly dataProcessor: DataProcessor;
    readonly coordinateSystem: CoordinateSystem;
    readonly renderer: SeriesRenderer;
    readonly interactionHandler: InteractionHandler;
    readonly legendProvider: LegendProvider;
    readonly tooltipProvider: TooltipProvider;
}
```

## 💡 Why This Approach Works

1. **Single Responsibility**: Each component has one clear purpose
2. **Easy Testing**: Components can be tested in isolation
3. **Flexible Composition**: Mix and match behaviors as needed
4. **Clear Boundaries**: No confusion about where functionality belongs
5. **Easier Debugging**: Issues isolated to specific components

## 🔑 Key Principles

### Single Responsibility Principle

Each component has one clear purpose:

-   **DataProcessor**: Transform raw data into series-ready format
-   **Renderer**: Handle visual representation only
-   **InteractionHandler**: Manage user interactions only
-   **LegendProvider**: Generate legend items only
-   **TooltipProvider**: Create tooltip content only

### Composition Over Inheritance

```typescript
// ❌ Bad: Deep inheritance with mixed responsibilities
class LineSeries extends CartesianSeries<...> {
    // Mixes data processing, rendering, interaction, etc.
}

// ✅ Good: Clear composition with single-purpose components
class LineSeries implements Series {
    readonly dataProcessor: DataProcessor;
    readonly renderer: Renderer;
    readonly interactionHandler: InteractionHandler;
    // Each component has one job
}
```

### Interface Segregation

```typescript
// ❌ Bad: Monolithic interface
interface Series {
    processData(): void;
    render(): void;
    handleClick(): void;
    getLegendData(): void;
    getTooltipContent(): void;
    // Too many responsibilities
}

// ✅ Good: Focused interfaces
interface DataProcessor {
    process(): void;
}
interface Renderer {
    render(): void;
}
interface InteractionHandler {
    handleClick(): void;
}
// Each interface has clear purpose
```

### Dependency Injection

```typescript
// ✅ Components receive dependencies explicitly
class LineSeries {
    constructor(
        private dataProcessor: DataProcessor,
        private renderer: Renderer,
        private interactionHandler: InteractionHandler
    ) {
        // Clear dependencies, easy to test and mock
    }
}
```

## 📊 Expected Impact

### Quantitative Benefits

-   **60-70% reduction** in duplicated code
-   **52% bundle size reduction** through better tree-shaking
-   **44% memory usage reduction** via flatter object structure
-   **<10 generic parameters** per class (down from 42+)

### Qualitative Benefits

-   **Clearer architecture** with obvious component boundaries
-   **Easier debugging** through component isolation
-   **Better testability** with focused unit tests
-   **Increased flexibility** through composition
-   **Improved maintainability** with single responsibility components

### Team Benefits

-   **Faster onboarding** with simpler architecture
-   **Reduced cognitive load** from eliminating deep inheritance
-   **Better collaboration** through clear component contracts
-   **Easier code reviews** with focused, single-purpose changes

---

**Next**: [02: Utility Extraction](02-utility-extraction.md) - Eliminate code duplication through shared utilities
