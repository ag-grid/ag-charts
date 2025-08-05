# Technical Review Plan: Upgrade to AG Charts 11.3

## Page Analysis Summary

This is a migration guide page for AG Charts version 11.3. The page contains:

### Key Content

1. **Release Information**: Link to the release blog post (https://blog.ag-grid.com/whats-new-in-ag-charts-11-3/)
2. **Breaking Changes**: States there are no breaking changes in v11.3
3. **Behaviour Changes**: States there are no behaviour changes in v11.3
4. **Removed Deprecated APIs**: States no deprecated APIs were removed in v11.3
5. **Deprecations**: Documents specific deprecations:
    - `contextMenu.extraActions[]`
    - `contextMenu.extraSeriesAreaActions[]`
    - `contextMenu.extraNodeActions`
    - `contextMenu.extraLegendItemActions`
    - All deprecated in favor of `contextMenu.items[]` with appropriate `showOn` values

### Examples Referenced

-   No example code is provided on this page
-   No interactive examples are embedded

### Interactive Features Described

-   None - this is a migration guide without interactive examples

## Validation Targets

### 1. TypeScript Interface Verification

-   **Priority: HIGH**
-   Verify that the deprecated `contextMenu` properties exist in AG Charts 11.2 or earlier type definitions:
    -   `extraActions?: AgContextMenuAction[]`
    -   `extraSeriesAreaActions?: AgContextMenuAction[]`
    -   `extraNodeActions?: AgContextMenuAction[]`
    -   `extraLegendItemActions?: AgContextMenuAction[]`
-   Confirm that `AgContextMenuOptions` interface in 11.3 includes:
    -   `items?: (AgContextMenuItem | string)[]` property with proper typing
    -   Deprecated properties should either be removed or marked as deprecated
-   Verify the `showOn` property exists in `AgContextMenuItem` with appropriate values:
    -   `'always'`, `'series-area'`, `'series-node'`, `'legend-item'` etc.

### 2. Implementation File Checks

-   **Priority: HIGH**
-   Search for migration/deprecation handling code that maps old context menu properties to new `items` array
-   Verify that using the deprecated properties still works in 11.3 (backward compatibility)
-   Check console warnings are issued when using deprecated properties
-   Confirm the mapping logic correctly translates old extra actions to new `items` with proper `showOn` values
-   Validate that the new `items` API with `showOn` provides equivalent functionality

### 3. Context Menu Documentation Cross-Reference

-   **Priority: HIGH**
-   Verify the context-menu documentation page properly documents the new `items[]` API
-   Check that examples in context-menu docs demonstrate the `showOn` property usage
-   Ensure the migration path from `extraActions` to `items` is clear and well-documented
-   Confirm that all `showOn` values mentioned in the deprecation are documented

### 4. Blog Post and External Links Verification

-   **Priority: MEDIUM**
-   Verify the blog post link (https://blog.ag-grid.com/whats-new-in-ag-charts-11-3/) is valid and accessible
-   Check that the blog post mentions the context menu improvements
-   Ensure the blog post content aligns with the deprecation statements in the migration guide

### 5. Deprecation Accuracy and Completeness

-   **Priority: HIGH**
-   Verify the deprecation statement is accurate and complete:
    -   The old APIs were `extraActions[]`, `extraSeriesAreaActions[]`, `extraNodeActions`, `extraLegendItemActions`
    -   The new API uses `items[]` with `showOn` values to control visibility
-   Check if there are any other context menu related deprecations in 11.3 that should be documented
-   Validate that the mapping from old to new API is one-to-one and no functionality is lost

### 6. Version and Change Statements Accuracy

-   **Priority: HIGH**
-   Confirm that the migration version is correctly set to 11.3.0
-   Verify the statements about no breaking changes are accurate (deprecated APIs should still work)
-   Verify the statements about no behaviour changes are accurate
-   Check if any deprecated APIs from previous versions were actually removed in 11.3
-   Validate that the only documented change is the context menu deprecation

### 7. Changelog and Version History Cross-Check

-   **Priority: MEDIUM**
-   Check the changelog.json entry for v11.3 matches the deprecation notes
-   Verify that the context menu changes are properly documented in version history
-   Ensure no undocumented breaking changes or deprecations exist

## Known Exceptions

-   No technical-review-exceptions.md file exists for this page

## Execution Plan

### Phase 1: TypeScript Definition Analysis

1. Examine `AgContextMenuOptions` interface in ag-charts-types for 11.3
2. Look for deprecated properties (`extraActions`, `extraSeriesAreaActions`, etc.)
3. Verify new `items` property exists with proper typing
4. Check `AgContextMenuItem` interface includes `showOn` property with correct union types
5. Validate backward compatibility annotations for deprecated properties

### Phase 2: Implementation and Migration Logic Verification

1. Search for deprecation handling code in context menu implementation files
2. Look for console warning messages about deprecated property usage
3. Find mapping logic from old extra actions to new `items` array
4. Test that `showOn` values properly control menu item visibility
5. Verify backward compatibility handling maintains functionality

### Phase 3: Documentation Consistency Validation

1. Review context-menu documentation page for comprehensive coverage of new API
2. Verify examples demonstrate proper usage of `items[]` and `showOn` properties
3. Check that migration guidance is clear and provides practical examples
4. Validate the blog post link is accessible and contains relevant information

### Phase 4: Cross-Reference and Completeness Check

1. Verify all statements about no breaking/behaviour changes
2. Check changelog entries align with documented changes
3. Search for any undocumented context menu changes or other deprecations
4. Validate that the migration guide is complete for 11.3

### Phase 5: API Equivalence Verification

1. Map each deprecated property to its new `items[]` equivalent:
    - `extraActions` → `items[]` with `showOn: 'always'`
    - `extraSeriesAreaActions` → `items[]` with `showOn: 'series-area'`
    - `extraNodeActions` → `items[]` with `showOn: 'series-node'`
    - `extraLegendItemActions` → `items[]` with `showOn: 'legend-item'`
2. Ensure no functionality is lost in the migration
3. Verify that mixed usage (old and new APIs together) is handled gracefully

## Success Criteria

1. **TypeScript Definitions**: Deprecated properties should be marked as deprecated or removed, new `items` property should be properly typed
2. **Backward Compatibility**: Old context menu configurations should still work with appropriate warnings
3. **API Equivalence**: New `items[]` API should provide equivalent functionality to deprecated properties
4. **Documentation Consistency**: All documentation sources should align on the deprecation details and migration path
5. **Content Completeness**: The migration guide should accurately reflect all changes in 11.3
6. **No Hidden Changes**: Verify that only the documented context menu deprecation exists in 11.3

## Delegation Plan for example-tester Agent

Since this page contains no examples, the example-tester agent will not be needed for example validation. However, they may be useful for:

-   Testing context menu functionality with both old and new APIs to verify backward compatibility
-   Validating that the migration path works correctly in practice
-   Checking that console warnings appear when using deprecated properties

## Estimated Complexity

-   **Medium**: While this is a migration guide, the context menu API change involves multiple deprecated properties and a significant API redesign
-   **Time Estimate**: 25-30 minutes for complete review
-   **Risk Areas**:
    -   Ensuring complete backward compatibility for all deprecated properties
    -   Verifying the new `items[]` API provides equivalent functionality
    -   Confirming no other undocumented changes exist in 11.3
    -   Validating that the `showOn` property mapping is correct and complete

## Special Considerations

This migration guide is particularly important because:

1. It involves a significant API redesign for context menus
2. Multiple properties are being deprecated simultaneously
3. The new API uses a different structure (`items[]` with `showOn`) that needs careful validation
4. Context menu functionality is user-facing and any migration issues would be immediately apparent
5. The deprecation affects multiple areas of context menu functionality (general, series area, nodes, legend items)
