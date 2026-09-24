---
targets: ['*']
name: port-showcases
description: 'Bring the Angular, Vue and TypeScript ports of the showcase demos (financial, web-analytics, procurement) back into step with their React golden masters: find the stale ports, port the React change following each PORTING guide, restamp the manifests and prove parity. Use when asked to align, sync or update the demo ports or seeds, when `check-seeds.mjs --stale` lists a port, or on /port-showcases [demo] [framework] [--ci].'
---

# Port Showcases

The React demo under `packages/ag-charts-demos/src/demos/<demo>/` is the golden master. Each
`packages/ag-charts-demos/seeds/<demo>/<framework>/` port records in `.seed-manifest.json` the
source hash it was last aligned to. This skill brings stale ports back into step and proves it.

Read first: `packages/ag-charts-demos/tools/seeds/README.md` (manifests, pins, the scripts),
`packages/ag-charts-demos/e2e/parity/README.md` (the harness), `.rulesync/rules/demo-ports.md`,
and for each port you touch, `seeds/<demo>/<framework>.PORTING.md`. Those are authoritative; this
skill is the order of work.

## Arguments

`/port-showcases [demo] [framework] [--ci]`

-   `demo` (`financial`, `web-analytics`, `procurement`) and `framework` (`angular`, `vue`,
    `typescript`) filter the stale list; either may be given alone. Default: every stale port.
-   `--ci`: headless run from `.github/workflows/demo-port-align.yml`. Commit, write the summary
    (step 5), and never push or open a PR; the workflow does both.

All commands run from the repository root with `NX_DAEMON=false`. Record the commit you start from
as `<base>` (`git rev-parse HEAD`) before changing anything.

## 1. Find the stale ports and what moved

```sh
node packages/ag-charts-demos/tools/seeds/check-seeds.mjs --stale
```

Each entry names `demo`, `framework`, `manifestCommit` (last aligned) and `sourceCommit` (the
golden master now). An empty list means nothing to do: say so and stop. For each entry, read the
React change since the port was aligned:

```sh
git log --oneline <manifestCommit>..HEAD -- packages/ag-charts-demos/src/demos/<demo>
git diff <manifestCommit> HEAD -- packages/ag-charts-demos/src/demos/<demo> packages/ag-charts-demos/seeds/<demo>/react
```

The React seed diff also shows the files it vendors from sibling demos (the manifest's `vendored`
list, such as `web-analytics/topology.ts` for procurement), whose changes make a port stale too.
A manifest with no `manifestCommit` was never aligned: compare the whole port against React.

## 2. Port each change

Follow the port's PORTING guide: its file-mapping table, mapping rules and DOM invariants.

-   **Byte-identical modules are re-copied, never edited.** Every file the mapping table marks as
    copied (data, types, formatters, CSS, vendored files) is copied again from the source the table
    names (the demo source, or the React seed for `routes.ts` and `vendored/`), then any rename the
    table lists is re-applied.
-   **Components and hooks** are rewritten by the guide's mapping rules. Keep React's DOM, class
    names, roles, ARIA and `data-*` attributes: the functional specs and the pixel comparison key
    off them.
-   **Never edit** `src/demos/**`, `seeds/<demo>/react/**` or anything outside the port to suit a
    port. If the port cannot match React without that, stop on that port and report why.
-   Update the PORTING guide in the same commit when a mapping rule or invariant changed.

## 3. Restamp

Once a port reproduces the change:

```sh
node packages/ag-charts-demos/tools/seeds/stamp-port-manifest.mjs <demo> <framework>
node packages/ag-charts-demos/tools/seeds/check-seeds.mjs --stale --pins   # the port is no longer listed
```

`check-seeds.mjs` runs every check it is given and prints only the `--stale` report on stdout.
Use the stamp script, not a hand-written manifest rewrite; it keeps `vendored`, `dist` and the pins. Never stamp a port that fails a gate below.

## 4. Gate

1. `yarn nx run ag-charts-demos-seeds:build` (every seed's typecheck and build; the React seeds
   included, so a broken golden master shows up here too).
2. **Functional specs** against each aligned port. Serve its `dist` and run the specs its guide
   names (the guides differ: `-g <demo>` or named spec files), from `packages/ag-charts-demos`:
   `DEMOS_BASE_URL=http://localhost:<port> npx playwright test <selection>`.
3. **Pixel parity.** Self-parity first, `yarn nx test:e2e:parity ag-charts-demos`, which must be
   pixel-identical. Then every aligned port as explicit targets in one run: serve each `dist` with
   `node packages/ag-charts-demos/e2e/parity/serve-dist.mjs --dir <seed>/dist --port <port>`
   and pass them all in `PARITY_TARGETS` (the parity README's "Explicit targets" subshell stops
   the servers on exit). Fix the port on a failure; never add a mask or widen the gate. The
   results are in `packages/ag-charts-demos/e2e/parity/results/<run>/summary.json`.
4. `yarn nx format`, then `yarn nx format:check` and `yarn nx lint ag-charts-demos`.
5. `node tools/hot-paths/detect.js --range <base>...HEAD --summary`.

Ports: the harness defaults to 4701 (reference), 4702 (self-parity copy) and 4710 upwards for
served ports, and fails rather than reuse a busy one. Check each with
`lsof -nP -iTCP:<port> -sTCP:LISTEN` first; move the reference and copy with
`PARITY_REFERENCE_PORT` and `PARITY_SELF_PORT` and pick free ports for the seeds. Stop every
server you started before finishing.

## 5. Output

-   **One commit per port**: the port's files, its manifest and any guide change together, per
    `/ag-eng:git-conventions`. Use the ticket key when the work has one; a `--ci` run has none, so
    its subjects are plain, for example `Align the financial Angular port with React at 1a2b3c4d`.
-   **Interactive**: stop at the commits; open a PR into the detected base (the release branch on
    one) only when asked, with `/ag-eng:pr-create`.
-   **`--ci`**: also write `reports/port-showcases/summary.md` (gitignored), which the workflow puts
    in the PR body: a table of each port handled (`demo/framework`, the React commits ported,
    aligned or not and why), then each gate above with its verbatim result line. A port left
    stale must be listed with the reason. Never push, and leave no uncommitted changes other than
    `.claude/settings.json`.
