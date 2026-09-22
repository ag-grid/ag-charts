# Porting the Financial demo to Vue

The React source under `packages/ag-charts-demos/src/demos/financial` is the golden master. This
seed is a port of it; nothing here is designed independently. When the React source changes, the
change is carried across by the rules below, and the result is checked against the React app pixel
for pixel by the parity harness. This document is the instruction set for that sync, whether a
person or an agent performs it.

## Ground rules

1. Port logic, not styling. `src/financial.css` is a verbatim copy of the React file. Every class
   name and the element structure of the React output are preserved so the stylesheet applies
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

| React source (`src/demos/financial/`)                     | Vue seed (`seeds/financial/vue/src/`)                                 | Treatment                            |
| --------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------ |
| `barTransaction.ts`                                       | `barTransaction.ts`                                                   | copied unchanged                     |
| `chartTheme.ts`                                           | `chartTheme.ts`                                                       | copied unchanged                     |
| `data.ts`                                                 | `data.ts`                                                             | copied unchanged                     |
| `deterministic.ts`                                        | `deterministic.ts`                                                    | copied unchanged (see below)         |
| `financial.css`                                           | `financial.css`                                                       | copied unchanged                     |
| `format.ts`                                               | `format.ts`                                                           | copied unchanged                     |
| `types.ts`                                                | `types.ts`                                                            | copied unchanged                     |
| `windowTransaction.ts`                                    | `windowTransaction.ts`                                                | copied unchanged                     |
| `components/grid.ts`                                      | `components/grid.ts`                                                  | two import lines changed (see below) |
| `index.tsx`                                               | `Financial.vue`                                                       | ported                               |
| `FinancialApp.tsx`                                        | `FinancialApp.vue`                                                    | ported                               |
| `useStreamingMarket.ts`                                   | `useStreamingMarket.ts`                                               | ported (hook to composable)          |
| `ui.tsx` (`Button`, `Select`, `ToggleGroup`)              | `ui/Button.vue`, `ui/Select.vue`, `ui/ToggleGroup.vue`, `ui/types.ts` | ported, one file per export          |
| `components/Toolbar.tsx`                                  | `components/Toolbar.vue`                                              | ported                               |
| `components/DemoInfo.tsx`                                 | `components/DemoInfo.vue`                                             | ported                               |
| `components/TickerCell.tsx` (`TickerBadge`, `TickerCell`) | `components/TickerBadge.vue`, `components/TickerCell.vue`             | ported, one file per export          |
| `components/SparklineCell.tsx`                            | `components/SparklineCell.vue`                                        | ported                               |
| `components/TickerGrid.tsx`                               | `components/TickerGrid.vue`                                           | ported                               |
| `components/Watchlist.tsx`                                | `components/Watchlist.vue`                                            | ported                               |
| `components/Trending.tsx`                                 | `components/Trending.vue`                                             | ported                               |
| `components/MostActive.tsx`                               | `components/MostActive.vue`                                           | ported                               |
| `components/FinancialChart.tsx`                           | `components/FinancialChart.vue`                                       | ported                               |
| `components/PeerPerformanceChart.tsx`                     | `components/PeerPerformanceChart.vue`                                 | ported                               |
| `components/PeerSpreadHeatmap.tsx`                        | `components/PeerSpreadHeatmap.vue`                                    | ported                               |
| `components/ProfileGauges.tsx`                            | `components/ProfileGauges.vue`                                        | ported                               |
| React seed `src/main.tsx`                                 | `main.ts`                                                             | ported (mount)                       |

`components/grid.ts` is otherwise verbatim; the only edits are the two cell-renderer imports:

```ts
import SparklineCell from './SparklineCell.vue';
import TickerCell from './TickerCell.vue';
```

## Mapping rules

### Libraries

| React                             | Vue                  | Notes                                                            |
| --------------------------------- | -------------------- | ---------------------------------------------------------------- |
| `react`, `react-dom`              | `vue` 3.5            | `<script setup lang="ts">` throughout                            |
| `ag-charts-react`                 | `ag-charts-vue3`     | same component names: `AgCharts`, `AgFinancialCharts`, `AgGauge` |
| `ag-grid-react`                   | `ag-grid-vue3`       | `AgGridReact` becomes `AgGridVue`                                |
| `@radix-ui/react-*`               | `reka-ui`            | the maintained successor of Radix Vue; part names match Radix    |
| `@vitejs/plugin-react` (not used) | `@vitejs/plugin-vue` | plus `resolve.dedupe: ['vue']` in `vite.config.ts`               |
| `tsc`                             | `vue-tsc`            | type-checks the `.vue` files too                                 |

### Radix React to reka-ui

| Radix React                                                                            | reka-ui                                                                                                                         |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `Label.Root htmlFor`                                                                   | `Label :for`                                                                                                                    |
| `Select.Root value onValueChange`                                                      | `SelectRoot v-model`                                                                                                            |
| `Select.Trigger`, `Value`, `Icon`, `Portal`, `Content`, `Viewport`, `Item`, `ItemText` | `SelectTrigger`, `SelectValue`, `SelectIcon`, `SelectPortal`, `SelectContent`, `SelectViewport`, `SelectItem`, `SelectItemText` |
| `ToggleGroup.Root type="single" value onValueChange`                                   | `ToggleGroupRoot type="single" :model-value @update:model-value`                                                                |
| `ToggleGroup.Item`                                                                     | `ToggleGroupItem`                                                                                                               |

Two places need help to reproduce Radix's DOM, both in `ui/ToggleGroup.vue`:

- Radix renders a single-select group as `role="radiogroup"` with `role="radio"` items carrying
  `aria-checked`. reka-ui renders `role="group"` with `aria-pressed` buttons. The port passes
  `as-child` on the root and supplies its own `<div class="fin-toggle-group" role="radiogroup">`,
  and sets `role="radio"`, `:aria-checked` and `:aria-pressed="undefined"` on each item (reka-ui
  spreads attributes after its own props there, so they win). The parity harness and the e2e
  specs select the range buttons by `getByRole('radio', { name })`, so this is load-bearing.
- Radix ignores a re-press of the selected item through the demo's `next && set(next)` guard; the
  port's `onUpdate` handler does the same with the `AcceptableValue` payload reka-ui emits.

`aria-label` is declared as a prop under its DOM name (`'aria-label'`) on `Select.vue` and
`ToggleGroup.vue`, so that it lands on the trigger or group rather than falling through to the
component root.

### Hooks to composables and Vue reactivity

| React                                                      | Vue                                                                                                                                                                                                 |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useState` of a scalar                                     | `ref`                                                                                                                                                                                               |
| `useState` of an array or object handed to a chart or grid | `shallowRef` (no deep proxies around bar or row data)                                                                                                                                               |
| `useMemo` on a value                                       | `computed`                                                                                                                                                                                          |
| `useMemo` on an options object (React.memo-style identity) | plain `const` in `<script setup>`: a new options object would send the wrapper down the full options path, so options are created once and later data goes through `applyTransaction`/`updateDelta` |
| `useRef` for a mutable non-rendered value                  | a plain `let` in `<script setup>`                                                                                                                                                                   |
| `useRef` for a chart instance                              | template `ref` on the wrapper component; the instance is `.chart`                                                                                                                                   |
| `useEffect([deps])`                                        | `watch([...deps], handler)`; `{ immediate: true }` when React ran it on mount                                                                                                                       |
| `useEffect` cleanup                                        | `onCleanup` argument of the `watch` handler, or `onBeforeUnmount`                                                                                                                                   |
| `useLayoutEffect` creating a chart on mount                | `onMounted`                                                                                                                                                                                         |
| `useCallback`                                              | a plain function                                                                                                                                                                                    |
| `key={...}` remount                                        | `:key` on the component                                                                                                                                                                             |
| `React.memo` guarding an expensive rerender                | one `computed` per input value; Vue 3.4+ computed values only notify when the value changes                                                                                                         |
| props callback `onSelect(ticker)`                          | `defineEmits<{ select: [ticker: string] }>()`                                                                                                                                                       |
| controlled `value`/`onValueChange` pair                    | `defineModel`                                                                                                                                                                                       |
| generic component `TickerGrid<T>`                          | `<script setup lang="ts" generic="T extends { ticker: string }">`                                                                                                                                   |
| module-scope constants next to a component                 | a separate plain `<script lang="ts">` block in the same `.vue` file                                                                                                                                 |

`useStreamingMarket.ts` keeps its exports and their names; each React state pair becomes a ref.
The composable returns refs, so `FinancialApp.vue` destructures them and binds them in the template
without `.value`.

### AG Grid

- `AgGridReact` props are `AgGridVue` props with the same names (`:row-data`, `:get-row-id`,
  `:column-defs`, `:default-col-def`, `:row-selection`, `dom-layout`, `:row-height`,
  `:header-height`). Grid events are Vue events: `@grid-ready`, `@first-data-rendered`,
  `@row-clicked`, `@cell-key-down`.
- The API arrives through `@grid-ready` rather than a `ref` on the component.
- A `cellRenderer` is the imported `.vue` component. AG Grid hands the cell a `params` prop and
  later calls `refresh(params)` on a change; each cell renderer holds the rendered params in a
  `shallowRef`, implements `refresh` to update it and return `true`, and publishes it with
  `defineExpose`. Without the exposed `refresh` the grid would destroy and recreate the cell on
  every tick, which recreates the sparkline chart.

### AG Charts

- `<AgFinancialCharts ref options style>` and `<AgCharts ref options style>` render the same
  `div` wrapper as the React components, with the inline style passed through. The chart
  instance is `chartComponent.value?.chart`.
- Options objects are created once as plain (non-reactive) constants and streamed into with
  `applyTransaction` and `updateDelta`, exactly as the React source does with `useMemo`/refs. The
  gauges are the exception on both sides: their options are rebuilt when a value changes and
  the wrapper runs `chart.update`.

## DOM and class-name invariants

The parity harness compares screenshots, so the DOM must produce the same layout. Keep these
exactly as the React output:

- Root: `<main data-demo-id="financial">` inside `#root`, containing `.fin-container`, with the
  inline style `position: fixed; inset: 0;`. This is a seed-level invariant every port carries:
  the demo fills the viewport from its own fixed-position container, which leaves the wrapper
  with no box of its own, and the e2e specs assert the wrapper is visible (in the demos app the
  lazy-load fallback fills it while the assertion runs). The React seed generator emits the same
  style from its template.
- Every `fin-*` class name in `financial.css`, on the same element type, in the same nesting.
- `data-` attributes read by the CSS: `.fin-body[data-drawer-open]` (`"true"`/`"false"` as text),
  `.fin-ticker-badge[data-avatar]`, and the `data-state` attributes reka-ui renders on the toggle
  items (`on`/`off`) and the select trigger (`open`/`closed`).
- Text content: interpolations that sit on their own line in a template pick up whitespace from the
  markup. Inline text that React renders from an expression (`v-text` in `FinancialApp.vue`,
  `ProfileGauges.vue`, `DemoInfo.vue`) must stay `v-text`, or a trailing space changes the layout.
- Attributes the e2e specs and parity states rely on: `role="radio"` + `aria-checked` on the range
  buttons, `aria-label="Time range"` on the group, the `/Live/`/`/Pause/` button text,
  `.fin-watchlist-grid .ag-row`, `.fin-quote-symbol`, `.ag-charts-wrapper`.

Acceptable, invisible differences from reka-ui: `tabindex`, `dir`, `data-reka-collection-item`,
`aria-required` and `<!--v-if-->` comments. None affects layout; none is masked.

## Deterministic mode

`src/deterministic.ts` is the unchanged React file. Nothing else in the port reads the clock or
draws a random number, so honouring the switch is a matter of consuming the same three exports from
the same places: `startTime()` seeds the feeds in `useStreamingMarket.ts`; `randomSource(label)` is
called inside the copied `data.ts` with the labels the React source uses; `DETERMINISTIC` starts
the stream paused in `useStreamingMarket.ts`. The switch is `?deterministic=1` in the URL or
`VITE_DEMO_DETERMINISTIC=1` at build time, as in React. Do not add a second flag.

## Manifest

`.seed-manifest.json` records which React source this port was last synced to:

```json
{
    "demo": "financial",
    "framework": "vue",
    "sourceHash": "sha256-…",
    "sourceCommit": "…",
    "pinnedVersion": "14.2.0",
    "pinSource": "released",
    "dist": "dist"
}
```

`sourceHash` and `sourceCommit` are computed with the same functions the React generator uses, so a
sync agent compares this file's `sourceHash` with the current hash to know whether a sync is due.
Regenerate it after a sync, from `packages/ag-charts-demos`:

```sh
node --input-type=module -e "
import { writeFileSync } from 'node:fs';
import { hashDemoSource, readDemoSourceCommit, readPinnedChartsVersion } from './tools/seeds/seed-common.mjs';
const { pinnedVersion, pinSource } = readPinnedChartsVersion();
const manifest = { demo: 'financial', framework: 'vue', sourceHash: hashDemoSource('financial'),
  sourceCommit: readDemoSourceCommit('financial'), pinnedVersion, pinSource, dist: 'dist' };
writeFileSync('seeds/financial/vue/.seed-manifest.json', JSON.stringify(manifest, null, 4) + '\n');
"
```

`pinnedVersion` must also be what `package.json` pins for the three `ag-charts-*` dependencies.

## Checking a sync

From the repository root, one Nx command at a time:

1. `yarn nx run ag-charts-demos-seeds:typecheck-vue` and `yarn nx run ag-charts-demos-seeds:build-vue`
   (both also run as part of `yarn nx run ag-charts-demos-seeds:build`).
2. Serve the build: `npx vite preview --port 4712 --strictPort packages/ag-charts-demos/seeds/financial/vue`.
3. Pixel parity against the React reference, which the target builds and serves itself:

    ```sh
    PARITY_TARGETS='[{"demo":"financial","framework":"vue","baseURL":"http://localhost:4712"}]' \
      yarn nx test:e2e:parity ag-charts-demos
    ```

    Every state in `e2e/parity/states.ts` must pass at both viewports. Results are written to
    `packages/ag-charts-demos/e2e/parity/results/summary.json`, with diff images beside it on a
    failure. Fix the port rather than adding a mask; `e2e/parity/masks.ts` is for chrome that
    cannot be made identical, with a one-line reason per entry.

4. Self-containment: copy the seed folder somewhere outside the repository, then `npm install`,
   `npm run build` and `npm run dev` must all work with nothing from the monorepo. Nothing in the
   seed may reference a path above its own root.

## Known deviations

- `components/grid.ts`: the two cell-renderer imports point at `.vue` files (above).
- `ui.tsx` and `components/TickerCell.tsx` each export two or three components; Vue allows one
  component per file, so they are split as in the file mapping.
- `main.ts` mounts with a render function (`h('main', …, h(Financial))`) rather than a root
  component, to keep the `<main data-demo-id>` wrapper out of the demo itself as in React.
- The Vue seed declares `vue-tsc` and `@vitejs/plugin-vue` as dev dependencies and
  `reka-ui` in place of the three `@radix-ui/react-*` packages; the `ag-grid-*` and `ag-charts-*`
  dependency set is otherwise the React seed's (no `ag-grid-enterprise`: the demo registers
  `AllCommunityModule` only).
- Repository tooling: the root `package.json` carries `@vue/compiler-sfc` as a dev dependency so
  that `yarn nx format` can parse `.vue` files (the sort-imports Prettier plugin needs it, and
  `@vue/*` is not hoisted from the workspace packages). The root ESLint configuration has no
  `.vue` handling, so `yarn nx lint ag-charts-demos` covers the seed's `.ts` files but not the
  script blocks of its `.vue` files; `vue-tsc` type-checks them.
