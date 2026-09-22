# AG Charts demo: Financial (TypeScript)

A standalone Vite + TypeScript project running the AG Charts "Financial" demo app with no UI
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
[`packages/ag-charts-demos/src/demos/financial`](../../../src/demos/financial). The demo lives in
`src/`, with `src/main.ts` mounting it. The pure TypeScript modules (data, formatting, chart theme,
transactions, grid configuration) are copied from the React demo unchanged; the components are
rewritten against the DOM, `AgCharts.create` and `createGrid`. [`PORTING.md`](../typescript.PORTING.md) records
the mapping and the invariants the port keeps to, and `.seed-manifest.json` records which revision
of the demo source it was ported from.

The `ag-charts-*` dependencies are pinned to 14.2.0, the latest release at the time this seed was
written from a pre-release build. The demo itself may already use features of the next release; if
so, this seed catches up when that release is published.
AG Charts Enterprise features show a watermark until a licence key is set.
