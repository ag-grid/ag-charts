# Porting the Procurement demo to Angular

This seed is a hand-written port of `packages/ag-charts-demos/src/demos/procurement` (React) to
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
  screenshots, and `procurement.css` and the functional specs key off these.
- Verify every AG Charts and AG Grid option against `packages/ag-charts-types` and the React
  source. Do not introduce options the React demo does not use.
- The seed stays standalone: no `extends` or import that reaches above this folder, no workspace
  references, no dependencies beyond what `src/` imports (plus the Angular CLI and TypeScript).
  Zone.js stays: `ag-charts-angular` and `ag-grid-angular` run chart and grid creation outside the
  zone and re-enter it for callbacks, which is the change-detection model they are built for.

## File mapping

| React source (`src/demos/procurement/`)                                                                                                                                                                            | This seed (`src/`)                                                                                 | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `chartTheme.ts`, `data.ts`, `format.ts`, `geo.ts`, `grid.ts`, `types.ts`, `workspace.ts`, `procurement.css`, `data/**` (JSON, `source.ts`, `README.md`), `components/chartSelection.ts`, `components/focusable.ts` | same names                                                                                         | Copied byte for byte (none has a React import). A diff here means the React source moved; re-copy. Test files beside the source (`data/source.test.ts`, `*.test.ts`) are not part of the seed, as in the React seed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `routes.ts`                                                                                                                                                                                                        | `routes.ts`                                                                                        | Copied from the **React seed**, not the demo source: the seed's copy imports `./vendored/web-analytics/topology` where the source imports the sibling demo. Byte for byte with the React seed's file.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `../web-analytics/topology.ts`                                                                                                                                                                                     | `vendored/web-analytics/topology.ts`                                                               | Vendored exactly as the React seed vendors it (the generator's `vendored` list), byte for byte.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `ui.tsx` (Radix wrappers)                                                                                                                                                                                          | `ui.ts`                                                                                            | `PcButton` directive, `Select` and `ToggleGroup` components (plus their `SelectItem` and `ToggleItem` item directives, and the `ToggleOption` type), the `Tabs`/`TabsList`/`TabTrigger`/`TabContent` directives standing in for the Radix Tabs that `WorkspaceApp.tsx` imports directly, and the `AfterRender` structural directive every chart mounts through (see below). `ToggleIcon` has no counterpart: its glyph is written by the `ToggleGroup` template from the option's `icon` (see the Radix rules).                                                                                                                                                                                                                                                                                     |
| `WorkspaceApp.tsx`                                                                                                                                                                                                 | `workspace-app.ts`                                                                                 | `WorkspaceApp` component; host is the React root, the Radix `Tabs.Root` rendered as `.pc-app`, with `Tabs` as a host directive holding the selected tab. It also holds the `HelpCard`'s dismissed state (see below).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `components/<Name>.tsx`                                                                                                                                                                                            | `components/<kebab-name>.ts`                                                                       | One component per file, class name unchanged (`AttentionAlert`, `BudgetBurnUp`, `CostReliabilityScatter`, `DeliveryMap`, `DeliverySlipHistograms` + `SlipFacet`, `DemoNotice`, `EmptyState`, `HelpCard`, `KpiStrip` + `KpiGaugeBar`/`KpiSegmentBar`, `OrdersView`, `PurchaseOrderGrid` + `StatusCell`/`PoActionCell`, `QualityCostChart`, `ShipmentSchedule`, `ShipmentScheduleGrid`, `SidebarActions`, `SpendBreakdownGrid` + `SpendSupplierCell`, `SpendSunburst`, `SpendTrendChart`, `SpendView`, `StatusKeys`, `SupplierScorecard` + `SupplierCell`/`ContactActions`, `SupplierShareChart`, `SupplierTrendChart`, `SuppliersView`). Module-level helpers stay beside their component (`statusSegments` and `STATUS_ORDER` in `status-keys.ts`, `buildKpis`/`buildSpendKpis` in `kpi-strip.ts`). |
| `components/AttentionList.tsx`                                                                                                                                                                                     | inlined in `components/attention-alert.ts`                                                         | The React component returns a different root element per state (`div.pc-attention-clear` or `ul.pc-attention`), which an attribute-selector component cannot do, so its two branches are the `@if`/`@else` of the panel body in `AttentionAlert`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `components/useShipmentSelection.ts`, `components/useSupplierSelection.ts`, `components/useClickAway.ts`                                                                                                           | `components/shipment-selection.ts`, `components/supplier-selection.ts`, `components/click-away.ts` | The hooks become functions called in a component's injection context (a field initialiser or the constructor): `shipmentSelection()`, `supplierSelection()` and `clickAway()`. See "Chart data selection" below.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `index.tsx`                                                                                                                                                                                                        | `index.ts`                                                                                         | Registers `AllEnterpriseModule`, exports the root `ProcurementDemo` component whose template is `<div pcWorkspaceApp>`. The CSS import moves to `angular.json` `styles`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `main.tsx` (React seed)                                                                                                                                                                                            | `main.ts`                                                                                          | Registers `AllCommunityModule`, appends `<main data-demo-id="procurement" style="position: fixed; inset: 0;">` to `#root`, then `bootstrapApplication(ProcurementDemo)` onto it (`ProcurementDemo`'s selector is `main[data-demo-id]`). The inline style is a seed-level invariant every port carries (the React generator emits it in `main.tsx`); `index.html` carries no `<style>` block.                                                                                                                                                                                                                                                                                                                                                                                                        |
| no equivalent                                                                                                                                                                                                      | `styles.css`, `angular.json`, `tsconfig*.json`                                                     | `styles.css` imports the CDK overlay positioning CSS; the rest is the Angular CLI project. `tsconfig.json` adds `resolveJsonModule` for the JSON imports in `data/source.ts`. There is no `env.d.ts` and no `define`: this demo has no deterministic module (see below).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

## Mapping rules

### Components and hooks

- A component function becomes a standalone `@Component`. Its selector is an **attribute on the
  element the React component renders as its root** (`div[pcWorkspaceApp]` with host class
  `pc-app`, `div[pcOrdersView]` with host class `pc-view-content`, `div[pcAttentionAlert]` with
  host class `pc-alert`, `div[pcKpiStrip]` with host class `pc-kpis`, `span[pcKpiGauge]`, and so
  on), so the rendered tree gains no element. Static host attributes and classes go in `host: {}`;
  the template holds the children. A host class that depends on state is bound
  (`'[class]': "recorded() ? 'pc-po-action-done' : 'pc-po-actions'"`), and a style custom property
  the React root set inline is a host style binding (`'[style.--pc-kpi-columns]'`).
- Components whose React root is the chart wrapper itself (`BudgetBurnUp`, `CostReliabilityScatter`,
  `QualityCostChart`, `ShipmentSchedule`, `SpendSunburst`, `SpendTrendChart`, `SupplierShareChart`,
  `SupplierTrendChart`) take a `div` host of their own, styled `height: 100%; width: 100%` like the
  React wrapper, with the `<ag-charts>` (or `<ag-quadrant-chart>`) element inside it. This is the one
  place the tree gains an element (see the accepted differences). `DeliveryMap`'s React root is a
  measured `div` around the wrapper, so its host is that `div` and the tree gains nothing there.
  `SpendBreakdownGrid`'s React root is the `AgGridReact` wrapper sized by `containerStyle`; its
  host is a `div` sized the same, with `<ag-grid-angular>` filling it.
- A component that renders `null` in some state cannot drop its host, so the condition and the
  state behind it move to the parent: `HelpCard` (host `section.pc-help`) emits `dismiss`, and
  `WorkspaceApp` holds `helpDismissed` and the `@if` around it. The card moves focus to the next
  focusable element before emitting, as the React card does before it unmounts.
- A sub-component the React file declares inline gets a component of its own when it carries
  per-instance state: `SlipFacet` (host `div.pc-facet`, bound `pc-facet--axis` on the last) holds
  each supplier row's two chart selections.
- Props become `input.required<T>()` signals (`input<T>()` for optional ones); callback props
  become `output<T>()`. A callback with two arguments becomes one payload object (`PoAction`
  `{ poId, kind }` for `onAction(poId, kind)`, `AttentionResolution` `{ item, action }` for
  `onResolve(item, action)`, `ShipmentSelectionChange` `{ added, removed }` for
  `onSelectionChange(added, removed)`). A callback prop named `on<X>Change` becomes an output named
  `<x>Change` (`selectedSupplierChange`, `selectionChange`, `shipmentSelectionChange`). `useState` becomes a `signal`; `useMemo` a `computed`; `useCallback`
  a method. Module-level constants (`SUPPLIER_COLORS`, `ALL_ATTENTION_ITEMS`, `TABS`) stay
  module-level.
- Selection toggles (`prev === id ? undefined : id`) are `signal.update` calls with the same
  function.
- A `useEffect` on the open worklist panel (the focus trap and the refocus after the list changes)
  becomes an `afterRenderEffect` in the constructor: the panel element exists only after render,
  and the effect re-runs when the signals it reads (`open`, `items`) change, with the same guards
  the React effect had and its cleanup returned through `onCleanup`.
- A `ref` to a DOM element becomes `viewChild<ElementRef>()`.
- A `useLayoutEffect` that acts on the DOM after a state change (the `.pc-body` scroll to the top
  on a tab change) becomes an `afterRenderEffect` reading the same signals. `DeliveryMap` measures
  its box for the initial zoom in an `afterNextRender` registered in its constructor, which runs
  before the `AfterRender` directive mounts the chart; the React map measures in a layout effect
  that re-renders the chart with the zoom straight after creating it.
- A JSX glyph (`<svg>` children) is written out in the template, attribute for attribute, with
  React's camel-cased SVG props in their DOM spelling (`stroke-width`, `stroke-linecap`).
- Inline `style` objects with bare numbers (`DemoNotice`'s tip position) carry their `px` unit,
  which React adds and Angular's `[style]` binding does not.
- Whitespace: Angular collapses runs of template whitespace to one space and drops whitespace-only
  text nodes, but does not trim a text node the way JSX does. Keep text that sits next to an
  element tight (`>{{ kpi.label }}@if (...) {<span`, `>Clear selection</button>`), or the DOM gains
  stray spaces that the flex and inline-flex layouts (`.pc-kpi-label`, `.pc-legend-item`,
  `.pc-brand`, `.pc-chips`) would render as gaps. The repository `.prettierrc` formats this seed's
  templates with `htmlWhitespaceSensitivity: "strict"` so `yarn nx format` preserves that tightness
  instead of reflowing text onto its own line.

### `ag-charts-react` to `ag-charts-angular`

- `<AgCharts options={o} style={{ height: '100%', width: '100%' }} />` becomes
  `<ag-charts *pcAfterRender style="display: block; height: 100%; width: 100%;" [options]="options()" />`;
  `AgGauge` becomes `<ag-gauge>`. The component element is the chart container (the wrapper sets
  `container` to its host), and it needs `display: block` because a custom element is inline by
  default and would have no box to size.
- `*pcAfterRender` (the `AfterRender` directive in `ui.ts`) mounts the chart after the first render
  of the page. The React wrapper creates its chart in a layout effect, after the whole tree has
  been committed; an Angular child's `ngAfterViewInit` runs as soon as its own view is checked,
  before later siblings have rendered their bound content (the `@for` of histogram facets, for
  one), so a chart created there measures a container whose height a later sibling still changes.
  A container at a fractional width then snaps differently and the canvas comes out a pixel
  narrower than the reference's. Mounting after render puts every chart in the same phase as its
  React counterpart. Do not mount a chart without it.
- The wrapper re-runs `chart.update(options)` in `ngOnChanges` whenever the `[options]` binding
  changes identity, exactly as the React wrapper does on a new `options` prop. Mirror the React
  memoisation: each chart's options are one `computed` over the same inputs the React `useMemo`
  depended on, so they change identity when React's would and not otherwise.
- Chart listeners (`selectionChange`, `click`, `seriesNodeDoubleClick`) are wrapped by the wrapper to
  re-enter the Angular zone, so an `output.emit` from one drives change detection as a React state
  update would.
- `AgQuadrantChart` becomes `<ag-quadrant-chart>`, mounted the same way.

### Chart data selection

The React charts mirror the workspace's selection into each chart's own data selection through
`useShipmentSelection` / `useSupplierSelection` and `chartSelection.ts` (copied).

- `shipmentSelection()` / `supplierSelection()` take the same options as the hooks, with the
  workspace selection and `itemsFor` as signal getters (`itemsFor` is a `computed` returning the
  lookup, as the React `useCallback` is memoised over its inputs). They return a `chart` signal,
  set from the wrapper's `(chartReady)` output (the React `chartRef`), and the
  `onChartSelectionChange` / `onChartClick` listeners the options `computed` puts in `listeners`.
- The mirroring runs in an `afterRenderEffect`, not an `effect`: the React effect runs after the
  wrapper has been handed the new options, so `waitForUpdate` waits for the update that holds the
  new data. A component `effect` runs before its view's bindings reach `<ag-charts>`, and mirrors
  ids into the old data (AG Charts warns "Skipping itemId (datum not found)", which the specs fail).
- `clickAway()` is the `useClickAway` document listener, registered in an `effect` while `active()`.
- `ShipmentScheduleGrid` keeps the grid API from `(gridReady)` and mirrors the shared selection in
  an `afterRenderEffect` over the selection and the shipments, after the grid has taken the new
  row data, as the React effect does.
- `SuppliersView` renders its drill and Back buttons as one `<button>` whose label and action follow
  the drill state: React keeps the element (and its focus) as the drill flips, which an
  `@if`/`@else` pair would not.

### `ag-grid-react` to `ag-grid-angular`

- `<AgGridReact style={{ height: '100%' }} />` becomes
  `<ag-grid-angular style="display: block; height: 100%;" ...>` with the same-named inputs
  (`[theme]`, `[rowData]`, `[columnDefs]`, `[defaultColDef]`, `[getRowId]`, `rowClass`,
  `[rowClassRules]`, `[rowHeight]`, `[headerHeight]`, `domLayout`, `[pagination]`,
  `[paginationPageSize]`, `[paginationPageSizeSelector]`).
- The React column definitions are `useMemo`s over the closure state their renderers read
  (`poActions`/`onAction`, `supplierColors`/`selectedSupplierId`/`onSelect`), so a change to that
  state hands the grid new column definitions and the cells re-render. Here `columnDefs` is a
  `computed` over the same inputs, and that state travels to the renderers as
  `cellRendererParams`, since an Angular renderer has no closure to read it from.
- Cell renderer components implement `ICellRendererAngularComp`: `agInit(params)` is the mount,
  `refresh(params)` the update. `StatusCell` is a stable component reference in React and
  re-renders in place, so its `refresh` applies the new value and returns `true`. `SupplierCell`,
  `ContactActions` and `PoActionCell` are arrows created inside the React `useMemo`, so a new
  column definition remounts them; their `refresh` returns `false` so the grid recreates them the
  same way, and a click that changes the selection leaves the same focus state behind (the
  recreated button is not focused, so no cell focus ring is painted).
- The renderer's host element is what the React renderer returned: `span[pcStatusCell]`,
  `span[pcPoActionCell]`, `button[pcSupplierCell]` with host class `pc-supplier-main`,
  `span[pcContactCell]` with host class `pc-contact-cell`. The grid creates the host from the
  element part of the selector.
- The on-time column's renderer returns a fragment in React (the formatted rate, then an `<abbr>`
  for a contracted rate), which has no single root element; it is a framework-agnostic string
  renderer (`onTimeRenderer`) returning the same markup, so the cell's DOM is identical.
- `rowClassRules` is a `computed` over the selected supplier, as the React `useMemo` is.

### Radix components to Angular CDK (`ui.ts`)

Each component renders exactly what the Radix primitive renders, minus Radix's private
`data-radix-*` bookkeeping attributes and CSS custom properties.

- `Button` -> `PcButton` directive on `button[pcBtn]`: adds `type="button"` and class `pc-btn`;
  further classes and attributes are written on the element as in React.
- `Tabs.Root` (vertical) -> `Tabs` directive, applied to `WorkspaceApp` as a host directive so the
  `.pc-app` host carries `dir="ltr" data-orientation="vertical"`; it holds the selected tab as a
  `model` and mints the `pc-tabs-N-trigger-<value>` / `pc-tabs-N-content-<value>` ids that Radix
  mints as `radix-:rN:-trigger-<value>`. `Tabs.List` -> `TabsList` on `div[pcTabsList]`: host
  `role="tablist" aria-orientation="vertical" data-orientation="vertical" tabindex style="outline: none;"`;
  roving focus is hand-written after Radix's `RovingFocusGroup`: keyboard focus landing on the
  list moves to the active trigger, Up/Down move focus and loop (Left/Right are ignored on the
  vertical list), Home/End and PageUp/PageDown jump, and Shift+Tab leaves the list without stopping
  on it.
  `Tabs.Trigger` -> `TabTrigger` on `button[pcTabTrigger]`:
  `type="button" role="tab" aria-selected aria-controls data-state="active|inactive" id tabindex data-orientation="vertical"`;
  the active trigger is the tab stop (`tabindex="0"`), the rest `-1`, and a trigger activates on
  focus, on a primary mousedown, and on Enter or Space, as Radix's automatic activation does
  (Shift+Tab out of the list, and a mousedown with Ctrl, do not activate). `Tabs.Content` ->
  `TabContent` on `div[pcTabContent]`:
  `role="tabpanel" data-state="active|inactive" data-orientation="vertical" aria-labelledby id tabindex="0"`,
  `hidden` while inactive. Radix keeps every panel in the DOM and mounts children only into the
  active one, so the app template renders all three panels and mounts each view with an
  `@if (tab() === '<value>')` inside its panel. `hidden` is toggled by an `effect`, not a host
  binding: Angular applies host bindings only after checking the `@if` views, so the charts in a
  newly selected panel would be created while it was still hidden and size themselves from a
  later, fractional measurement (React unhides the panel before any chart in it is created).
- `ToggleGroup.Root` (single, `rovingFocus`, `loop`) -> `ToggleGroup` on `div[pcToggleGroup]`:
  host `role="radiogroup" dir="ltr" class="pc-toggle-group" aria-label tabindex="0" style="outline: none;"`
  with `<button type="button" data-state="on|off" role="radio" aria-checked class="pc-toggle-item" tabindex>`
  items. Roving focus, hand-written after Radix's `RovingFocusGroup`: items are `tabindex="-1"`
  until one is focused, which then takes `0` (the group keeps `0`); keyboard focus landing on the
  group moves to the item that is on; arrow keys on both axes (the React demo gives the group no
  orientation) move focus and loop; Home/End and PageUp/PageDown jump; Shift+Tab leaves the group
  without stopping on it. A click selects; the selected item cannot be deselected (`valueChange`
  only ever emits a value). A `ToggleOption` with an `icon` (the `d` of each path of the React
  `ToggleIcon`'s children) renders `class="pc-toggle-item pc-toggle-item--icon"` with `aria-label`
  and `title` set to its label and the 16px `<svg viewBox="0 0 32 32" fill="currentColor"
aria-hidden="true" focusable="false">` in place of the text. The React `ToggleGroup`'s `label`
  wraps the group in `<div class="pc-labeled-select"><span aria-hidden="true">label</span>`; the
  component's host is the group, so a caller with a label writes that wrapper around it.
- `Select` (Root/Trigger/Value/Icon/Portal/Content/Viewport/Item/ItemText) -> `Select` on
  `label[pcSelect]`: the host is the Radix `Label.Root`, `<label class="pc-labeled-select">`
  (this demo's label carries no `for`), holding `<span>Period</span>` and the trigger
  `<button type="button" role="combobox" aria-controls aria-expanded aria-autocomplete="none" dir="ltr" data-state="closed|open" class="pc-btn pc-select-trigger" aria-label>`
  with `<span style="pointer-events: none;">label</span>` and the Radix `Select.Icon`,
  `<span aria-hidden="true" class="pc-select-icon">` around the 10px triangle `<svg>`. While
  open, a CDK connected overlay (`CdkConnectedOverlay`, positioned bottom-start with a 4px offset
  and flipping above when there is no room) holds
  `<div role="listbox" id data-state="open" data-side="bottom|top" data-align="start" dir="ltr" class="pc-portal pc-select-content" tabindex="-1" style="box-sizing: border-box; display: flex; flex-direction: column; outline: none; pointer-events: auto;">`
  then `<div role="presentation" style="position: relative; flex: 1 1 0%; overflow: auto;">` and
  `<div role="option" aria-labelledby aria-selected data-state="checked|unchecked" tabindex="-1" class="pc-select-item"><span id>Last 6 months</span></div>`
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
- The worklist panel (`AttentionAlert`) uses no Radix primitive in React: its scrim, dialog,
  focus trap and Escape handling are hand-written there and are hand-written here, with the same
  `FOCUSABLE` selector and the same Tab-wrapping rule.

## DOM and class-name invariants

The functional specs and the parity harness depend on these. Do not rename, wrap or reorder them.

- `<main data-demo-id="procurement" style="position: fixed; inset: 0;">` wraps the demo. The
  wrapper carries exactly `data-demo-id` and that inline style (Angular adds `ng-version` when it
  bootstraps onto it): the demo's own container is fixed-position, which would leave the wrapper
  with no box, so every port sizes it to the viewport as the React generator does in `main.tsx`.
- `.pc-app` > `aside.pc-sidebar` (`.pc-brand-row` with `.pc-brand` and the `.pc-notice` demo
  notice, `.pc-tabs-list` of three `.pc-tab-trigger` `role="tab"` buttons named `My orders`,
  `My suppliers`, `My spend`, `.pc-sidebar-spacer`, the dismissible `section.pc-help`,
  `ul.pc-side-actions`, `.pc-account` with `.pc-account-name` and `.pc-account-title`) and
  `.pc-body` > `.pc-view` > `.pc-page-head` (`h1.pc-page-title`, `.pc-page-actions` with either a
  `.pc-page-controls` period select, or on the orders tab a `.pc-page-controls` of the supplier and
  subcategory selects followed by the `.pc-alert`) then one `.pc-tab-content` `role="tabpanel"`
  holding the active view (`.pc-view-content`).
- The worklist: `button.pc-alert-trigger` with `aria-haspopup="dialog"`, `aria-expanded` and, while
  open, `aria-controls="pc-attention-panel"`; `.pc-alert-scrim` and
  `#pc-attention-panel.pc-alert-panel[role="dialog"][aria-modal="true"][tabindex="-1"]` with
  `.pc-alert-panel-head`, then `ul.pc-attention` of `li.pc-attention-item` (`.pc-attention-body`
  button, `.pc-attention-actions` buttons) or `.pc-attention-clear`. Escape closes and returns
  focus to the trigger; Tab wraps inside the panel.
- Chart counts per tab: the orders tab renders 3 `.ag-charts-wrapper`s (segment bar, map,
  schedule; the schedule's table view is a grid), the suppliers tab 13, the spend tab 6 (with the
  sunburst, not its grouped table, showing).
- The regions a click may land on without clearing a selection carry `data-keeps-selection`
  (the chart boxes, the grid hosts, the `.pc-alert`), as in React.
- The scorecard's rows are `.ag-row.pc-supplier`, `is-selected` on the selected supplier; the
  supplier cell is `button.pc-supplier-main[aria-pressed]`. The PO grid's action cell is
  `span.pc-po-actions` of `button.pc-link-btn` (Resolve, Reassign, Escalate) until a decision is
  recorded, then `span.pc-po-action-done`.
- The chips row (`.pc-chips`) holds one `.pc-chip` per selected shipment and the `Clear selection`
  button, disabled until a shipment is selected. The PO grid stays mounted and empty with nothing
  selected, showing its `noRows` overlay.
- Every chart container has `height: 100%; width: 100%` (plus `display: block`, see above) and is
  the direct parent of `.ag-charts-wrapper`.

Known, accepted differences from the React render, none of which move a pixel:

- Angular writes each attribute-selector marker on its host (`pcworkspaceapp=""`, `pcbtn=""`,
  `pctabtrigger=""`, `cdkoverlayorigin=""`) and keeps static input attributes on the element
  (`label="Period"`, `value="orders"`); it also writes host attributes and bound attributes in its
  own order, so attribute order differs from the React render.
- Each chart component's host `div` wraps an `<ag-charts>`, `<ag-quadrant-chart>` or `<ag-gauge>`
  element with `display: block` where React renders one `<div>`: the tree is one element deeper at
  every chart, both elements filling their box (not at `DeliveryMap`, whose React root is a `div` of
  its own). The grid host is `<ag-grid-angular>`, and `SpendBreakdownGrid` gains a sized `div` host
  around it.
- `SpendBreakdownGrid`'s group column inner renderer (`SpendSupplierCell`) has a `<span>` host on
  group rows too, where the React renderer returns the bare value.
- The tab ids are `pc-tabs-N-trigger-<value>` / `pc-tabs-N-content-<value>` rather than Radix's
  `radix-:rN:-...`; the `aria-controls` and `aria-labelledby` pairs match as Radix's do.
- AG Grid's internal DOM differs because `ag-grid-react` renders the grid shell with React
  components while `ag-grid-angular` renders it itself (`data-ref` attributes, comment nodes, class
  order).
- The open select's listbox sits in the CDK overlay container (`.cdk-overlay-container` >
  `.cdk-overlay-connected-position-bounding-box` > `.cdk-overlay-pane`) rather than Radix's
  `[data-radix-popper-content-wrapper]` div, and Radix's private attributes, CSS custom properties,
  inline `<style>` for hiding the viewport scrollbar, focus guards and the `data-scroll-locked` it
  sets on `<body>` while the Select is open are omitted.
- Angular leaves `<!--container-->` comment nodes where `@if`/`@for` blocks render.

One residual difference does move pixels, on the orders tab (`my-orders` and `worklist-open`, about
250 pixels at either viewport, well inside the tolerance): the delivery map's `Chattanooga Plant`
label sits two pixels to the right in the React render. The React app creates its charts before
the `Red Hat Text` web font has arrived, so the map measures its labels in the fallback font and
places `Chattanooga Plant` clear of its neighbours by that wider width; when the font loads the
chart re-measures and redraws the text, but keeps the placement. Angular bootstraps later, by which
time the font is loaded, so the label is placed by its true width from the start. The reference's
placement is a property of its font-loading timing, not of the demo, and cannot be reproduced
deliberately; no mask covers it.

## Deterministic mode

This demo has none. Its data is a fixed dataset current to `DEMO_NOW` (`data.ts`), with no random
source, clock or animation loop to seed, so the React seed carries no `deterministic.ts` and this
port carries no `env.d.ts` and no `angular.json` `define`. The parity harness still loads
`/?deterministic=1#procurement`; the query string is ignored, and React self-parity passes at zero
difference on every state.

## Sync procedure (Phase 4)

`/port-showcases` aligns a stale port by following this guide, and the Demo Port Alignment workflow
runs it at the release-branch cut. To align this port by hand, work through these steps:

1. Diff `src/demos/procurement` between the `sourceCommit` recorded in `.seed-manifest.json` and `HEAD`,
   the branch being aligned (a release branch at the cut), from the repository root:
   `git diff <sourceCommit> HEAD -- packages/ag-charts-demos/src/demos`. The whole of `src/demos`,
   since a module imported from a sibling demo counts towards this demo's source hash.
2. Re-copy every byte-for-byte module in the file mapping table: from the demo source for the
   modules it lists, from the regenerated React seed for `routes.ts` and `vendored/`.
3. Apply component changes by the mapping rules above, keeping the invariants.
4. Type-check and build:
    ```sh
    NX_DAEMON=false yarn nx run ag-charts-demos-seeds:typecheck-angular
    NX_DAEMON=false yarn nx run ag-charts-demos-seeds:build-angular
    ```
5. Run the parity check (below) and the functional specs. Fix differences in the port; do not add
   masks or loosen tolerances for anything but unavoidable browser chrome.
6. Rewrite the manifest from `packages/ag-charts-demos`:
    ```sh
    node tools/seeds/stamp-port-manifest.mjs procurement angular
    ```
    which rewrites `sourceHash` and `sourceCommit` and leaves every other field as it was.
    `vendored` lists the cross-demo modules copied under `src/vendored/`, exactly as the React seed's
    manifest lists them; if the React seed's list changes, change this one to match.
7. Leave the `ag-charts-*` pins, and the manifest's `pinnedVersion` / `pinSource`, alone: `pin-ports.mjs`
   owns them and re-pins every port on each version bump and at the release-branch cut, so never
   edit them by hand. Any other dependency pin, the `ag-grid-*` ones included, is updated by hand
   to match the React demo's `packages/ag-charts-demos/package.json` when that changed.

## Parity check

From `packages/ag-charts-demos`, with the demos app built (`yarn nx build ag-charts-demos`) and
this seed built:

```sh
# Serve this seed's production bundle (a dependency-free static server with SPA fallback).
node e2e/parity/serve-dist.mjs --dir seeds/procurement/angular/dist --port 4710 &

# Functional specs: the procurement ones must pass. The other specs address other demos or the
# demos app itself and fail against a single seed.
DEMOS_BASE_URL=http://localhost:4710 npx playwright test -g procurement

# Pixel parity against the React reference, every procurement state at both viewports.
PARITY_TARGETS='[{"demo":"procurement","framework":"angular","baseURL":"http://localhost:4710"}]' \
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
