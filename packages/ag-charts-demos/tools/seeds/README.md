# Demo seed tooling

The demo apps under `src/demos/<demo>/` are the React golden masters. Each is published as a set
of standalone Vite seed projects under `seeds/<demo>/<framework>/`, which the website links on
GitHub and opens in StackBlitz. The React seed is generated; the Angular, Vue and TypeScript seeds
are hand-maintained ports. The scripts here keep both kinds honest.

Every seed carries a `.seed-manifest.json` whose `sourceHash` is a content hash of
`src/demos/<demo>/**` (`hashDemoSource` in `seed-common.mjs`) and whose `sourceCommit` is the last
commit that touched it. The React generator writes it; a port's is stamped by hand after a sync.

## Scripts

All commands run from the repository root.

### `generate-react-seed.mjs`

Regenerates the React seed for every demo (or the ids given) from its golden master. Also
available as `yarn nx run ag-charts-demos:generate-seeds`.

### `check-seeds.mjs --react`

Regenerates every React seed into a temporary folder and diffs it against the committed one. A
difference fails the check with a summary of what changed. CI runs it as
`yarn nx run ag-charts-demos:check-seeds` in the lint job, so a demo change must be committed
together with its regenerated seed.

### `check-seeds.mjs --stale [--fail-on-stale]`

Reports the ports whose manifest no longer matches the hash of their golden master, as JSON on
stdout:

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
