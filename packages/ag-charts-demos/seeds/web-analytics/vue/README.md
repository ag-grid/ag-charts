# AG Charts demo: Web Analytics (Vue)

A standalone Vite + Vue 3 project running the AG Charts "Web Analytics" demo app. Use it
to see how the demo is built, or as the starting point for an application of your own.

## Run it

```sh
npm install
npm run dev
```

`npm run build` produces a production bundle in `dist/`; `npm run preview` serves it.

## About this folder

This project is a port of the React demo source in
[`packages/ag-charts-demos/src/demos/web-analytics`](../../../src/demos/web-analytics), which is the
golden master. The demo lives in `src/`, with `src/main.ts` mounting it. [`PORTING.md`](../vue.PORTING.md) records how
the React source maps onto this port and how the two are checked against each other; a change to
the demo lands in the React source first and is then carried across.

The `ag-charts-*` dependencies are pinned to something public npm resolves: the exact release on a
release tag and the npm `latest` tag otherwise, so `npm install` fetches the newest published
release. What the copy in `ag-grid/ag-charts-demos` installs depends on its ref: `staging` and the
release branches (`bX.Y.Z`) install the AG Charts build their docs site was made from, through
package tarballs that site serves; the `release-X.Y.Z` tags install that release, and `latest` the
newest one, from npm. The demo may already use features of a release that is not out yet; where a
seed installs `latest`, it catches up when that release is published.
AG Charts Enterprise features show a watermark until a licence key is set.
