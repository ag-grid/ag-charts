# Porting the Web Analytics demo to Vue

The React source under `packages/ag-charts-demos/src/demos/web-analytics` is the golden master. This
seed is a port of it; nothing here is designed independently. When the React source changes, the
change is carried across by the rules below, and the result is checked against the React app pixel
for pixel by the parity harness. This document is the instruction set for that sync, whether a
person or an agent performs it.

## Ground rules

1. Port logic, not styling. `src/web-analytics.css` is a verbatim copy of the React file. Every
   class name and the element structure of the React output are preserved so the stylesheet applies
   unchanged. Never adapt the CSS to the port; make the port emit the DOM the CSS expects.
2. Reuse pure modules unchanged. A `.ts` module without a React import is copied byte for byte.
   Diff the copies against the source before anything else; a byte difference in one of them is a
   sync bug, not a design choice.
3. One-to-one files. Every React component has one Vue single-file component of the same name.
   Do not merge or split components; the parity failure messages and this document assume the
   mapping in the table below.
4. Same identifiers. Constants, function names, prop names, emitted event names and comments are
   kept as in the React source wherever Vue syntax allows, so a diff of the two trees reads as a
   translation rather than a rewrite.
5. Deviations are documented. Anything that cannot follow the rules goes in "Known deviations"
   below with the reason. An undocumented deviation is a bug.

## File mapping

| React source (`src/demos/web-analytics/`)  | Vue seed (`seeds/web-analytics/vue/src/`) | Treatment              |
| ------------------------------------------ | ----------------------------------------- | ---------------------- |
| `assets/**`                                | `assets/**`                               | copied unchanged       |
| `browsers.ts`                              | `browsers.ts`                             | copied unchanged       |
| `chartTheme.ts`                            | `chartTheme.ts`                           | copied unchanged       |
| `data.ts`                                  | `data.ts`                                 | copied unchanged       |
| `devices.ts`                               | `devices.ts`                              | copied unchanged       |
| `flags.ts`                                 | `flags.ts`                                | copied unchanged       |
| `format.ts`                                | `format.ts`                               | copied unchanged       |
| `metrics.ts`                               | `metrics.ts`                              | copied unchanged       |
| `topology.ts`                              | `topology.ts`                             | copied unchanged       |
| `types.ts`                                 | `types.ts`                                | copied unchanged       |
| `web-analytics.css`                        | `web-analytics.css`                       | copied unchanged       |
| `components/dateFilter.ts`                 | `components/dateFilter.ts`                | copied unchanged       |
| `components/grid.ts`                       | `components/grid.ts`                      | copied unchanged       |
| `index.tsx`                                | `WebAnalytics.vue`                        | ported                 |
| `WebAnalyticsApp.tsx`                      | `WebAnalyticsApp.vue`                     | ported                 |
| `ui.tsx` (`Select`, `SelectOption`)        | `ui/Select.vue`, `ui/types.ts`            | ported (see below)     |
| —                                          | `ui/typeahead.ts`                         | port-only (see below)  |
| `components/ActivityByDayChart.tsx`        | `components/ActivityByDayChart.vue`       | ported                 |
| `components/ActivityHeatmapChart.tsx`      | `components/ActivityHeatmapChart.vue`     | ported                 |
| `components/AudienceView.tsx`              | `components/AudienceView.vue`             | ported                 |
| `components/BehaviorView.tsx`              | `components/BehaviorView.vue`             | ported                 |
| `components/BrandMark.tsx`                 | `components/BrandMark.vue`                | ported (template only) |
| `components/BrowserBreakdownChart.tsx`     | `components/BrowserBreakdownChart.vue`    | ported                 |
| `components/ChannelBreakdownChart.tsx`     | `components/ChannelBreakdownChart.vue`    | ported                 |
| `components/DemoNotice.tsx`                | `components/DemoNotice.vue`               | ported                 |
| `components/DeviceBreakdownChart.tsx`      | `components/DeviceBreakdownChart.vue`     | ported                 |
| `components/DurationHistogramChart.tsx`    | `components/DurationHistogramChart.vue`   | ported                 |
| `components/EmptyState.tsx`                | `components/EmptyState.vue`               | ported                 |
| `components/EventForm.tsx` (`FormAnchor`)  | `components/EventForm.vue`                | ported                 |
| `components/FunnelChart.tsx`               | `components/FunnelChart.vue`              | ported                 |
| `components/GeoMap.tsx`                    | `components/GeoMap.vue`                   | ported                 |
| `components/KpiTiles.tsx` (`buildKpis`, …) | `components/KpiTiles.vue`                 | ported (see below)     |
| `components/OverviewView.tsx`              | `components/OverviewView.vue`             | ported                 |
| `components/PagePerformanceChart.tsx`      | `components/PagePerformanceChart.vue`     | ported                 |
| `components/PageTreemapChart.tsx`          | `components/PageTreemapChart.vue`         | ported                 |
| `components/PathFlowChart.tsx`             | `components/PathFlowChart.vue`            | ported                 |
| `components/SessionsGrid.tsx`              | `components/SessionsGrid.vue`             | ported (see below)     |
| `components/Sparkline.tsx` (`SparkPoint`)  | `components/Sparkline.vue`                | ported                 |
| `components/TrafficChart.tsx`              | `components/TrafficChart.vue`             | ported                 |
| `components/VisitorBreakdownChart.tsx`     | `components/VisitorBreakdownChart.vue`    | ported                 |
| React seed `src/main.tsx`                  | `main.ts`                                 | ported (mount)         |

`components/grid.ts` has no React import (it registers the AG Grid enterprise bundle and exports
the theme and the base column definition), so unlike the financial port it is copied byte for byte.

Named exports that sit beside a React component (`FormAnchor`, `SparkPoint`, `KpiDef`, `buildKpis`,
`kpiTabId`) are exported from a plain `<script lang="ts">` block of the same `.vue` file and imported
from it (`import KpiTiles, { type KpiDef, kpiTabId } from './KpiTiles.vue'`), so the file mapping
stays one to one. `vue-tsc` and Vite both resolve named exports from a `.vue` module.

## Mapping rules

### Libraries

| React                             | Vue                  | Notes                                                              |
| --------------------------------- | -------------------- | ------------------------------------------------------------------ |
| `react`, `react-dom`              | `vue` 3.5            | `<script setup lang="ts">` throughout                              |
| `ag-charts-react`                 | `ag-charts-vue3`     | same component name: `AgCharts`; sparklines have no wrapper either |
| `ag-grid-react`                   | `ag-grid-vue3`       | `AgGridReact` becomes `AgGridVue`                                  |
| `@radix-ui/react-*`               | `reka-ui`            | the maintained successor of Radix Vue; part names match Radix      |
| `@vitejs/plugin-react` (not used) | `@vitejs/plugin-vue` | plus `resolve.dedupe: ['vue']` in `vite.config.ts`                 |
| `tsc`                             | `vue-tsc`            | type-checks the `.vue` files too                                   |

### Radix React to reka-ui

| Radix React                                                                            | reka-ui                                                                                                                         |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `Label.Root`                                                                           | `Label`                                                                                                                         |
| `Select.Root value onValueChange`                                                      | `SelectRoot v-model`                                                                                                            |
| `Select.Trigger`, `Value`, `Icon`, `Portal`, `Content`, `Viewport`, `Item`, `ItemText` | `SelectTrigger`, `SelectValue`, `SelectIcon`, `SelectPortal`, `SelectContent`, `SelectViewport`, `SelectItem`, `SelectItemText` |
| `Tabs.Root value onValueChange`                                                        | `TabsRoot v-model`                                                                                                              |
| `Tabs.List`, `Tabs.Trigger value`, `Tabs.Content value`                                | `TabsList`, `TabsTrigger value`, `TabsContent value`                                                                            |
| `Popover.Root open onOpenChange`                                                       | `PopoverRoot :open @update:open`                                                                                                |
| `Popover.Anchor virtualRef`                                                            | `PopoverAnchor as-child :reference` (see below)                                                                                 |
| `Popover.Trigger`, `Portal`, `Content side align sideOffset collisionPadding`          | `PopoverTrigger`, `PopoverPortal`, `PopoverContent side align :side-offset :collision-padding`                                  |

Five places need care to reproduce Radix's DOM and behaviour:

- Radix renders nothing for an inactive `Tabs.Content`; reka-ui renders an empty
  `<div hidden role="tabpanel">` (its `Presence` is force-mounted) and unmounts the slot content, as
  Radix does. The hidden panel has no box, so the `.wa-body` layout is unchanged, and returning to
  a tab remounts its charts exactly as in React.
- `Popover.Anchor virtualRef` renders no element and moves the popover's reference point to a
  virtual rectangle. reka-ui's `PopoverAnchor` accepts the same floating-ui virtual element on its
  `reference` prop; rendered `as-child` with no child it produces no element either, so
  `<PopoverAnchor v-if="pointAnchor" as-child :reference="pointAnchor" />` is the exact equivalent.
  While it is mounted the trigger stops being the anchor, as in Radix.
- The React `Select` returns the bare trigger when `label` is omitted and wraps it in `Label.Root`
  otherwise. A Vue template cannot place the same trigger subtree in two branches without
  duplicating it, so `ui/Select.vue` requires `label`; the demo's one caller always passes
  `label="Range"`.
- Radix's Select searches its options as you type on the closed trigger and moves the value to
  the match (`useTypeaheadSearch`: characters typed within a second accumulate, a repeated
  character steps through the options starting with it, and the search clears a second after the
  last character and when the listbox opens). reka-ui's trigger only focuses the match, which sits
  in a detached fragment while the listbox is closed, so the value never moves. `Select.vue`
  listens to `keydown` on `SelectTrigger` and, while closed (`v-model:open`), searches the options
  with `ui/typeahead.ts`, a copy of Radix's search and `findNextItem`, and sets the value. In the
  open listbox reka-ui's own typeahead focuses the match as Radix does, so nothing is added there.
- Radix marks an option `aria-selected="true"` only while it is both the value and focused, so the
  attribute follows focus; reka-ui marks the value whether it is focused or not. `Select.vue`
  renders each `SelectItem` `as-child` around its own `<div class="wa-select-item">` carrying
  `:aria-selected` from the value and a `focused` ref that the item's `focus`/`blur` events keep.
  reka-ui's `Slot` merges the supplied element's attributes over its own, so this `aria-selected`
  wins while `role`, `aria-labelledby`, `data-state`, `data-highlighted` and `tabindex` still come
  from reka-ui; the rendered element is the same `div` as before.

`ariaLabel` is a prop of `ui/Select.vue`, as it is of the React `Select`, and is passed as
`ariaLabel="Date range"` (a kebab-case `aria-label` would fall through as an attribute under
`vue-tsc`); it lands on the trigger, so `getByRole('combobox', { name: 'Date range' })` resolves.

### Hooks to composables and Vue reactivity

| React                                                      | Vue                                                                                                                               |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `useState` of a scalar                                     | `ref`                                                                                                                             |
| `useState` of an array or object handed to a chart or grid | `shallowRef` (no deep proxies around annotations, selected days or row data)                                                      |
| `useMemo` on a value                                       | `computed`                                                                                                                        |
| `useMemo` on a chart options object                        | `computed`; the wrapper's `options` watcher runs `chart.update` on a new object, as the React wrapper's effect does               |
| `useRef` for a mutable non-rendered value                  | a plain `let` in `<script setup>` (`mountedDomain` in `TrafficChart.vue`)                                                         |
| `useRef` for a chart instance                              | template `ref` on the wrapper component; the instance is `.chart`                                                                 |
| `useRef` for a DOM element                                 | template `ref`                                                                                                                    |
| `useImperativeHandle` (`SessionsGridHandle`)               | `defineExpose({ clearFilters })`, called through the template `ref`                                                               |
| `useEffect([deps])` reading the chart                      | `watch([...deps], handler, { flush: 'post' })`, so the wrapper's `options` watcher has pushed the new options first, as in React  |
| `useEffect` that also ran on mount                         | the same handler called from `onMounted` (the wrapper creates the chart in its own `mounted`, which runs first)                   |
| `useLayoutEffect` creating a sparkline on mount            | `onMounted`; updates through `watch` on the props; `onBeforeUnmount` destroys                                                     |
| `useCallback`                                              | a plain function                                                                                                                  |
| `key={...}` remount                                        | `:key` on the component                                                                                                           |
| props callback `onSelect(key)`                             | `defineEmits<{ select: [key: MetricKey] }>()`; every `onX` prop becomes an `x` event                                              |
| controlled `value`/`onValueChange` pair                    | `defineModel`                                                                                                                     |
| `{cond ? <A/> : <B/>}`, `{cond && <A/>}`                   | `v-if`/`v-else`, `v-if`; a fragment becomes `<template v-if>`                                                                     |
| module-scope constants and helpers next to a component     | a separate plain `<script lang="ts">` block in the same `.vue` file                                                               |
| functional cell renderer `iconCell(iconUrl)(props)`        | `iconCell(iconUrl)` returns a `defineComponent` with a render function, holding `params` in a `shallowRef` and exposing `refresh` |

### AG Grid

- `AgGridReact` props are `AgGridVue` props with the same names (`:row-data`, `:column-defs`,
  `:default-col-def`, `:overlay-component-params`, `:row-height`, `:header-height`, `dom-layout`,
  `:pagination`, `:pagination-page-size`, `:pagination-page-size-selector`). Grid events are Vue
  events: `@grid-ready`, `@model-updated`.
- The API arrives through `@grid-ready` rather than a `ref` on the component.
- A `cellRenderer` is a Vue component. AG Grid hands the cell a `params` prop and later calls
  `refresh(params)` on a change; each cell renderer holds the rendered params in a `shallowRef`,
  implements `refresh` to update it and return `true`, and exposes it. The three icon cells come
  from one `iconCell` factory, as in React; `null` from the render function is the React `return
null`, and the `<img>` is only added to the children when there is an icon, so no comment node
  lands in the cell.

### AG Charts

- `<AgCharts ref options style>` renders the same `div` wrapper as the React component, with the
  inline style passed through. The chart instance is `chartComponent.value?.chart`.
- Options are `computed` from the props and mirror the React `useMemo` bodies verbatim; the chart
  listeners emit the events that the React callbacks called.
- The KPI sparklines use `AgCharts.__createSparkline` directly, as the React source does, since
  there is no framework wrapper for sparklines.
- `TrafficChart.vue` keeps the React selection contract: the chart's `selectionChange` is ignored
  when `source === 'api-call'`, the parent's `selectedDays` is re-asserted post-flush when it, the
  metric or the day domain changes, and a rebuilt domain prunes days it no longer holds.

## DOM and class-name invariants

The parity harness compares screenshots, so the DOM must produce the same layout. Keep these
exactly as the React output:

- Root: `<main data-demo-id="web-analytics">` inside `#root`, containing `.wa-app`, with the inline
  style `position: fixed; inset: 0;`. This is a seed-level invariant every port carries: the demo
  fills the viewport from its own fixed-position container, which leaves the wrapper with no box of
  its own, and the e2e specs assert the wrapper is visible (in the demos app the lazy-load fallback
  fills it while the assertion runs). The React seed generator emits the same style from its
  template.
- Every `wa-*` class name in `web-analytics.css`, on the same element type, in the same nesting.
- `data-` and `aria-` attributes read by the CSS and the specs: `data-state` on the tab triggers and
  the select trigger, `.wa-kpi-tabs [role="tab"]` with `aria-selected` and `id="wa-kpi-tab-<key>"`,
  the `role="tabpanel"` chart box labelled by it, `role="tooltip"` with `id="wa-demo-notice"` on the
  notice, `name="wa-event-type"` on the radio inputs.
- Text content: interpolations that sit on their own line in a template pick up whitespace from the
  markup. Inline text that React renders from an expression (`v-text` in `KpiTiles.vue`,
  `OverviewView.vue`, `DemoNotice.vue`) must stay `v-text`, or a trailing space changes the layout.
  `.wa-brand` and `.wa-radio` keep their icon and text on one line for the same reason.
- Attributes the e2e specs and parity states rely on: `getByRole('tab', { name })` for the three
  views, `getByRole('combobox', { name: 'Date range' })` with `aria-expanded`, `aria-controls`
  (while open) and `data-state`, and `getByRole('option', { name })` with `aria-labelledby`,
  `aria-selected` (the value, while focused), `data-state` and `data-highlighted` for the range,
  `getByRole('button', { name: 'Add event' })`, `getByLabel('Event name')` (the label wraps the
  input), `.wa-card-sub`, `.wa-chart-box-lg`, `.ag-center-cols-container .ag-row`,
  `.ag-overlay-no-rows-center`, `.ag-charts-wrapper`.

Acceptable, invisible differences from reka-ui: `tabindex`, `dir`, `data-orientation`,
`data-reka-collection-item`, the empty hidden tab panels and `<!--v-if-->` comments. None affects
layout; none is masked.

## Deterministic mode

The demo has no `deterministic.ts` and needs none: its data comes from a seeded pseudo-random
generator with a fixed `DATA_END` in the copied `data.ts`, nothing reads the clock and nothing
streams. `?deterministic=1` therefore changes nothing in React or here; the URL is honoured by
being ignored, as the React seed does. Do not add a flag.

## Manifest

`.seed-manifest.json` records which React source this port was last synced to:

```json
{
    "demo": "web-analytics",
    "framework": "vue",
    "sourceHash": "sha256-…",
    "sourceCommit": "…",
    "pinnedVersion": "latest",
    "pinSource": "dist-tag",
    "dist": "dist"
}
```

`sourceHash` and `sourceCommit` are computed with the same functions the React generator uses, so a
sync agent compares this file's `sourceHash` with the current hash to know whether a sync is due.
Regenerate it after a sync, from `packages/ag-charts-demos`:

```sh
node tools/seeds/stamp-port-manifest.mjs web-analytics vue
```

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
2. Serve the build:
   `node packages/ag-charts-demos/e2e/parity/serve-dist.mjs --dir packages/ag-charts-demos/seeds/web-analytics/vue/dist --port 4712`.
3. Functional specs against the port, from `packages/ag-charts-demos`:
   `DEMOS_BASE_URL=http://localhost:4712 npx playwright test -g web-analytics`.
4. Pixel parity against the React reference, which the target builds and serves itself:

    ```sh
    PARITY_TARGETS='[{"demo":"web-analytics","framework":"vue","baseURL":"http://localhost:4712"}]' \
      yarn nx test:e2e:parity ag-charts-demos
    ```

    Every state in `e2e/parity/states.ts` must pass at both viewports. Results are written to
    `packages/ag-charts-demos/e2e/parity/results/ports/summary.json`, with diff images beside it on a
    failure. Fix the port rather than adding a mask; `e2e/parity/masks.ts` is for chrome that
    cannot be made identical, with a one-line reason per entry.

5. Self-containment: copy the seed folder somewhere outside the repository, then `npm install`,
   `npm run build` and `npm run dev` must all work with nothing from the monorepo. Nothing in the
   seed may reference a path above its own root.

## Known deviations

- `ui/Select.vue` requires `label` (above); `SelectOption` moves to `ui/types.ts` because a
  `<script setup>` file cannot export a type alongside its component.
- `main.ts` mounts with a render function (`h('main', …, h(WebAnalytics))`) rather than a root
  component, to keep the `<main data-demo-id>` wrapper out of the demo itself as in React.
- The Vue seed declares `vue-tsc` and `@vitejs/plugin-vue` as dev dependencies and `reka-ui` in
  place of the four `@radix-ui/react-*` packages; the `ag-grid-*` and `ag-charts-*` dependency set
  is the React seed's (`ag-grid-enterprise` included: `components/grid.ts` registers
  `AllEnterpriseModule`), plus `ag-grid-vue3` and `ag-charts-vue3` in place of the React wrappers.
- Repository tooling: the root `package.json` carries `@vue/compiler-sfc` as a dev dependency so
  that `yarn nx format` can parse `.vue` files (the sort-imports Prettier plugin needs it, and
  `@vue/*` is not hoisted from the workspace packages). The root ESLint configuration has no
  `.vue` handling, so `yarn nx lint ag-charts-demos` covers the seed's `.ts` files but not the
  script blocks of its `.vue` files; `vue-tsc` type-checks them.
