# AG Charts demo: Procurement (Angular)

A standalone Angular CLI project running the AG Charts "Procurement" demo app with
[`ag-charts-angular`](https://www.ag-grid.com/charts/angular/quick-start/) and
[`ag-grid-angular`](https://www.ag-grid.com/angular-data-grid/getting-started/). Use it to see how
the demo is built, or as the starting point for an application of your own.

## Run it

```sh
npm install
npm run dev
```

`npm run build` produces a production bundle in `dist/`; `npm run preview` serves a production
build with the dev server.

## About this folder

This project is a hand-written port of the React demo source in
[`packages/ag-charts-demos/src/demos/procurement`](../../../src/demos/procurement). The demo lives
in `src/`, with `src/main.ts` bootstrapping it. The pure TypeScript modules (data, formatting, chart
theme, geography, routes, the workspace model and the grid configuration) and the JSON data under
`src/data/` are copied from the React demo unchanged; the components are rewritten as standalone
Angular components with signals, the Radix UI controls as components and directives over the
Angular CDK. [`PORTING.md`](../angular.PORTING.md) records the mapping and the invariants the port keeps to,
and `.seed-manifest.json` records which revision of the demo source it was ported from.

Files under `src/vendored/` are copied from sibling demos that this one shares source with:

- `src/demos/web-analytics/topology.ts`

The `ag-charts-*` dependencies are pinned to 14.2.0, the latest release at the time this seed was
written from a pre-release build. The demo itself may already use features of the next release; if
so, this seed catches up when that release is published.
AG Charts Enterprise features show a watermark until a licence key is set.
