# AG Charts demo: Procurement (Vue)

A standalone Vite + Vue 3 project running the AG Charts "Procurement" demo app. Use it
to see how the demo is built, or as the starting point for an application of your own.

## Run it

```sh
npm install
npm run dev
```

`npm run build` produces a production bundle in `dist/`; `npm run preview` serves it.

## About this folder

This project is a port of the React demo source in
[`packages/ag-charts-demos/src/demos/procurement`](../../../src/demos/procurement), which is the
golden master. The demo lives in `src/`, with `src/main.ts` mounting it. [`PORTING.md`](../vue.PORTING.md) records how
the React source maps onto this port and how the two are checked against each other; a change to
the demo lands in the React source first and is then carried across.

The `ag-charts-*` dependencies here use the npm `latest` tag, so `npm install` fetches the newest
published release; the demo may already use features of a release that is not out yet, and catches up
when that release is published. The copy in `ag-grid/ag-charts-demos` installs differently by ref:
`staging` and the release branches (`bX.Y.Z`) install the AG Charts build their docs site was made
from, as package tarballs that site serves, and the `release-X.Y.Z` tags and the default branch
`latest` install a published release from npm.
AG Charts Enterprise features show a watermark until a licence key is set.
