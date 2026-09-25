# Porting the Financial demo to Angular

This seed is a hand-written port of `packages/ag-charts-demos/src/demos/financial` (React) to
Angular 20 on the Angular CLI, with standalone components, signals and the Angular CDK for the
behaviour Radix UI supplied in React. It exists so the same demo can be published as an Angular
StackBlitz seed, and so a sync agent can bring it back into step when the React source changes.
This document is that agent's instruction set: the mapping rules, the invariants the port must
keep, and how to prove parity afterwards.

## Ground rules

- The React demo is the source of truth. The port follows it; it never leads.
- Copy, do not rewrite, any module that has no React import. Rewrite only components and hooks.
- Reproduce the rendered DOM, not the React tree: the same elements, class names, roles, ARIA
  attributes and `data-state` values that React and Radix render. The parity harness compares
  screenshots, and `financial.css` and the functional specs key off these.
- Verify every AG Charts and AG Grid option against `packages/ag-charts-types` and the React
  source. Do not introduce options the React demo does not use.
- The seed stays standalone: no `extends` or import that reaches above this folder, no workspace
  references, no dependencies beyond what `src/` imports (plus the Angular CLI and TypeScript).
  Zone.js stays: `ag-charts-angular` and `ag-grid-angular` run chart and grid creation outside the
  zone and re-enter it for callbacks, which is the change-detection model they are built for.

## File mapping

| React source (`src/demos/financial/`)                                                                                                 | This seed (`src/`)                                         | Rule                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data.ts`, `deterministic.ts`, `format.ts`, `types.ts`, `chartTheme.ts`, `barTransaction.ts`, `windowTransaction.ts`, `financial.css` | same names                                                 | Copied byte for byte. A diff here means the React source moved; re-copy.                                                                                                                                                                                                                                                                                                               |
| `components/grid.ts`                                                                                                                  | `components/grid.ts`                                       | Copied byte for byte except its two renderer imports, which resolve to `./sparkline-cell` and `./ticker-cell` here (kebab-case file names; the export names `SparklineCell` and `TickerCell` are unchanged).                                                                                                                                                                           |
| `ui.tsx` (Radix wrappers)                                                                                                             | `ui.ts`                                                    | `FinButton` directive, `Select` and `ToggleGroup` components (plus their `SelectItem` and `ToggleItem` item directives) reproducing the Radix DOM over the Angular CDK (see below).                                                                                                                                                                                                    |
| `useStreamingMarket.ts` (hook)                                                                                                        | `streaming-market.ts`                                      | The `StreamingMarket` injectable: the hook's state as signals, its callbacks as methods. Same feeds, tick loop and animation-frame flush. Provided by `FinancialApp`, so it lives as long as the app.                                                                                                                                                                                  |
| `FinancialApp.tsx`                                                                                                                    | `financial-app.ts`                                         | `FinancialApp` component; host is the React root `.fin-container`.                                                                                                                                                                                                                                                                                                                     |
| `components/<Name>.tsx`                                                                                                               | `components/<kebab-name>.ts`                               | One component per file, class name unchanged (`FinancialChart`, `PeerPerformanceChart`, `PeerSpreadHeatmap`, `ProfileGauges`, `Toolbar`, `DemoInfo`, `TickerBadge` + `TickerCell`, `SparklineCell`, `Watchlist`, `Trending`, `MostActive`); `TickerGrid` is an abstract directive the three grids extend.                                                                              |
| `index.tsx`                                                                                                                           | `index.ts`                                                 | Registers `AllEnterpriseModule`, exports the root `FinancialDemo` component whose template is `<div finFinancialApp>`. The CSS import moves to `angular.json` `styles`.                                                                                                                                                                                                                |
| `main.tsx` (React seed)                                                                                                               | `main.ts`                                                  | Registers `AllCommunityModule`, appends `<main data-demo-id="financial" style="position: fixed; inset: 0;">` to `#root`, then `bootstrapApplication(FinancialDemo)` onto it (`FinancialDemo`'s selector is `main[data-demo-id]`). The inline style is a seed-level invariant every port carries (the React generator emits it in `main.tsx`); `index.html` carries no `<style>` block. |
| no equivalent                                                                                                                         | `styles.css`, `env.d.ts`, `angular.json`, `tsconfig*.json` | `styles.css` imports the CDK overlay positioning CSS; `env.d.ts` types `import.meta.env` for the copied `deterministic.ts`; the rest is the Angular CLI project.                                                                                                                                                                                                                       |

## Mapping rules

### Components and hooks

- A component function becomes a standalone `@Component`. Its selector is an **attribute on the
  element the React component renders as its root** (`div[finFinancialApp]` with host class
  `fin-container`, `div[finWatchlist]` with host class `fin-section`, `div[finPeerPerformanceChart]`
  with host class `fin-detail-card`, `span[finTickerBadge]`, and so on), so the rendered tree gains
  no element. Static host attributes and classes go in `host: {}`; the template holds the children.
  Components whose React root is the chart wrapper itself (`FinancialChart`) take the parent element
  instead (`.fin-chart-body`).
- Props become `input.required<T>()` signals; callback props become `output<T>()`. `useState`
  becomes a `signal`; `useMemo` a `computed`. Cheap derivations (`change`, `changePct`) are
  `computed`s too, so the template never repeats arithmetic.
- A `useEffect` whose body applies prop changes to a chart or grid becomes an `effect()` in the
  constructor that reads its dependency signals, then does the work inside `untracked()` with the
  same guards the React effect had. Values React held in `useRef` to tell a prop change from a tick
  (`rangeMinutesRef`, `tickerRef`, `windowRef`, `liveRef`) become private fields.
- Work `useMemo(() => ..., [])` did once (the chart options) runs in `ngOnInit`, where the inputs
  are readable and the template has not yet been checked. Work `useLayoutEffect` did after mount
  runs in `ngAfterViewInit`.
- A `ref` to a wrapper component becomes `viewChild.required(AgCharts | AgFinancialCharts)`; the
  wrapper creates the chart in its own `ngAfterViewInit`, which runs before the parent's, so
  `this.chartComponent().chart` is set by then. Effects that run before it exists return early, as
  the React effects do when `chartRef.current` is null.
- A React `key` that forces a remount (the two peer charts keyed on the ticker) becomes a keyed
  `@for (ticker of tickerKey(); track ticker)` over a one-element array: a new ticker destroys and
  recreates both components, and the wrappers destroy their charts in `ngOnDestroy`.
- `React.memo` with a comparator (`ProfileGauges`) becomes one `computed` per compared value
  (`sentiment`, `beta`, `analystRating`): a fresh metrics object with equal values changes none of
  them, so the gauge options `computed`s and the `<ag-gauge [options]>` bindings stay put.
- A custom hook becomes an `@Injectable()` service with signals. Timers set up in an effect with
  a cleanup (`setInterval` on `running`/`speedMs`) become an `effect((onCleanup) => ...)` in the
  service constructor.
- Whitespace: Angular collapses runs of template whitespace to one space and drops whitespace-only
  text nodes, but does not trim a text node the way JSX does. Keep text that sits next to an
  element tight (`>{{ label }}</button>`, `>News sentiment<span`), or the DOM gains stray spaces.
  The repository `.prettierrc` formats this seed's templates with `htmlWhitespaceSensitivity:
"strict"` so `yarn nx format` preserves that tightness instead of reflowing button text onto its
  own line.

### `ag-charts-react` to `ag-charts-angular`

- `<AgCharts options={o} style={{ height: '100%', width: '100%' }} />` becomes
  `<ag-charts style="display: block; height: 100%; width: 100%;" [options]="options" />`;
  `AgFinancialCharts` becomes `<ag-financial-charts>`, `AgGauge` becomes `<ag-gauge>`. The
  component element is the chart container (the wrapper sets `container` to its host), and it needs
  `display: block` because a custom element is inline by default and would have no box to size.
- The wrapper re-runs `chart.update(options)` in `ngOnChanges` whenever the `[options]` binding
  changes identity, exactly as the React wrapper does on a new `options` prop. Mirror the React
  memoisation: the streaming charts hold one options object for their lifetime and stream data
  through the instance; the gauges bind a `computed` that only changes when its value does.
- Imperative calls made through a `ref` (`applyTransaction`, `updateDelta`, `setState`,
  `getState`) are made on the wrapper's `chart` instance directly, with identical arguments and
  ordering.
- Chart listeners (`listeners.zoom`) are wrapped by the wrapper to re-enter the Angular zone, so
  an `output.emit` from one drives change detection as a React state update would.

### `ag-grid-react` to `ag-grid-angular`

- `<AgGridReact style={{ height: '100%' }} />` becomes
  `<ag-grid-angular style="display: block; height: 100%" ...>` with the same-named inputs
  (`[theme]`, `[rowData]`, `[getRowId]`, `[columnDefs]`, `[defaultColDef]`, `[rowSelection]`,
  `domLayout`, `[rowHeight]`, `[headerHeight]`) and outputs (`(firstDataRendered)`,
  `(rowClicked)`, `(cellKeyDown)`). `ref.current.api` becomes `viewChild(AgGridAngular)().api`,
  which is set once the grid is created in the wrapper's `ngAfterViewInit`.
- `rowData` is bound to the initial rows once (`initialRowData`, taken in `ngOnInit`); later rows
  reach the grid as `applyTransactionAsync` updates from an effect, as in React.
- Cell renderer components implement `ICellRendererAngularComp`: `agInit(params)` is the mount,
  `refresh(params)` the update effect (return `true`), `ngOnDestroy` the cleanup. Work the React
  renderer did in a layout effect after attach (creating a sparkline) runs in a `queueMicrotask`
  scheduled from `agInit`, because the grid attaches the renderer's element after `agInit` returns.
  Charts created outside the wrappers (`AgCharts.__createSparkline`) are created inside
  `NgZone.runOutsideAngular`, as the wrappers do.
- The renderer's host element is what the React renderer returned: `div[finSparklineCell]` with
  host class `fin-sparkline-cell`, `span[finTickerCell]` with host class `fin-ticker`. The grid
  creates the host from the element part of the selector.

### Radix components to Angular CDK (`ui.ts`)

Each component renders exactly what the Radix primitive renders, minus Radix's private
`data-radix-*` bookkeeping attributes and CSS custom properties.

- `Button` -> `FinButton` directive on `button[finBtn]`: adds `type="button"` and class `fin-btn`;
  further classes and attributes are written on the element as in React.
- `ToggleGroup.Root` (single, `rovingFocus`, `loop`) -> `ToggleGroup` on `div[finToggleGroup]`:
  host `role="radiogroup" dir="ltr" class="fin-toggle-group" aria-label tabindex="0" style="outline: none;"`
  with `<button type="button" data-state="on|off" role="radio" aria-checked class="fin-toggle-item" tabindex>`
  items. Roving focus, hand-written after Radix's `RovingFocusGroup`: items are `tabindex="-1"`
  until one is focused, which then takes `0` (the group keeps `0`); keyboard focus landing on the
  group moves to the item that is on; arrow keys on both axes (the React demo gives the group no
  orientation) move focus and loop; Home/End and PageUp/PageDown jump; Shift+Tab leaves the group
  without stopping on it. A click selects; the selected item cannot be deselected (`valueChange`
  only ever emits a value).
- `Select` (Root/Trigger/Value/Icon/Portal/Content/Viewport/Item/ItemText) -> `Select` on
  `label[finSelect]`: the host is the Radix `Label.Root`, `<label class="fin-labeled-select">` (no `for`: it wraps its control),
  holding `<span>Speed</span>` and the trigger
  `<button type="button" role="combobox" aria-controls aria-expanded aria-autocomplete="none" dir="ltr" data-state="closed|open" class="fin-btn fin-select-trigger" aria-label>`
  with `<span style="pointer-events: none;">label</span><span aria-hidden="true">▾</span>`. While
  open, a CDK connected overlay (`CdkConnectedOverlay`, positioned bottom-start with a 4px offset
  and flipping above when there is no room) holds
  `<div role="listbox" id data-state="open" data-side="bottom|top" data-align="start" dir="ltr" class="fin-portal fin-select-content" tabindex="-1" style="box-sizing: border-box; display: flex; flex-direction: column; outline: none; pointer-events: auto;">`
  then `<div role="presentation" style="position: relative; flex: 1 1 0%; overflow: auto;">` and
  `<div role="option" aria-labelledby aria-selected data-state="checked|unchecked" tabindex="-1" class="fin-select-item"><span id>1×</span></div>`
  items (`SelectItem` directives), the focused one carrying `data-highlighted`. Opens on a mouse
  pointerdown, a touch or pen click, or Space, Enter, ArrowUp, ArrowDown; the selected item takes
  focus; arrows and Home/End move it; Enter, Space or pointerup select; Escape or a pointerdown
  outside closes (the CDK overlay detaches on Escape, the port on the pointerdown); focus returns
  to the trigger. Typing searches the options as Radix does: on the closed trigger the value moves
  to the next match, in the open listbox the match takes focus (repeating a character steps
  through its matches; the search resets after a second). While open, the rest of the page carries
  `aria-hidden="true"` (with Radix's `data-aria-hidden` marker) and `document.body` takes no
  pointer events.
- `Label` -> the `Select` host itself.

## DOM and class-name invariants

The functional specs and the parity harness depend on these. Do not rename, wrap or reorder them.

- `<main data-demo-id="financial" style="position: fixed; inset: 0;">` wraps the demo. The
  wrapper carries exactly `data-demo-id` and that inline style (Angular adds `ng-version` when it
  bootstraps onto it): the demo's own container is fixed-position, which would leave the wrapper
  with no box, so every port sizes it to the viewport as the React generator does in `main.tsx`.
- `.fin-container` > `.fin-toolbar`, `.fin-body[data-drawer-open]` > `.fin-sidebar.fin-sidebar-left`
  (three `.fin-section` grids: `.fin-watchlist-grid`, `.fin-trending-grid`, `.fin-most-active-grid`),
  `.fin-drawer-overlay`, `.fin-main` > `.fin-title-bar` > `.fin-title-left` (`.fin-drawer-toggle`,
  `.fin-quote` with `.fin-ticker-badge`, `.fin-quote-symbol`, `.fin-quote-price`) and
  `.fin-title-controls` (toggle group, speed select, live button), then
  `.fin-detail-card.fin-chart-card` > `.fin-chart-body`, `.fin-detail-gauges`, `.fin-detail-charts`.
- The live button's text is exactly `❚❚ Pause` while streaming and `▶ Live` while paused.
- Range buttons are `role="radio"` with names `30m`, `1H`, `2H`, `4H` and `aria-checked`.
- Grid rows are `.ag-row` under the grid class; selecting an instrument clicks a row.
- Every chart container is the direct parent of `.ag-charts-wrapper` and has
  `height: 100%; width: 100%` (plus `display: block`, see above).

Known, accepted differences from the React render, none of which move a pixel:

- Angular writes each attribute-selector marker on its host (`finfinancialapp=""`, `finbtn=""`,
  `fintoggleitem=""`, `cdkoverlayorigin=""`) and keeps static input attributes on the element
  (`arialabel="Time range"`, `label="Speed"`); it also writes host attributes and bound attributes
  in its own order, so attribute order differs from the React render.
- The chart containers are `<ag-charts>`, `<ag-financial-charts>` and `<ag-gauge>` elements with
  `display: block`, where React renders `<div>`s. The grid host is `<ag-grid-angular>`.
- AG Grid's internal DOM differs because `ag-grid-react` renders the grid shell with React
  components while `ag-grid-angular` renders it itself (`data-ref` attributes, comment nodes, class
  order).
- The open select's listbox sits in the CDK overlay container (`.cdk-overlay-container` >
  `.cdk-overlay-connected-position-bounding-box` > `.cdk-overlay-pane`) rather than Radix's
  `[data-radix-popper-content-wrapper]` div, and Radix's private attributes, CSS custom properties,
  inline `<style>` for hiding the viewport scrollbar, focus guards and the `data-scroll-locked` it
  sets on `<body>` while the Select is open are omitted.
- Angular leaves `<!--container-->` comment nodes where `@if`/`@for` blocks render.

## Deterministic mode

`?deterministic=1` on the URL switches `deterministic.ts` (copied unchanged) to a seeded random
source and a fixed start time, and the service starts paused. Nothing in the port reads the query
string directly; everything goes through `DETERMINISTIC`, `startTime()` and `randomSource(label)`
with the same labels as the React demo (`bars:<ticker>`, `peers`, `movers:<tickers>`). The copied
file also reads Vite's `import.meta.env.VITE_DEMO_DETERMINISTIC`; the Angular build has no
`import.meta.env`, so `angular.json` `define` replaces that expression with `undefined` at build
time and `src/env.d.ts` declares it for the type-checker. The parity harness loads
`/?deterministic=1#financial`.

## Sync procedure (Phase 4)

`/port-showcases` aligns a stale port by following this guide, and the Demo Port Alignment workflow
runs it at the release-branch cut. To align this port by hand, work through these steps:

1. Diff `src/demos/financial` between the `sourceCommit` recorded in `.seed-manifest.json` and `HEAD`,
   the branch being aligned (a release branch at the cut), from the repository root:
   `git diff <sourceCommit> HEAD -- packages/ag-charts-demos/src/demos`. The whole of `src/demos`,
   since a module imported from a sibling demo counts towards this demo's source hash.
2. Re-copy every byte-for-byte module in the file mapping table (and re-apply the two import
   renames in `components/grid.ts`).
3. Apply component and hook changes by the mapping rules above, keeping the invariants.
4. Type-check and build:
    ```sh
    NX_DAEMON=false yarn nx run ag-charts-demos-seeds:typecheck-angular
    NX_DAEMON=false yarn nx run ag-charts-demos-seeds:build-angular
    ```
5. Run the parity check (below) and the functional specs. Fix differences in the port; do not add
   masks or loosen tolerances for anything but unavoidable browser chrome.
6. Rewrite the manifest from `packages/ag-charts-demos`:
    ```sh
    node tools/seeds/stamp-port-manifest.mjs financial angular
    ```
    which rewrites `sourceHash` and `sourceCommit` and leaves every other field as it was.
7. Leave the `ag-charts-*` pins, and the manifest's `pinnedVersion` / `pinSource`, alone: `pin-ports.mjs`
   owns them and re-pins every port on each version bump and at the release-branch cut, so never
   edit them by hand. Any other dependency pin is updated by hand to match the React demo's
   `packages/ag-charts-demos/package.json` when that changed.

## Parity check

From `packages/ag-charts-demos`, with the demos app built (`yarn nx build ag-charts-demos`) and
this seed built:

```sh
# Serve this seed's production bundle (a dependency-free static server with SPA fallback).
node e2e/parity/serve-dist.mjs --dir seeds/financial/angular/dist --port 4710 &

# Functional specs: the financial ones must pass. The other specs address other demos or the demos
# app itself and fail against a single seed.
DEMOS_BASE_URL=http://localhost:4710 npx playwright test -g financial

# Pixel parity against the React reference, every financial state at both viewports.
PARITY_TARGETS='[{"demo":"financial","framework":"angular","baseURL":"http://localhost:4710"}]' \
    NX_DAEMON=false yarn nx test:e2e:parity ag-charts-demos
```

Or let the harness find and serve every committed port, this one included, from its manifest:

```sh
NX_DAEMON=false yarn nx run ag-charts-demos-seeds:build
PARITY_DISCOVER=1 NX_DAEMON=false yarn nx test:e2e:parity ag-charts-demos
```

The parity harness serves the React reference itself (`vite preview` of the demos app `dist`). Its
states, viewports and tolerance live in `e2e/parity/`; masks belong in `e2e/parity/masks.ts` under
a labelled TypeScript section with a one-line reason each.

## StackBlitz self-containment

Copy this folder anywhere outside the repository, then `npm install`, `npm run build` and
`npm run dev`. All three must work with nothing but this folder's files.
