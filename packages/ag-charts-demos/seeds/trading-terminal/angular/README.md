# AG Charts demo: Trading Terminal (Angular)

A standalone Angular CLI project running the AG Charts "Trading Terminal" demo app with
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
[`packages/ag-charts-demos/src/demos/trading-terminal`](../../../src/demos/trading-terminal). The demo lives in
`src/`, with `src/main.ts` bootstrapping it. The pure TypeScript modules (data, formatting, chart
theme, transactions, grid configuration) are copied from the React demo unchanged; the components
are rewritten as standalone Angular components with signals, the Radix UI controls as components
over the Angular CDK. [`PORTING.md`](../angular.PORTING.md) records the mapping and the invariants the port
keeps to, and `.seed-manifest.json` records which revision of the demo source it was ported from.

The `ag-charts-*` dependencies are pinned to something public npm resolves: the exact release on a
release tag and the npm `latest` tag otherwise, so `npm install` fetches the newest published
release. What the copy in `ag-grid/ag-charts-demos` installs depends on its ref: `staging` and the
release branches (`bX.Y.Z`) install the AG Charts build their docs site was made from, through
package tarballs that site serves; the `release-X.Y.Z` tags install that release, and `latest` the
newest one, from npm. The demo may already use features of a release that is not out yet; where a
seed installs `latest`, it catches up when that release is published.
AG Charts Enterprise features show a watermark until a licence key is set.
