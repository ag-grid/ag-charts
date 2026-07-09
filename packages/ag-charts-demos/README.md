# ag-charts-demos

Standalone, multi-file React application examples ("demo apps") that showcase AG Charts in a
realistic app context (React + Material UI). These are distinct from the single-file-per-framework
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
  registry.ts        # the single list of demo apps (id, title, description, lazy loader)
  demos/<id>/        # one folder per demo app; folder name === registry id
    index.tsx        #   default export: the app root
    <App>Example.tsx #   the app itself
    data.ts          #   sample data
```

## Commands

- `yarn nx dev ag-charts-demos` — dev server; open `/#<id>` (e.g. `/#starter`).
- `yarn nx build ag-charts-demos` — type-check (`tsc --noEmit`) + `vite build`. This is the CI gate.
- `yarn nx test:e2e ag-charts-demos` — Playwright smoke: loads each demo and asserts it renders with
  no console errors.

## Adding a demo app

1. Create `src/demos/<id>/` with an `index.tsx` that `export default`s the app root.
2. Add one entry to `DEMO_APPS` in `src/registry.ts` (use the same `<id>` as the folder name).

No per-app build or test wiring is needed: the type-check globs the tree, and the e2e smoke
discovers apps by folder.
