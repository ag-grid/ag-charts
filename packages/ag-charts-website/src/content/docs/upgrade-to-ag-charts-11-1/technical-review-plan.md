# Technical Review Plan: Upgrade to AG Charts 11.1

## Page Analysis Summary

This is an upgrade guide for AG Charts version 11.1, which is a minor release with minimal changes:

### Key Content:

-   **Release Blog Post**: Links to external blog post for feature highlights
-   **Breaking Changes**: None
-   **Behavior Changes**: None
-   **Removed Deprecated APIs**: None
-   **Deprecations**: One deprecation - `zoom.minVisibleItemsX` and `zoom.minVisibleItemsY` are deprecated in favor of `zoom.minVisibleItems`
-   **Integration Note**: Users of integrated charting on AG Grid should refer to this guide when upgrading to AG Grid 33.1

### Documentation Features:

-   Uses Markdoc variables for version management (`migrationVersion()`, `migrationVersionPatch()`)
-   Includes changelog section
-   Has expandable sections for deprecations
-   Links to release post for additional context

## Validation Targets

### 1. TypeScript Interface Verification

-   **Primary Target**: `AgZoomOptions` interface in `packages/ag-charts-types/src/chart/zoomOptions.ts`
    -   Verify `minVisibleItems` property exists
    -   Check if deprecated properties (`minVisibleItemsX`, `minVisibleItemsY`) are marked with `@deprecated` JSDoc comments
    -   Confirm property types and default values

### 2. Implementation Verification

-   **Zoom Manager**: Check `packages/ag-charts-community/src/chart/interaction/zoomManager.ts`
    -   Verify `minVisibleItems` is properly implemented
    -   Check for backward compatibility handling of deprecated properties
    -   Verify deprecation warnings are logged when old properties are used

### 3. Example Validation

-   **Primary Example**: `/zoom/zoom-min-visible-items` example
    -   Verify it uses the new `minVisibleItems` property
    -   Check that it demonstrates the feature correctly
    -   Ensure no usage of deprecated properties

### 4. Documentation Cross-References

-   **Zoom Documentation**: Check main zoom documentation page for consistency
-   **API Reference**: Verify zoom options documentation reflects the deprecation
-   **Upgrade Guide v12**: Confirm deprecated properties were removed in v12 (already verified)

## Known Exceptions

No existing `technical-review-exceptions.md` file was found for this page.

## Execution Plan

### Priority 1: Deprecation Accuracy (Critical)

1. **Verify TypeScript Definitions**

    - Check `AgZoomOptions` interface for property definitions
    - Confirm deprecation annotations exist for old properties
    - Verify new `minVisibleItems` property is properly typed

2. **Implementation Validation**

    - Search for deprecation warning logic in zoom implementation
    - Check backward compatibility handling
    - Verify property mapping from old to new names

3. **Success Criteria**:
    - Deprecated properties should have `@deprecated` JSDoc comments
    - Implementation should handle both old and new properties during v11.1
    - Console warnings should appear when using deprecated properties

### Priority 2: Example Testing (High)

**Delegation to example-tester agent:**

1. **Test zoom-min-visible-items example**

    - **Documentation claim**: The example demonstrates the `minVisibleItems` configuration option
    - **Expected behavior**:
        - Chart should enforce minimum of 10 visible items when zooming
        - Zooming should stop when only 10 data points remain visible
        - No console errors or warnings
    - **Validation requirements**:
        - Verify `zoom.minVisibleItems: 10` is used in configuration
        - Test zoom interaction to confirm minimum visible items constraint
        - Check for proper TypeScript typing
        - Ensure no deprecated properties are used

2. **Visual and Interaction Testing**:
    - Take screenshots during zoom operations
    - Verify zoom constraints are visually enforced
    - Test edge cases (zoom to minimum, then try to zoom further)

### Priority 3: Documentation Consistency (Medium)

1. **Cross-reference with zoom documentation**

    - Check if main zoom docs mention the deprecation
    - Verify API reference is updated

2. **Version consistency check**

    - Confirm v11.1 deprecates the properties
    - Verify v12.0 removes them (already confirmed)

3. **Success Criteria**:
    - No contradictory information across documentation
    - Clear migration path documented

### Priority 4: Additional Validation (Low)

1. **Search for any remaining usage of deprecated properties**

    - Check all zoom-related examples
    - Verify no documentation references old properties (except upgrade guides)

2. **Blog post validation**
    - Check if linked blog post is accessible
    - Verify it mentions the deprecation if applicable

## Estimated Complexity

-   **Low complexity** - Single deprecation to validate
-   **Time estimate**: 30-45 minutes for complete validation
-   **Risk areas**:
    -   Ensuring deprecation warnings are properly implemented
    -   Verifying backward compatibility works correctly

## Test Checklist

-   [ ] TypeScript interface has new `minVisibleItems` property
-   [ ] TypeScript interface marks old properties as deprecated
-   [ ] Implementation handles both old and new properties
-   [ ] Deprecation warnings are logged for old properties
-   [ ] zoom-min-visible-items example uses new property correctly
-   [ ] No console errors in examples
-   [ ] Documentation is consistent across pages
-   [ ] Deprecated properties removed in v12 (confirmed)
-   [ ] Blog post link is valid
