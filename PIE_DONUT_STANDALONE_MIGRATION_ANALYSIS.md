# Pie and Donut Series: Standalone Chart Migration Analysis

## Executive Summary

**Recommendation: YES - Migration to standalone chart type is strongly justified**

The Pie and Donut series are currently implemented as PolarSeries subclasses, but explicit TODOs in the codebase (`expectedModules.ts:17,39-40`) indicate they should be refactored to standalone chart types. After comprehensive analysis, this migration makes strong architectural sense and would:

1. **Eliminate architectural mismatch** - Pie/Donut don't use polar axes despite inheriting from PolarSeries
2. **Remove special-case code** - PolarChart contains specific pie/donut layout logic that doesn't belong
3. **Enable enterprise polar features** - Allow polar charts to become enterprise-only as planned
4. **Simplify the type hierarchy** - Reduce inheritance depth and complexity
5. **Improve code maintainability** - Each chart type would follow its natural pattern

**Key Insight**: Pie/Donut are circular by visual appearance, not by architectural need. They have more in common with gauge and hierarchy charts (all standalone) than with radar/nightingale charts (true polar series that use axes).

---

## Current Architecture Analysis

### 1. Implementation Details

**File Locations:**
- Implementation: `packages/ag-charts-community/src/chart/series/polar/donutSeries.ts` (1,911 lines)
- Subclass: `packages/ag-charts-community/src/chart/series/polar/pieSeries.ts` (7 lines - extends DonutSeries)
- Module: `packages/ag-charts-community/src/chart/series/polar/donutSeriesModule.ts`

**Class Hierarchy:**
```
Series → DataModelSeries → PolarSeries → DonutSeries → PieSeries
```

**Module Configuration:**
```typescript
export const DonutSeriesModule = {
    type: 'series',
    name: 'donut',
    chartType: 'polar',  // ← Currently polar
    // ...
};
```

### 2. Axis Usage Analysis

**Critical Finding: Pie/Donut DO NOT use axes despite being PolarSeries**

Evidence:
- `canHaveAxes = false` (inherited from PolarSeries constructor at line 122)
- Define axis directions but never request axes from the chart
- Manage internal scales directly (`angleScale`, `radiusScale`)
- The `getSeriesDomain()` method (donutSeries.ts:265-270) is never called by the framework

**Chart.ts axis assignment gate** (chart.ts:1057-1060):
```typescript
if (this.series.some((s) => s.canHaveAxes)) {
    this.assignAxesToSeries();
    this.assignSeriesToAxes();
}
```
Pie/Donut skip this entirely.

**Internal Scale Management** (donutSeries.ts:226-230):
```typescript
this.angleScale = new LinearScale();
this.angleScale.domain = [0, 1];  // Ratios, not axis values
this.angleScale.range = [-Math.PI, Math.PI].map((angle) => angle + Math.PI / 2);
```

### 3. PolarChart Special Handling

**PolarChart contains pie/donut-specific layout code** (polarChart.ts:93-105):

```typescript
const pieSeries = polarSeries.filter((s) => s.type === 'donut' || s.type === 'pie');
if (pieSeries.length > 1) {
    // Special concentric layout for multiple pie/donut series
    const innerRadii = pieSeries
        .map((series) => ({ series, innerRadius: series.getInnerRadius() }))
        .sort((a, b) => a.innerRadius - b.innerRadius);
    // Arrange pies concentrically...
}
```

This is a code smell - PolarChart shouldn't have series-type-specific logic.

### 4. Comparison: True Polar Series vs Pie/Donut

| Aspect | True Polar (Radar, Nightingale) | Pie/Donut |
|--------|----------------------------------|-----------|
| **Uses Axes** | ✅ Yes (angle + radius axes) | ❌ No |
| **Axis Directions** | [Angle, Radius] | [Angle, Radius] (defined but unused) |
| **Scale Source** | From axes | Internal `angleScale`/`radiusScale` |
| **Data Mapping** | Maps to axis domains | Maps to proportions (sum = 1) |
| **Layout Logic** | Standard circular | Custom per-series-type handling |
| **Multi-Series** | Standard overlay | Special concentric arrangement |
| **Enterprise** | ✅ Yes (radar-*, nightingale) | ❌ No (community) |

---

## Standalone Chart Pattern Analysis

### 1. Standalone Chart Definition

**Chart Implementation:** `packages/ag-charts-enterprise/src/charts/standaloneChart.ts` (62 lines)

```typescript
export class StandaloneChart extends Chart {
    static readonly type = 'standalone' as const;

    protected performLayout(ctx: LayoutContext) {
        const seriesRect = ctx.layoutBox.clone().shrink(seriesArea.getPadding());
        this.seriesRect = seriesRect;
        // Simple rect layout - no axis computation
    }
}
```

**Key Characteristics:**
- Extends Chart directly (not CartesianChart/PolarChart)
- No axis layout or management
- Simple rectangular layout box
- Series manage their own positioning entirely

### 2. Standalone Series Examples

**Currently Standalone** (all enterprise):
- `radial-gauge`, `linear-gauge` - Circular/linear displays with internal scales
- `treemap`, `sunburst` - Hierarchy charts with custom layouts
- `sankey`, `chord` - Flow diagrams with node/link positioning
- `pyramid` - Proportional stage display

**Common Pattern:**
```typescript
export class RadialGaugeSeries extends Series<...> {
    // No axis directions defined
    // Manages own scale and positioning
    // Simple data-to-visual mapping
}
```

Module registration:
```typescript
export const RadialGaugeSeriesModule = {
    type: 'series',
    name: 'radial-gauge',
    chartType: 'standalone',  // ← Standalone
    enterprise: true,
    // ...
};
```

### 3. Why Pie/Donut Fit the Standalone Pattern

| Criterion | Pie/Donut Behavior | Standalone Pattern |
|-----------|-------------------|-------------------|
| **Axes Required** | No | No ✅ |
| **Self-Contained Layout** | Yes (sectors based on data sum) | Yes ✅ |
| **Data Domain** | Proportions (0-1) | Varies ✅ |
| **Visual Space** | Circular region | Varies ✅ |
| **Multi-Series Layout** | Custom concentric | Custom ✅ |
| **Positioning Logic** | Internal angle/radius calc | Internal ✅ |

**Architectural Alignment Score: 10/10**

---

## Current System Constraints

### 1. Community vs Enterprise Split

**Critical Issue:** StandaloneChart currently exists only as a **placeholder** in community:

`packages/ag-charts-community/src/chart/enterpriseChartModules.ts`:
```typescript
export const StandaloneChartModule: ChartModuleDefinition<any> = {
    type: 'chart',
    name: 'standalone',
    placeholder: true,  // ← Not implemented in community
    version: VERSION,
    create: () => { throw new Error('Enterprise module placeholder...'); },
};
```

Actual implementation: `packages/ag-charts-enterprise/src/charts/standaloneChart.ts`

**Package Status:**
- **Pie/Donut:** Community features (MIT license)
- **StandaloneChart:** Enterprise-only implementation
- **All standalone series:** Currently enterprise-only

### 2. TODO Comments in Codebase

`packages/ag-charts-community/src/chart/factory/expectedModules.ts`:

**Line 17:**
```typescript
{ type: 'chart', name: 'polar' }, // TODO refactor pie/donut to be a standalone chart type, and make polar an enterprise feature
```

**Lines 39-40:**
```typescript
{ type: 'series', name: 'pie', chartType: 'polar' }, // TODO should be of chartType standalone
{ type: 'series', name: 'donut', chartType: 'polar' }, // TODO should be of chartType standalone
```

**Implications:**
1. Team has already identified this need
2. Goal is to make polar enterprise-only (radar, nightingale, radial-bar are enterprise)
3. Migration would unblock that architectural goal

---

## Migration Justification

### Architectural Reasons

1. **Semantic Correctness**
   - Pie/Donut are not "polar" charts in the mathematical/charting sense
   - True polar charts use angle/radius axes with continuous scales
   - Pie/Donut use proportional segmentation, more like gauges or funnels

2. **Inheritance Hierarchy**
   - Currently: `Series → DataModelSeries → PolarSeries (10,503 lines) → DonutSeries`
   - Proposed: `Series → DataModelSeries → DonutSeries`
   - Removes 10,500+ lines of irrelevant inherited code

3. **Code Cleanliness**
   - Eliminates PolarChart's special-case pie/donut handling
   - Removes unused axis-related methods and properties
   - Clarifies that pie/donut are self-contained visualizations

4. **Feature Independence**
   - True polar features (radar charts, polar axes) can become enterprise
   - Pie/Donut remain community without architectural compromises
   - Clear separation of concerns

### Technical Benefits

1. **Reduced Complexity**
   - No need to inherit PolarSeries animation state machine
   - No unused axis direction definitions
   - Simpler testing and maintenance

2. **Better Performance**
   - Slightly smaller bundle (no unused polar infrastructure)
   - Clearer code paths (no conditional checks for pie/donut)

3. **Improved Extensibility**
   - Future pie variants (e.g., rose chart, exploded pie) follow standalone pattern
   - Multi-series pie layout moves to series-level control

4. **Type Safety**
   - TypeScript types reflect actual behavior (no axis properties)
   - IDE autocomplete shows relevant options only

---

## Migration Plan

### Phase 1: Community StandaloneChart Implementation (2-3 days)

**Goal:** Create a working StandaloneChart in the community package

**Tasks:**

1. **Create StandaloneChart class** (`packages/ag-charts-community/src/chart/standaloneChart.ts`)
   - Copy from enterprise implementation
   - Implement simple layout (already 62 lines, very simple)
   - No enterprise dependencies

2. **Update StandaloneChartModule** (`packages/ag-charts-community/src/chart/enterpriseChartModules.ts`)
   - Remove placeholder flag
   - Wire up actual create function
   - Add options definitions

3. **Add StandaloneChart export** (`packages/ag-charts-community/src/main.ts`)
   - Export real implementation instead of placeholder

**Files to Create/Modify:**
```
CREATE  packages/ag-charts-community/src/chart/standaloneChart.ts
MODIFY  packages/ag-charts-community/src/chart/enterpriseChartModules.ts
MODIFY  packages/ag-charts-community/src/chart/chartOptionsDefs.ts
```

**Validation:**
- Build succeeds
- Existing tests pass
- Enterprise StandaloneChart still works (backward compat)

### Phase 2: Refactor DonutSeries to Standalone (3-4 days)

**Goal:** Make DonutSeries extend Series directly, not PolarSeries

**Tasks:**

1. **Update DonutSeries class** (`donutSeries.ts`)

   **Remove:**
   - `extends PolarSeries` → `extends DataModelSeries`
   - `directions` property definition
   - `getSeriesDomain()` method (unused)
   - PolarSeries-specific animation state handling
   - Unused import of PolarSeries types

   **Keep:**
   - All existing `angleScale`/`radiusScale` logic (already self-contained)
   - All data processing, properties, rendering code
   - Internal `centerX`, `centerY`, `radius` properties
   - Animation functions (adapt to Series pattern, not PolarSeries)

   **Add:**
   - Direct `centerX`, `centerY`, `radius` management
   - Layout computation in `update()` phase (currently set by PolarChart)

2. **Update DonutSeriesModule** (`donutSeriesModule.ts`)
   ```typescript
   chartType: 'standalone',  // Changed from 'polar'
   ```

3. **Update PieSeries** (`pieSeries.ts`)
   - No changes needed (still extends DonutSeries)
   - Verify inheritance still works

4. **Move multi-series layout logic** (from PolarChart to DonutSeries)

   PolarChart currently handles concentric pie arrangement (polarChart.ts:93-105).

   **Move to:**
   - StandaloneChart's `performLayout()` OR
   - DonutSeries' layout coordination method

   **New Pattern:**
   ```typescript
   // In StandaloneChart or DonutSeries
   private layoutConcentricPies(pieSeries: DonutSeries[], rect: BBox) {
       // Sort by innerRadius
       // Assign surroundingRadius to each
       // Coordinate centerX/Y/radius
   }
   ```

5. **Update expectedModules.ts**
   ```typescript
   { type: 'series', name: 'pie', chartType: 'standalone' },  // Remove TODO
   { type: 'series', name: 'donut', chartType: 'standalone' }, // Remove TODO
   { type: 'chart', name: 'polar' },  // Remove TODO (can now be enterprise)
   ```

**Files to Modify:**
```
MODIFY  packages/ag-charts-community/src/chart/series/polar/donutSeries.ts (~200 lines changed)
MODIFY  packages/ag-charts-community/src/chart/series/polar/donutSeriesModule.ts (1 line)
MODIFY  packages/ag-charts-community/src/chart/series/polar/pieSeries.ts (verify only)
MODIFY  packages/ag-charts-community/src/chart/polarChart.ts (remove pie/donut code)
MODIFY  packages/ag-charts-community/src/chart/standaloneChart.ts (add layout logic if needed)
MODIFY  packages/ag-charts-community/src/chart/factory/expectedModules.ts (3 lines)
```

**Validation:**
- `nx build ag-charts-community`
- `nx test ag-charts-community`
- Visual regression: pie/donut examples render identically

### Phase 3: Update Tests and Examples (1-2 days)

**Goal:** Ensure all tests and examples work with new architecture

**Tasks:**

1. **Update Unit Tests**
   - Search for PolarSeries mocks involving pie/donut
   - Update test expectations (chart type, class hierarchy)
   - Add standalone-specific tests

2. **Update Integration Tests**
   - Run full test suite: `nx test ag-charts-community`
   - Fix any chart type detection failures
   - Verify multi-series pie tests pass

3. **Update E2E Tests**
   - Run website tests: `nx e2e ag-charts-website`
   - Verify pie/donut gallery pages render correctly
   - Test framework switcher (React/Angular/Vue variants)

4. **Validate Examples**
   - Run: `nx generate-examples ag-charts-website`
   - Run: `nx validate-examples`
   - Visual check key pie/donut documentation pages

**Files to Review:**
```
packages/ag-charts-community/src/chart/test/**/*pie*
packages/ag-charts-community/src/chart/test/**/*donut*
packages/ag-charts-website/src/content/docs/**/*pie*
packages/ag-charts-website/src/content/docs/**/*donut*
```

**Validation:**
- All tests pass
- All examples generate correctly
- No visual regressions

### Phase 4: Documentation and Cleanup (1 day)

**Goal:** Update documentation and remove dead code

**Tasks:**

1. **Remove TODOs**
   - Delete TODO comments from expectedModules.ts
   - Document migration in CHANGELOG

2. **Update Architecture Docs**
   - Update `tools/prompts/technology-stack.md` if needed
   - Document standalone pattern for community charts

3. **Code Cleanup**
   - Remove PolarSeries imports from pie/donut files
   - Clean up any commented-out code
   - Run `nx format` and `nx lint`

4. **Migration Notes**
   - Add migration guide for any API changes (likely none)
   - Update TypeScript type exports if needed

5. **Performance Validation**
   - Run: `nx benchmark ag-charts-community -- -t "pie"`
   - Run: `nx benchmark ag-charts-community -- -t "donut"`
   - Ensure no performance regression (should be same or better)

**Files to Modify:**
```
MODIFY  packages/ag-charts-community/CHANGELOG.md
MODIFY  tools/prompts/technology-stack.md (if needed)
REMOVE  Any obsolete polar-specific pie/donut code
```

**Validation:**
- Documentation builds successfully
- Benchmarks show no regression
- Code review ready

### Phase 5: Enterprise Polar Promotion (Optional, Future)

**Goal:** Make polar charts enterprise-only (as TODO suggests)

**Note:** This phase is OPTIONAL and can be done separately. The pie/donut migration does NOT depend on this.

**Tasks:**
1. Move PolarChart to enterprise package
2. Move PolarAxis to enterprise
3. Update module registrations for radar-*, nightingale, radial-*
4. Update licensing documentation

**Timeline:** 2-3 days (separate initiative)

---

## Risk Assessment

### Low Risk ✅

1. **API Stability**
   - ✅ No user-facing API changes required
   - ✅ All options remain the same (angleKey, radiusKey, etc.)
   - ✅ Backward compatible JSON configurations

2. **Functionality**
   - ✅ All rendering logic stays in DonutSeries (no changes)
   - ✅ Data processing unchanged
   - ✅ Animation system compatible with DataModelSeries

3. **Testing**
   - ✅ Comprehensive test coverage exists
   - ✅ Visual regression tests will catch rendering issues
   - ✅ E2E tests cover user interactions

### Medium Risk ⚠️

1. **Multi-Series Layout**
   - ⚠️ Concentric pie layout logic must be moved carefully
   - **Mitigation:** Extract to dedicated function, add unit tests
   - **Validation:** Test examples with multiple pie series

2. **Chart Type Detection**
   - ⚠️ Type detection system must recognize new chartType
   - **Mitigation:** Already handled by detectChartType() function
   - **Validation:** Add test cases for pie/donut detection

3. **Animation System**
   - ⚠️ PolarSeries has complex StateMachine for animation
   - **Mitigation:** DonutSeries can use simpler DataModelSeries pattern
   - **Validation:** Verify all animation scenarios work

### Mitigation Strategy

1. **Feature Flags** (Optional)
   - Add temporary flag: `AG_CHARTS_PIE_STANDALONE=true`
   - Allow testing new architecture in parallel
   - Remove flag after validation

2. **Gradual Rollout**
   - Phase 1-2 can be in same PR (infrastructure)
   - Phase 3-4 in separate PR (validation)
   - Allows incremental review and testing

3. **Rollback Plan**
   - Keep changes in feature branch until fully validated
   - All changes are in well-isolated files
   - Can revert cleanly if issues found

---

## Implementation Checklist

### Pre-Migration
- [ ] Create feature branch: `ag-16xxx/pie-donut-standalone-migration`
- [ ] Run baseline tests: `nx test ag-charts-community`
- [ ] Run baseline benchmarks: `nx benchmark ag-charts-community`
- [ ] Document current test results for comparison

### Phase 1: StandaloneChart in Community
- [ ] Create `standaloneChart.ts` in community package
- [ ] Update `enterpriseChartModules.ts` to use real implementation
- [ ] Add StandaloneChart to exports
- [ ] Verify build: `nx build ag-charts-community`
- [ ] Run tests: `nx test ag-charts-community`

### Phase 2: Refactor DonutSeries
- [ ] Update DonutSeries class definition (remove PolarSeries)
- [ ] Remove axis-related methods and properties
- [ ] Update DonutSeriesModule chartType to 'standalone'
- [ ] Move multi-series layout logic from PolarChart
- [ ] Update expectedModules.ts (remove TODOs)
- [ ] Verify build: `nx build ag-charts-community`
- [ ] Run unit tests: `nx test ag-charts-community`

### Phase 3: Testing and Validation
- [ ] Update any pie/donut-specific tests
- [ ] Run full community test suite: `nx test ag-charts-community`
- [ ] Generate examples: `nx generate-examples ag-charts-website`
- [ ] Validate examples: `nx validate-examples`
- [ ] Run E2E tests: `nx e2e ag-charts-website`
- [ ] Visual regression check (manual review of gallery pages)
- [ ] Test multi-series pie examples specifically
- [ ] Test all framework variants (React, Angular, Vue)

### Phase 4: Documentation and Cleanup
- [ ] Remove TODO comments from expectedModules.ts
- [ ] Update CHANGELOG.md with migration notes
- [ ] Run code formatting: `nx format`
- [ ] Run linting: `nx lint ag-charts-community`
- [ ] Clean up any debug code or comments
- [ ] Update architecture docs if needed

### Phase 5: Final Validation
- [ ] Run benchmarks: `nx benchmark ag-charts-community -- -t "pie|donut"`
- [ ] Compare to baseline performance
- [ ] Build enterprise package: `nx build ag-charts-enterprise`
- [ ] Verify no enterprise regressions
- [ ] Run full repo tests: `nx test`
- [ ] Final code review

### Post-Migration
- [ ] Monitor for any user-reported issues
- [ ] Document lessons learned
- [ ] Consider Phase 5 (enterprise polar promotion) as future work

---

## Timeline Estimate

| Phase | Duration | Effort |
|-------|----------|--------|
| **Phase 1: Community StandaloneChart** | 2-3 days | Low |
| **Phase 2: Refactor DonutSeries** | 3-4 days | Medium |
| **Phase 3: Testing and Validation** | 1-2 days | Low |
| **Phase 4: Documentation and Cleanup** | 1 day | Low |
| **Buffer for Issues** | 1-2 days | - |
| **TOTAL** | **8-12 days** | **Medium** |

**Note:** Timeline assumes:
- One engineer working full-time
- Normal code review turnaround (1 day)
- No major blockers or surprises
- Includes time for thorough testing and validation

---

## Success Criteria

### Must Have ✅
1. ✅ All existing pie/donut functionality works identically
2. ✅ No user-facing API changes
3. ✅ All tests pass (community + enterprise)
4. ✅ No visual regressions in examples
5. ✅ Build succeeds for all packages
6. ✅ Performance is same or better

### Should Have 🎯
1. 🎯 Code is cleaner and more maintainable
2. 🎯 Multi-series pie layout is more elegant
3. 🎯 TODO comments are resolved
4. 🎯 Documentation is updated
5. 🎯 Type safety is improved

### Nice to Have ⭐
1. ⭐ Bundle size is slightly smaller
2. ⭐ Performance is measurably faster
3. ⭐ Opens door for enterprise polar promotion
4. ⭐ Makes future pie variants easier to add

---

## Alternative Approaches Considered

### Alternative 1: Keep as PolarSeries, Add "Pseudo-Polar" Type
**Description:** Create a "pseudo-polar" chartType that's like polar but without axes.

**Pros:**
- Minimal changes
- No need to move layout logic

**Cons:**
- ❌ Doesn't address architectural mismatch
- ❌ Adds complexity instead of reducing it
- ❌ Doesn't resolve TODO comments
- ❌ Still couples pie/donut to polar infrastructure

**Verdict:** Not recommended

### Alternative 2: Create New "Circular" Chart Type
**Description:** Create a new chart type specifically for circular non-axis charts.

**Pros:**
- Clear semantic separation
- Could accommodate future circular chart types

**Cons:**
- ❌ Unnecessary abstraction (standalone already exists)
- ❌ Duplicates StandaloneChart functionality
- ❌ Increases codebase complexity
- ❌ Doesn't align with TODO guidance

**Verdict:** Not recommended

### Alternative 3: Recommended Approach (Standalone)
**Description:** Migrate to standalone chart type as per TODO comments.

**Pros:**
- ✅ Aligns with existing TODO comments
- ✅ Reduces code complexity
- ✅ Improves architectural clarity
- ✅ Enables enterprise polar promotion
- ✅ Uses existing infrastructure
- ✅ Clear semantic fit

**Cons:**
- Requires creating community StandaloneChart
- Medium effort (8-12 days)

**Verdict:** ✅ Strongly recommended

---

## Conclusion

The migration of Pie and Donut series from PolarSeries to standalone chart types is **strongly justified** both architecturally and pragmatically:

### Why This Makes Sense

1. **Explicit team guidance** - TODO comments clearly indicate this direction
2. **Architectural correctness** - Pie/Donut don't use axes, shouldn't inherit axis infrastructure
3. **Code cleanliness** - Removes special-case handling and 10,500+ lines of irrelevant inheritance
4. **Strategic alignment** - Enables making polar charts enterprise-only as planned
5. **Risk is manageable** - No API changes, comprehensive testing, clear rollback path

### The Path Forward

The migration is straightforward:
1. Create StandaloneChart in community (simple, 62-line implementation)
2. Refactor DonutSeries to extend DataModelSeries instead of PolarSeries
3. Move multi-series layout logic to appropriate location
4. Thorough testing and validation
5. Documentation and cleanup

### What Success Looks Like

- Pie and Donut charts work exactly as before (zero user impact)
- Codebase is cleaner and more maintainable
- Type hierarchy reflects actual behavior
- TODO comments are resolved
- Foundation is laid for future enhancements

**Recommendation: Proceed with migration following the detailed plan above.**

---

## Questions for Discussion

1. **Timing**: Should this be done in the current release cycle or next?
2. **Enterprise Polar**: Should Phase 5 (making polar enterprise-only) happen immediately after, or as separate future work?
3. **Feature Flag**: Do we want a temporary feature flag for gradual rollout, or confidence in immediate migration?
4. **API Changes**: Any concerns about edge cases or undocumented behaviors?

---

**Document Version:** 1.0
**Date:** 2025-11-05
**Author:** Claude Code Analysis
**Review Status:** Ready for team review
