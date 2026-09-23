# Porting the Web Analytics demo to vanilla TypeScript

This seed is a hand-written port of `packages/ag-charts-demos/src/demos/web-analytics` (React) to
plain TypeScript on Vite, with no UI framework and no third-party UI library. It exists so the same
demo can be published as a framework-free StackBlitz seed, and so a sync agent can bring it back
into step when the React source changes. This document is that agent's instruction set: the mapping
rules, the invariants the port must keep, and how to prove parity afterwards.

## Ground rules

- The React demo is the source of truth. The port follows it; it never leads.
- Copy, do not rewrite, any module that has no React import. Rewrite only components and the
  Radix wrappers.
- Reproduce the rendered DOM, not the React tree: the same elements, class names, roles, ARIA
  attributes and `data-state` values that React and Radix render. The parity harness compares
  screenshots, and `web-analytics.css` and the functional specs key off these.
- Verify every AG Charts and AG Grid option against `packages/ag-charts-types` and the React
  source. Do not introduce options the React demo does not use.
- The seed stays standalone: no `extends` or import that reaches above this folder, no workspace
  references, no dependencies beyond what `src/` imports (plus Vite and TypeScript).

## File mapping

| React source (`src/demos/web-analytics/`)                                                                                                                   | This seed (`src/`)           | Rule                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data.ts`, `topology.ts`, `types.ts`, `metrics.ts`, `format.ts`, `browsers.ts`, `devices.ts`, `flags.ts`, `chartTheme.ts`, `web-analytics.css`, `assets/**` | same names                   | Copied byte for byte. A diff here means the React source moved; re-copy.                                                                                                                                                                                                                                |
| `components/grid.ts`, `components/dateFilter.ts`                                                                                                            | same names                   | Copied byte for byte. `grid.ts` registers the AG Grid enterprise module and exports the theme and the base column definition; `dateFilter.ts` holds the day-key helpers (`startOfDay`, `dayKey`, `sameDaySet`) the traffic chart and the overview share.                                                |
| `data.test.ts`, `dataTimezone.test.ts`                                                                                                                      | none                         | Vitest suites for the data module; they run in the demos package, not in a seed.                                                                                                                                                                                                                        |
| `ui.tsx` (Radix wrappers)                                                                                                                                   | `ui.ts`                      | Hand-rolled `createSelect`, `createTabs` and `createPopover` reproducing the Radix DOM (see below).                                                                                                                                                                                                     |
| `WebAnalyticsApp.tsx`                                                                                                                                       | `WebAnalyticsApp.ts`         | Builds the top bar and the tabs once; `render()` recomputes the range-derived data when the range changes and pushes props to the active view's `update()`. Inactive views are destroyed, as Radix unmounts inactive `Tabs.Content`.                                                                    |
| `components/OverviewView.tsx`, `AudienceView.tsx`, `BehaviorView.tsx`                                                                                       | `components/*.ts`            | One `create*View(props)` factory each, returning `{ el, mount, update, destroy }`. Chart-or-empty-state branches go through `createChartSlot`.                                                                                                                                                          |
| `components/*Chart.tsx`, `GeoMap.tsx`, `FunnelChart.tsx`, `PageTreemapChart.tsx`, `PathFlowChart.tsx`                                                       | `components/*.ts`            | `create<Name>Chart(data)` wrapping `createDataChart(data, buildOptions)`; `buildOptions` is the `useMemo` body verbatim, including any sorting or totalling it did.                                                                                                                                     |
| `components/TrafficChart.tsx`                                                                                                                               | `components/TrafficChart.ts` | The one chart with imperative calls: `update(props)` rebuilds options on the memo's dependencies, then syncs and prunes the selection as the two effects did.                                                                                                                                           |
| `components/KpiTiles.tsx`, `EventForm.tsx`, `SessionsGrid.tsx`, `Sparkline.tsx`, `EmptyState.tsx`, `BrandMark.tsx`, `DemoNotice.tsx`                        | `components/*.ts`            | One `create*()` factory per component (the `View` interface in `dom.ts`); `createBrandMark()` returns the SVG element directly.                                                                                                                                                                         |
| `index.tsx`                                                                                                                                                 | `index.ts`                   | Registers `AllEnterpriseModule`, imports the CSS, exports `createWebAnalytics(): View`.                                                                                                                                                                                                                 |
| `main.tsx` (React seed)                                                                                                                                     | `main.ts`                    | Registers `AllCommunityModule`, appends `<main data-demo-id="web-analytics" style="position: fixed; inset: 0;">` to `#root`, then calls `mount()`. The inline style is a seed-level invariant every port carries (the React generator emits it in `main.tsx`); `index.html` carries no `<style>` block. |
| no equivalent                                                                                                                                               | `dom.ts`                     | `h()`, `svg()`, `append()` element helpers, the `View` interface, `staticView` and `createSlot` (a keyed mount point that swaps one view for another).                                                                                                                                                  |
| no equivalent                                                                                                                                               | `agChart.ts`                 | `createAgChart` (the `ag-charts-react` wrapper as a view), `createDataChart` (a chart whose options are a pure function of its data) and `createChartSlot` (a chart-or-empty-state branch).                                                                                                             |

## Mapping rules

### Components and hooks

- A component function becomes a `create<Name>(props)` factory. JSX becomes nested `h()` calls
  with the same tag, class names and attribute values, in the same order.
- `useState` becomes a `let` in the factory; every `setX` call is followed by `render()`. Where a
  handler sets state while `render()` is already running (the grid's `onModelUpdated` fires from
  inside `setGridOption`), `render()` marks itself dirty and runs once more when it finishes.
- `useMemo` becomes a plain variable recomputed in `update()` when its dependency changes, with
  the dependency compared by the same identity or value React would use.
- `useEffect` / `useLayoutEffect` bodies that create a chart or grid go in `mount()`, which the
  parent calls once the element is in the document (React layout-effect timing). Bodies that react
  to prop changes go in `update(props)`, guarded by the same dependency comparison as the effect's
  dependency array. Cleanup goes in `destroy()`.
- `useRef` to a DOM node becomes the element itself, held in a `const`.
- A conditional branch `{cond ? <Chart data={d} /> : <EmptyState />}` becomes a `createChartSlot`:
  a keyed slot that destroys the outgoing view, creates and mounts the incoming one, and forwards
  `data` to a chart that stayed.
- A React `key` that forces a remount (the event form keyed on the selected day) becomes: on key
  change, `destroy()` the old view, create a new one, and `mount()` it in the popover.
- Inactive tab content is unmounted by Radix, so switching tabs destroys the outgoing view and
  creates the incoming one; charts remount with a fresh initial animation, as the functional spec
  "returning to a tab remounts its charts with data" expects.

### `ag-charts-react` to `AgCharts.create` and `chart.update`

- `<AgCharts options={o} style={{ height: '100%', width: '100%' }} />` renders
  `<div style="height: 100%; width: 100%;">`. `createAgChart` creates that div with `h()`, and in
  `mount()` calls `AgCharts.create({ ...options, container: div })`.
- The wrapper re-runs `chart.update({ ...options, container })` whenever the `options` prop
  changes identity, skipping the mount render, and logs a rejected update with `console.error`.
  `createAgChart.update()` mirrors this: it returns early when handed the same object, and
  `createDataChart` only rebuilds options when its data changes identity, so `chart.update` runs
  exactly when the React component's memoised options would have changed.
- Imperative calls made through a `ref` (`getSelection`, `setSelection`, `clearSelection` on the
  traffic chart) are made on the instance directly, with identical arguments and ordering.
- Sparklines are created with `AgCharts.__createSparkline` in `mount()` and updated with
  `chart.update` when the points change identity, as the React `Sparkline` effects do.
- The wrapper's layout-effect cleanup calls `chart.destroy()` on unmount; the port's `destroy()`
  does the same, so tab switches and slot swaps never leak an instance.

### `ag-grid-react` to `createGrid`

- `<AgGridReact />` inside `.wa-grid-host` renders a full-height div and themes it. Vanilla
  `createGrid(el, options)` inserts that same div into `el` itself, so pass `.wa-grid-host` as `el`
  and do not add a div of your own.
- Grid options are the same object the React component passed as props (`domLayout="autoHeight"`,
  pagination and page sizes, row and header heights, the overlay params). Event handler props
  (`onGridReady`, `onModelUpdated`) are the same-named grid options.
- `ref.current.api` becomes the `GridApi` returned by `createGrid`. Row data changes go through
  `api.setGridOption('rowData', …)`, as the React prop change does.
- The icon cell renderers (`DeviceCell`, `BrowserCell`, `CountryCell`) are function renderers
  returning an element, or `''` where the React component returned `null`.

### Radix components to DOM (`ui.ts`)

Each factory renders exactly what the Radix primitive renders, minus Radix's private
`data-radix-*` bookkeeping attributes and CSS custom properties.

- `Select` (Root/Trigger/Value/Icon/Portal/Content/Viewport/Item/ItemText) -> `createSelect`:
  the trigger is `<button type="button" role="combobox" aria-controls aria-expanded aria-autocomplete="none" dir="ltr" data-state="closed|open" class="wa-btn wa-select-trigger" aria-label>`
  holding `<span style="pointer-events: none;">label</span><span aria-hidden="true">▾</span>`,
  wrapped in `<label class="wa-labeled-select"><span>Range</span>…</label>` when a label is given.
  Opening appends to `document.body` a wrapper `<div dir="ltr" style="position: fixed; left: 0px; top: 0px; min-width: max-content; z-index: 60; transform: translate(x, y);">`
  containing `<div role="listbox" id data-state="open" data-side="bottom|top" data-align="start" dir="ltr" class="wa-portal wa-select-content" tabindex="-1" style="box-sizing: border-box; display: flex; flex-direction: column; outline: none; pointer-events: auto;">`
  then `<div role="presentation" style="position: relative; flex: 1 1 0%; overflow: auto;">` and
  `<div role="option" aria-labelledby aria-selected data-state="checked|unchecked" tabindex="-1" class="wa-select-item"><span id>Last 30 days</span></div>`
  items, the focused one carrying `data-highlighted`. Positioned 4px below the trigger, flipping
  above when there is no room, snapped to device pixels. Opens on pointerdown or Space, Enter,
  ArrowUp, ArrowDown; arrows and Home/End move the highlight; Enter, Space or pointerup select;
  Escape or a pointerdown outside closes; focus returns to the trigger. Typing searches the
  options as Radix does: on the closed trigger the value moves to the next match, in the open
  listbox the match takes focus (repeating a character steps through its matches; the search
  resets after a second). While open, the rest of the page carries `aria-hidden="true"` (with
  Radix's `data-aria-hidden` marker) and `document.body` takes no pointer events.
- `Tabs` (Root/List/Trigger/Content, horizontal, automatic activation, `loop`) -> `createTabs`:
  `<div dir="ltr" data-orientation="horizontal" class="wa-app">` holding
  `<div role="tablist" aria-orientation="horizontal" aria-label="Analytics views" class="wa-tabs-list" tabindex="0" data-orientation="horizontal" style="outline: none;">`
  of `<button type="button" role="tab" aria-selected aria-controls data-state="active|inactive" id class="wa-tab-trigger" tabindex data-orientation="horizontal">`
  triggers and one `<div data-state="active|inactive" data-orientation="horizontal" role="tabpanel" aria-labelledby id tabindex="0" class="wa-tab-content" hidden>`
  per tab. Roving focus as Radix's `RovingFocusGroup`: the list keeps `tabindex="0"` and the
  focused trigger takes `tabindex="0"`, the others `-1`; keyboard focus landing on the list moves
  to the active trigger; Left/Right move focus and activate, looping (Up/Down are ignored on the
  horizontal list); Home/End and PageUp/PageDown jump; Shift+Tab leaves the list without stopping
  on it. A left-button mousedown without Control activates, as do Space and Enter. The panel that
  is active on
  first render carries `style="animation-duration: 0s;"` until the value first changes, as Radix
  suppresses the mount animation. Inactive panels are `hidden` and empty.
- `Popover` (Root/Trigger/Anchor/Portal/Content, non-modal, `side="bottom" align="end"`) ->
  `createPopover`: the trigger is `<button type="button" aria-haspopup="dialog" aria-expanded data-state="closed|open" class="wa-btn wa-btn--secondary">Add event</button>`,
  gaining `aria-controls` while open. Opening appends to `document.body` a wrapper
  `<div style="position: fixed; left: 0px; top: 0px; min-width: max-content; z-index: auto; transform: translate(x, y);">`
  holding `<div data-state="open" data-side="bottom|top" data-align="end" role="dialog" id class="wa-portal" tabindex="-1">`
  with the form.
  Positioned 6px below the anchor with its right edge on the anchor's, shifted to stay 8px inside
  the viewport and flipping above when there is no room. Escape, a pointerdown outside or focus
  moving outside dismiss it; focus returns to the trigger unless the dismissal was an interaction
  outside.
- `Label` -> a plain `<label class="wa-labeled-select">` wrapping the trigger; a double click on
  its text does not select the text.

## DOM and class-name invariants

The functional specs and the parity harness depend on these. Do not rename, wrap or reorder them.

- `<main data-demo-id="web-analytics" style="position: fixed; inset: 0;">` wraps the demo. The
  wrapper carries exactly `data-demo-id` and that inline style: the demo's own container is
  fixed-position, which would leave the wrapper with no box, so every port sizes it to the
  viewport as the React generator does in `main.tsx`.
- `.wa-app` > `.wa-topbar` (`.wa-brand` with the brand mark and "Pulse Analytics", the tab list,
  `.wa-topbar-spacer`, `.wa-controls` with the range select and the demo notice) then `.wa-body`
  holding the three `.wa-tab-content` panels.
- Overview: `.wa-view.wa-view--fill` > `.wa-kpi-tabs[role="tablist"][aria-label="Traffic metric"]`
  of `.wa-kpi[role="tab"]` tiles (`.wa-kpi-label`, `.wa-kpi-value`, `.wa-kpi-delta`,
  `.wa-kpi-spark-box` > `.wa-kpi-spark`), then `.wa-card.wa-card--tabbed` > `.wa-card-head`
  (`.wa-card-title`, `.wa-card-sub`, `.wa-card-actions` with the remove button and the
  "Add event" trigger) and `.wa-chart-box-lg[role="tabpanel"]`, then `.wa-card.wa-card--fill` >
  `.wa-card-head` and `.wa-grid-host`.
- Audience and Behavior: `.wa-view` > `.wa-grid-4` / `.wa-grid-2` / `.wa-grid-2-even` of
  `.wa-card` > `.wa-card-head` + `.wa-chart-box-xsm` or `.wa-chart-box-xxsm`, with `.wa-fill`
  around an empty state that replaces a chart.
- The empty state is `.wa-empty` > `.wa-empty-icon[aria-hidden="true"]`, the message span and an
  optional `.wa-card-sub` hint.
- The demo notice is `.wa-notice` > `.wa-notice-trigger[aria-describedby]` and, while open,
  `span#wa-demo-notice[role="tooltip"].wa-notice-tip`.
- Every chart container is the direct parent of `.ag-charts-wrapper` and has
  `style="height: 100%; width: 100%;"`.
- Attribute order follows the React render (`type`, then `class` and the rest on buttons; `class`
  before `role` and ARIA attributes on tiles).

Known, accepted differences from the React render:

- AG Grid's internal DOM differs because `ag-grid-react` renders the grid shell with React
  components while `createGrid` renders it itself (`data-ref` attributes, comment nodes, class
  order). Pixel output is identical.
- Radix's private `data-radix-*` attributes and its CSS custom properties are omitted, along with
  its inline `<style>` for hiding the viewport scrollbar, its focus guards and the
  `data-scroll-locked` it sets on `<body>` while a Select is open.
- The traffic chart's legend and axis labels can sit a few pixels apart from the React reference
  in the overview states. AG Charts re-lays a chart out when a web font it measured with a
  fallback finishes loading, and defers that re-layout to the end of any running animation. The
  React app renders after `load`, so Urbanist arrives mid-animation and the re-layout is a second
  animated pass; this port renders synchronously from its module script, so the font arrives
  before the animation starts and the re-layout folds into the first pass. The difference is
  within the parity tolerance and disappears when the web font is unavailable.

## Deterministic mode

The demo has no `deterministic.ts`: `data.ts` generates every dataset from a seeded PRNG anchored
to a fixed date, so its output is the same on every load. The parity harness still loads
`/?deterministic=1#web-analytics`; nothing in the port or the React demo reads the query string.

## Sync procedure (Phase 4)

`/port-showcases` aligns a stale port by following this guide, and the Demo Port Alignment workflow
runs it at the release-branch cut. To align this port by hand, work through these steps:

1. Diff `src/demos/web-analytics` between the `sourceCommit` recorded in `.seed-manifest.json` and `HEAD`,
   the branch being aligned (a release branch at the cut), from the repository root:
   `git diff <sourceCommit> HEAD -- packages/ag-charts-demos/src/demos`. The whole of `src/demos`,
   since a module imported from a sibling demo counts towards this demo's source hash.
2. Re-copy every byte-for-byte module in the file mapping table.
3. Apply component and hook changes by the mapping rules above, keeping the invariants.
4. Type-check and build:
    ```sh
    NX_DAEMON=false yarn nx run ag-charts-demos-seeds:typecheck-typescript
    NX_DAEMON=false yarn nx run ag-charts-demos-seeds:build-typescript
    ```
5. Run the parity check (below) and the functional specs. Fix differences in the port; do not add
   masks or loosen tolerances for anything but unavoidable browser chrome.
6. Rewrite the manifest from `packages/ag-charts-demos`:
    ```sh
    node tools/seeds/stamp-port-manifest.mjs web-analytics typescript
    ```
7. Leave the `ag-charts-*` pins, and the manifest's `pinnedVersion` / `pinSource`, alone: `pin-ports.mjs`
   owns them and re-pins every port on each version bump and at the release-branch cut, so never
   edit them by hand. Any other dependency pin is updated by hand to match the React demo's
   `packages/ag-charts-demos/package.json` when that changed.

## Parity check

From `packages/ag-charts-demos`, with the demos app built (`yarn nx build ag-charts-demos`) and
this seed built:

```sh
# Serve this seed's production bundle.
(cd seeds/web-analytics/typescript && npx vite preview --port 4712 --strictPort) &

# Functional specs: every web-analytics spec plus the demos.spec.ts case for this demo.
DEMOS_BASE_URL=http://localhost:4712 npx playwright test -g web-analytics

# Pixel parity against the React reference, every web-analytics state at both viewports.
PARITY_TARGETS='[{"demo":"web-analytics","framework":"typescript","baseURL":"http://localhost:4712"}]' \
    NX_DAEMON=false yarn nx test:e2e:parity ag-charts-demos
```

The parity harness serves the React reference itself (`vite preview` of the demos app `dist`). Its
states, viewports and tolerance live in `e2e/parity/`; masks belong in `e2e/parity/masks.ts` under
a labelled TypeScript section with a one-line reason each. This port needs no masks.

## StackBlitz self-containment

Copy this folder anywhere outside the repository, then `npm install`, `npm run build` and
`npm run dev`. All three must work with nothing but this folder's files.
