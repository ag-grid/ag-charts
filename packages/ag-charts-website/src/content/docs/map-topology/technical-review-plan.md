# Technical Review Plan: Map Topology Documentation

## Page Analysis Summary

The map-topology page is a foundational documentation page that explains how AG Charts Map Series use GeoJSON format for geographic data. This page serves as essential reading for users working with any of the three map series types (map-shape, map-line, map-marker) and covers critical concepts about data-topology linkage.

### Key Topics Covered

-   GeoJSON specification and its usage in AG Charts
-   Geometry types and their mapping to series types
-   Properties within GeoJSON features
-   Data-topology connection mechanism using `idKey` and `topologyIdKey`
-   Background series topology handling
-   External resources for working with GeoJSON

### Examples Referenced

-   **None directly on this page** - The page references other map series pages but contains no examples of its own
-   Code snippets demonstrate the topology-data connection pattern

### Interactive Features Described

-   No interactive features are described on this page - it's purely informational

## Validation Targets

### 1. TypeScript Interface Verification

**Priority: HIGH**

-   **Primary interfaces to check:**
    -   `GeoJSON` type definition in `packages/ag-charts-types/src/chart/types.ts`
    -   `topologyIdKey` property in:
        -   `AgMapShapeSeriesOptions` (line 86 in mapShapeOptions.ts)
        -   `AgMapLineSeriesOptions` (should be around line 101 in mapLineOptions.ts)
        -   `AgMapMarkerSeriesOptions` (should be around line 122 in mapMarkerOptions.ts)
-   **Verify default values:**
    -   Documentation states `topologyIdKey` defaults to `'name'`
    -   Check implementation files for actual default value assignment

### 2. Implementation Verification

**Priority: HIGH**

-   **Core files to examine:**

    -   Map series base classes in `packages/ag-charts-community/src/series/topology/`
    -   Data-topology matching logic implementation
    -   Console warning behavior for unmatched data items
    -   Silent handling of unmatched topology features

-   **Specific behaviors to verify:**
    -   Data items without matching topology produce console warnings
    -   Topology features without data are silently ignored
    -   The matching uses `idKey` from data and `topologyIdKey` from topology properties

### 3. Code Snippet Validation

**Priority: MEDIUM**

-   **Validate the main example structure:**
    ```js
    series: [{
      type: 'map-shape',
      topology: { type: 'FeatureCollection', features: [...] },
      data: [...],
      idKey: 'country',
      topologyIdKey: 'name'
    }]
    ```
    -   Verify this matches actual API structure
    -   Check if all properties shown are valid
    -   Confirm property types match TypeScript definitions

### 4. Cross-Reference with Related Pages

**Priority: HIGH**

-   **Check consistency with:**
    -   `/map-shapes/` - Verify topology usage examples
    -   `/map-lines/` - Verify topology usage examples
    -   `/map-markers/` - Verify topology usage examples
    -   Check if background series documentation matches claims

### 5. GeoJSON Specification Accuracy

**Priority: MEDIUM**

-   **Verify geometry type table:**
    -   Confirm all seven geometry types are correctly listed
    -   Verify series type recommendations are accurate
    -   Check if `GeometryCollection` handling is correctly described

### 6. Enterprise Feature Flag

**Priority: HIGH**

-   **Verify enterprise marking:**
    -   Page is marked as `enterprise: true`
    -   Confirm all map series are enterprise-only features
    -   Check if this is properly enforced in implementation

## Known Exceptions

No `technical-review-exceptions.md` file exists for this page.

## Execution Plan

### Phase 2 Tasks (in priority order)

1. **TypeScript API Verification** (15 minutes)

    - Read type definitions for all three map series
    - Verify `topologyIdKey` property existence and documentation
    - Check `GeoJSON` type definition
    - Confirm default value documentation

2. **Implementation Analysis** (20 minutes)

    - Locate and examine topology matching logic
    - Verify console warning behavior
    - Check default value implementation for `topologyIdKey`
    - Confirm enterprise feature enforcement

3. **Code Snippet Validation** (10 minutes)

    - Test example configuration structure
    - Verify all properties are valid
    - Check for any missing required properties

4. **Related Pages Cross-Reference** (15 minutes)

    - Review map-shapes examples for topology usage
    - Review map-lines examples for topology usage
    - Review map-markers examples for topology usage
    - Verify background series claims

5. **Documentation Completeness** (10 minutes)
    - Check if all essential topology concepts are covered
    - Verify geometry type accuracy
    - Assess clarity of data-topology matching explanation

### Charts QA Tester Agent Delegation Plan

Since this page has no examples, the example-tester agent will not be needed for direct example testing. However, we should delegate testing of topology usage in related pages:

**For Phase 2 cross-reference validation:**

1. **Map Shapes Examples Testing:**

    - Test `/map-shapes/_examples/heatmap/`
    - Expected: Proper topology-data matching using `idKey` and `topologyIdKey`
    - Verify: Console warnings for unmatched data items
    - Check: Topology features render only when matched with data

2. **Map Shapes Background Example:**

    - Test `/map-shapes/_examples/backgrounds/`
    - Expected: Background series renders all topology features without data
    - Verify: No console warnings for background series

3. **Multiple Series Example:**
    - Test `/map-shapes/_examples/multiple-series/`
    - Expected: Multiple series can share the same topology
    - Verify: Each series matches its data independently

### Success Criteria

-   All TypeScript interfaces match documented properties
-   Default values are correctly documented
-   Console warning behavior matches documentation
-   Code snippets are syntactically correct and functional
-   Related pages demonstrate concepts consistently
-   Enterprise feature flag is properly enforced

### Estimated Complexity

**Medium** - While this page has no examples, it documents fundamental concepts that underpin all map series functionality. The validation requires checking multiple implementation files and cross-referencing with other documentation pages.
