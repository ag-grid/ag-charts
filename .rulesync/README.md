# Agentic Tooling — AG Charts

Most skills, agents, commands, and shared rules come from the [`ag-grid/ag-dev-prompts`](https://github.com/ag-grid/ag-dev-prompts) marketplace. See its [README](https://github.com/ag-grid/ag-dev-prompts#readme) for the full inventory and what each item does.

## Where things come from

| Channel                                                              | Claude Code                          | Cursor / Codex / Gemini / Copilot                           |
| -------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| Plugin marketplace (`ag-dev` → `ag-charts`, `ag-prodeng`, `ag-core`, `ag-eng`, `ag-product`) | Loaded directly as a plugin          | N/A                                                         |
| `.rulesync/` (this directory)                                        | Rules + a few product-specific items | Everything — staged from ag-dev-prompts by `rulesync-fetch` |

Plugin content is mirrored into `.rulesync/` by `external/ag-shared/scripts/rulesync-fetch/stage.py` so non-Claude tools receive the same surface via `rulesync generate`. Staged items are gitignored (`.rulesync/.gitignore`); only the AG Charts-local items below are tracked here.

## AG Charts-local items (not in any plugin)

These live in this repo because they depend on ag-charts source layout or release process.

**Skills** — `technology-stack` (AG Charts zero-runtime-dependencies constraint + package topology) and `animation-test-migration` (frame-trajectory harness migration).

**Commands** — none. The previous `/release-summary` is now the `release-summary` skill in `ag-prodeng` and auto-triggers on release-branch discussion.

**Rules** — the fourteen rules tightly coupled to ag-charts source code evolution: `ag-charts` (root), `animation-trajectory-tests`, `api-contracts`, `cartesian-series-types`, `data-model`, `defaults`, `dom-performance`, `entry-point-hygiene`, `module-support`, `numeric-values`, `series`, `server-side-rendering`, `test-harness-contracts`, `website-e2e-testing`. These describe architectural patterns (e.g., `_ModuleSupport` barrel, `DataSet`, series class hierarchy) and test-harness contracts that evolve in the same PR as the code they describe, so keeping them adjacent avoids cross-repo coordination. Everything else — chart-tooling guides, workflow guides, release skills, release-testing triage — now lives in `ag-dev-prompts` and arrives via the plugin fetch.

`git ls-files .rulesync/` is the authoritative list: tracked means repo-native, untracked means plugin-staged. Check it rather than trusting this paragraph, which has gone stale before.

## Editing

-   Tool-specific output directories (`.claude/`, `.cursor/`, `.codex/`, `.gemini/`, `.github/copilot*`, `AGENTS.md`) are **generated** — never edit them directly.
-   Change **tracked** files in `.rulesync/` and run `./external/ag-shared/scripts/setup-prompts/setup-prompts.sh` to regenerate.
-   **Untracked `.rulesync/` files are plugin-staged, not canonical.** Editing one looks like it works, then `setup-prompts.sh` silently overwrites it with no error. Most of `.rulesync/rules/` and nearly all of `.rulesync/skills/` fall into this category — always `git ls-files` the path before editing it.
-   Plugin-delivered items must be edited in `ag-dev-prompts` (or its local plugin cache, then upstreamed with `/ag-prodeng:contribute-prompt`), and are picked up on the next `setup-prompts` run.

Full contributor guide: `.rulesync/rules/rulesync-editing.md`.
