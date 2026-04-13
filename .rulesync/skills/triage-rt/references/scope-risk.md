# Scope and Risk Assessment Reference

Detailed guidance for evaluating the scope and risk of library fixes during release testing.

## Scope Assessment: Code Area Heuristics

### Narrow Scope (isolated fix)

Typical patterns:

-   Bug in a single series type (e.g., `BarSeries`, `PieSeries`) that doesn't extend to others
-   Tooltip rendering issue specific to one chart configuration
-   Locale/translation string fix
-   Type definition correction in `ag-charts-types`
-   Single example or test fix

How to verify:

-   The fix file is a leaf module with few or no downstream dependents
-   `git log --oneline origin/latest..HEAD -- <file>` shows the file was not recently refactored
-   Grep for imports of the affected module — few results

Testing impact: Run the specific series/feature test suite only.

### Moderate Scope (shared area)

Typical patterns:

-   Fix in a utility used by several series types (e.g., label placement, marker rendering)
-   Axis formatting or tick calculation change
-   Legend interaction fix
-   Theme property change that affects a subset of chart types
-   Framework wrapper fix (affects one framework's integration)

How to verify:

-   The affected module is imported by 3-10 other modules
-   The fix touches a method that's called from multiple series implementations
-   The class inherits from a shared base but the fix is in the subclass

Testing impact: Run test suites for all features that use the affected utility. Check visual regression snapshots for related chart types.

### Wide Scope (core infrastructure)

Typical patterns:

-   Scene graph rendering changes (`Group`, `Node`, `Selection`, `Scene`)
-   Layout engine modifications (`BBox`, `layoutService`, sizing calculations)
-   Data model or data domain changes (`DataModel`, `DataDomain`, `ProcessedData`)
-   Animation/transition system changes
-   Canvas rendering pipeline changes
-   Chart lifecycle changes (`Chart`, `ChartUpdateType`)
-   Module registration or plugin architecture changes

How to verify:

-   The affected module is imported by >10 other modules
-   Changes are in `ag-charts-community/src/scene/` or `ag-charts-community/src/chart/`
-   The fix modifies a virtual/abstract method that subclasses override

Testing impact: Full regression test suite across all chart types. Visual regression snapshots for all examples.

## Risk Assessment: Side-Effect Indicators

### Low Risk Indicators

-   Fix adds a new code path without modifying existing paths (additive change)
-   Fix changes a default value or configuration constant
-   Fix is in error handling or edge case that doesn't affect the happy path
-   Fix has a clear, small diff with obvious correctness
-   Existing test coverage directly exercises the changed code

### Medium Risk Indicators

-   Fix modifies conditional logic in a shared utility
-   Fix changes timing or ordering of operations
-   Fix modifies state that persists across render cycles
-   The area has moderate test coverage but not exhaustive
-   Fix involves CSS/styling changes that could cascade

### High Risk Indicators

-   Fix modifies the rendering pipeline (draw order, clipping, transformations)
-   Fix changes how data is processed, filtered, or aggregated
-   Fix alters event handling or interaction state machines
-   Fix touches memory management or object pooling
-   Fix modifies the update/invalidation mechanism
-   The area has poor test coverage
-   The fix author doesn't fully understand why the original code was written that way

## AG Charts-Specific Risk Hotspots

These areas of the codebase have historically been high-risk for unintended side-effects:

| Area                | Location                                           | Why it's risky                                                |
| ------------------- | -------------------------------------------------- | ------------------------------------------------------------- |
| Series base classes | `AbstractSeries`, `CartesianSeries`, `PolarSeries` | Changes propagate to every series type                        |
| Scene graph         | `scene/` directory                                 | Affects all visual rendering                                  |
| Axis system         | `axis/` directory, `CartesianAxis`                 | Tick calculation, label layout, crosshairs all interconnected |
| Layout engine       | `chart/layout/`                                    | Padding, margins, sizing affect every chart                   |
| Data processing     | `chart/data/`                                      | Domain calculation, data transforms affect all chart types    |
| Update mechanism    | `ChartUpdateType`, `Chart.update()`                | Wrong invalidation = missing updates or infinite loops        |
| Animation           | `motion/` directory                                | Timing issues are subtle and hard to test                     |
| Interaction state   | `chart/interaction/`                               | State machine bugs cause broken user interactions             |

## Decision Matrix

|              | Low Risk                      | Medium Risk                   | High Risk                     |
| ------------ | ----------------------------- | ----------------------------- | ----------------------------- |
| **Narrow**   | Fix in release                | Fix in release                | Fix in release (with caution) |
| **Moderate** | Fix in release                | Fix in release (with caution) | Defer or targeted workaround  |
| **Wide**     | Fix in release (with caution) | Defer unless regression       | Defer to next release         |

Regressions shift the matrix one column to the left (more aggressive about fixing), because shipping a new bug is worse than shipping a known limitation.

Feature prominence further modulates urgency:

-   **Core** features shift one column left (more aggressive) — most users will encounter the bug.
-   **Specialised** features shift one column right (more conservative) — fewer users affected, so the risk/reward of a late fix is less favourable.
-   **Common** features use the matrix as-is.
