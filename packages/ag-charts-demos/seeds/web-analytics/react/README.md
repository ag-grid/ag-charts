# AG Charts demo: Web Analytics (React)

A standalone Vite + React project running the AG Charts "Web Analytics" demo app. Use it
to see how the demo is built, or as the starting point for an application of your own.

## Run it

```sh
npm install
npm run dev
```

`npm run build` produces a production bundle in `dist/`; `npm run preview` serves it.

## About this folder

This project is generated from the React demo source in
[`packages/ag-charts-demos/src/demos/web-analytics`](../../../src/demos/web-analytics) by
`tools/seeds/generate-react-seed.mjs`. The demo source lives in `src/`, with `src/main.tsx`
mounting it once `src/fonts.ts` has loaded the demo's web fonts, so that the charts lay out in
their final font from the first frame. Do not edit the seed in place: change the demo source and
regenerate.

The `ag-charts-*` dependencies use the npm `latest` tag, so `npm install` fetches the newest
published release. This seed follows the development branch, so the demo may already use features of
a release that is not out yet; if so, it catches up when that release is published.
AG Charts Enterprise features show a watermark until a licence key is set.
