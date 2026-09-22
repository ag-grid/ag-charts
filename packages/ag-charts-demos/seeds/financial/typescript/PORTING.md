# Porting the Financial demo to vanilla TypeScript

This seed is a hand-written port of `packages/ag-charts-demos/src/demos/financial` (React) to plain
TypeScript on Vite, with no UI framework and no third-party UI library. It exists so the same demo
can be published as a framework-free StackBlitz seed, and so a sync agent can bring it back into
step when the React source changes. This document is that agent's instruction set: the mapping
rules, the invariants the port must keep, and how to prove parity afterwards.

## Ground rules

- The React demo is the source of truth. The port follows it; it never leads.
- Copy, do not rewrite, any module that has no React import. Rewrite only components and hooks.
- Reproduce the rendered DOM, not the React tree: the same elements, class names, roles, ARIA
  attributes and `data-state` values that React and Radix render. The parity harness compares
  screenshots, and `financial.css` and the functional specs key off these.
- Verify every AG Charts and AG Grid option against `packages/ag-charts-types` and the React
  source. Do not introduce options the React demo does not use.
- The seed stays standalone: no `extends` or import that reaches above this folder, no workspace
  references, no dependencies beyond what `src/` imports (plus Vite and TypeScript).

## File mapping

| React source (`src/demos/financial/`)                                                                                                 | This seed (`src/`)   | Rule                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data.ts`, `deterministic.ts`, `format.ts`, `types.ts`, `chartTheme.ts`, `barTransaction.ts`, `windowTransaction.ts`, `financial.css` | same names           | Copied byte for byte. A diff here means the React source moved; re-copy.                                                                                                                                                                                                                            |
| `components/grid.ts`                                                                                                                  | `components/grid.ts` | Copied byte for byte. Its `./SparklineCell` and `./TickerCell` imports resolve to this seed's classes, which keep the same export names.                                                                                                                                                            |
| `components/ui.tsx` (Radix wrappers)                                                                                                  | `ui.ts`              | Hand-rolled `button`, `createSelect`, `createToggleGroup` reproducing the Radix DOM (see below).                                                                                                                                                                                                    |
| `useStreamingMarket.ts` (hook)                                                                                                        | `streamingMarket.ts` | A store: `getState()`, `subscribe()`, and one setter per hook callback. Same feeds, tick loop and animation-frame flush.                                                                                                                                                                            |
| `FinancialApp.tsx`                                                                                                                    | `FinancialApp.ts`    | Builds the DOM tree once; `render()` runs on every store notification and applies state to children via their `update()`.                                                                                                                                                                           |
| `components/*.tsx`                                                                                                                    | `components/*.ts`    | One `create*()` factory per component, returning `{ el, mount, update, destroy }` (the `View` interface in `dom.ts`).                                                                                                                                                                               |
| `index.tsx`                                                                                                                           | `index.ts`           | Registers `AllEnterpriseModule`, imports the CSS, exports `createFinancial(): View`.                                                                                                                                                                                                                |
| `main.tsx` (React seed)                                                                                                               | `main.ts`            | Registers `AllCommunityModule`, appends `<main data-demo-id="financial" style="position: fixed; inset: 0;">` to `#root`, then calls `mount()`. The inline style is a seed-level invariant every port carries (the React generator emits it in `main.tsx`); `index.html` carries no `<style>` block. |
| no equivalent                                                                                                                         | `dom.ts`             | `h()`, `svg()`, `append()` element helpers and the `View` interface.                                                                                                                                                                                                                                |

## Mapping rules

### Components and hooks

- A component function becomes a `create<Name>(props)` factory. JSX becomes nested `h()` calls
  with the same tag, class names and attribute values, in the same order.
- `useState` becomes a `let` in the factory; every `setX` call is followed by `render()`.
- `useMemo` becomes a plain variable recomputed in `update()` when its dependency changes, with
  the dependency compared by the same identity or value React would use.
- `useEffect` / `useLayoutEffect` bodies that create a chart or grid go in `mount()`, which the
  parent calls once the element is in the document (React layout-effect timing). Bodies that react
  to prop changes go in `update(props)`, guarded by the same dependency comparison as the effect's
  dependency array. Cleanup goes in `destroy()`.
- `useRef` to a DOM node becomes the element itself, held in a `const`.
- A React `key` that forces a remount (the two peer charts keyed on the ticker) becomes: on ticker
  change, `destroy()` the old view, create a new one, `replaceWith` its element, and `mount()` it
  if the parent is mounted.
- A custom hook becomes a store object. State changes call every subscriber; the app's single
  subscriber is `render()`.

### `ag-charts-react` to `AgCharts.create` and `chart.update`

- `<AgCharts options={o} style={{ height: '100%', width: '100%' }} />` renders
  `<div style="height: 100%; width: 100%;">`. Create that div with `h()`, and in `mount()` call
  `AgCharts.create({ ...options, container: div })`. `AgFinancialCharts` maps to
  `AgCharts.createFinancialChart`, `AgGauge` to `AgCharts.createGauge`.
- The wrapper re-runs `chart.update({ ...options, container })` whenever the `options` prop
  changes identity, skipping the mount render. Mirror this: pass `container` in every `update()`
  call, and only call it when the React component's memoised options would have changed.
- Imperative calls made through a `ref` (`applyTransaction`, `updateDelta`, `setState`,
  `getState`) are made on the instance directly, with identical arguments and ordering.
- The wrapper's layout-effect cleanup calls `chart.destroy()` on unmount; the port's `destroy()`
  does the same, so a remount (the keyed peer charts) never leaks an instance.

### `ag-grid-react` to `createGrid`

- `<AgGridReact style={{ height: '100%' }} />` renders `<div style="height: 100%">` and themes it.
  Vanilla `createGrid(el, options)` inserts that same full-height div into `el` itself, so pass the
  class-named wrapper (`.fin-watchlist-grid` and friends) as `el` and do not add a div of your own.
- Grid options are the same object the React component passed as props. Event handler props
  (`onRowClicked`, `onCellKeyDown`, `onFirstDataRendered`) are the same-named grid options.
- `ref.current.api` becomes the `GridApi` returned by `createGrid`.
- Cell renderer components implement `ICellRendererComp`: `init(params)` builds the DOM,
  `getGui()` returns it, `refresh(params)` applies new params and returns `true`, `destroy()`
  cleans up. Work the React renderer did in a layout effect after attach (creating a sparkline)
  runs in a `queueMicrotask` scheduled from `init`, because the grid attaches the GUI
  synchronously after `init` returns.

### Radix components to DOM (`ui.ts`)

Each factory renders exactly what the Radix primitive renders, minus Radix's private
`data-radix-*` bookkeeping attributes and CSS custom properties.

- `Button` -> `button(attrs, ...children)`: `<button type="button" class="fin-btn ...">`.
- `ToggleGroup.Root` (single, `rovingFocus`, `loop`) -> `createToggleGroup`:
  `<div dir="ltr" role="radiogroup" class="fin-toggle-group" aria-label tabindex="0" style="outline: none;">`
  with `<button type="button" data-state="on|off" role="radio" aria-checked class="fin-toggle-item" tabindex="-1">`
  items. Roving focus: the group has `tabindex="0"` until an item is focused, then the focused
  item takes `tabindex="0"` and the group `-1`; arrow keys move focus and loop; Home/End jump. A
  click or Enter/Space selects; the selected item cannot be deselected.
- `Select` (Root/Trigger/Value/Icon/Portal/Content/Viewport/Item/ItemText) -> `createSelect`:
  the trigger is `<button type="button" role="combobox" aria-controls aria-expanded aria-autocomplete="none" dir="ltr" data-state="closed|open" class="fin-btn fin-select-trigger" aria-label>`
  holding `<span style="pointer-events: none;">label</span><span aria-hidden="true">▾</span>`,
  wrapped in `<label for class="fin-labeled-select"><span>Speed</span>…</label>`. Opening appends
  to `document.body` a wrapper `<div dir="ltr" style="position: fixed; left: 0px; top: 0px; min-width: max-content; z-index: 60; transform: translate(x, y);">`
  containing `<div role="listbox" id data-state="open" dir="ltr" class="fin-portal fin-select-content" tabindex="-1" style="box-sizing: border-box; display: flex; flex-direction: column; outline: none;">`
  then `<div role="presentation" style="position: relative; flex: 1 1 0%; overflow: auto;">` and
  `<div role="option" aria-labelledby aria-selected data-state="checked|unchecked" tabindex="-1" class="fin-select-item"><span id>1×</span></div>`
  items, the focused one carrying `data-highlighted`. Positioned 4px below the trigger, flipping
  above when there is no room, snapped to device pixels. Opens on pointerdown or Space, Enter,
  ArrowUp, ArrowDown; arrows and Home/End move the highlight; Enter, Space or pointerup select;
  Escape or a pointerdown outside closes; focus returns to the trigger. Radix's typeahead is not
  reproduced (no functional spec or parity state exercises it).
- `Label` -> a plain `<label for>` with the same class.

## DOM and class-name invariants

The functional specs and the parity harness depend on these. Do not rename, wrap or reorder them.

- `<main data-demo-id="financial" style="position: fixed; inset: 0;">` wraps the demo. The
  wrapper carries exactly `data-demo-id` and that inline style: the demo's own container is
  fixed-position, which would leave the wrapper with no box, so every port sizes it to the
  viewport as the React generator does in `main.tsx`.
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
  `style="height: 100%; width: 100%;"`.
- Attribute order follows the React render (`type`, `class`, then the rest on buttons;
  `class`, `data-avatar`, `aria-hidden` on ticker badges).

Known, accepted differences from the React render:

- AG Grid's internal DOM differs because `ag-grid-react` renders the grid shell with React
  components while `createGrid` renders it itself (`data-ref` attributes, comment nodes, class
  order). Pixel output is identical.
- Radix's private `data-radix-*` attributes, `data-side`/`data-align` and its CSS custom
  properties are omitted, along with its inline `<style>` for hiding the viewport scrollbar.

## Deterministic mode

`?deterministic=1` on the URL switches `deterministic.ts` (copied unchanged) to a seeded
random source and a fixed start time, and the store starts paused. Nothing in the port reads the
query string directly; everything goes through `DETERMINISTIC`, `startTime()` and
`randomSource(label)` with the same labels as the React demo (`bars:<ticker>`, `peers`,
`movers:<tickers>`). The parity harness loads `/?deterministic=1#financial`.

## Sync procedure (Phase 4)

1. Diff `src/demos/financial` at `sourceCommit` in `.seed-manifest.json` against `latest`.
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
    node --input-type=module -e "
    import { writeFileSync } from 'node:fs';
    import { hashDemoSource, readDemoSourceCommit, readPinnedChartsVersion } from './tools/seeds/seed-common.mjs';
    const pin = readPinnedChartsVersion();
    writeFileSync('seeds/financial/typescript/.seed-manifest.json', JSON.stringify({
        demo: 'financial', framework: 'typescript',
        sourceHash: hashDemoSource('financial'), sourceCommit: readDemoSourceCommit('financial'),
        pinnedVersion: pin.pinnedVersion, pinSource: pin.pinSource, dist: 'dist',
    }, null, 4) + '\n');
    "
    ```
7. If the pinned `ag-charts-*` version changed, update `package.json` to match.

## Parity check

From `packages/ag-charts-demos`, with the demos app built (`yarn nx build ag-charts-demos`) and
this seed built:

```sh
# Serve this seed's production bundle.
(cd seeds/financial/typescript && npx vite preview --port 4713 --strictPort) &

# Functional specs: the financial ones must pass. demos.spec.ts, procurement.spec.ts and
# web-analytics.spec.ts address other demos or the demos app itself and fail against a single seed.
DEMOS_BASE_URL=http://localhost:4713 npx playwright test demo-charts.spec.ts

# Pixel parity against the React reference, every financial state at both viewports.
PARITY_TARGETS='[{"demo":"financial","framework":"typescript","baseURL":"http://localhost:4713"}]' \
    NX_DAEMON=false yarn nx test:e2e:parity ag-charts-demos
```

The parity harness serves the React reference itself (`vite preview` of the demos app `dist`). Its
states, viewports and tolerance live in `e2e/parity/`; masks belong in `e2e/parity/masks.ts` under
a labelled TypeScript section with a one-line reason each.

## StackBlitz self-containment

Copy this folder anywhere outside the repository, then `npm install`, `npm run build` and
`npm run dev`. All three must work with nothing but this folder's files.
