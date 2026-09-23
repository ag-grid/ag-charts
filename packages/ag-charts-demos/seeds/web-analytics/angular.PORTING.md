# Porting the Web Analytics demo to Angular

This seed is a hand-written port of `packages/ag-charts-demos/src/demos/web-analytics` (React) to
Angular 20 on the Angular CLI, with standalone components, signals and the Angular CDK for the
behaviour Radix UI supplied in React. It exists so the same demo can be published as an Angular
StackBlitz seed, and so a sync agent can bring it back into step when the React source changes.
This document is that agent's instruction set: the mapping rules, the invariants the port must
keep, and how to prove parity afterwards.

## Ground rules

- The React demo is the source of truth. The port follows it; it never leads.
- Copy, do not rewrite, any module that has no React import. Rewrite only components.
- Reproduce the rendered DOM, not the React tree: the same elements, class names, roles, ARIA
  attributes and `data-state` values that React and Radix render. The parity harness compares
  screenshots, and `web-analytics.css` and the functional specs key off these.
- Verify every AG Charts and AG Grid option against `packages/ag-charts-types` and the React
  source. Do not introduce options the React demo does not use.
- The seed stays standalone: no `extends` or import that reaches above this folder, no workspace
  references, no dependencies beyond what `src/` imports (plus the Angular CLI and TypeScript).
  Zone.js stays: `ag-charts-angular` and `ag-grid-angular` run chart and grid creation outside the
  zone and re-enter it for callbacks, which is the change-detection model they are built for.

## File mapping

| React source (`src/demos/web-analytics/`)                                                                                                                                                                     | This seed (`src/`)                                            | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data.ts`, `types.ts`, `format.ts`, `metrics.ts`, `chartTheme.ts`, `flags.ts`, `devices.ts`, `browsers.ts`, `topology.ts`, `web-analytics.css`, `components/dateFilter.ts`, `components/grid.ts`, `assets/**` | same names                                                    | Copied byte for byte. A diff here means the React source moved; re-copy. `flags.ts`, `devices.ts` and `browsers.ts` import their `.png`/`.svg` assets as URL modules, which `angular.json` `loader` and `src/assets.d.ts` provide (see below).                                                                                                                                                                                                                                                                                                                                                                         |
| `ui.tsx` (Radix `Select` wrapper) and the `@radix-ui/react-tabs` primitives `WebAnalyticsApp.tsx` uses directly                                                                                               | `ui.ts`                                                       | `Select` component (plus its `SelectItem` item directive), `TabList` component, `TabTrigger` and `TabContent` directives reproducing the Radix DOM over the Angular CDK (see below).                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `WebAnalyticsApp.tsx`                                                                                                                                                                                         | `web-analytics-app.ts`                                        | `WebAnalyticsApp` component; host is the React root, Radix `Tabs.Root` rendered as `.wa-app`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `components/<Name>.tsx`                                                                                                                                                                                       | `components/<kebab-name>.ts`                                  | One component per file, class name unchanged (`OverviewView`, `AudienceView`, `BehaviorView`, `TrafficChart`, `KpiTiles` with `buildKpis` and `kpiTabId`, `Sparkline`, `EventForm`, `SessionsGrid`, `EmptyState`, `BrandMark`, `DemoNotice`, `GeoMap`, `ChannelBreakdownChart`, `VisitorBreakdownChart`, `DeviceBreakdownChart`, `BrowserBreakdownChart`, `ActivityHeatmapChart`, `ActivityByDayChart`, `FunnelChart`, `PathFlowChart`, `PageTreemapChart`, `PagePerformanceChart`, `DurationHistogramChart`). The `@radix-ui/react-popover` `OverviewView.tsx` uses directly is reproduced inside `overview-view.ts`. |
| `iconCell` factory in `components/SessionsGrid.tsx`                                                                                                                                                           | `components/icon-cell.ts`                                     | One `IconCell` renderer component; the factory's arguments (`iconUrl`, `imgClass`) travel as `cellRendererParams`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `index.tsx`                                                                                                                                                                                                   | `index.ts`                                                    | Registers `AllEnterpriseModule`, exports the root `WebAnalyticsDemo` component whose template is `<div waWebAnalyticsApp>`. The CSS import moves to `angular.json` `styles`.                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `main.tsx` (React seed)                                                                                                                                                                                       | `main.ts`                                                     | Registers `AllCommunityModule`, appends `<main data-demo-id="web-analytics" style="position: fixed; inset: 0;">` to `#root`, then `bootstrapApplication(WebAnalyticsDemo)` onto it (`WebAnalyticsDemo`'s selector is `main[data-demo-id]`). The inline style is a seed-level invariant every port carries (the React generator emits it in `main.tsx`); `index.html` carries no `<style>` block.                                                                                                                                                                                                                       |
| no equivalent                                                                                                                                                                                                 | `styles.css`, `assets.d.ts`, `angular.json`, `tsconfig*.json` | `styles.css` imports the CDK overlay positioning CSS; `assets.d.ts` declares the `.png`/`.svg` URL modules that `angular.json` `loader: { ".png": "file", ".svg": "file" }` emits (Vite inlines the small SVGs as data URIs instead; pixel-neutral); the rest is the Angular CLI project. `optimization.fonts` is off so the build neither needs the network nor inlines the Google Fonts CSS that `web-analytics.css` imports at runtime, as the React build does.                                                                                                                                                    |

## Mapping rules

### Components

- A component function becomes a standalone `@Component`. Its selector is an **attribute on the
  element the React component renders as its root** (`div[waWebAnalyticsApp]` with host class
  `wa-app`, `div[waOverviewView]` with host class `wa-view`, `div[waAudienceView]` with host class
  `wa-view wa-view--fill`, `div[waKpiTiles]` with host class `wa-kpi-tabs`, `div[waSessionsGrid]`
  with host class `wa-grid-host`, `form[waEventForm]`, `div[waEmptyState]`, `span[waDemoNotice]`,
  `svg[waBrandMark]`, and so on), so the rendered tree gains no element. Static host attributes and
  classes go in `host: {}`; the template holds the children. `BrandMark`'s host is the `<svg>`
  itself, so its template children take the `svg:` prefix to stay in the SVG namespace.
- Every chart component's React root is the chart wrapper itself, so the component takes the
  **parent box element** as host: the view template writes the box's classes and attributes on it
  (`<div waTrafficChart class="wa-chart-box-lg" role="tabpanel" [attr.aria-labelledby]=...>`,
  `<div waGeoMap class="wa-fill" ...>`, `<div waFunnelChart class="wa-chart-box" ...>`) and the
  component's template is only `<ag-charts ...>`. The React `hasData ? <Chart/> : <EmptyState/>`
  inside the box therefore becomes an `@if` around the box: the chart branch is the box-as-host,
  the `@else` branch renders the plain box with `<div waEmptyState>` inside, so both branches keep
  the box element.
- Props become `input.required<T>()` signals (`input<T>()` for the optional `hint`); callback
  props become `output<T>()`. A callback with several arguments becomes an output of one object:
  `onAnnotationAdd(date, label, type)` -> `annotationAdd: { date, label, type }`,
  `onAddEventAt(day, anchor?)` -> `addEventAt: { day, anchor? }`,
  `onGridStateChange(filterModel, count)` -> `gridStateChange: { filterModel, displayedRowCount }`,
  `EventForm.onSubmit(date, label, type)` -> `submitted: { date, label, type }`.
- `useState` becomes a `signal`; `useMemo` a `computed` (including the chart options, which are
  `computed`s bound to `[options]`, so they recompute exactly when the React `useMemo` dependencies
  change). Setter updater functions (`setX(prev => ...)`) become `signal.update`.
  `useState(() => toInputValue(date))`, state seeded from a prop, becomes a `linkedSignal`.
  Module-level counters (`nextEventId`) stay module-level.
- A `useEffect` that only writes state (`OverviewView` deselecting an annotation that left the
  range) becomes an `effect()` in the constructor. The two `TrafficChart` effects that drive the
  chart instance become `afterRenderEffect()`s: in React the wrapper's effect applies the new
  options before the parent's effect runs, and in Angular the wrapper applies them in `ngOnChanges`
  during change detection, so an after-render effect keeps that ordering. Each tracks the signals
  the React dependency list named and reads the rest with `untracked()`. The React
  `useRef(domainKey)` mount snapshot is a local taken on the effect's first run, because inputs
  are not readable in the constructor.
- A React `key` that forces a remount (`<EventForm key={formDay.getTime()}>`) becomes a keyed
  `@for (day of formDays(); track day.getTime())` over a one-element array: a new day destroys and
  recreates the form, which resets its state and refocuses its first field.
- Work `useEffect(..., [])` did after mount to focus an element (`EventForm`) runs in
  `afterNextRender`, so the element is in the document.
- `KpiTiles` is hand-rolled in React (no Radix): its roving `tabIndex` and arrow-key handler port
  one to one, with the `onKeyDown` on the host and the `querySelectorAll('[role="tab"]')` focus
  move on the host element.
- Whitespace: Angular collapses runs of template whitespace to one space and drops whitespace-only
  text nodes, but does not trim a text node the way JSX does. Keep text that sits next to an
  element tight (`>Add event</button`, `>{{ fmtDelta(kpi.delta) }} vs prev</span`,
  `<svg waBrandMark></svg>Pulse Analytics`), or the DOM gains stray spaces. The repository
  `.prettierrc` formats this seed's templates with `htmlWhitespaceSensitivity: "strict"` so
  `yarn nx format` preserves that tightness instead of reflowing button text onto its own line.
  Write the curly quotes of `Remove “label”` as literal characters (`&ldquo;` is JSX).

### `ag-charts-react` to `ag-charts-angular`

- `<AgCharts options={o} style={{ height: '100%', width: '100%' }} />` becomes
  `<ag-charts style="display: block; height: 100%; width: 100%;" [options]="options()" />`. The
  component element is the chart container (the wrapper sets `container` to its host), and it needs
  `display: block` because a custom element is inline by default and would have no box to size.
- The wrapper re-runs `chart.update(options)` in `ngOnChanges` whenever the `[options]` binding
  changes identity, exactly as the React wrapper does on a new `options` prop; a `computed` options
  object changes identity exactly when a `useMemo` would.
- Imperative calls made through a `ref` (`getSelection`, `setSelection`, `clearSelection`) are
  made on the wrapper's `chart` instance, reached through `viewChild.required(AgCharts)`; the
  wrapper creates the chart in its own `ngAfterViewInit`, so the instance exists by the time an
  after-render effect runs. Callbacks inside the options (listeners, context-menu actions) close
  over the values captured when the options were computed, as the React `useMemo` closures do,
  and emit outputs.
- Chart `listeners` and `contextMenu.getItems` item actions are wrapped by the wrapper to
  re-enter the Angular zone, so an `output.emit` from one drives change detection as a React state
  update would. Tooltip renderers and formatters are not wrapped and must not touch state (the demo's
  do not).
- The KPI sparklines have no wrapper in React either: `Sparkline` creates one with
  `AgCharts.__createSparkline` in an `afterRenderEffect` (the React layout effect), inside
  `NgZone.runOutsideAngular` as the wrappers do, updates the instance in place on later runs, and
  destroys it in `ngOnDestroy`.

### `ag-grid-react` to `ag-grid-angular`

- `<AgGridReact />` becomes `<ag-grid-angular style="display: block; height: 100%" ...>` with the
  same-named inputs (`[theme]`, `[rowData]`, `[columnDefs]`, `[defaultColDef]`,
  `[overlayComponentParams]`, `[rowHeight]`, `[headerHeight]`, `domLayout`, `[pagination]`,
  `[paginationPageSize]`, `[paginationPageSizeSelector]`) and outputs (`(gridReady)`,
  `(modelUpdated)`). `ref.current.api` becomes `viewChild.required(AgGridAngular)().api`.
- The React `forwardRef` + `useImperativeHandle` handle (`clearFilters`) becomes a public method
  on `SessionsGrid`, which `OverviewView` calls through `viewChild(SessionsGrid)`.
- The column definitions are a module constant (the React `useMemo(..., [])`), with the
  `iconCell(...)` cells spread in as `{ cellRenderer: IconCell, cellRendererParams: { iconUrl, imgClass } }`.
- The renderer implements `ICellRendererAngularComp`: `agInit(params)` is the mount,
  `refresh(params)` the update (return `true`). Its host is what the React renderer returned,
  `span[waIconCell]` with host class `wa-icon-cell`; the grid creates the host from the element part
  of the selector. React returns `null` for an empty value where the Angular host span is present
  and empty (no such value occurs in the data).

### Radix components to Angular CDK

Each component renders exactly what the Radix primitive renders, minus Radix's private
`data-radix-*` bookkeeping attributes and CSS custom properties.

- `Tabs.Root` -> the `WebAnalyticsApp` host: `div.wa-app[dir="ltr"][data-orientation="horizontal"]`
  holding the `view` signal. `Tabs.List` -> `TabList` on `div[waTabList]`: host
  `role="tablist" aria-orientation="horizontal" tabindex="0" data-orientation="horizontal" style="outline: none;"`
  (plus the `class` and `aria-label` written in the app template), with `[value]`/`(valueChange)`.
  `Tabs.Trigger` -> `TabTrigger` on `button[waTabTrigger]`:
  `type="button" role="tab" aria-selected aria-controls data-state="active|inactive" id tabindex data-orientation="horizontal"`.
  Roving focus, hand-written after Radix's `RovingFocusGroup`: triggers are `tabindex="-1"` until
  one is focused, which then takes `0` (the list keeps `0`); keyboard focus landing on the list
  moves to the active trigger; Left/Right move focus, looping (Up/Down are ignored on the
  horizontal list); Home/End and PageUp/PageDown jump; Shift+Tab leaves the list without stopping
  on it. Radix activates on focus, so moving focus selects; a left-button mousedown without
  Control, Space and Enter select too. `Tabs.Content` -> `TabContent` on `div[waTabContent]`:
  `role="tabpanel" data-orientation="horizontal" tabindex="0" data-state aria-labelledby id`,
  `hidden` while inactive. Radix keeps every panel in the DOM and mounts children only into the
  active one, so the app template renders all three panels and mounts each view with an `@if` on
  the same value. `hidden` is toggled by an `effect`, not a host binding: Angular applies host
  bindings only after checking the `@if` views, so the charts in a newly selected panel would be
  created while it was still hidden and size themselves from a later, fractional measurement
  (React unhides the panel before any chart in it is created); the `style="animation-duration: 0s;"` Radix writes on the panels is written
  statically. The panel's `[tabs]` input takes the list through a template reference (`#tabs`).
- `Select` (Root/Trigger/Value/Icon/Portal/Content/Viewport/Item/ItemText) -> `Select` on
  `label[waSelect]`: the host is the Radix `Label.Root`, `<label class="wa-labeled-select">`,
  holding `<span>Range</span>` and the trigger
  `<button type="button" role="combobox" aria-controls aria-expanded aria-autocomplete="none" dir="ltr" data-state="closed|open" class="wa-btn wa-select-trigger" aria-label>`
  with `<span style="pointer-events: none;">label</span><span aria-hidden="true">▾</span>`. While
  open, a CDK connected overlay (`CdkConnectedOverlay`, positioned bottom-start with a 4px offset
  and flipping above when there is no room) holds
  `<div role="listbox" id data-state="open" data-side="bottom|top" data-align="start" dir="ltr" class="wa-portal wa-select-content" tabindex="-1" style="box-sizing: border-box; display: flex; flex-direction: column; outline: none; pointer-events: auto;">`
  then `<div role="presentation" style="position: relative; flex: 1 1 0%; overflow: auto;">` and
  `<div role="option" aria-labelledby aria-selected data-state="checked|unchecked" tabindex="-1" class="wa-select-item"><span id>Last 30 days</span></div>`
  items (`SelectItem` directives), the focused one carrying `data-highlighted`. Opens on a mouse
  pointerdown, a touch or pen click, or Space, Enter, ArrowUp, ArrowDown; the selected item takes
  focus; arrows and Home/End move it; Enter, Space or pointerup select; Escape or a pointerdown
  outside closes (the CDK overlay detaches on Escape, the port on the pointerdown); focus returns
  to the trigger. Typing searches the options as Radix does: on the closed trigger the value moves
  to the next match, in the open listbox the match takes focus (repeating a character steps
  through its matches; the search resets after a second). While open, the rest of the page carries
  `aria-hidden="true"` (with Radix's `data-aria-hidden` marker) and `document.body` takes no
  pointer events.
- `Popover` (Root/Anchor/Trigger/Portal/Content) in `OverviewView` -> written inline in
  `overview-view.ts`. The trigger is
  `<button type="button" aria-haspopup="dialog" aria-expanded data-state="closed|open" class="wa-btn wa-btn--secondary" [disabled]>Add event</button>`,
  gaining `aria-controls` while open (`.wa-btn[data-state='open']` is styled). The content is a
  CDK connected overlay positioned `side="bottom" align="end" sideOffset={6}` (bottom-end, 6px
  offset, flipping above with a -6px offset) with `collisionPadding={8}` as
  `cdkConnectedOverlayViewportMargin`, holding
  `<div id data-side="bottom|top" data-align="end" data-state="open" role="dialog" class="wa-portal" tabindex="-1">`
  and the keyed `<form waEventForm>`. The overlay origin is the trigger's `ElementRef`, or, when the
  form was opened from the chart's context menu, the `{ x, y }` point of the right-click (Radix's
  `Anchor virtualRef` with a zero-size `DOMRect`). Escape closes and returns focus to the trigger;
  a click outside closes without moving focus (Radix's `hasInteractedOutside` behaviour); Cancel
  and a successful submit close.
- Generated ids are `wa-tabs-N-trigger-<value>`/`wa-tabs-N-content-<value>`, `wa-select-N` and
  `wa-popover-N` where Radix generates `radix-:rN:`; the functional specs address elements by role
  and name, never by id. The KPI tab ids (`wa-kpi-tab-<key>`) are the demo's own and unchanged.

## DOM and class-name invariants

The functional specs and the parity harness depend on these. Do not rename, wrap or reorder them.

- `<main data-demo-id="web-analytics" style="position: fixed; inset: 0;">` wraps the demo. The
  wrapper carries exactly `data-demo-id` and that inline style (Angular adds `ng-version` when it
  bootstraps onto it): the demo's own container is fixed-position, which would leave the wrapper
  with no box, so every port sizes it to the viewport as the React generator does in `main.tsx`.
- `.wa-app` > `.wa-topbar` (`.wa-brand` with `svg.wa-brand-mark`, `.wa-tabs-list[role="tablist"]`
  with tabs named `Overview`, `Audience` and `Behavior`, `.wa-topbar-spacer`, `.wa-controls` with
  the `Date range` combobox, `.wa-notice` with the `About this demo` button) and `.wa-body` > three
  `.wa-tab-content[role="tabpanel"]` panels.
- Overview: `.wa-view` > `.wa-card.wa-card--tabbed` (`.wa-kpi-tabs[role="tablist"]` of
  `button#wa-kpi-tab-<key>[role="tab"].wa-kpi` tiles with `.wa-kpi-label`, `.wa-kpi-value`,
  `.wa-kpi-delta.wa-up|wa-down` and `.wa-kpi-spark-box` > `.wa-kpi-spark`; `.wa-card-head` with the
  `Traffic over time` title, the `Remove “label”` button while an annotation is selected and the
  `Add event` trigger; `.wa-chart-box-lg[role="tabpanel"][aria-labelledby="wa-kpi-tab-<key>"]`)
  then `.wa-card` (`.wa-card-head` with the `Sessions` title, `.wa-card-sub` summary and the
  `Clear filters` button; `.wa-grid-host`). The summary reads exactly `No days selected.` with
  nothing selected and `N sessions on 1 selected day` after a selection; the grid's no-rows
  overlay reads `Click or drag across chart above to display matching sessions.`.
- The add-event form is `form.wa-event-form` with `label.wa-field` (`.wa-field-label` text
  `Event name` and `Date`, `input.wa-input`), `fieldset.wa-fieldset` (`legend.wa-field-label`
  `Type`, `.wa-radio-row` of `label.wa-radio` radios named `wa-event-type`) and
  `.wa-event-form-actions` (`Cancel`, then the `Add event` submit, disabled until named). Its first
  input is focused when it opens.
- Audience: `.wa-view.wa-view--fill` > `.wa-grid-4` of four `.wa-card`s with `.wa-chart-box-xsm`
  then `.wa-grid-2` of two `.wa-card.wa-card--fill`s (`.wa-fill` for the map; `.wa-chart-box-xxsm`
  then `.wa-fill` for the activity charts). Behavior: `.wa-view` > `.wa-card` with
  `.wa-chart-box-lg` then two `.wa-grid-2-even` rows of `.wa-card`s with `.wa-chart-box`. The
  chart counts the specs assert (7, 7 and 5 `.ag-charts-wrapper`s outside `.ag-cell`) follow from
  this structure.
- Empty states are `div.wa-empty` with the exact React messages and hints.
- Every chart container is the direct parent of `.ag-charts-wrapper` and has
  `height: 100%; width: 100%` (plus `display: block`, see above).

Known, accepted differences from the React render, none of which move a pixel:

- Angular writes each attribute-selector marker on its host (`wawebanalyticsapp=""`,
  `watabtrigger=""`, `waeventform=""`) and keeps static input attributes on the element
  (`arialabel="Date range"`, `label="Range"`, `value="overview"` on the tab triggers and panels,
  `message=...` on the empty states); it also writes host attributes and bound attributes in its own
  order, so attribute order differs from the React render.
- The chart containers are `<ag-charts>` elements with `display: block`, where React renders
  `<div>`s. The grid host is `<ag-grid-angular>`.
- AG Grid's internal DOM differs because `ag-grid-react` renders the grid shell with React
  components while `ag-grid-angular` renders it itself (`data-ref` attributes, comment nodes, class
  order).
- Open overlays sit in the CDK overlay container (`.cdk-overlay-container` >
  `.cdk-overlay-connected-position-bounding-box` > `.cdk-overlay-pane`) rather than Radix's
  `[data-radix-popper-content-wrapper]` div, and Radix's private attributes, CSS custom properties,
  inline `<style>` for hiding the viewport scrollbar, focus guards and the `data-scroll-locked` it
  sets on `<body>` while the Select is open are omitted.
- Angular binds the form inputs' `value` as a property, so the `value=""` attribute React reflects
  on controlled inputs is absent.
- Cell icons are served as files (`media/*.svg`, `media/*.png`) where Vite inlines the SVGs as
  data URIs.
- Angular leaves `<!--container-->` comment nodes where `@if`/`@for` blocks render.

Known pixel deviation, within tolerance and unmasked: the traffic chart, the geographic map and
the activity heatmap lay out with a series area about one pixel taller than the React reference
does, because the React reference measures its chart text before the Urbanist web font that
`web-analytics.css` imports has been declared, and AG Charts does not re-measure once the font
arrives; the Angular bundle's stylesheet declares the font before the app script runs, so the port
measures with the loaded font. Preloading the font ahead of the React app's script makes the
reference match the port pixel for pixel. The difference is at most 0.14% of a viewport.

## Deterministic mode

The demo has no `deterministic.ts`: every session, breakdown and annotation is generated in
`data.ts` from a fixed seed and a fixed `DATA_END`, so it renders identically on every load. The
React demo ignores `?deterministic=1`, and so does the port; nothing reads the query string. The
parity harness still loads `/?deterministic=1#web-analytics`, which the seed serves like any URL.

## Sync procedure (Phase 4)

`/port-showcases` aligns a stale port by following this guide, and the Demo Port Alignment workflow
runs it at the release-branch cut. To align this port by hand, work through these steps:

1. Diff `src/demos/web-analytics` between the `sourceCommit` recorded in `.seed-manifest.json` and `HEAD`,
   the branch being aligned (a release branch at the cut), from the repository root:
   `git diff <sourceCommit> HEAD -- packages/ag-charts-demos/src/demos`. The whole of `src/demos`,
   since a module imported from a sibling demo counts towards this demo's source hash.
2. Re-copy every byte-for-byte module and asset in the file mapping table.
3. Apply component changes by the mapping rules above, keeping the invariants. Chart options are
   copied verbatim from the React component into the `computed`.
4. Type-check and build:
    ```sh
    NX_DAEMON=false yarn nx run ag-charts-demos-seeds:typecheck-angular
    NX_DAEMON=false yarn nx run ag-charts-demos-seeds:build-angular
    ```
5. Run the parity check (below) and the functional specs. Fix differences in the port; do not add
   masks or loosen tolerances for anything but unavoidable browser chrome.
6. Rewrite the manifest from `packages/ag-charts-demos`:
    ```sh
    node tools/seeds/stamp-port-manifest.mjs web-analytics angular
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
node e2e/parity/serve-dist.mjs --dir seeds/web-analytics/angular/dist --port 4711 &

# Functional specs: the web-analytics ones must pass. The other specs address other demos or the
# demos app itself and fail against a single seed.
DEMOS_BASE_URL=http://localhost:4711 npx playwright test -g web-analytics

# Pixel parity against the React reference, every web-analytics state at both viewports.
PARITY_TARGETS='[{"demo":"web-analytics","framework":"angular","baseURL":"http://localhost:4711"}]' \
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
