---
root: false
targets: ['*']
description: 'Framework transformation patterns — loads /example skill for full reference'
globs: ['**/_examples/**/*', 'plugins/ag-charts-generate-example-files/**/*']
---

# Framework Transformation Patterns

When working with example framework generation, key patterns:

1. **Options → State**: Options object becomes `useState` (React), class property (Angular), `ref` (Vue)
2. **Chart instance → Ref**: Chart variable becomes `useRef` (React), component method (Angular), template ref (Vue)
3. **HTML events → Framework handlers**: `onclick` → `onClick` (React), `(click)` (Angular), `@click` (Vue)
4. **Supported patterns**: Static charts, top-level options, simple event handlers, `chart.update()`, `updateDelta()`
5. **Unsupported**: Complex DOM manipulation, external libraries, multiple charts, window assignments
6. **Directives**: `@ag-skip-fws` (internal only), `@ag-skip-clone` (perf), `/** inScope */` (utility functions)

## Timer / Interval Pattern (`/** inScope */`)

Functions not directly referenced in HTML event handlers (e.g. `onclick="toggleUpdates()"`) are placed **outside** the React component as globals by the generator. If they need access to `options` state or call other in-scope functions, they must be annotated with `/** inScope */` to be placed inside the component.

**Reference example**: `high-frequency-data/_examples/high-frequency-showcase/main.ts`

**Rule of thumb**: If a function reads or writes `options`, uses `chart`, or calls other `/** inScope */` functions, it needs the annotation. HTML event handler functions (referenced in `onclick`, `onchange` etc.) do NOT need it — they're automatically placed inside the component.

**Stale closure pitfall**: `setInterval` callbacks capture variables from the render when the interval was created. If the callback reads `options` (React state), it will always see the initial value. Fix: store mutable data in a **module-level variable** (placed before `options`), mutate it in the callback, then assign to `options.data` before calling `chart.update(options)`.

**API-neutral**: The `/** inScope */` pattern is about function placement in React — it does not require changing the chart API used (e.g. `chart.update()` vs `chart.applyTransaction()`). Keep the same API the example was designed to demonstrate.

```typescript
let data = getInitialData(); // module-level — avoids stale closure

const options = { container: ..., data, ... };
const chart = AgCharts.create(options);

/** inScope */
function update() {
    data = applyUpdate(data);  // mutate module-level variable
    options.data = data;       // assign to options
    chart.update(options);     // trigger chart update
}

/** inScope */
function startUpdates() {
    /* calls update(), sets interval */
}

/** inScope */
function stopUpdates() {
    /* clears interval */
}

// No annotation needed — referenced in HTML onclick
function toggleUpdates() {
    /* calls startUpdates/stopUpdates */
}
```

For full reference (parser architecture, framework transformations, debugging), load the `/example` skill.
