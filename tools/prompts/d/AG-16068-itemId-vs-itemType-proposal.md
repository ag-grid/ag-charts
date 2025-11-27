# ItemId vs ItemType Property Proposal

## Current Implementation Analysis

### Type Variations Found

1. **Legend Related**

```typescript
// legendOptions.ts
interface AgLegendClickEvent {
    itemId: any; // Most permissive
}

interface AgLegendLabelFormatterParams {
    itemId: string; // Strict string
}

interface AgChartLegendListenerEvent {
    itemId?: string; // Optional string
}
```

2. **Event Related**

```typescript
// eventOptions.ts
interface AgBaseChartListenerEvent {
    itemId?: string | number; // Supports both string and number
}
```

3. **Series Specific**

```typescript
// waterfallOptions.ts
type AgWaterfallSeriesItemType = 'positive' | 'negative' | 'total' | 'subtotal';

interface AgWaterfallSeriesTooltipRendererParams {
    itemId: AgWaterfallSeriesItemType;  // Using literal types
}

// ohlcBaseOptions.ts
interface OHLCParams {
    itemId: 'up' | 'down';  // Using literal types
}

// rangeAreaOptions.ts
type AgRangeAreaSeriesItemType = /* literal types */;
interface RangeAreaParams {
    itemId: AgRangeAreaSeriesItemType;
}
```

## Problem Analysis

1. **Semantic Overloading**:

    - `itemId` is used for both identification (legend, events) and categorization (series parameters)
    - This creates confusion about the property's purpose

2. **Type Inconsistencies**:

    - Legend: `any`, `string`, and `string?`
    - Events: `string | number | undefined`
    - Series: Literal union types

3. **Documentation Mismatch**:
    - API docs specify `string` type
    - Implementation varies across different use cases

## Proposed Solution

### 1. Split the Concepts

#### For Series Parameter Callbacks:

```typescript
// Convert from:
interface SeriesCallbackParams {
    itemId: 'positive' | 'negative' | 'total'; // Current
}

// To:
interface SeriesCallbackParams {
    itemType: 'positive' | 'negative' | 'total'; // New
}
```

#### For Identification (Keep as is):

```typescript
interface EventParams {
    itemId: string | number | undefined;
}
```

### 2. Specific Type Updates

1. **Waterfall Series**:

```typescript
export interface AgWaterfallSeriesTooltipRendererParams {
    // Change from itemId to itemType
    itemType: 'positive' | 'negative' | 'total' | 'subtotal';
}
```

2. **OHLC Series**:

```typescript
interface OHLCParams {
    // Change from itemId to itemType
    itemType: 'up' | 'down';
}
```

3. **Range Area Series**:

```typescript
interface RangeAreaParams {
    // Change from itemId to itemType
    itemType: AgRangeAreaSeriesItemType;
}
```

## Migration Strategy

1. Add `itemType` to all series parameter interfaces
2. Remove `itemId` usage in series parameters
3. Standardize `itemId` type as `string | number | undefined` for identification
4. Update documentation to reflect new property
5. Update all examples and docs

## Implementation Steps

1. Update Type Definitions:

    - Modify series-specific options in `ag-charts-types`
    - Update event interfaces where needed
    - Add proper JSDoc documentation

2. Update Implementation:

    - Modify internal code to use new property names
    - Update tests

3. Documentation Updates:
    - Update API reference
    - Add migration guide
    - Update examples

## Testing Requirements

1. **Type Definition Tests**

```typescript
// Verify series parameter type safety
const params: AgWaterfallSeriesTooltipRendererParams = {
    itemType: 'positive', // Should compile
    itemType: 'invalid', // Should not compile
};

// Verify event type safety
const event: AgBaseChartListenerEvent = {
    itemId: 'string-id', // Should compile
    itemId: 123, // Should compile
};
```

2. **Runtime Tests**
    - Verify both old and new properties work where appropriate
    - Test all chart types and series combinations

## Benefits

1. **Semantic Clarity**

    - Clear distinction between identifiers and type categories
    - More intuitive API

2. **Type Safety**

    - Better TypeScript type checking
    - Clear contracts for different use cases

3. **Documentation Accuracy**
    - No more mismatches between docs and implementation
    - Clear usage guidelines

## Next Steps

1. Create JIRA ticket(s) for implementation
2. Update type definitions
3. Add migration documentation
4. Schedule deprecation timeline

This solution maintains backward compatibility while providing a clearer, more type-safe API moving forward.
