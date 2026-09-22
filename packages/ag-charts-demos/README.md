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

Each demo is also published as runnable seed projects — a standalone copy per framework, opened in
StackBlitz from the demo page — under `seeds/`; see [Seed projects](#seed-projects) below. The React
seed exists for every demo; the Angular, Vue and TypeScript ports land demo by demo
([AG-18147](https://ag-grid.atlassian.net/browse/AG-18147)), and a demo page offers whichever of them
are committed.

## Layout

```
src/
  main.tsx           # entry
  App.tsx            # selects a demo app by URL hash (#<id>) and renders it
  fonts.ts           # waits for a demo's web fonts before its first render (see below)
  DemoPage.tsx       # shared page shell used by the demo apps
  LoadingDemo.tsx    # Suspense fallback while a demo app loads
  registry.ts        # the single list of demo apps (id + lazy loader)
  demos/<id>/        # one folder per demo app; folder name === registry id
    index.tsx        #   default export: the app root
    <App>.tsx        #   the app itself
    data.ts          #   sample data
    *.test.ts        #   unit tests (vitest)
e2e/                 # Playwright specs: a registry smoke plus one spec per demo
  parity/            #   screenshot-diff harness: each port against the React demo (see its README)
seeds/               # standalone seed projects, one folder per demo and framework (Nx project ag-charts-demos-seeds)
  <id>/react/        #   GENERATED from src/demos/<id> plus scaffolding; committed, CI-checked fresh
  <id>/angular/      #   port of the React demo, hand-maintained
  <id>/vue/          #   port
  <id>/typescript/   #   vanilla port: Vite + TypeScript, no framework
  <id>/<framework>/.seed-manifest.json   # what the seed is and which src/demos/<id> it was last synced to
  <id>/<framework>/PORTING.md            # a port's mapping rules (React construct -> port equivalent)
tools/seeds/         # generator, freshness and staleness checks, sync automation (see its README)
```

### Web fonts and the first render

The web-analytics and procurement demos take their fonts from Google Fonts through an `@import`
in the demo's own stylesheet, and a chart lays out its labels with whatever font its canvas has at
that moment, because canvas text never triggers a font download: a chart created while the font
is still downloading is laid out with the fallback font's metrics and laid out again once the font
arrives, and the two passes do not always land on the same pixels as one pass in the final font.
So the demo loader in `src/App.tsx` renders a demo only once `waitForDeclaredFonts` (`src/fonts.ts`)
has loaded the default face of every family the demo's stylesheet declares, or 3 seconds have
passed, whichever comes first; a font that fails to load leaves the demo to render with its
fallbacks as it would have anyway. That gives the first layout the final font, which is what the
framework ports already get by their timing, and it is what makes the React reference and the
ports pixel-identical in the parity harness. The generated React seed does the same in its
`src/main.tsx`, with `src/fonts.ts` copied in beside the demo source.

## Seed projects

Each demo/framework pair is a standalone Vite project committed under `seeds/<id>/<framework>/`,
with exact `ag-charts-*` pins, and is opened in StackBlitz straight from GitHub. There is no separate
demos repository and no zip download.

- The React demo under `src/demos/<id>` is the golden master. The React seed is **generated** from it
  (`tools/seeds/generate-react-seed.mjs`) and CI fails if the committed seed is stale.
- The Angular, Vue and vanilla TypeScript seeds are ports of the React demo. They are built,
  type-checked and e2e-tested in CI only; the website keeps rendering React. When a React demo
  changes, CI files a JIRA Sub-task that gets the ports re-synced; how that works, and how to do a
  sync by hand, is in [`tools/seeds/README.md`](tools/seeds/README.md).
- Parity is a hard gate: a Playwright screenshot diff of each port against the React demo at fixed
  viewports with frozen data and time, plus the functional specs run against each port. The harness
  and its `PARITY_DISCOVER=1` mode, which finds every committed port by its manifest, are described
  in [`e2e/parity/README.md`](e2e/parity/README.md).
- Seeds must be fully self-contained — nothing in a seed may reference a path above its own root —
  so that StackBlitz can import the folder on its own.

### How the demo pages link the seeds

The showcase pages (`ag-charts-website/src/pages/examples*.astro`, rendered through
`src/components/demo-examples/DemoPage.astro`) show one "Open in StackBlitz" button and one
"See on GitHub" link per framework the demo has a seed for. The set is not configured anywhere:
`seedLinks.ts` in that folder reads every `seeds/<id>/<framework>/.seed-manifest.json` when the
site builds and offers exactly the frameworks that have one, in the order React, Angular, Vue,
TypeScript. **A new port becomes visible on the site by committing its folder with a manifest;
nothing on the website side changes.** A folder without a manifest is not a seed and is not linked.
A manifest that does not parse, or that names a different demo or framework from the folder it is
in, fails the website build.

The links point at the seed folder in this repository at a git ref chosen per build
(`getSeedGitRef` in `seedLinks.ts`):

- production links the release tag matching the version the site displays (`release-14.2.0` for
  `PUBLIC_PACKAGE_VERSION=14.2.0`, or for a `14.2.0-beta.*`), so a reader opens the seed that
  shipped with the version they are reading about;
- every other build — dev, staging, PR previews — links the `latest` branch, which carries the seeds
  from the moment they merge.

StackBlitz imports only the linked sub-folder, runs `npm install` against the seed's exact pins and
starts its `dev` script. After each staging deploy, `tools/ci/check-demo-seed-links.mjs` (run by
`.github/workflows/post-deploy-verification.yml`) HEADs the GitHub folder of every seed the
manifests declare at the ref that site links, so a link that would 404 is caught; StackBlitz
itself cannot be driven headlessly.

## Commands

- `yarn nx dev ag-charts-demos` — standalone dev server; open `/#<id>` (e.g. `/#financial`).
- `yarn nx typecheck ag-charts-demos` — `tsc --noEmit` over the package.
- `yarn nx build ag-charts-demos` — type-check + `vite build`. This is the CI gate.
- `yarn nx test ag-charts-demos` — vitest unit tests, run twice: once normally and once with a
  DST-observing `TZ` for the `*Timezone.test.ts` specs.
- `yarn nx test:e2e ag-charts-demos` — Playwright: loads each demo and asserts it renders with no
  console errors, plus per-demo interaction specs.
- `yarn nx run ag-charts-demos-seeds:build` — builds and type-checks every committed seed, ports
  included; `yarn nx run ag-charts-demos:check-seeds` — fails if a React seed is stale.
- `PARITY_DISCOVER=1 yarn nx test:e2e:parity ag-charts-demos` — the parity harness against every
  committed port (details in `e2e/parity/README.md`).

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
