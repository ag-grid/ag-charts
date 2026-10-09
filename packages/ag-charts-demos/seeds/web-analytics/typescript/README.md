# AG Charts demo: Web Analytics (TypeScript)

A standalone Vite + TypeScript project running the AG Charts "Web Analytics" demo app with no UI
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
[`packages/ag-charts-demos/src/demos/web-analytics`](../../../src/demos/web-analytics). The demo
lives in `src/`, with `src/main.ts` mounting it. The pure TypeScript modules (data, topology,
formatting, metrics, chart theme, icon and flag tables, grid configuration) are copied from the
React demo unchanged; the components are rewritten against the DOM, `AgCharts.create` and
`createGrid`. [`PORTING.md`](../typescript.PORTING.md) records the mapping and the invariants the port keeps
to, and `.seed-manifest.json` records which revision of the demo source it was ported from.

The `ag-charts-*` dependencies here use the npm `latest` tag, so `npm install` fetches the newest
published release; the demo may already use features of a release that is not out yet, and catches up
when that release is published. The copy in `ag-grid/ag-charts-demos` installs differently by ref:
`staging` and the release branches (`bX.Y.Z`) install the AG Charts build their docs site was made
from, as package tarballs that site serves, and the `release-X.Y.Z` tags and the default branch
`latest` install a published release from npm.
AG Charts Enterprise features show a watermark until a licence key is set.
