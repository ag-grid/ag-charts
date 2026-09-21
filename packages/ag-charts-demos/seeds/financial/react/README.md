# AG Charts demo: Financial (React)

A standalone Vite + React project running the AG Charts "Financial" demo app. Use it
to see how the demo is built, or as the starting point for an application of your own.

## Run it

```sh
npm install
npm run dev
```

`npm run build` produces a production bundle in `dist/`; `npm run preview` serves it.

## About this folder

This project is generated from the React demo source in
[`packages/ag-charts-demos/src/demos/financial`](../../../src/demos/financial) by
`tools/seeds/generate-react-seed.mjs`. The demo source lives in `src/`, with `src/main.tsx`
mounting it. Do not edit the seed in place: change the demo source and regenerate.

The `ag-charts-*` dependencies are pinned to 14.2.0, the latest release at the time this seed was
generated from a pre-release build. The demo itself may already use features of the next release; if
so, this seed catches up when that release is published.
AG Charts Enterprise features show a watermark until a licence key is set.
