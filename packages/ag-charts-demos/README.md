<!-- hand-maintained: tools/readme/sync-readme.js skips READMEs carrying this marker -->

# ag-charts-demos

Standalone, multi-file React application examples ("demo apps") that showcase AG Charts in a
realistic app context (React). These are distinct from the single-file-per-framework
snippets under `ag-charts-website`'s `content/**/_examples/`.

This is a dedicated Vite/React package rather than part of `ag-charts-website` on purpose: the
website resolves the AG Charts packages to **source** for library hot-reload, and AG Charts source
cannot be bundled by a generic bundler to instantiate a chart (its DOM template is inlined only by
the packages' own build). This package resolves the AG Charts packages to their **built** output —
exactly as a real consumer app does — so charts render normally.

## Status

There are three demo apps: `financial`, `web-analytics` and `procurement`. Each is built,
type-checked, unit-tested and e2e-tested in CI (a broken demo fails CI) and deployed with the website
at `/charts/demos/<id>`, marked `noindex`, which also keeps the pages out of the sitemap.

Seed projects — a downloadable, runnable copy of each demo in every supported framework — are
**planned** under [AG-18147](https://ag-grid.atlassian.net/browse/AG-18147); see
[Seed projects (planned)](#seed-projects-planned) below.

## Layout

```
src/
  main.tsx           # entry
  App.tsx            # selects a demo app by URL hash (#<id>) and renders it
  DemoPage.tsx       # shared page shell used by the demo apps
  LoadingDemo.tsx    # Suspense fallback while a demo app loads
  registry.ts        # the single list of demo apps (id + lazy loader)
  demos/<id>/        # one folder per demo app; folder name === registry id
    index.tsx        #   default export: the app root
    <App>.tsx        #   the app itself
    data.ts          #   sample data
    *.test.ts        #   unit tests (vitest)
e2e/                 # Playwright specs: a registry smoke plus one spec per demo
```

Planned additions (AG-18147; none of these exist yet):

```
seeds/<id>/react/               generated from src/demos/<id> plus scaffolding; committed, CI-checked fresh
seeds/<id>/angular/             port of the React demo
seeds/<id>/vue/                 port
seeds/<id>/typescript/          vanilla port: Vite + TypeScript, no framework
seeds/<id>/<framework>/.seed-manifest.json   { sourceHash, sourceCommit } of src/demos/<id> last synced
tools/seeds/generate-react-seed.mjs
tools/seeds/check-seeds.mjs     freshness and staleness report (JSON)
e2e/parity/                     screenshot-diff harness: each port against the React demo
```

## Seed projects (planned)

Each demo/framework pair will be a standalone Vite project committed under `seeds/<id>/<framework>/`
and opened in StackBlitz straight from GitHub at the release tag matching the version the website
displays (`https://stackblitz.com/github/ag-grid/ag-charts/tree/release-<version>/<path>`). There is
no separate demos repository and no zip download.

- The React demo under `src/demos/<id>` is the golden master. The React seed is **generated** from it
  and a CI check fails if the committed seed is stale.
- The Angular, Vue and vanilla TypeScript seeds are ports of the React demo. They are built,
  type-checked and e2e-tested in CI only; the website keeps rendering React.
- Parity is a hard gate: a Playwright screenshot diff of each port against the React demo at fixed
  viewports with frozen data and time.
- Seeds must be fully self-contained — nothing in a seed may reference a path above its own root —
  so that StackBlitz can import the folder on its own.

## Commands

- `yarn nx dev ag-charts-demos` — standalone dev server; open `/#<id>` (e.g. `/#financial`).
- `yarn nx typecheck ag-charts-demos` — `tsc --noEmit` over the package.
- `yarn nx build ag-charts-demos` — type-check + `vite build`. This is the CI gate.
- `yarn nx test ag-charts-demos` — vitest unit tests, run twice: once normally and once with a
  DST-observing `TZ` for the `*Timezone.test.ts` specs.
- `yarn nx test:e2e ag-charts-demos` — Playwright: loads each demo and asserts it renders with no
  console errors, plus per-demo interaction specs.

### In the website dev server

`yarn nx dev` builds this package once at startup and the website's dev server serves the built output
same-origin at `/charts/demos/<id>` (e.g. `https://localhost:4600/charts/demos/financial`).
`/charts/demos` (no id) lists the available demos with a link to each. Serving the build — rather
than proxying a second dev server — keeps the embed same-origin, which the website's `frame-src` CSP
requires.

Editing a demo is wired into the shared watch loop: the change triggers the `build:watch` target (via
`external/ag-shared/scripts/watch/chartsWatch.config.js`), which rebuilds `dist`, and the dev server
reloads the browser once the rebuild completes. There is no HMR — it is a gated full reload, so the
page only refreshes after `dist` is ready (never mid-rebuild).

The build is base-relative (`DEMOS_BASE_PATH=./`), so the same `dist` works wherever it is mounted: the
dev server serves it via `agDemosStatic`, and the production website build copies it to `/internal-demos/`
and serves it under the site base (see `ag-charts-website/astro.config.mjs` and `src/pages/demos/`).

## Adding a demo app

1. Create `src/demos/<id>/` with an `index.tsx` that `export default`s the app root.
2. Add one entry to `DEMO_APPS` in `src/registry.ts` (use the same `<id>` as the folder name).

No per-app build or test wiring is needed: the type-check globs the tree, and the e2e smoke is
driven by `DEMO_APPS`. Both steps are required — the smoke suite fails if a demo folder has no
matching registry entry, so a folder alone cannot slip through untested.

## Maintaining this README

This file is written by hand. The release scripts run `tools/readme/sync-readme.js`, which
regenerates every `packages/*/README.md` from the root README; the marker comment on the first line
tells it to leave this one alone. Keep the marker.
