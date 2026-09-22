# Demo seed tooling

The demo apps under `src/demos/<demo>/` are the React golden masters. Each is published as a set
of standalone Vite seed projects under `seeds/<demo>/<framework>/`, which the website links on
GitHub and opens in StackBlitz. The React seed is generated; the Angular, Vue and TypeScript seeds
are hand-maintained ports. The scripts here keep both kinds honest.

Every seed carries a `.seed-manifest.json` whose `sourceHash` is a content hash of
`src/demos/<demo>/**` plus every file the demo imports from a sibling demo (`hashDemoSource` in
`seed-common.mjs`; procurement draws on web-analytics' topology, so a topology change moves the
procurement hash too) and whose `sourceCommit` is the last commit that touched any of those files.
The React generator writes it; a port's is stamped by hand after a sync.

## The manifest is what makes a seed exist

Nothing lists the seeds. Everything that needs to know which seeds there are walks
`seeds/<demo>/<framework>/` and takes the folders that carry a `.seed-manifest.json`:

- the website: the demo page offers an "Open in StackBlitz" button and a "See on GitHub" link for
  every framework with a manifest, in the order React, Angular, Vue, TypeScript (`readSeedManifests`
  in `packages/ag-charts-website/src/components/demo-examples/seedLinks.ts`);
- the parity harness, with `PARITY_DISCOVER=1`, serves and compares every port with a manifest
  (`e2e/parity/README.md`, "Discovered ports");
- `check-seeds.mjs --stale` reports every port with a manifest whose `sourceHash` is behind, and
  `check-seeds.mjs --pins` fails when one pins a different `ag-charts-*` version from the seeds';
- the post-deploy check `tools/ci/check-demo-seed-links.mjs` verifies that every seed with a
  manifest resolves on GitHub at the ref the deployed site links.

So a new port becomes visible on the site, and part of the CI gates, by committing its folder with a
manifest; no registry, website or workflow change is needed. A folder without a manifest is ignored
by all of the above, which is what a port in progress should be. A manifest whose `demo` or
`framework` disagrees with the folder it lives in fails the website build and every check.

A port's manifest carries:

```json
{
    "demo": "financial",
    "framework": "angular",
    "sourceHash": "sha256-…", // of src/demos/<demo>/** and its sibling-demo imports when last synced; stamped
    "sourceCommit": "…", // the commit that last touched any of those files; also stamped
    "pinnedVersion": "14.2.0", // the ag-charts-* version the seed's package.json pins; kept by pin-ports.mjs
    "pinSource": "released", // "workspace" on a release branch, "released" on a pre-release build; likewise
    "dist": "dist", // the seed-relative build output the parity harness serves
    "vendored": ["web-analytics/topology.ts"] // sibling-demo files copied under src/vendored/, if any
}
```

`framework` must be one of `react`, `angular`, `vue` or `typescript`: the website has a label for
those and fails on anything else. The Nx targets in `seeds/project.json` are per framework, so a
seed in a new framework also needs its build and typecheck targets there.

## Scripts

All commands run from the repository root.

### `generate-react-seed.mjs`

Regenerates the React seed for every demo (or the ids given) from its golden master. Also
available as `yarn nx run ag-charts-demos:generate-seeds`. Beside the copied demo source it writes
the seed's `src/main.tsx` and copies `src/fonts.ts` from the demos app shell, so the seed too
waits for the demo's web fonts before mounting (see "Web fonts and the first render" in the
package README).

### `check-seeds.mjs --react`

Regenerates every React seed into a temporary folder and diffs it against the committed one. A
difference fails the check with a summary of what changed. CI runs it, together with `--pins`
below, as `yarn nx run ag-charts-demos:check-seeds` in the lint job, so a demo change must be
committed together with its regenerated seed.

### `check-seeds.mjs --pins`

Fails when a framework port's `ag-charts-*` dependencies, or the `pinnedVersion` / `pinSource` in
its manifest, disagree with the version the seeds install (`readPinnedChartsVersion` in
`seed-common.mjs`: the workspace version on a release branch, the newest released version
otherwise). The message names each port and what is off, and the command that fixes it. The React
seed is not listed: `--react` regenerates it with its pins. Combines with `--react`; the exit status
is non-zero if either fails.

### `pin-ports.mjs`

Rewrites every framework port to the pinned version: each `ag-charts-*` entry in the port's
`package.json` (whichever dependency section it is in) and `pinnedVersion` / `pinSource` in its
`.seed-manifest.json`, inserting the manifest fields after `framework` if a port lacks them. Values
are replaced in the file text, not re-serialised, so each port keeps its own JSON formatting.
Reports what it changed; changes nothing when every port is already in step.

`tools/bump-versions.sh` runs it right after regenerating the React seeds, so a version bump moves
the ports' pins in the same commit. Run it by hand after adding a port, or when `--pins` fails:

```sh
node packages/ag-charts-demos/tools/seeds/pin-ports.mjs
```

### `check-seeds.mjs --stale [--fail-on-stale]`

Reports the ports whose manifest no longer matches the hash of their golden master (sibling-demo
imports included, so a shared module's change lists every demo that uses it), as JSON on stdout:

```json
{
    "stale": [
        {
            "demo": "financial",
            "framework": "angular",
            "sourceHash": "sha256-…",
            "manifestHash": "sha256-…",
            "sourceCommit": "…",
            "manifestCommit": "…"
        }
    ]
}
```

`sourceHash` and `sourceCommit` describe the golden master now; `manifestHash` and
`manifestCommit` are what the port was last synced to. A manifest without a `sourceHash` has never
been synced and is reported. The React seed is never listed here; `--react` covers it.

It is a report, so it exits 0 whatever it finds unless `--fail-on-stale` is passed, and it needs
nothing installed: the generator and its Prettier dependency are only loaded for `--react`.

### `stamp-port-manifest.mjs <demo> <framework>`

Records that a port is in step with its golden master by rewriting the manifest's `sourceHash`
and `sourceCommit` from the current source. Every other field is left as it was. Run it once the
port reproduces the demo change, and commit the manifest with the port; `--stale` then stops
reporting it.

```sh
node packages/ag-charts-demos/tools/seeds/stamp-port-manifest.mjs financial angular
```

### `create-port-sync-subtask.mjs [--dry-run] [--stale-report <file>]`

Files the JIRA work item that gets stale ports re-synced. Run by the sync workflow below; run it
by hand only with `--dry-run`, which prints every JIRA and GitHub request it would make and makes
none. It reads `CURRENT_SHA`, `BEFORE_SHA`, `RUN_URL`, `GITHUB_REPOSITORY`, `GITHUB_TOKEN`,
`JIRA_SITE_URL`, `JIRA_EMAIL` and `JIRA_API_TOKEN` from the environment.

## How a port gets re-synced

1. A PR changes a React demo. The lint job's "Stale demo ports" step warns that the ports are
   now behind, and that a Sub-task will follow after merge. Nothing blocks.
2. The PR merges to `latest`. `.github/workflows/demo-port-sync.yml` runs the stale report and,
   if anything is listed, `create-port-sync-subtask.mjs`:
    - The JIRA key comes from the pushed commit range: subjects filed under a key
      (`AG-12345 …`), then any key mentioned in a commit message (merge commits carry the branch
      name), then the merged PRs' branch names (`ghabot-ag-12345-…`, `ag-12345/…`). A Sub-task
      resolves to its parent; an Epic gets a Task rather than a Sub-task. With no key at all, or
      when the parent is Done (a Sub-task under a closed parent never appears on the board), a
      Task is filed under the showcase epic AG-17737.
    - If that parent already has an open "Sync demo ports" issue, the script comments on it with
      the new source commit and the stale ports, and stops. It is never re-transitioned: a run
      may be in flight, and the agent reads the repository at the start of its next run.
    - Otherwise it creates the issue (summary `[Charts] Sync demo ports: <demo> to <shortsha>`,
      component Charts, Track Housekeeping, label `ai-eligible`) with a description listing the
      stale ports, the commit range, each port's `PORTING.md`, the stamp command and the
      acceptance criteria, then transitions it to In Progress. That transition fires the JIRA
      automation rule that dispatches `jira-resume` into `jira-agent-pipeline.yml`, and the AI
      Workflow ports the change and opens a PR.
3. The PR is gated by the parity harness (`e2e/parity/README.md`): every port screenshot must
   match React within tolerance, and the functional specs must pass against each port.

A JIRA failure never fails the push. The step continues on error and posts to the CI alert
channel (`CI_FAILURE_SLACK_CHANNEL`, the same one `ci.yml` alerts to) so it can be filed by hand.

## Taking over a sync Sub-task

To do a sync yourself, or finish one the AI Workflow left:

1. Check the ticket's AI fields first (`AI status`, `AI branch`, `AI PR URL`). If a branch or PR
   exists, continue from it rather than starting again, and say so on the ticket so the pipeline
   does not resume over your work. See the `aiw-help` skill for how to stop an in-flight run.
2. Read `seeds/<demo>/<framework>/PORTING.md` for the port's mapping rules, then port the change
   listed in the ticket. Keep the React CSS and class names; the pixel comparison depends on them.
3. Stamp the manifest: `node packages/ag-charts-demos/tools/seeds/stamp-port-manifest.mjs <demo> <framework>`.
4. Verify: `node packages/ag-charts-demos/tools/seeds/check-seeds.mjs --stale` prints an empty
   list, `yarn nx test:e2e:parity ag-charts-demos` is green with the port served, and the
   functional specs pass with `DEMOS_BASE_URL` pointing at the port (both described in
   `e2e/parity/README.md`).
5. Open the PR against the ticket as usual. The port-only change does not touch
   `src/demos/**`, so it does not trigger another sync.
