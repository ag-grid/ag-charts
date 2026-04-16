## AG Charts Example Structure

This section covers the Plunker-specific file structure for AG Charts demos. For general chart construction patterns (axes syntax, module registration, controls), see `.rulesync/skills/example/ag-charts/chart-construction.md`. For enterprise vs community feature decisions, see `.rulesync/skills/example/ag-charts/enterprise-features.md`.

**CRITICAL**: Follow this exact structure to match website-generated Plunkers.

### Required Files

1. `index.html` - HTML structure with inline styles
2. `main.js` - Chart configuration and creation
3. `ag-example-styles.css` - Copy from `<skill-base-directory>/assets/ag-example-styles.css`
4. `package.json` - Dependencies
5. `data.js` (optional) - Data if not inline

### index.html

**WITHOUT controls:**

```html
<html lang="en">
    <head>
        <title>AG Charts Example - Demo Name</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <link rel="stylesheet" href="ag-example-styles.css" />
        <style>
            body {
                padding: 1rem;
            }
            div:has(> .ag-charts-wrapper),
            ag-charts,
            ag-financial-charts {
                padding: 0 !important;
                border: none !important;
            }
        </style>
    </head>
    <body>
        <div id="myChart"></div>
        <script src="https://cdn.jsdelivr.net/npm/ag-charts-community@13.2.1/dist/umd/ag-charts-community.js"></script>
        <script src="main.js"></script>
    </body>
</html>
```

**WITH controls:**

```html
<html lang="en">
    <head>
        <title>AG Charts Example - Demo Name</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <link rel="stylesheet" href="ag-example-styles.css" />
        <style>
            body {
                padding: 1rem;
            }
            div:has(> .ag-charts-wrapper),
            ag-charts,
            ag-financial-charts {
                padding: 0 !important;
                border: none !important;
            }
        </style>
    </head>
    <body>
        <div class="example-controls">
            <div class="controls-row">
                <!-- Your controls here -->
            </div>
        </div>
        <div id="myChart"></div>
        <script src="https://cdn.jsdelivr.net/npm/ag-charts-community@13.2.1/dist/umd/ag-charts-community.js"></script>
        <script src="main.js"></script>
    </body>
</html>
```

**Key points:**

-   Include `<meta name="robots" content="noindex" />` to prevent indexing
-   Include the inline `<style>` block - required for proper sizing
-   Use a **specific version** (e.g., `@13.2.1`) with optional cache-busting timestamp (`?t=1768428202375`)
-   Generate timestamp with: `date +%s%3N`
-   Do NOT add `<h1>`, `<p>`, or any other elements — use the chart's `title`/`subtitle` options instead

For Enterprise features, use the enterprise CDN URL:

```html
<script src="https://cdn.jsdelivr.net/npm/ag-charts-enterprise@13.2.1/dist/umd/ag-charts-enterprise.js"></script>
```

### Enterprise vs Community

See `.rulesync/skills/example/ag-charts/enterprise-features.md` for the full feature matrix. Use `ag-charts-enterprise` CDN URL if the example uses any enterprise-only series, axis, or plugin.

### main.js

```javascript
const { AgCharts } = agCharts;

const options = {
    container: document.getElementById('myChart'),
    title: { text: 'Chart Title Here' },
    subtitle: { text: 'Explanatory text goes in the subtitle' },
    data: getData(), // or inline array
    series: [
        // series configuration
    ],
};

AgCharts.create(options);
```

**No module registration in vanilla JS:** Vanilla JS examples using UMD bundles do NOT call `AgCharts.setupModules()` or `ModuleRegistry.register()`. Module registration is only needed in framework/ESM examples. The UMD bundle automatically registers all included modules.

### Axes (v13+)

Use the **object-based axes syntax**: `axes: { x: { type: 'time' }, y: { type: 'number' } }`. See `.rulesync/skills/example/ag-charts/chart-construction.md` for full syntax and multiple axes patterns.

### ag-example-styles.css

Copy the CSS file directly from the skill assets — do not write it by hand:

```bash
cp "<skill-base-directory>/assets/ag-example-styles.css" "$PLNKR_DIR/ag-example-styles.css"
```

This file includes both the base control styles (buttons, inputs, etc.) and the vanilla framework styles needed for proper chart sizing. **Without these styles, the chart will appear small and not fill the available space.**

### Controls

If your example needs interactive controls, wrap them in `<div class="example-controls">` with `<div class="controls-row">` for each row. The chart `<div id="myChart">` sits **outside** the controls div as a sibling. Use `gap-left`, `gap-right`, `push-left`, `push-right` classes for layout. No additional CSS needed — base styles handle all control styling.

### package.json

```json
{
    "name": "ag-charts-example",
    "dependencies": {
        "ag-charts-community": "latest"
    }
}
```

For Enterprise, use `"ag-charts-enterprise": "latest"` instead.

### CDN URLs

**Staging (DEFAULT for testing):**

Use staging by default unless the user specifies a version. Add a cache-busting timestamp.

-   Community: `https://charts-staging.ag-grid.com/dev/ag-charts-community/dist/umd/ag-charts-community.js?t={timestamp}`
-   Enterprise: `https://charts-staging.ag-grid.com/dev/ag-charts-enterprise/dist/umd/ag-charts-enterprise.js?t={timestamp}`

Generate timestamp with: `date +%s%3N`

**Versioned (for reproduction/sharing):**

-   Community: `https://cdn.jsdelivr.net/npm/ag-charts-community@13.2.1/dist/umd/ag-charts-community.js`
-   Enterprise: `https://cdn.jsdelivr.net/npm/ag-charts-enterprise@13.2.1/dist/umd/ag-charts-enterprise.js`

### data.js (Optional Separate Data File)

Create a `data.js` when data is large enough to warrant separation (roughly >20 rows or >30 lines). Define a `getData()` function:

```javascript
function getData() {
    return [
        { month: 'Jan', value: 10 },
        { month: 'Feb', value: 20 },
        // ...
    ];
}
```

In `index.html`, add `<script src="data.js"></script>` **before** `<script src="main.js"></script>`. In `main.js`, call `getData()`. For small datasets, inline the data directly.

### Version Migration (Forking Old Plunkers)

When forking a plunker built on an older AG Charts version, audit **every** option against the current types. Common breaking changes across major versions:

| Change | Old (≤v9) | New (v13+) |
|--------|-----------|------------|
| Series type | `type: 'column'` | `type: 'bar'` |
| Axes format | `axes: [{ type: 'category', position: 'bottom' }]` (array) | `axes: { x: { type: 'category' } }` (object) |
| Create API | `agCharts.AgChart.create(options)` | `const { AgCharts } = agCharts; AgCharts.create(options)` |
| Bar labels | Enabled by default for stacked bars | Disabled by default — add `label: {}` explicitly |
| Legend order | Reversed by default (top of stack first) | Series order by default — add `reverseOrder: true` to restore |
| Scatter marker | `marker: { size: 0 }` | `size: 0` directly on series (via `AgSeriesMarkerStyle`) |

**Checklist when porting:**

1. Update the CDN URL to the target version
2. Change `agCharts.AgChart.create()` → `const { AgCharts } = agCharts; AgCharts.create()`
3. Replace `type: 'column'` with `type: 'bar'`
4. Convert `axes` array to object format (`x`/`y` keys)
5. Check every series option against `ag-charts-types` — defaults may have changed
6. Visually compare both plunkers in the browser before delivering

### Framework Plunkers

The website generates Angular, React, and Vue plunker variants using SystemJS for in-browser module loading. When the user requests a framework plunker, follow the patterns below.

**Boilerplate source:** `packages/ag-charts-website/public/example-runner/charts-angular-boilerplate/`

#### Angular

Angular plunkers use SystemJS with in-browser TypeScript compilation (no build step). Required files:

| File | Source |
|------|--------|
| `index.html` | Write per template below |
| `main.ts` | Copy from `charts-angular-boilerplate/main.ts` |
| `app.component.ts` | Write — standalone component with `[options]` binding |
| `systemjs.config.js` | Copy from `charts-angular-boilerplate/systemjs.config.js` |
| `css.js` | Copy from `charts-angular-boilerplate/css.js` |
| `ag-example-styles.css` | Copy from skill assets |
| `package.json` | Write with Angular + ag-charts deps |

**index.html template:**

```html
<html lang="en">
    <head>
        <title>AG Charts - Angular Example</title>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        <link rel="stylesheet" href="ag-example-styles.css" />
        <style>
            body { padding: 1rem; }
            div:has(> .ag-charts-wrapper), ag-charts, ag-financial-charts {
                padding: 0 !important; border: none !important;
            }
        </style>
    </head>
    <body>
        <my-app>Loading...</my-app>
        <script>document.write('<base href="' + document.location + '" />');</script>
        <script src="https://cdn.jsdelivr.net/npm/core-js-bundle@3.6.5/minified.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/zone.js@0.11.2/dist/zone.min.js"></script>
        <script>
            var appLocation = './';
            var boilerplatePath = './';
            var systemJsMap = {
                'ag-charts-angular': 'https://charts-staging.ag-grid.com/dev/ag-charts-angular/'
            };
            var systemJsPaths = {
                'ag-charts-community': 'https://charts-staging.ag-grid.com/dev/ag-charts-community/dist/package/main.cjs.js',
                'ag-charts-core': 'https://charts-staging.ag-grid.com/dev/ag-charts-core/dist/package/main.cjs.js',
                'ag-charts-types': 'https://charts-staging.ag-grid.com/dev/ag-charts-types/dist/package/main.cjs.js',
                'ag-charts-locale': 'https://charts-staging.ag-grid.com/dev/ag-charts-locale/dist/package/main.cjs.js'
            };
        </script>
        <script src="https://cdn.jsdelivr.net/npm/systemjs@0.21.6/dist/system.js"></script>
        <script src="systemjs.config.js"></script>
        <script>
            System.import('ag-charts-community')
                .then(function() { return System.import('./main.ts'); })
                .catch(function(err) { console.error(err.originalErr || err); });
        </script>
    </body>
</html>
```

**For enterprise features**, add to `systemJsPaths`:
```javascript
'ag-charts-enterprise': 'https://charts-staging.ag-grid.com/dev/ag-charts-enterprise/dist/package/main.cjs.js'
```

**Key differences from vanilla:**

-   `systemJsMap` maps package names to base directories (for packages with internal structure like `fesm2022/`)
-   `systemJsPaths` maps package names directly to CJS entry files (resolved via SystemJS `paths`)
-   Use `systemjs.config.js` (non-dev) — it supports both `systemJsMap` and `systemJsPaths`
-   Polyfills (`core-js-bundle`, `zone.js`) and `<base href>` are required
-   Angular compiles in-browser — first load is slow (~10-20s)

**app.component.ts pattern:**

```typescript
import { Component } from '@angular/core';
import { AgCharts } from 'ag-charts-angular';
import { AgChartOptions, AllCommunityModule, ModuleRegistry } from 'ag-charts-community';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
    selector: 'my-app',
    standalone: true,
    imports: [AgCharts],
    template: `<ag-charts [options]="options"></ag-charts>`,
})
export class AppComponent {
    public options: AgChartOptions;

    constructor() {
        this.options = {
            // chart options here
        };
    }
}
```

#### React

React plunkers use UMD CDN bundles — no build step needed. The `ag-charts-react` wrapper does NOT have a UMD build, so use `agCharts.AgCharts` directly with React's lifecycle.

```html
<script src="https://unpkg.com/react@18/umd/react.development.js"></script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
<script src="https://charts-staging.ag-grid.com/dev/ag-charts-community/dist/umd/ag-charts-community.js?t={timestamp}"></script>
<script src="main.js"></script>
```

In `main.js`, use `React.createElement` (not JSX) with `useRef`/`useEffect`/`useLayoutEffect` to create and update charts:

```javascript
const { AgCharts: AgChartsAPI } = agCharts;
const { useState, useRef, useEffect, useLayoutEffect } = React;

function AgCharts({ options }) {
    const containerRef = useRef(null);
    const chartRef = useRef(null);

    useLayoutEffect(() => {
        const chart = AgChartsAPI.create({ ...options, container: containerRef.current });
        chartRef.current = chart;
        return () => chart.destroy();
    }, []);

    useEffect(() => {
        if (chartRef.current) {
            chartRef.current.update({ ...options, container: containerRef.current });
        }
    }, [options]);

    return React.createElement('div', { ref: containerRef, style: { width: '100%', height: '100%' } });
}
```

**Key points:**
-   Controls are rendered by the React component — do NOT add HTML controls to `index.html`
-   `<div id="root">` replaces `<div id="myChart">` in the HTML body
-   Use `ReactDOM.createRoot(document.getElementById('root')).render(...)` to mount

#### Vue

Vue plunkers use Vue 3 global CDN + ag-charts-community UMD. The `ag-charts-vue3` wrapper does NOT have a UMD build, so use `agCharts.AgCharts` directly with Vue's composition API.

```html
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script src="https://charts-staging.ag-grid.com/dev/ag-charts-community/dist/umd/ag-charts-community.js?t={timestamp}"></script>
<script src="main.js"></script>
```

In `main.js`, use `createApp` with the composition API:

```javascript
const { AgCharts } = agCharts;
const { createApp, ref, watch, onMounted, onBeforeUnmount } = Vue;

const App = {
    template: `<div ref="chartContainer"></div>`,
    setup() {
        const chartContainer = ref(null);
        let chart = null;

        onMounted(() => {
            chart = AgCharts.create({
                container: chartContainer.value,
                // chart options here
            });
        });

        onBeforeUnmount(() => { if (chart) chart.destroy(); });

        return { chartContainer };
    },
};

createApp(App).mount('#app');
```

**Key points:**
-   Controls are rendered by the Vue template — do NOT add HTML controls to `index.html`
-   `<div id="app">` replaces `<div id="myChart">` in the HTML body
-   Use `chart.updateDelta({...})` in `watch()` callbacks for reactive updates

### Framework CDN — SystemJS/CJS Paths

Framework plunkers use SystemJS with CJS/ESM paths instead of UMD. The same staging-vs-versioned rules apply as for vanilla plunkers: use staging by default, versioned when the user specifies a version.

**Staging:**

| Package | Staging CJS path |
|---------|-----------------|
| `ag-charts-community` | `https://charts-staging.ag-grid.com/dev/ag-charts-community/dist/package/main.cjs.js` |
| `ag-charts-core` | `https://charts-staging.ag-grid.com/dev/ag-charts-core/dist/package/main.cjs.js` |
| `ag-charts-enterprise` | `https://charts-staging.ag-grid.com/dev/ag-charts-enterprise/dist/package/main.cjs.js` |
| `ag-charts-types` | `https://charts-staging.ag-grid.com/dev/ag-charts-types/dist/package/main.cjs.js` |
| `ag-charts-locale` | `https://charts-staging.ag-grid.com/dev/ag-charts-locale/dist/package/main.cjs.js` |
| `ag-charts-angular` (ESM) | `https://charts-staging.ag-grid.com/dev/ag-charts-angular/` (+ `fesm2022/ag-charts-angular.mjs`) |

**Versioned:**

| Package | Versioned CJS path |
|---------|--------------------|
| `ag-charts-community` | `https://cdn.jsdelivr.net/npm/ag-charts-community@13.2.1/dist/package/main.cjs.js` |
| `ag-charts-core` | `https://cdn.jsdelivr.net/npm/ag-charts-core@13.2.1/dist/package/main.cjs.js` |
| `ag-charts-enterprise` | `https://cdn.jsdelivr.net/npm/ag-charts-enterprise@13.2.1/dist/package/main.cjs.js` |
| `ag-charts-types` | `https://cdn.jsdelivr.net/npm/ag-charts-types@13.2.1/dist/package/main.cjs.js` |
| `ag-charts-locale` | `https://cdn.jsdelivr.net/npm/ag-charts-locale@13.2.1/dist/package/main.cjs.js` |
| `ag-charts-angular` (ESM) | `https://cdn.jsdelivr.net/npm/ag-charts-angular@13.2.1/` (+ `fesm2022/ag-charts-angular.mjs`) |

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `axes` silently ignored | Using legacy array format `axes: [...]` | Use object format: `axes: { x: {...}, y: {...} }` |
| Chart appears small | Missing vanilla framework styles | Copy `ag-example-styles.css` from assets |
| Chart doesn't render | Wrong CDN URL or missing global | Check script src and use `agCharts.AgCharts` |
| Styling issues | Missing inline styles in index.html | Add the `<style>` block in `<head>` |
| Layout breaks | Extra HTML elements in body | Remove all elements except controls + `<div id="myChart">` |
| Wrong UMD global | Using `agChartsEnterprise`/`agChartsCommunity` | Always use `agCharts` — `const { AgCharts } = agCharts;` |
| Update API error | Using `AgCharts.update(chart, opts)` | Use instance method: `chart.update(options)` for full replacement (v13+) |
| Partial update wipes options | Using `chart.update({ data: newData })` without full options | Use `chart.updateDelta({ data: newData })` for partial/delta updates |
| Container not found | Using string selector `'#myChart'` | Use `document.getElementById('myChart')` |
| Controls break chart layout | Chart div nested inside controls div | `<div id="myChart">` must be a **sibling** outside `<div class="example-controls">` |

## QA Plunker Observability

When creating plunkers for JIRA QA testing, always add `console.log` for callback parameters and other relevant runtime values. This enables QA to inspect what the chart is passing at runtime without needing to modify the plunker.

**Example — `dataSource.getData`:**

```js
dataSource: {
    getData: async (params) => {
        console.log('getData params:', params);
        // ... fetch data
    },
},
```

Apply this to every callback in a QA plunker: `getData`, event handlers, `itemStyler`, `formatter`, etc. Log the params as the first line of the callback body.

**Do NOT** create custom log panels, DOM overlays, or visual logging elements. Use `console.log` exclusively — QA will use browser DevTools to inspect output.
