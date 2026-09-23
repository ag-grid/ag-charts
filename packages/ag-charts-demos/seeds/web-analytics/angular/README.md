# AG Charts demo: Web Analytics (Angular)

A standalone Angular CLI project running the AG Charts "Web Analytics" demo app with
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
[`packages/ag-charts-demos/src/demos/web-analytics`](../../../src/demos/web-analytics). The demo
lives in `src/`, with `src/main.ts` bootstrapping it. The pure TypeScript modules (data, metrics,
formatting, chart theme, icon lookups, map topology, grid configuration) and the icon assets are
copied from the React demo unchanged; the components are rewritten as standalone Angular components
with signals, the Radix UI controls as components over the Angular CDK. [`PORTING.md`](../angular.PORTING.md)
records the mapping and the invariants the port keeps to, and `.seed-manifest.json` records which
revision of the demo source it was ported from.

The `ag-charts-*` dependencies use the npm `latest` tag on the development branch, so `npm install`
fetches the newest published release; on a release branch they pin that release exactly. The demo
may already use features of a release that is not out yet; if so, it catches up when that release is
published.
AG Charts Enterprise features show a watermark until a licence key is set.
