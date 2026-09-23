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

The hash covers exactly what the React seed copies: the files git would commit (tracked, or
untracked and not ignored, so `.DS_Store` and the like never count), less test files
(`*.test.*`, `*.spec.*`), which stay with the workspace. A test-only edit therefore changes no
seed and makes no port stale. When a manifest is rewritten with an unchanged hash its
`sourceCommit` is kept, so regenerating from a shallow clone (a version bump, a CI job) cannot
replace it with the clone's starting commit.

## The manifest is what makes a seed exist

Nothing lists the seeds. Everything that needs to know which seeds there are walks
`seeds/<demo>/<framework>/` and takes the folders that carry a `.seed-manifest.json`:

- the website: the demo page offers an "Open in StackBlitz" button and a "See on GitHub" link for
  every framework with a manifest, in the order React, Angular, Vue, TypeScript (`readSeedManifests`
  in `packages/ag-charts-website/src/components/demo-examples/seedLinks.ts`);
- the parity harness, with `PARITY_DISCOVER=1`, serves and compares every port with a manifest
  that is not stale, and lists the stale ones it skips (`e2e/parity/README.md`, "Discovered ports");
- `check-seeds.mjs --stale` reports every port with a manifest whose `sourceHash` is behind, and
  `check-seeds.mjs --pins` fails when one pins a different `ag-charts-*` version from the seeds';
- the post-deploy check `tools/ci/check-demo-seed-links.mjs` reads the seed links the deployed
  demo pages render and verifies that each, and every seed with a manifest, resolves on GitHub at
  the ref the deployed site links.

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
    "pinnedVersion": "latest", // what the seed's package.json pins every ag-charts-* dependency to; kept by pin-ports.mjs
    "pinSource": "dist-tag", // "release" for an exact X.Y.Z, "dist-tag" for npm's "latest" tag; likewise (see "Pins")
    "dist": "dist", // the seed-relative build output the parity harness serves
    "vendored": ["web-analytics/topology.ts"] // sibling-demo files copied under src/vendored/, if any
}
```

`framework` must be one of `react`, `angular`, `vue` or `typescript`: the website has a label for
those and fails on anything else. The Nx targets in `seeds/project.json` are per framework, so a
seed in a new framework also needs its build and typecheck targets there.

## Pins

A seed is installed from public npm, which is where StackBlitz installs from, so every `ag-charts-*`
dependency in its `package.json` must be something npm resolves. Between releases the workspace
carries a pre-release, `X.Y.Z-beta.<date>[.<time>]` (`tools/calculate-next-version.js`), and betas
are published only to the private registry at registry.ag-grid.com, never to public npm. So the
pin follows the branch (`readPinnedChartsVersion` in `seed-common.mjs`):

| Where                                                                                         | Pin      | `pinSource` |
| --------------------------------------------------------------------------------------------- | -------- | ----------- |
| A release branch `bX.Y.Z`, or a pull request into one, beta or not                            | `X.Y.Z`  | `release`   |
| A plain `X.Y.Z` workspace version (the "Release X.Y.Z Prep" commit), on any branch            | `X.Y.Z`  | `release`   |
| Everywhere else: `latest`, `next`, feature branches, pull requests into them, a detached HEAD | `latest` | `dist-tag`  |

The `latest` dist-tag makes `npm install` fetch the newest published release, so a seed on `latest`
may lag a feature its demo already uses until that release ships. Production links the seeds at the
`release-X.Y.Z` tag, where they pin `X.Y.Z` exactly; staging and local builds link `latest`.

The branch is resolved in this order (`resolveBranch` in `seed-common.mjs`, shared with
`tools/ci/check-demo-seed-links.mjs`):

1. `AG_CHARTS_SEED_BRANCH`, when set;
2. `GITHUB_BASE_REF`, set on GitHub Actions pull requests, so a pull request is checked against
   the branch it merges into;
3. `GITHUB_REF_NAME`, the pushed or dispatched branch in any other GitHub Actions run;
4. the checked-out branch. A detached HEAD with none of the above resolves to no branch, and so to
   the dist-tag unless the workspace version is a plain `X.Y.Z`.

### Pins through a release

- **Cutting the branch.** `tools/create-release-automated.sh` (and `create-release.sh`) checks out
  `bX.Y.Z` first and then runs `tools/bump-versions.sh`, twice: to `X.Y.Z`, then to the branch's
  first `X.Y.Z-beta.*`. `bump-versions.sh` sets `AG_CHARTS_SEED_BRANCH` to the checked-out
  branch before regenerating the React seeds and running `pin-ports.mjs`, so both bumps pin
  `X.Y.Z` and the prep commit carries them. `latest` keeps pinning the dist-tag.
- **Beta bumps.** `update-release.sh` and the Bump Beta Version workflow (`beta-publish.yml`) run
  `bump-versions.sh` on the branch they bump, so a release branch stays on `X.Y.Z` and `latest`
  on the dist-tag; the pins do not change.
- **"Release X.Y.Z Prep".** This commit is made outside this repository's scripts, and is what
  gets tagged `release-X.Y.Z`. It sets the plain `X.Y.Z` version, which pins
  `X.Y.Z` with `pinSource` `release`, exactly what the release branch already carries, so it
  needs no seed change and need not run the seed tooling. If it does run `bump-versions.sh` from
  a detached HEAD, that is still right: a plain version pins itself whatever the branch.
  Either way the tagged commit's pins are what `check-seeds.mjs --pins` expects there.
- **Merging a release branch into `latest`.** Such a merge brings `X.Y.Z` pins with it, and CI on
  `latest` then fails `check-seeds`. Run `yarn nx run ag-charts-demos:generate-seeds` and
  `node packages/ag-charts-demos/tools/seeds/pin-ports.mjs` on the merge, as for the version
  numbers the merge also has to resolve.
- **Running the scripts elsewhere.** A job that runs `bump-versions.sh`, `generate-react-seed.mjs`
  or `pin-ports.mjs` on a detached checkout with no GitHub Actions variables pins the dist-tag
  for a beta. On a release branch it must first check out the branch by name, or set
  `AG_CHARTS_SEED_BRANCH=bX.Y.Z`.

## Scripts

All commands run from the repository root.

### `generate-react-seed.mjs`

Regenerates the React seed for every demo (or the ids given) from its golden master. Also
available as `yarn nx run ag-charts-demos:generate-seeds`. Beside the copied demo source it writes
the seed's `src/main.tsx`, which mounts the demo at once. The seed does not wait for the demo's web
fonts: the demos app does that only in an e2e run, for the parity harness (see "Web fonts and the
first render" in the package README), and the parity harness compares the ports with the demos
app, not with this seed.

### Combining the `check-seeds.mjs` flags

`--react`, `--pins`, `--touched <base>` and `--stale` combine: every check asked for runs, in that
order, even after one fails, and the exit status is non-zero if any fails. Stdout carries the
`--stale` JSON and nothing else; every other line, success messages included, goes to stderr, so
`check-seeds.mjs --stale --pins > stale.json` still writes a parseable report.

### `check-seeds.mjs --react`

Regenerates every React seed into a temporary folder and diffs it against the committed one. A
difference fails the check with a summary of what changed. CI runs it, together with `--pins`
below, as `yarn nx run ag-charts-demos:check-seeds` in the lint job, so a demo change must be
committed together with its regenerated seed.

### `check-seeds.mjs --pins`

Fails when a framework port's `ag-charts-*` dependencies, or the `pinnedVersion` / `pinSource` in
its manifest, disagree with what the seeds install on this branch (see "Pins" below). The message
names each port and what is off, the pin expected and why, and the command that fixes it. The React
seed is not listed: `--react` regenerates it with its pins.

### `pin-ports.mjs`

Rewrites every framework port to the pinned version: each `ag-charts-*` entry in the port's
`package.json` (whichever dependency section it is in) and `pinnedVersion` / `pinSource` in its
`.seed-manifest.json`, inserting the manifest fields after `framework` if a port lacks them. Values
are replaced in the file text, not re-serialised, so each port keeps its own JSON formatting.
Reports what it changed; changes nothing when every port is already in step.

`tools/bump-versions.sh` runs it right after regenerating the React seeds, so a version bump moves
the ports' pins in the same commit. Run it by hand after adding a port, or when `--pins` fails, on
the branch the change targets (or with `AG_CHARTS_SEED_BRANCH` set to it; see "Pins"):

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
nothing installed: the generator and its Prettier dependency are only loaded for `--react`. The
lint job prints it as non-blocking warnings, and the parity run reads it to skip stale ports.

### `check-seeds.mjs --touched <base>`

Fails when a port the change edits is still stale: a file under `seeds/<demo>/<framework>/` differs
between `<base>` and `HEAD`, and the port's manifest is behind its golden master. A port is aligned
by editing it and restamping its manifest; edited and still stale means the restamp was forgotten,
and the blocking parity run, which skips stale ports, would not compare it. The message names each
port, the files that touched it and the stamp command. Changes to a port's `package.json` and
`.seed-manifest.json` alone do not count: `pin-ports.mjs` rewrites those in every port on each
version bump and at the release-branch cut, stale or not.

It compares the trees at `<base>` and `HEAD`, so it needs no merge base and works in a shallow
clone once `<base>` is fetched; uncommitted changes are not seen. CI runs it in the lint job with the
same base as the affected checks (`findTouchedStalePorts` in `stale-ports.mjs` takes the changed files
as input, for the unit tests):

```sh
node packages/ag-charts-demos/tools/seeds/check-seeds.mjs --touched origin/latest
```

### `stamp-port-manifest.mjs <demo> <framework>`

Records that a port is in step with its golden master by rewriting the manifest's `sourceHash`
and `sourceCommit` from the current source (the commit is kept when the hash has not moved).
Every other field is left as it was. Run it once the
port reproduces the demo change, and commit the manifest with the port; `--stale` then stops
reporting it.

```sh
node packages/ag-charts-demos/tools/seeds/stamp-port-manifest.mjs financial angular
```

## How a port gets aligned

1. A PR changes a React demo. Its ports are now stale, which is expected: the lint job's "Stale
   demo ports" step warns without blocking, and the blocking parity run skips them, listing each
   in its output and in `summary.json`. The ports stay stale on `latest` until the next release.
2. When a release branch `bX.Y.Z` is cut, the "Demo Port Alignment" workflow
   (`.github/workflows/demo-port-align.yml`) runs the stale report on it. With nothing stale it ends
   there. Otherwise it runs the `/port-showcases` skill headlessly, which ports each React change
   following the port's `seeds/<demo>/<framework>.PORTING.md` (keeping the React CSS and class
   names, which the pixel comparison depends on), restamps the manifests with
   `stamp-port-manifest.mjs` and runs the gates, then opens one PR into the release branch listing
   the stale ports and the gate results. It can also be run by hand from the Actions tab, with the
   release branch as input.
3. The PR is gated by CI like any other. Once restamped a port is current again, so the parity run
   compares it: every port screenshot must match React within tolerance. The lint job's
   `check-seeds.mjs --touched` fails a PR that edits a port without restamping it.

To align ports yourself on any branch, run `/port-showcases [demo] [framework]` in Claude Code. The
functional specs should pass with `DEMOS_BASE_URL` pointing at an aligned port too
(`e2e/parity/README.md`).
