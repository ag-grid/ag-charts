# Porting the Procurement demo to Vue

The React source under `packages/ag-charts-demos/src/demos/procurement` is the golden master. This
seed is a port of it; nothing here is designed independently. When the React source changes, the
change is carried across by the rules below, and the result is checked against the React app pixel
for pixel by the parity harness. This document is the instruction set for that sync, whether a
person or an agent performs it.

## Ground rules

1. Port logic, not styling. `src/procurement.css` is a verbatim copy of the React file. Every class
   name and the element structure of the React output are preserved so the stylesheet applies
   unchanged. Never adapt the CSS to the port; make the port emit the DOM the CSS expects.
2. Reuse pure modules unchanged. A `.ts` module without a React import is copied byte for byte,
   including the JSON dataset under `src/data/` and the vendored `web-analytics/topology.ts`. Diff
   the copies against the source before anything else; a byte difference in one of them is a sync
   bug, not a design choice.
3. One-to-one files. Every React component has one Vue single-file component of the same name.
   A React file that defines several components is split into one `.vue` file per component, as
   listed in the table below; do not merge or split further. The parity failure messages and this
   document assume that mapping.
4. Same identifiers. Constants, function names, prop names, emitted event names and comments are
   kept as in the React source wherever Vue syntax allows, so a diff of the two trees reads as a
   translation rather than a rewrite.
5. Deviations are documented. Anything that cannot follow the rules goes in "Known deviations"
   below with the reason. An undocumented deviation is a bug.

## File mapping

| React source (`src/demos/procurement/`)                                                                                 | Vue seed (`seeds/procurement/vue/src/`)                                                                                  | Treatment                           |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| `chartTheme.ts`                                                                                                         | `chartTheme.ts`                                                                                                          | copied unchanged                    |
| `data.ts`                                                                                                               | `data.ts`                                                                                                                | copied unchanged                    |
| `data/**` (`source.ts`, `README.md`, nine `.json` files)                                                                | `data/**`                                                                                                                | copied unchanged                    |
| `format.ts`                                                                                                             | `format.ts`                                                                                                              | copied unchanged                    |
| `geo.ts`                                                                                                                | `geo.ts`                                                                                                                 | copied unchanged                    |
| `grid.ts`                                                                                                               | `grid.ts`                                                                                                                | copied unchanged                    |
| `procurement.css`                                                                                                       | `procurement.css`                                                                                                        | copied unchanged                    |
| `routes.ts`                                                                                                             | `routes.ts`                                                                                                              | copied unchanged                    |
| `types.ts`                                                                                                              | `types.ts`                                                                                                               | copied unchanged                    |
| `workspace.ts`                                                                                                          | `workspace.ts`                                                                                                           | copied unchanged                    |
| `../web-analytics/topology.ts` (vendored by the React seed)                                                             | `vendored/web-analytics/topology.ts`                                                                                     | copied unchanged                    |
| `index.tsx`                                                                                                             | `Procurement.vue`                                                                                                        | ported                              |
| `WorkspaceApp.tsx`                                                                                                      | `WorkspaceApp.vue`                                                                                                       | ported                              |
| `ui.tsx` (`Button`, `Select`, `ToggleGroup`, `SelectOption`)                                                            | `ui/Button.vue`, `ui/Select.vue`, `ui/SelectControl.vue`, `ui/ToggleGroup.vue`, `ui/types.ts`                            | ported, one file per export (below) |
| —                                                                                                                       | `ui/typeahead.ts`                                                                                                        | port-only (below)                   |
| `components/AttentionAlert.tsx`                                                                                         | `components/AttentionAlert.vue`                                                                                          | ported                              |
| `components/AttentionList.tsx`                                                                                          | `components/AttentionList.vue`                                                                                           | ported                              |
| `components/BudgetBurnUp.tsx`                                                                                           | `components/BudgetBurnUp.vue`                                                                                            | ported                              |
| `components/CostReliabilityScatter.tsx`                                                                                 | `components/CostReliabilityScatter.vue`                                                                                  | ported                              |
| `components/DeliveryMap.tsx`                                                                                            | `components/DeliveryMap.vue`                                                                                             | ported                              |
| `components/DeliverySlipHistograms.tsx` (`MAX_SLIP_DAYS`, `Binned`, `binned`, the component)                            | `components/DeliverySlipHistograms.vue`                                                                                  | ported                              |
| `components/EmptyState.tsx`                                                                                             | `components/EmptyState.vue`                                                                                              | ported                              |
| `components/KpiStrip.tsx` (`KpiStrip`, `KpiGaugeBar`, `KpiSegmentBar`, `KpiSegmentKeys`, `buildKpis`, `buildSpendKpis`) | `components/KpiStrip.vue`, `components/KpiGaugeBar.vue`, `components/KpiSegmentBar.vue`, `components/KpiSegmentKeys.vue` | ported, one file per component      |
| `components/OrdersView.tsx`                                                                                             | `components/OrdersView.vue`                                                                                              | ported                              |
| `components/PurchaseOrderGrid.tsx` (`PurchaseOrderGrid`, `StatusCell`, the action cell)                                 | `components/PurchaseOrderGrid.vue`, `components/StatusCell.vue`, `components/PurchaseOrderActionCell.vue`                | ported, one file per component      |
| `components/QualityCostChart.tsx`                                                                                       | `components/QualityCostChart.vue`                                                                                        | ported                              |
| `components/ShipmentSchedule.tsx`                                                                                       | `components/ShipmentSchedule.vue`                                                                                        | ported                              |
| `components/SpendSunburst.tsx`                                                                                          | `components/SpendSunburst.vue`                                                                                           | ported                              |
| `components/SpendTrendChart.tsx`                                                                                        | `components/SpendTrendChart.vue`                                                                                         | ported                              |
| `components/SpendView.tsx`                                                                                              | `components/SpendView.vue`                                                                                               | ported                              |
| `components/StatusLegend.tsx` (`STATUS_CLASS`, the component)                                                           | `components/StatusLegend.vue`                                                                                            | ported                              |
| `components/SupplierScorecard.tsx` (`SupplierScorecard`, `ContactActions`, the supplier cell)                           | `components/SupplierScorecard.vue`, `components/SupplierCell.vue`, `components/ContactActions.vue`                       | ported, one file per component      |
| `components/SupplierShareChart.tsx`                                                                                     | `components/SupplierShareChart.vue`                                                                                      | ported                              |
| `components/SupplierTrendChart.tsx` (`TrendMetric`, the component)                                                      | `components/SupplierTrendChart.vue`                                                                                      | ported                              |
| `components/SuppliersView.tsx`                                                                                          | `components/SuppliersView.vue`                                                                                           | ported                              |
| React seed `src/main.tsx`                                                                                               | `main.ts`                                                                                                                | ported (mount)                      |

A React file's non-component exports (`buildKpis`, `buildSpendKpis`, `SpendKpis`, `MAX_SLIP_DAYS`,
`binned`, `Binned`, `STATUS_CLASS`, `TrendMetric`) stay in the `.vue` file of the component they
sit beside, in a plain `<script lang="ts">` block, so imports such as
`import { buildKpis } from './components/KpiStrip.vue'` keep the React import path modulo the
extension.

`ui.tsx` splits four ways: `Button.vue` is the forwarded-ref button; `Select.vue` keeps the React
`Select` contract (`options`, `ariaLabel`, optional `label`, the controlled value as `v-model`) and
wraps `SelectControl.vue`, which holds the reka-ui Select tree, because a Vue template cannot hold
a fragment in a variable the way the React helper holds `trigger` and then either returns it bare
or wraps it in a `Label`; `ToggleGroup.vue` is the toggle group; `types.ts` is `SelectOption`.
`typeahead.ts` has no React counterpart: it is Radix's typeahead search, which `SelectControl.vue`
runs on the closed trigger (below).

## Mapping rules

### Libraries

| React                             | Vue                  | Notes                                                            |
| --------------------------------- | -------------------- | ---------------------------------------------------------------- |
| `react`, `react-dom`              | `vue` 3.5            | `<script setup lang="ts">` throughout                            |
| `ag-charts-react`                 | `ag-charts-vue3`     | same component names: `AgCharts`, `AgGauge`                      |
| `ag-grid-react`                   | `ag-grid-vue3`       | `AgGridReact` becomes `AgGridVue`                                |
| `@radix-ui/react-*`               | `reka-ui`            | the maintained successor of Radix Vue; part names match Radix    |
| `@vitejs/plugin-react` (not used) | `@vitejs/plugin-vue` | plus `resolve.dedupe: ['vue']` in `vite.config.ts`               |
| `tsc`                             | `vue-tsc`            | type-checks the `.vue` files too; see `vueCompilerOptions` below |

### Radix React to reka-ui

| Radix React                                                                            | reka-ui                                                                                                                         |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `Tabs.Root value onValueChange orientation`                                            | `TabsRoot v-model orientation`                                                                                                  |
| `Tabs.List`, `Tabs.Trigger`, `Tabs.Content`                                            | `TabsList`, `TabsTrigger`, `TabsContent`                                                                                        |
| `Label.Root`                                                                           | `Label`                                                                                                                         |
| `Select.Root value onValueChange`                                                      | `SelectRoot v-model`                                                                                                            |
| `Select.Trigger`, `Value`, `Icon`, `Portal`, `Content`, `Viewport`, `Item`, `ItemText` | `SelectTrigger`, `SelectValue`, `SelectIcon`, `SelectPortal`, `SelectContent`, `SelectViewport`, `SelectItem`, `SelectItemText` |
| `ToggleGroup.Root type="single" value onValueChange`                                   | `ToggleGroupRoot type="single" :model-value @update:model-value`                                                                |
| `ToggleGroup.Item`                                                                     | `ToggleGroupItem`                                                                                                               |

Four places need help to reproduce Radix's DOM and behaviour, two in `ui/ToggleGroup.vue` and two in
`ui/SelectControl.vue`:

- Radix renders a single-select group as `role="radiogroup"` with `role="radio"` items carrying
  `aria-checked`. reka-ui renders `role="group"` with `aria-pressed` buttons. The port passes
  `as-child` on the root and supplies its own `<div class="pc-toggle-group" role="radiogroup">`,
  and sets `role="radio"`, `:aria-checked` and `:aria-pressed="undefined"` on each item (reka-ui
  spreads attributes after its own props there, so they win). The e2e specs select the trend
  metric buttons by `getByRole('radio', { name })`, so this is load-bearing.
- Radix ignores a re-press of the selected item through the demo's `next && set(next)` guard; the
  port's `onUpdate` handler does the same with the `AcceptableValue` payload reka-ui emits.
- Radix's Select searches its options as you type on the closed trigger and moves the value to
  the match (`useTypeaheadSearch`: characters typed within a second accumulate, a repeated
  character steps through the options starting with it, and the search clears a second after the
  last character and when the listbox opens). reka-ui's trigger only focuses the match, which sits
  in a detached fragment while the listbox is closed, so the value never moves. `SelectControl.vue`
  listens to `keydown` on `SelectTrigger` and, while closed (`v-model:open`), searches the options
  with `ui/typeahead.ts`, a copy of Radix's search and `findNextItem`, and sets the value. In the
  open listbox reka-ui's own typeahead focuses the match as Radix does, so nothing is added there.
- Radix marks an option `aria-selected="true"` only while it is both the value and focused, so the
  attribute follows focus; reka-ui marks the value whether it is focused or not. `SelectControl.vue`
  renders each `SelectItem` `as-child` around its own `<div class="pc-select-item">` carrying
  `:aria-selected` from the value and a `focused` ref that the item's `focus`/`blur` events keep.
  reka-ui's `Slot` merges the supplied element's attributes over its own, so this `aria-selected`
  wins while `role`, `aria-labelledby`, `data-state`, `data-highlighted` and `tabindex` still come
  from reka-ui; the rendered element is the same `div` as before.

`aria-label` is a declared prop named `ariaLabel` on `Select.vue`, `SelectControl.vue` and
`ToggleGroup.vue`, as it is on the React `Select` and `ToggleGroup`, so that it lands on the
trigger or group rather than falling through to the component root. Parents write it as
`aria-label="…"`; Vue camelises every hyphenated attribute into the prop at runtime. `vue-tsc` by
default leaves `aria-*` attributes un-camelised (`htmlAttributes: ['aria-*']`) and would report the
attribute as unknown, so `tsconfig.json` sets `vueCompilerOptions.htmlAttributes` to `[]` to make
the type-check agree with the runtime. Declaring the prop under its DOM name (`'aria-label'`)
instead does type-check, but the runtime props object then only has `ariaLabel`, and
`$props['aria-label']` is `undefined`.

Radix `Tabs` unmounts the content of inactive tabs and reka-ui does the same, so a tab's charts
and grids are created afresh on each visit in both, and `data-state="active"` on the trigger and
content is what `procurement.css` styles.

### Hooks to composables and Vue reactivity

| React                                                           | Vue                                                                                                                        |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `useState` of a scalar                                          | `ref`                                                                                                                      |
| `useState` of a record replaced whole (`resolved`, `poActions`) | `shallowRef`, replaced whole (`x.value = { ...x.value, [k]: v }`) as React's setter is called                              |
| `useMemo` on a value                                            | `computed`                                                                                                                 |
| `useMemo` on a chart options object                             | `computed`; the wrapper runs `chart.update` when it yields a new object, exactly when React's `useEffect([options])` does  |
| `useMemo` on grid `columnDefs` or `rowClassRules`               | `computed` whose body reads every prop React's dependency list names (see below)                                           |
| `useRef` for a DOM element                                      | template `ref`; for a `Button` component the element is `ref.value?.$el`                                                   |
| `useEffect([deps])`                                             | `watch([...deps], handler)`; `{ flush: 'post' }` where React's effect reads the DOM it just rendered                       |
| `useEffect` cleanup                                             | `onCleanup` argument of the `watch` handler                                                                                |
| `useCallback`                                                   | a plain function                                                                                                           |
| `forwardRef` on `Button`                                        | a plain component; Vue exposes the root element as `$el`                                                                   |
| props callback `onSelectSupplier(id)`                           | `defineEmits<{ selectSupplier: [supplierId: string] }>()`, bound as `@select-supplier`                                     |
| controlled `value`/`onValueChange` pair                         | `defineModel`; a writable `computed` where the parent's state is a `number` (`PeriodMonths`) and the Select speaks strings |
| module-scope constants next to a component                      | a separate plain `<script lang="ts">` block in the same `.vue` file; imports live in one block or the other, never both    |

A `computed` tracks only what its body reads while it runs. A prop read inside a closure the
computed returns (a `rowClassRules` rule, a `cellRenderer` callback) is not a dependency, so the
computed would never recompute and the grid would never be told. Where React's `useMemo` lists a
dependency, read it at the top of the computed body (`const { selectedSupplierId } = props;`) and
close over the local.

### AG Grid

- `AgGridReact` props are `AgGridVue` props with the same names in kebab case (`:row-data`,
  `:column-defs`, `:default-col-def`, `:get-row-id`, `row-class`, `:row-class-rules`,
  `:row-height`, `:header-height`, `dom-layout`, `:pagination`, `:pagination-page-size`,
  `:pagination-page-size-selector`, `:theme`).
- A `cellRenderer` that is a component is the imported `.vue` component. AG Grid hands the cell a
  `params` prop and later calls `refresh(params)` on a change; each cell renderer holds the
  rendered params in a `shallowRef`, implements `refresh` to update it and return `true`, and
  publishes it with `defineExpose`. Values the React source closes over from component scope
  (`poActions`, `onAction`, `supplierColors`, `selectedSupplierId`, `onSelect`) travel in
  `cellRendererParams`, and the `columnDefs` computed is rebuilt when they change, as React rebuilds
  its `useMemo`, so the grid refreshes the cells with the new values.
- `ag-grid-vue3` mounts a cell component into a fragment and takes its first element as the cell,
  so every cell renderer has a single root element. The on-time cell, which React renders as a
  fragment (text plus an optional `<abbr>`), is a `cellRenderer` function returning the same HTML
  string instead of a component, so the cell's DOM is React's.
- A `cellRenderer` that is a plain function of `params` (the action cell's `pc-po-action-done`
  branch in React is JSX, not a function) is a component here too, `PurchaseOrderActionCell.vue`,
  with `v-if`/`v-else-if` selecting the same two roots React renders.

### AG Charts

- `<AgCharts :options :style>` and `<AgGauge :options :style>` render the same `div` wrapper as
  the React components, with the inline style passed through.
- Every chart's options are a `computed` over the component's props, as in React they are a
  `useMemo` over them: the wrapper creates the chart on mount and calls `chart.update` when the
  computed yields a new object. Nothing in the demo streams into a chart.
- Enterprise modules are registered in `Procurement.vue` (`AllEnterpriseModule`), and the
  community bundle in `main.ts`, as in `index.tsx` and the React seed's `main.tsx`.

## DOM and class-name invariants

The parity harness compares screenshots, so the DOM must produce the same layout. Keep these
exactly as the React output:

- Root: `<main data-demo-id="procurement">` inside `#root`, containing `.pc-app`, with the inline
  style `position: fixed; inset: 0;`. This is a seed-level invariant every port carries: the demo
  fills the viewport from its own fixed-position container, which leaves the wrapper with no box
  of its own, and the e2e specs assert the wrapper is visible (in the demos app the lazy-load
  fallback fills it while the assertion runs). The React seed generator emits the same style from
  its template.
- Every `pc-*` class name in `procurement.css`, on the same element type, in the same nesting.
- `data-` attributes read by the CSS: `data-state="active"` on the tab triggers and contents,
  `data-state="on"` on the selected toggle item and `data-state="open"` on the select trigger,
  all rendered by reka-ui as Radix renders them, and `data-highlighted` on the focused select item.
- The `is-selected` row class the scorecard's `rowClassRules` adds, and the `aria-pressed` state
  on `.pc-supplier-main`, which the e2e specs and the `supplier-selected` parity state read.
- Text content: a Vue template condenses the whitespace around an inline element into a single
  space, where JSX drops it. Text React renders from an expression next to markup is bound with
  `v-text` (`pc-page-range` in `WorkspaceApp.vue`, `pc-card-sub` in `SpendView.vue`,
  `pc-facet-note` in `DeliverySlipHistograms.vue`); elsewhere inline children are written with the
  `><` wrapping Prettier produces so no stray text node appears.
- Attributes the e2e specs and parity states rely on: `role="tab"` with the tab names,
  `role="radio"` + `aria-checked` on the trend metric buttons with `aria-label="Trend metric"` on
  the group, `role="combobox"` with the period selects' `aria-label`s, `aria-expanded`,
  `aria-controls` (while open) and `data-state` on their triggers, `role="option"` with
  `aria-labelledby`, `aria-selected` (the value, while focused), `data-state` and `data-highlighted`
  on their options, `role="dialog"` with `aria-label="Needs my attention"` on `.pc-alert-panel`,
  `aria-expanded`/`aria-controls` on `.pc-alert-trigger`, the `Clear selection` and `Resolve`
  button names, `.pc-attention-item`, `.pc-po-action-done`, `.pc-stamp`, `.pc-chip`,
  `.ag-center-cols-container .pc-supplier-main`, `.ag-row.is-selected`, `.ag-charts-wrapper`.

Acceptable, invisible differences from reka-ui: `tabindex`, `dir`, `data-orientation`,
`data-reka-collection-item`, `aria-required`, the `id`/`aria-controls` values reka-ui generates for
tabs, and `<!--v-if-->`/teleport comments. None affects layout; none is masked.

## Deterministic mode

The procurement demo has no `deterministic.ts`: it renders a static JSON dataset whose "today" is
`meta.now` in `src/data/dataset.json`, and nothing reads the clock or draws a random number, so the
`?deterministic=1` switch the parity harness passes has nothing to alter. Do not add a flag; the
copied `data.ts` is the whole of deterministic mode.

## Manifest

`.seed-manifest.json` records which React source this port was last synced to:

```json
{
    "demo": "procurement",
    "framework": "vue",
    "sourceHash": "sha256-…",
    "sourceCommit": "…",
    "pinnedVersion": "latest",
    "pinSource": "dist-tag",
    "dist": "dist",
    "vendored": ["web-analytics/topology.ts"]
}
```

`vendored` lists the modules copied from sibling demos under `src/vendored/<demo>/`, exactly as the
React seed's manifest lists them; the React generator decides that list, and a sync copies the same
files.

`sourceHash` and `sourceCommit` are computed with the same functions the React generator uses, so a
sync agent compares this file's `sourceHash` with the current hash to know whether a sync is due.
Regenerate it after a sync, from `packages/ag-charts-demos`:

```sh
node tools/seeds/stamp-port-manifest.mjs procurement vue
```

which rewrites `sourceHash` and `sourceCommit` and leaves every other field as it was.
The `ag-charts-*` pins in `package.json`, and `pinnedVersion` / `pinSource` here, are owned by
`pin-ports.mjs`, which re-pins every port on each version bump and at the release-branch cut; never
edit them by hand. Any other dependency pin is updated by hand to match the React demo's
`packages/ag-charts-demos/package.json` when that changed.

## Checking a sync

`/port-showcases` aligns a stale port by following this guide and runs these checks, and the Demo
Port Alignment workflow runs it at the release-branch cut. To check a hand-made sync, run them
from the repository root, one Nx command at a time:

1. `yarn nx run ag-charts-demos-seeds:typecheck-vue` and `yarn nx run ag-charts-demos-seeds:build-vue`
   (both also run as part of `yarn nx run ag-charts-demos-seeds:build`).
2. Serve the build: `node packages/ag-charts-demos/e2e/parity/serve-dist.mjs --dir packages/ag-charts-demos/seeds/procurement/vue/dist --port 4713`.
3. Pixel parity against the React reference, which the target builds and serves itself:

    ```sh
    PARITY_TARGETS='[{"demo":"procurement","framework":"vue","baseURL":"http://localhost:4713"}]' \
      yarn nx test:e2e:parity ag-charts-demos
    ```

    Every state in `e2e/parity/states.ts` must pass at both viewports. Results are written to
    `packages/ag-charts-demos/e2e/parity/results/ports/summary.json`, with diff images beside it on a
    failure. Fix the port rather than adding a mask; `e2e/parity/masks.ts` is for chrome that
    cannot be made identical, with a one-line reason per entry.

4. The functional specs against the same server:
   `DEMOS_BASE_URL=http://localhost:4713 npx playwright test -g procurement` from
   `packages/ag-charts-demos`.
5. Self-containment: copy the seed folder somewhere outside the repository, then `npm install`,
   `npm run build` and `npm run dev` must all work with nothing from the monorepo. Nothing in the
   seed may reference a path above its own root.

## Known deviations

- `ui.tsx`, `components/KpiStrip.tsx`, `components/PurchaseOrderGrid.tsx` and
  `components/SupplierScorecard.tsx` each define several components; Vue allows one component per
  file, so they are split as in the file mapping. `Select.vue` gains a `SelectControl.vue` child
  for the reason given under the table.
- `main.ts` mounts with a render function (`h('main', …, h(Procurement))`) rather than a root
  component, to keep the `<main data-demo-id>` wrapper out of the demo itself as in React.
- `Button.vue` has no forwarded ref; `AttentionAlert.vue` reaches the trigger element through the
  component's `$el` to return focus when the worklist closes.
- The scorecard's on-time cell is an HTML-string `cellRenderer` rather than a component, so that
  the cell's DOM is the React fragment (text then `<abbr>`) and not a wrapping element.
- The map's plant labels are placed by the chart library's collision-avoiding placement, which
  lays them out again when a web font arrives after the chart's first render. The React reference
  renders before `Red Hat Text` is available and the port after it, so the `Chattanooga Plant`
  label sits two pixels apart in the `my-orders` and `worklist-open` states (about 250 pixels of
  the 1% tolerance). It is a font-load ordering difference inside the chart, not a DOM or options
  difference; the options are byte-identical to React's. Not masked.
- `tsconfig.json` sets `vueCompilerOptions.htmlAttributes` to `[]` (above).
- The Vue seed declares `vue-tsc` and `@vitejs/plugin-vue` as dev dependencies and `reka-ui` in
  place of the four `@radix-ui/react-*` packages; the `ag-grid-*` and `ag-charts-*` dependency
  set is the React seed's, including `ag-grid-enterprise`, which `grid.ts` imports.
- Repository tooling: the root `package.json` carries `@vue/compiler-sfc` as a dev dependency so
  that `yarn nx format` can parse `.vue` files (the sort-imports Prettier plugin needs it, and
  `@vue/*` is not hoisted from the workspace packages). The root ESLint configuration has no
  `.vue` handling, so `yarn nx lint ag-charts-demos` covers the seed's `.ts` files but not the
  script blocks of its `.vue` files; `vue-tsc` type-checks them.
