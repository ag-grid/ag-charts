# AG Charts demo: Procurement (TypeScript)

A standalone Vite + TypeScript project running the AG Charts "Procurement" demo app with no UI
framework. Use it to see how the demo is built, or as the starting point for an application of
your own.

## Run it

```sh
npm install
npm run dev
```

`npm run build` produces a production bundle in `dist/`; `npm run preview` serves it.

## About this folder

This project is a hand-written port of the React demo source in
[`packages/ag-charts-demos/src/demos/procurement`](../../../src/demos/procurement). The demo lives
in `src/`, with `src/main.ts` mounting it. The pure TypeScript modules (data, formatting, chart
theme, geography, routes, workspace model, grid configuration) are copied from the React demo
unchanged; the components are rewritten against the DOM, `AgCharts.create` and `createGrid`.
[`PORTING.md`](../typescript.PORTING.md) records the mapping and the invariants the port keeps to, and
`.seed-manifest.json` records which revision of the demo source it was ported from.

Files under `src/vendored/` are copied from sibling demos that this one shares source with:

- `src/demos/web-analytics/topology.ts`

The `ag-charts-*` dependencies are pinned to something public npm resolves: the exact release on a
release tag and the npm `latest` tag otherwise, so `npm install` fetches the newest published
release. What the copy in `ag-grid/ag-charts-demos` installs depends on its ref: `staging` and the
release branches (`bX.Y.Z`) install the AG Charts build their docs site was made from, through
package tarballs that site serves; the `release-X.Y.Z` tags install that release, and `latest` the
newest one, from npm. The demo may already use features of a release that is not out yet; where a
seed installs `latest`, it catches up when that release is published.
AG Charts Enterprise and AG Grid Enterprise features show a watermark until a licence key is set.
