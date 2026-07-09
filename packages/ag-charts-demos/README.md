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

Demo apps are **internal-only** for now: built and type-checked in CI (a broken demo fails CI), and
runnable locally, but not published or linked from the live website. Surfacing them publicly (a
"Demo" tab) is separate, later work.

## Layout

```
src/
  main.tsx           # entry
  App.tsx            # selects a demo app by URL hash (#<id>) and renders it
  registry.ts        # the single list of demo apps (id + lazy loader)
  demos/<id>/        # one folder per demo app; folder name === registry id
    index.tsx        #   default export: the app root
    <App>Example.tsx #   the app itself
    data.ts          #   sample data
```

## Commands

- `yarn nx dev ag-charts-demos` — standalone dev server; open `/#<id>` (e.g. `/#starter`).
- `yarn nx build ag-charts-demos` — type-check (`tsc --noEmit`) + `vite build`. This is the CI gate.
- `yarn nx test:e2e ag-charts-demos` — Playwright smoke: loads each demo and asserts it renders with
  no console errors.

### In the website dev server

`yarn nx dev` builds this package once at startup and the website's dev server serves the built output
same-origin at `/charts/debug/demos/<id>` (e.g. `https://localhost:4600/charts/debug/demos/starter`).
`/charts/debug/demos` (no id) lists the available demos with a link to each. Serving the build — rather
than proxying a second dev server — keeps the embed same-origin, which the website's `frame-src` CSP
requires.

Editing a demo is wired into the shared watch loop: the change triggers the `build:watch` target (via
`chartsWatch.config.js`), which rebuilds `dist` with the embedded base path, and the dev server reloads
the browser once the rebuild completes. There is no HMR — it is a gated full reload, so the page only
refreshes after `dist` is ready (never mid-rebuild).

The route is dev-only (see `agDemosStatic` and the `getStaticPaths` production guard), so demos never
reach the live site.

## Adding a demo app

1. Create `src/demos/<id>/` with an `index.tsx` that `export default`s the app root.
2. Add one entry to `DEMO_APPS` in `src/registry.ts` (use the same `<id>` as the folder name).

No per-app build or test wiring is needed: the type-check globs the tree, and the e2e smoke is
driven by `DEMO_APPS`. Both steps are required — the smoke suite fails if a demo folder has no
matching registry entry, so a folder alone cannot slip through untested.
