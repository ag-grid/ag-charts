[Charts] Rename itemId to itemType for series parameter callbacks to improve type safety

1. **Brief Requirements statement**

    - Rename `itemId` to `itemType` in series parameter callbacks where the value represents a categorical type (e.g., 'positive', 'negative', 'up', 'down')
    - Retain `itemId` only for true identification purposes in events and legend interactions

2. **Current behavior & Problem statement**

    - Currently, `itemId` is semantically overloaded:
        - Used for identification in legend/events (string | number)
        - Used for categorization in series parameters (literal union types)
    - Documentation states `itemId` is string type, contradicting implementation
    - Type inconsistencies exist across different interfaces
    - Pie/donut charts use number type, creating confusion

3. **Use cases**

    - Users need to handle series visibility change events with proper type checking
    - Developers implementing series parameter callbacks need clear type definitions
    - Users working with legend interactions need proper type safety
    - Applications using TypeScript need accurate type definitions

4. **API Design**

    - Location: packages/ag-charts-types/src/series/cartesian/\*
    - New Members:
        ```typescript
        // In series parameter interfaces:
        interface SeriesCallbackParams {
            itemType: 'positive' | 'negative' | 'total' | 'subtotal'; // For waterfall
            // or
            itemType: 'up' | 'down'; // For OHLC
        }
        ```
    - Default Values: `undefined`
    - Existing callback params updated include:
        - AgWaterfallSeriesTooltipRendererParams
        - OHLCParams
        - RangeAreaParams

5. **API Deprecations/Hiding**

    - Remove `itemId` in series parameter contexts
    - Replace with `itemType` where categorical types are used
    - Keep `itemId` for identification purposes (events, legend)

6. **Breaking changes in API or behavior**

    - Series parameter callbacks will need to use `itemType` instead of `itemId`
    - No runtime behaviour changes
    - Type definitions will be stricter

7. **UX Design**

    - N/A - Type-level change only

8. **Dependencies**

    - No blocking dependencies
    - Related work:
        - Documentation updates
        - Example updates

9. **Functional Acceptance Criteria**

    - Series parameter callbacks:
        - Must accept `itemType` property
        - Must support literal union types specific to each series
        - May be `undefined` for series that don't use it
    - Events and legend:
        - Must continue to use `itemId` as before
        - Must maintain existing type definitions
    - TypeScript compilation:
        - Must fail when incorrect literal types are used
        - Must accept valid literal types
        - Must maintain type safety for events

10. **Non-functional Acceptance Criteria**

    - State: N/A
    - Documentation:
        - API reference must be updated to reflect new property names
        - Migration guide must be added
        - Examples must be updated
    - Accessibility: N/A
    - Localization: N/A
    - RTL Support: N/A
    - Theming: N/A

11. **Out of Scope**
    N/A
