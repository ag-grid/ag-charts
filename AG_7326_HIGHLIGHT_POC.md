# AG-7326: Delayed Unhighlighting POC

## Problem Statement

When moving the mouse over bar series, there is a noticeable flickering effect caused by rapidly highlighting and unhighlighting bars. This is particularly visible when:

1. Moving horizontally across a chart - the mouse alternately hovers bars and gaps between bars
2. Multiple series are present - transitioning between series causes flicker
3. Using the new highlight defaults that fade all other items

**Examples of the problem:**

-   https://charts-staging.ag-grid.com/javascript/bar-series/#example-stacked-bars
-   https://charts-staging.ag-grid.com/javascript/large-dataset-interactivity/#example-ordered-data

## Solution Approach

Add a delay before unhighlighting items. This means:

-   When hovering an item → **immediate highlight** (instant visual feedback)
-   When leaving an item → **delayed unhighlight** (smooth transition)
-   When hovering a new item within the delay → **cancel pending unhighlight** and immediately switch to the new highlight

This creates a smooth experience where highlights only clear if the user truly leaves the chart area, not just briefly passes over a gap.

## Technical Context

### Current Highlighting Architecture

The AG Charts highlighting system has three main components:

#### 1. HighlightManager (`packages/ag-charts-community/src/chart/interaction/highlightManager.ts`)

**Role:** Central coordinator for all highlight state

**Key characteristics:**

-   Manages highlight state using a `StateTracker<HighlightNodeDatum>`
-   Emits `'highlight:change'` events when state changes
-   Very simple implementation (~33 lines currently)
-   **No delay logic exists** - changes are immediate

**Key method:**

```typescript
updateHighlight(callerId: string, highlightedDatum?: HighlightNodeDatum): void
```

**Current flow:**

1. Caller provides a datum to highlight (or `undefined` to unhighlight)
2. HighlightManager updates its internal state immediately
3. Emits `'highlight:change'` event
4. All series receive the event and update their visual state

#### 2. SeriesAreaManager (`packages/ag-charts-community/src/chart/series/seriesAreaManager.ts`)

**Role:** Main event handler for mouse interactions over the chart

**Key flow:**

```
User moves mouse
  ↓
onHover() [line 421-442]
  ↓
Sets pendingHoverEvent
  ↓
hoverScheduler.schedule() [debounced to next animation frame]
  ↓
handleHoverHighlight() [line 921-952]
  ↓
pickNodes() to find datum under cursor
  ↓
highlightManager.updateHighlight(this.id, datum)
```

**Important:** Already has a debounce mechanism (`hoverScheduler`) that batches rapid mouse movements to the next animation frame. Our delay will work alongside this.

#### 3. Series Classes (e.g., BarSeries, SankeySeries)

**Role:** Render highlighted items with appropriate styles

**Key method:**

```typescript
onChangeHighlight(event: HighlightChangeEvent): void [line 664 in series.ts]
```

This method:

1. Receives highlight change events
2. Determines which items should be highlighted/unhighlighted
3. Triggers a re-render with updated styles

### Highlight States

There are 5 possible highlight states (from `HighlightState` enum):

| State         | Meaning                                  | Public API Name          | Should be delayed? |
| ------------- | ---------------------------------------- | ------------------------ | ------------------ |
| `None`        | Nothing highlighted                      | `'none'`                 | ✅ Yes             |
| `Item`        | This exact item is highlighted           | `'highlighted-item'`     | ❌ No (immediate)  |
| `Series`      | This series highlighted (different item) | `'highlighted-series'`   | ❌ No (immediate)  |
| `OtherItem`   | Different item in same series            | `'unhighlighted-item'`   | ✅ Yes             |
| `OtherSeries` | Different series is highlighted          | `'unhighlighted-series'` | ✅ Yes             |

**Key insight:** Only delay transitions **away from** highlighting (to `None`, `OtherItem`, `OtherSeries`). Never delay transitions **to** highlighting (to `Item`, `Series`).

### Existing Delay Utilities

AG Charts already has utilities for delaying operations:

**debouncedCallback** (`packages/ag-charts-community/src/util/render.ts` lines 17-28):

```typescript
export function debouncedCallback(callback: () => void): {
    schedule: (delayMs?: number) => void;
    waitForCompletion: () => Promise<void>;
};
```

This is perfect for our use case! It provides:

-   `schedule(delayMs)` - schedule the callback with a delay
-   Automatic cancellation if `schedule()` called again before delay expires
-   Returns a Promise for testing

## Implementation Plan

### Phase 1: Add Delay Logic to HighlightManager

**File:** `packages/ag-charts-community/src/chart/interaction/highlightManager.ts`

**Why here?**

-   Central location - automatically applies to all series types (bar, sankey, etc.)
-   Clean separation of concerns - HighlightManager owns highlight timing
-   Easy to test in isolation

**Changes needed:**

1. **Import the delay utility:**

```typescript
import { debouncedCallback } from '../../util/render';
```

2. **Add private fields to track delayed unhighlight:**

```typescript
export class HighlightManager {
    private readonly highlightStates = new StateTracker<HighlightNodeDatum>();

    // NEW: Scheduler for delayed unhighlight
    private readonly unhighlightScheduler = debouncedCallback(() => {
        this.applyPendingUnhighlight();
    });

    // NEW: Track pending unhighlight to cancel if needed
    private pendingUnhighlight?: { callerId: string };

    // NEW: Configurable delay (hardcoded for POC, will be user-configurable later)
    private readonly unhighlightDelay: number = 200; // milliseconds

    constructor(private readonly eventsHub: EventsHub) {}

    // ... rest of class
}
```

3. **Update the `updateHighlight()` method:**

**Current implementation:**

```typescript
public updateHighlight(callerId: string, highlightedDatum?: HighlightNodeDatum): void {
    const previousHighlight = this.getActiveHighlight();
    this.highlightStates.set(callerId, highlightedDatum);
    const currentHighlight = this.getActiveHighlight();
    if (!this.isEqual(currentHighlight, previousHighlight)) {
        this.eventsHub.emit('highlight:change', { callerId, currentHighlight, previousHighlight });
    }
}
```

**New implementation:**

```typescript
public updateHighlight(callerId: string, highlightedDatum?: HighlightNodeDatum): void {
    const previousHighlight = this.getActiveHighlight();

    // Case 1: Highlighting something new
    if (highlightedDatum != null) {
        // Cancel any pending unhighlight - we're highlighting something else now
        if (this.pendingUnhighlight) {
            this.pendingUnhighlight = undefined;
        }

        // Apply the highlight immediately
        this.highlightStates.set(callerId, highlightedDatum);
        const currentHighlight = this.getActiveHighlight();

        if (!this.isEqual(currentHighlight, previousHighlight)) {
            this.eventsHub.emit('highlight:change', { callerId, currentHighlight, previousHighlight });
        }
    }
    // Case 2: Unhighlighting (datum is undefined/null)
    else {
        // Schedule the unhighlight after a delay
        this.pendingUnhighlight = { callerId };
        this.unhighlightScheduler.schedule(this.unhighlightDelay);
    }
}
```

4. **Add the delayed unhighlight application method:**

```typescript
private applyPendingUnhighlight(): void {
    if (!this.pendingUnhighlight) {
        return; // No pending unhighlight
    }

    const { callerId } = this.pendingUnhighlight;
    const previousHighlight = this.getActiveHighlight();

    // Actually clear the highlight
    this.highlightStates.set(callerId, undefined);

    const currentHighlight = this.getActiveHighlight();

    // Only emit if something actually changed
    if (!this.isEqual(currentHighlight, previousHighlight)) {
        this.eventsHub.emit('highlight:change', { callerId, currentHighlight, previousHighlight });
    }

    // Clear the pending unhighlight
    this.pendingUnhighlight = undefined;
}
```

5. **Add cleanup method (optional, for completeness):**

```typescript
public destroy(): void {
    // Cancel any pending unhighlight when manager is destroyed
    if (this.pendingUnhighlight) {
        this.pendingUnhighlight = undefined;
    }
}
```

### Phase 2: Verify Use Cases

The implementation should handle these scenarios correctly:

#### Use Case 1: Moving between bars in same series

**Scenario:**

1. User hovers bar A in series 1 → **Immediate highlight**
2. User moves to gap between bars A and B → **Wait 200ms**
3. User hovers bar B within 200ms → **Immediate highlight B, unhighlight A**

**What happens in code:**

```
1. updateHighlight('seriesAreaManager', barA_datum)
   → highlightedDatum != null → immediate highlight
   → Emit 'highlight:change' with barA

2. updateHighlight('seriesAreaManager', undefined)
   → highlightedDatum is undefined → schedule unhighlight
   → pendingUnhighlight = { callerId: 'seriesAreaManager' }
   → unhighlightScheduler.schedule(200)

3. updateHighlight('seriesAreaManager', barB_datum)
   → highlightedDatum != null → cancel pending unhighlight
   → pendingUnhighlight = undefined
   → immediate highlight barB
   → Emit 'highlight:change' with barB
```

**Result:** Smooth transition from bar A to bar B with no visible unhighlight state.

#### Use Case 2: Moving between bars in different series

**Scenario:**

1. User hovers bar A in series 1 → **Immediate highlight**
2. User moves to gap between series → **Wait 200ms**
3. User hovers bar Z in series 2 within 200ms → **Immediate series switch**

**What happens in code:**

```
1. updateHighlight('seriesAreaManager', barA_datum) // series: 1
   → Immediate highlight
   → series 1 becomes "highlighted-series"
   → series 2, 3 become "unhighlighted-series"

2. updateHighlight('seriesAreaManager', undefined)
   → Schedule unhighlight after 200ms

3. updateHighlight('seriesAreaManager', barZ_datum) // series: 2
   → Cancel pending unhighlight
   → Immediate highlight barZ
   → series 2 becomes "highlighted-series"
   → series 1, 3 become "unhighlighted-series"
```

**Result:** Smooth transition between series with no flicker.

#### Use Case 3: Mouse leaves chart entirely

**Scenario:**

1. User hovers bar A → **Immediate highlight**
2. User moves mouse off chart → **Wait 200ms**
3. After 200ms with no new hover → **Unhighlight all**

**What happens in code:**

```
1. updateHighlight('seriesAreaManager', barA_datum)
   → Immediate highlight

2. updateHighlight('seriesAreaManager', undefined)
   → Schedule unhighlight after 200ms

3. [200ms passes with no new updateHighlight call]
   → unhighlightScheduler triggers applyPendingUnhighlight()
   → highlightStates.set('seriesAreaManager', undefined)
   → Emit 'highlight:change' with currentHighlight = undefined
   → All series go to "none" state
```

**Result:** Clean unhighlight after brief delay.

### Phase 3: Testing

#### Unit Tests

**File:** `packages/ag-charts-community/src/chart/highlight.test.ts`

Add tests for the new delay behavior:

**Test 1: Immediate highlight (no delay on highlight)**

```typescript
test('highlighting is immediate with no delay', async () => {
    const { chart } = await createChart(barOptions);

    const startTime = Date.now();

    // Simulate hovering a bar
    await hoverAction(100, 200)(chart);

    const elapsedTime = Date.now() - startTime;

    // Should be immediate (< 50ms including test overhead)
    expect(elapsedTime).toBeLessThan(50);

    // Verify highlight is active
    const highlightedNode = chart.ctx.highlightManager.getActiveHighlight();
    expect(highlightedNode).toBeDefined();
});
```

**Test 2: Delayed unhighlight**

```typescript
test('unhighlighting is delayed by 200ms', async () => {
    const { chart } = await createChart(barOptions);

    // Hover a bar to highlight it
    await hoverAction(100, 200)(chart);
    expect(chart.ctx.highlightManager.getActiveHighlight()).toBeDefined();

    // Move mouse to empty area (unhover)
    await hoverAction(500, 500)(chart); // Assuming this is empty space

    // Immediately check - should still be highlighted
    expect(chart.ctx.highlightManager.getActiveHighlight()).toBeDefined();

    // Wait 100ms - still highlighted (delay is 200ms)
    await sleep(100);
    expect(chart.ctx.highlightManager.getActiveHighlight()).toBeDefined();

    // Wait another 150ms (total 250ms) - now unhighlighted
    await sleep(150);
    expect(chart.ctx.highlightManager.getActiveHighlight()).toBeUndefined();
});
```

**Test 3: Canceling pending unhighlight**

```typescript
test('highlighting new item cancels pending unhighlight', async () => {
    const { chart } = await createChart(barOptions);

    // Hover bar 1
    await hoverAction(100, 200)(chart);
    const firstHighlight = chart.ctx.highlightManager.getActiveHighlight();
    expect(firstHighlight).toBeDefined();

    // Move to gap (triggers pending unhighlight)
    await hoverAction(150, 200)(chart); // Assuming gap between bars

    // Wait 50ms (less than 200ms delay)
    await sleep(50);

    // Hover bar 2 before unhighlight completes
    await hoverAction(200, 200)(chart);
    const secondHighlight = chart.ctx.highlightManager.getActiveHighlight();

    // Should immediately switch to bar 2
    expect(secondHighlight).toBeDefined();
    expect(secondHighlight).not.toBe(firstHighlight);

    // Wait for original delay to complete
    await sleep(200);

    // Should still be highlighting bar 2 (unhighlight was cancelled)
    expect(chart.ctx.highlightManager.getActiveHighlight()).toBeDefined();
    expect(chart.ctx.highlightManager.getActiveHighlight()).toBe(secondHighlight);
});
```

**Test helper to add:**

```typescript
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
```

#### Manual Testing

Create a test page to manually verify the behavior:

**File:** `packages/ag-charts-website/src/content/docs/highlight-delay-poc/_examples/delayed-unhighlight/main.ts`

```typescript
import { AgChartOptions, AgCharts } from 'ag-charts-community';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Delayed Unhighlight POC',
    },
    data: [
        { month: 'Jan', series1: 90, series2: 45, series3: 30 },
        { month: 'Feb', series1: 78, series2: 52, series3: 35 },
        { month: 'Mar', series1: 96, series2: 48, series3: 32 },
        { month: 'Apr', series1: 70, series2: 60, series3: 40 },
        { month: 'May', series1: 82, series2: 55, series3: 38 },
        { month: 'Jun', series1: 88, series2: 50, series3: 33 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'series1',
            yName: 'Series 1',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'series2',
            yName: 'Series 2',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'series3',
            yName: 'Series 3',
        },
    ],
};

const chart = AgCharts.create(options);
```

**Manual test checklist:**

-   [ ] Hover over bars - should highlight immediately
-   [ ] Move between bars in same series with small gaps - should transition smoothly without flicker
-   [ ] Move between bars in different series - should transition smoothly
-   [ ] Move mouse quickly across chart - should feel responsive
-   [ ] Move mouse off chart - should unhighlight after brief delay
-   [ ] Compare with staging site examples to verify improvement

### Phase 4: Verify with Other Series Types

Test that the change doesn't break other series types:

1. **Bar series** (primary target) ✅
2. **Sankey series** (mentioned in requirements)
    - File: `packages/ag-charts-enterprise/src/series/sankey/sankeySeries.ts`
    - Should work automatically since it uses the same HighlightManager
3. **Other series types** to spot-check:
    - Line series
    - Area series
    - Scatter series
    - Pie series

**Test command:**

```bash
yarn nx test ag-charts-community
yarn nx test ag-charts-enterprise
```

## Success Criteria

The POC is successful if:

1. ✅ **Highlight states are only cleared after a delay** (hardcoded 200ms)

    - Verified by unit tests
    - Verified by manual testing

2. ✅ **Highlighting a new item cancels pending unhighlight**

    - Verified by unit test
    - No flicker when moving between bars

3. ✅ **Bar series shows smooth highlighting**

    - Test with staging site examples
    - Compare before/after behavior

4. ✅ **Sankey series (if applicable) also benefits**

    - Manual test with sankey example
    - Verify smooth transitions

5. ✅ **No regression in other series types**

    - Run full test suite
    - Spot-check major series types

6. ✅ **No performance issues**
    - Delay should be imperceptible
    - No memory leaks from pending timers

## Future Work (Not Part of POC)

After POC is validated:

1. **Make delay configurable:**

    - Add `unhighlightDelay` property to `HighlightProperties`
    - Update TypeScript types in `packages/ag-charts-types/src/chart/seriesOptions.ts`
    - Document in API reference

2. **Consider different delays for different series:**

    - Some series might benefit from longer/shorter delays
    - Per-series configuration vs global configuration

3. **Add transition animations:**

    - See AG-8375 for full transition support
    - This POC only handles timing, not visual transitions

4. **Expand hit range:**
    - Alternative approach mentioned in ticket
    - Could be combined with delay for even smoother experience

## Key Files Reference

### Must Modify

-   `packages/ag-charts-community/src/chart/interaction/highlightManager.ts` - Core delay logic

### Must Test

-   `packages/ag-charts-community/src/chart/highlight.test.ts` - Add unit tests

### Reference (Understanding)

-   `packages/ag-charts-community/src/chart/series/seriesAreaManager.ts` - Event handling flow
-   `packages/ag-charts-community/src/chart/series/series.ts` - Highlight state propagation
-   `packages/ag-charts-community/src/chart/series/seriesProperties.ts` - HighlightState enum
-   `packages/ag-charts-community/src/util/render.ts` - debouncedCallback utility

### Test Examples

-   Bar series: `packages/ag-charts-website/src/content/docs/bar-series/_examples/`
-   Sankey series: `packages/ag-charts-website/src/content/docs/sankey/_examples/` (enterprise)

## Development Commands

```bash
# Start development server (recommended)
yarn nx dev

# Build specific package
yarn nx build ag-charts-community

# Run tests
yarn nx test ag-charts-community --testPathPattern="highlight.test"

# Run specific test
yarn nx test ag-charts-community --testPathPattern="highlight.test" --testNamePattern="delayed unhighlight"

# Format code
yarn nx format

# Type check
yarn nx build:types ag-charts-community

# Lint
yarn nx lint ag-charts-community
```

## Questions / Decisions Needed

1. **Delay duration:** 200ms is proposed - does this feel right?

    - Too short: Still flickery
    - Too long: Feels unresponsive
    - Needs manual testing to tune

2. **Should delay apply when keyboard navigating?**

    - Current plan: Yes, same delay for all unhighlight triggers
    - Alternative: Immediate unhighlight for keyboard

3. **Should delay apply to tooltip triggers?**

    - Current plan: Yes, since highlights and tooltips are linked
    - Need to verify tooltip timing isn't affected negatively

4. **Performance in charts with many series/nodes?**
    - Should be fine - delay is in HighlightManager, not per-node
    - But worth profiling with large datasets

## Timeline Estimate

-   **Phase 1 (Implementation):** 2-3 hours
-   **Phase 2 (Verification):** 1 hour
-   **Phase 3 (Unit Testing):** 2-3 hours
-   **Phase 4 (Manual Testing):** 1-2 hours

**Total:** 6-9 hours for complete POC

## Getting Help

If you get stuck:

1. Check the existing `debouncedCallback` implementation in `packages/ag-charts-community/src/util/render.ts`
2. Review existing tests in `packages/ag-charts-community/src/chart/highlight.test.ts`
3. Look at how `SeriesAreaManager.hoverScheduler` uses debouncing (line 903-919)
4. Consult [Testing Guide](tools/prompts/guides/testing.md) for testing patterns
5. See [Code Quality Guide](tools/prompts/guides/code-quality.md) for best practices
