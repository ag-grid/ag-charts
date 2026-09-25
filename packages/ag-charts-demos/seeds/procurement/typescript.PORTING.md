# Porting the Procurement demo to vanilla TypeScript

This seed is a hand-written port of `packages/ag-charts-demos/src/demos/procurement` (React) to
plain TypeScript on Vite, with no UI framework and no third-party UI library. It exists so the same
demo can be published as a framework-free StackBlitz seed, and so a sync agent can bring it back
into step when the React source changes. This document is that agent's instruction set: the mapping
rules, the invariants the port must keep, and how to prove parity afterwards.

## Ground rules

- The React demo is the source of truth. The port follows it; it never leads.
- Copy, do not rewrite, any module that has no React import. Rewrite only components and hooks.
- Reproduce the rendered DOM, not the React tree: the same elements, class names, roles, ARIA
  attributes and `data-state` values that React and Radix render. The parity harness compares
  screenshots, and `procurement.css` and the functional specs key off these.
- Verify every AG Charts and AG Grid option against `packages/ag-charts-types` and the React
  source. Do not introduce options the React demo does not use.
- The seed stays standalone: no `extends` or import that reaches above this folder, no workspace
  references, no dependencies beyond what `src/` imports (plus Vite and TypeScript).

## File mapping

| React source (`src/demos/procurement/`)                                                                                                                        | This seed (`src/`)                   | Rule                                                                                                                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data.ts`, `types.ts`, `chartTheme.ts`, `format.ts`, `geo.ts`, `grid.ts`, `workspace.ts`, `procurement.css`, `data/*.json`, `data/source.ts`, `data/README.md` | same names                           | Copied byte for byte. A diff here means the React source moved; re-copy. The `data/*.test.ts` files are not part of the seed.                                                                                                                                                                         |
| `routes.ts`                                                                                                                                                    | `routes.ts`                          | Copied from the React seed (`seeds/procurement/react/src/routes.ts`), whose one difference from the demo source is the import of the vendored topology below.                                                                                                                                         |
| `../web-analytics/topology.ts`                                                                                                                                 | `vendored/web-analytics/topology.ts` | Copied byte for byte, at the same path the React seed vendors it to. The demo source imports it from the sibling demo; a seed has no sibling.                                                                                                                                                         |
| `ui.tsx` (Radix wrappers) and the `RTabs.*` elements of `WorkspaceApp.tsx`                                                                                     | `ui.ts`                              | Hand-rolled `button`, `createSelect`, `createToggleGroup`, `createTabs` reproducing the Radix DOM (see below).                                                                                                                                                                                        |
| `WorkspaceApp.tsx`                                                                                                                                             | `WorkspaceApp.ts`                    | Builds the sidebar and page head once; `render()` runs after every state change, swaps the active tab's view, and applies state to it via `update()`.                                                                                                                                                 |
| `components/*.tsx`                                                                                                                                             | `components/*.ts`                    | One `create*()` factory per component, returning `{ el, mount, update, destroy }` (the `View` interface in `dom.ts`). `EmptyState`, `StatusLegend` and `AttentionList` are stateless and return a plain element.                                                                                      |
| `index.tsx`                                                                                                                                                    | `index.ts`                           | Registers `AllEnterpriseModule`, imports the CSS, exports `createProcurement(): View`.                                                                                                                                                                                                                |
| `main.tsx` (React seed)                                                                                                                                        | `main.ts`                            | Registers `AllCommunityModule`, appends `<main data-demo-id="procurement" style="position: fixed; inset: 0;">` to `#root`, then calls `mount()`. The inline style is a seed-level invariant every port carries (the React generator emits it in `main.tsx`); `index.html` carries no `<style>` block. |
| no equivalent                                                                                                                                                  | `dom.ts`, `memo.ts`, `chart.ts`      | `h()`, `svg()`, `append()` element helpers and the `View` interface; `memo()`, the `useMemo` stand-in; `chartHost()` / `gaugeHost()`, the `ag-charts-react` wrapper stand-in.                                                                                                                         |

## Mapping rules

### Components and hooks

- A component function becomes a `create<Name>(props)` factory. JSX becomes nested `h()` calls
  with the same tag, class names and attribute values, in the same order.
- `useState` becomes a `let` in the factory; every `setX` call is followed by `render()`.
- `useMemo` becomes `memo(fn)` from `memo.ts`: the memoised function re-runs only when an
  argument changes identity, so pass exactly the values the React dependency array lists.
  Callbacks the React source wraps in `useCallback(fn, [])` are stable and are left out.
- `useEffect` / `useLayoutEffect` bodies that create a chart or grid go in `mount()`, which the
  parent calls once the element is in the document (React layout-effect timing). Bodies that react
  to prop changes go in `update(props)`, guarded by the same dependency comparison as the effect's
  dependency array. Cleanup goes in `destroy()`.
- `useRef` to a DOM node becomes the element itself, held in a `const`.
- A conditional render (`{rows.length > 0 ? <Chart /> : <EmptyState />}`) becomes a slot: the
  box element stays, and `update()` creates or destroys the chart view and swaps the empty state
  in or out as the condition changes, mounting the new view if the parent is mounted.
- A list keyed by id (the KPI tiles, the histogram facets) keeps one view per key and reuses it
  across updates while the keys match, rebuilding the list when they do not.
- `Tabs.Content` unmounts its children when another tab is selected. The port destroys the
  outgoing tab's view (charts and grids included) and its page-head controls, and creates the new
  tab's fresh, so a tab's own state (the trend metric toggle) starts over as React's does.
  Selections and recorded actions live in `WorkspaceApp` and persist across tabs.

### `ag-charts-react` to `AgCharts.create` and `chart.update`

- `<AgCharts options={o} style={{ height: '100%', width: '100%' }} />` renders
  `<div style="height: 100%; width: 100%;">`. `chartHost()` in `chart.ts` creates that div, and
  its `mount(options)` calls `AgCharts.create({ ...options, container: div })`. `AgGauge` maps to
  `gaugeHost()`, which calls `AgCharts.createGauge`.
- The wrapper re-runs `chart.update({ ...options, container })` whenever the `options` prop
  changes identity, skipping the mount render. `ChartHost.update(options)` does the same, and
  skips a call when it is handed the object it already holds, so a component passes it the
  memoised options object on every `update()` and the identity check decides.
- The wrapper's layout-effect cleanup calls `chart.destroy()` on unmount; the port's `destroy()`
  does the same, so switching tabs never leaks an instance.

### `ag-grid-react` to `createGrid`

- `<div className="pc-grid-host"><AgGridReact … /></div>` renders the grid's full-height div
  inside the host. Vanilla `createGrid(el, options)` inserts that same div into `el` itself, so
  pass the `.pc-grid-host` element as `el` and do not add a div of your own.
- Grid options are the same object the React component passed as props, including `theme`,
  `defaultColDef`, `getRowId`, `rowClass`, `rowClassRules`, `rowHeight`, `headerHeight`,
  `domLayout` and the pagination options.
- Prop changes become one `api.updateGridOptions({ … })` call carrying only the props whose value
  changed identity (`rowData`, `columnDefs`, `rowClassRules`), which is what `ag-grid-react` does
  after a render. New `columnDefs` make the grid refresh every cell, so a renderer that closes over
  state (the selected supplier, the recorded PO actions) re-renders without `redrawRows`, which
  would drop the focused row's classes.
- Function cell renderers return an element built with `h()`, or an HTML string where the React
  renderer returned a fragment of text and inline elements (the on-time rate with its `<abbr>`).
  Event handlers are attached to the elements directly.

### Radix components to DOM (`ui.ts`)

Each factory renders exactly what the Radix primitive renders, minus Radix's private
`data-radix-*` bookkeeping attributes and CSS custom properties.

- `Button` -> `button(attrs, ...children)`: `<button type="button" class="pc-btn ...">`.
- `Tabs.Root` (vertical) -> `createTabs`: `<div dir="ltr" data-orientation="vertical" class="pc-app">`
  which the owner fills. `Tabs.List` is
  `<div role="tablist" aria-orientation="vertical" class="pc-tabs-list" aria-label tabindex="0" data-orientation="vertical" style="outline: none;">`
  holding `<button type="button" role="tab" aria-selected aria-controls data-state="active|inactive" id class="pc-tab-trigger" tabindex="-1" data-orientation="vertical">`
  triggers; each `Tabs.Content` is
  `<div data-state data-orientation="vertical" role="tabpanel" aria-labelledby id tabindex="0" class="pc-tab-content">`,
  `hidden` and empty while inactive. Roving focus as for the toggle group, along the vertical
  axis (Up/Down loop, Home/End and PageUp/PageDown jump; Left/Right ignored). A tab activates on a
  left-button mousedown without Control, on Space or Enter, and on focus, so arrowing through the
  list switches tabs.
- `ToggleGroup.Root` (single, `rovingFocus`, `loop`) -> `createToggleGroup`:
  `<div dir="ltr" role="radiogroup" class="pc-toggle-group" aria-label tabindex="0" style="outline: none;">`
  with `<button type="button" data-state="on|off" role="radio" aria-checked class="pc-toggle-item" tabindex="-1">`
  items. Roving focus as Radix's `RovingFocusGroup`: the group keeps `tabindex="0"`; the focused
  item takes `tabindex="0"` and the others `-1`; keyboard focus landing on the group moves to the
  item that is on; arrow keys on both axes (the React demo gives the group no orientation) move
  focus and loop; Home/End and PageUp/PageDown jump; Shift+Tab leaves the group without stopping
  on it. A click or Enter/Space selects; the selected item cannot be deselected.
- `Select` (Root/Trigger/Value/Icon/Portal/Content/Viewport/Item/ItemText) -> `createSelect`:
  the trigger is `<button type="button" role="combobox" aria-controls aria-expanded aria-autocomplete="none" dir="ltr" data-state="closed|open" class="pc-btn pc-select-trigger" aria-label>`
  holding `<span style="pointer-events: none;">label</span><span aria-hidden="true">▾</span>`,
  wrapped in `<label class="pc-labeled-select"><span>Period</span>…</label>` (no `for`: the
  React source renders none). Opening appends to `document.body` a wrapper
  `<div dir="ltr" style="position: fixed; left: 0px; top: 0px; min-width: max-content; z-index: 60; transform: translate(x, y);">`
  containing `<div role="listbox" id data-state="open" data-side="bottom|top" data-align="start" dir="ltr" class="pc-portal pc-select-content" tabindex="-1" style="box-sizing: border-box; display: flex; flex-direction: column; outline: none; pointer-events: auto;">`
  then `<div role="presentation" style="position: relative; flex: 1 1 0%; overflow: auto;">` and
  `<div role="option" aria-labelledby aria-selected data-state="checked|unchecked" tabindex="-1" class="pc-select-item"><span id>Last 12 months</span></div>`
  items, the focused one carrying `data-highlighted`. Positioned 4px below the trigger, flipping
  above when there is no room, snapped to device pixels. Opens on pointerdown or Space, Enter,
  ArrowUp, ArrowDown; arrows and Home/End move the highlight; Enter, Space or pointerup select;
  Escape or a pointerdown outside closes; focus returns to the trigger. Typing searches the
  options as Radix does: on the closed trigger the value moves to the next match, in the open
  listbox the match takes focus (repeating a character steps through its matches; the search
  resets after a second). While open, the rest of the page carries `aria-hidden="true"` (with
  Radix's `data-aria-hidden` marker) and `document.body` takes no pointer events. `destroy()`, the
  unmount, closes an open listbox without moving focus, cancels pending timers and removes the select.
- The attention worklist (`AttentionAlert`) uses no Radix primitive in the React source; its
  trigger, scrim, dialog panel and document-level focus trap are ported element for element.

## DOM and class-name invariants

The functional specs and the parity harness depend on these. Do not rename, wrap or reorder them.

- `<main data-demo-id="procurement" style="position: fixed; inset: 0;">` wraps the demo. The
  wrapper carries exactly `data-demo-id` and that inline style: the demo's own container is
  fixed-position, which would leave the wrapper with no box, so every port sizes it to the
  viewport as the React generator does in `main.tsx`.
- `.pc-app` > `.pc-sidebar` (`.pc-brand`, `.pc-tabs-list` of `.pc-tab-trigger`,
  `.pc-sidebar-spacer`, `.pc-stamp`, `.pc-account`) and `.pc-body` > `.pc-view` >
  `.pc-page-head` (`.pc-page-title`, `.pc-page-actions` holding the active tab's
  `.pc-page-controls` or `.pc-alert-trigger`) then three `.pc-tab-content` panels in tab order.
- Each view is `.pc-view-content` of `.pc-card` sections with `.pc-card-head` > `div` >
  `.pc-card-title` (+ `.pc-card-sub`), the chart in a `.pc-chart-box*` div, or a `.pc-grid-host`
  for a grid.
- Tabs are `role="tab"` named `My orders`, `My suppliers`, `My spend`; the page title `<h1>`
  repeats the active tab's label.
- The alert trigger is `.pc-alert-trigger` with `aria-haspopup="dialog"`; the open panel is
  `#pc-attention-panel.pc-alert-panel[role="dialog"]` behind `.pc-alert-scrim`, listing
  `.pc-attention-item` entries, or `.pc-attention-clear` when nothing is left.
- Grid rows are `.ag-row`; supplier rows also carry `pc-supplier` and the selected one
  `is-selected`. The supplier cell is `button.pc-supplier-main[aria-pressed]`; the PO action
  column is pinned right and renders `.pc-po-actions` buttons or `.pc-po-action-done`.
- The `Clear selection` button is disabled until a shipment is selected; a selected shipment's id
  shows in `.pc-chip`.
- `.pc-stamp` reads `Data as of <date>` from `DEMO_NOW`; nothing repaints on a timer.
- Every chart container is the direct parent of `.ag-charts-wrapper` and has
  `style="height: 100%; width: 100%;"`.

Known, accepted differences from the React render:

- AG Grid's internal DOM differs because `ag-grid-react` renders the grid shell with React
  components while `createGrid` renders it itself (`data-ref` attributes, comment nodes, class
  order). Pixel output is identical.
- Radix's private `data-radix-*` attributes and its CSS custom properties are omitted, along with
  its inline `<style>` for hiding the viewport scrollbar, the `style="animation-duration: 0s;"` it
  leaves on the initially active tab panel (no CSS animates `.pc-tab-content`), its focus guards
  and the `data-scroll-locked` it sets on `<body>` while the Select is open.
- Element ids are `pc-tabs-N-trigger-<tab>` / `pc-tabs-N-content-<tab>` and `pc-select-N-*`
  rather than Radix's generated `radix-*` ids.
- The `my-orders` and `worklist-open` states differ by about 250 pixels at either viewport, all in
  the delivery map canvas on the `Chattanooga Plant` marker label: text anti-aliasing, not
  layout, and well inside the tolerance.

## Deterministic mode

The procurement demo has no deterministic module. Its data is static JSON under `src/data/` with
a fixed `meta.now` (`DEMO_NOW`), nothing streams, and no chart animates or repaints on a timer, so
there is no random source or clock to seed. The parity harness still loads
`/?deterministic=1#procurement`; the query string is read by nothing in the port.

## Sync procedure (Phase 4)

`/port-showcases` aligns a stale port by following this guide, and the Demo Port Alignment workflow
runs it at the release-branch cut. To align this port by hand, work through these steps:

1. Diff `src/demos/procurement` between the `sourceCommit` recorded in `.seed-manifest.json` and `HEAD`,
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
    node tools/seeds/stamp-port-manifest.mjs procurement typescript
    ```
    The manifest's `vendored` field lists the cross-demo modules copied under `src/vendored/`
    (`web-analytics/topology.ts`), matching the React seed's manifest; the stamp leaves it as is.
7. Leave the `ag-charts-*` pins, and the manifest's `pinnedVersion` / `pinSource`, alone: `pin-ports.mjs`
   owns them and re-pins every port on each version bump and at the release-branch cut, so never
   edit them by hand. Any other dependency pin is updated by hand to match the React demo's
   `packages/ag-charts-demos/package.json` when that changed.

## Parity check

From `packages/ag-charts-demos`, with the demos app built (`yarn nx build ag-charts-demos`) and
this seed built:

```sh
# Serve this seed's production bundle.
(cd seeds/procurement/typescript && npx vite preview --port 4713 --strictPort) &

# Functional specs: the procurement ones must pass. The other demos' specs address other demos or
# the demos app itself and fail against a single seed.
DEMOS_BASE_URL=http://localhost:4713 npx playwright test -g procurement \
    e2e/procurement.spec.ts e2e/demo-charts.spec.ts e2e/demos.spec.ts

# Pixel parity against the React reference, every procurement state at both viewports.
PARITY_TARGETS='[{"demo":"procurement","framework":"typescript","baseURL":"http://localhost:4713"}]' \
    NX_DAEMON=false yarn nx test:e2e:parity ag-charts-demos
```

The parity harness serves the React reference itself (`vite preview` of the demos app `dist`). Its
states, viewports and tolerance live in `e2e/parity/`; masks belong in `e2e/parity/masks.ts` under
a labelled TypeScript section with a one-line reason each.

## StackBlitz self-containment

Copy this folder anywhere outside the repository, then `npm install`, `npm run build` and
`npm run dev`. All three must work with nothing but this folder's files.
