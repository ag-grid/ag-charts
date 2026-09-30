---
root: false
targets: ['*']
description: 'Where the framework ports of the showcase demos come from and which files are generated'
globs: ['**/ag-charts-demos/seeds/**', '**/ag-charts-demos/src/demos/**']
---

# Showcase Demo Seeds and Ports

`packages/ag-charts-demos/seeds/<demo>/<framework>/` holds one standalone project per framework for each showcase demo. The React demo under `src/demos/<demo>/` is the golden master; the other frameworks are hand-maintained ports of it.

-   **`react/` is generated.** Never edit it by hand: change `src/demos/<demo>/` and run `yarn nx run ag-charts-demos:generate-seeds`.
-   **Before touching a port, read `seeds/<demo>/<framework>.PORTING.md`.** It records how each React construct maps to the framework, the invariants the port keeps (the `<main data-demo-id>` wrapper, selectors the functional specs depend on, accessibility linkages) and which shared modules are byte copies of the React source. Keep it current when the mapping changes.
-   **Shared modules are copies, not rewrites.** Files listed as copied in `PORTING.md` (data, types, CSS) must stay identical to the React source; re-copy rather than edit.
-   **After a sync, restamp.** Run `node tools/seeds/stamp-port-manifest.mjs <demo> <framework>` from `packages/ag-charts-demos` so `.seed-manifest.json` records the source hash; `node tools/seeds/check-seeds.mjs --stale` must report no stale ports.
-   **To align stale ports,** use the `/port-showcases` skill (`.rulesync/skills/port-showcases/SKILL.md`).
-   **Verify with the parity harness**, not by eye: `PARITY_DISCOVER=1 yarn nx test:e2e:parity ag-charts-demos` compares each port against the React reference pixel for pixel. It skips stale ports, so restamp first (or set `PARITY_INCLUDE_STALE=1` to compare a port mid-alignment). See `packages/ag-charts-demos/tools/seeds/README.md` for the full workflow.
