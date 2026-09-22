# AG Charts demo: Financial (Vue)

A standalone Vite + Vue 3 project running the AG Charts "Financial" demo app. Use it
to see how the demo is built, or as the starting point for an application of your own.

## Run it

```sh
npm install
npm run dev
```

`npm run build` produces a production bundle in `dist/`; `npm run preview` serves it.

## About this folder

This project is a port of the React demo source in
[`packages/ag-charts-demos/src/demos/financial`](../../../src/demos/financial), which is the
golden master. The demo lives in `src/`, with `src/main.ts` mounting it. [`PORTING.md`](../vue.PORTING.md) records how
the React source maps onto this port and how the two are checked against each other; a change to
the demo lands in the React source first and is then carried across.

The `ag-charts-*` dependencies are pinned to 14.2.0, the latest release at the time this seed was
synced from a pre-release build. The demo itself may already use features of the next release; if
so, this seed catches up when that release is published.
AG Charts Enterprise features show a watermark until a licence key is set.
