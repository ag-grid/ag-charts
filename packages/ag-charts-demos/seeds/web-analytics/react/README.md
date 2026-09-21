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
mounting it. Do not edit the seed in place: change the demo source and regenerate.

The `ag-charts-*` dependencies are pinned to the exact version the demo was generated against.
AG Charts Enterprise features show a watermark until a licence key is set.
