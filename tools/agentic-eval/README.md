# Agentic tooling eval harness

Tools for measuring the context cost of glob-attached `.claude/rules` and for A/B-testing rule-set
changes against real agent runs.

## Rule-load simulation

```bash
node tools/agentic-eval/simulate-rule-load.mjs                 # representative sample paths
node tools/agentic-eval/simulate-rule-load.mjs path/to/file.ts # specific paths
node tools/agentic-eval/simulate-rule-load.mjs --rules-dir /path/to/other/.claude/rules
```

Reports which rules auto-attach for each file path and the total word count — use before/after any
rule glob or content change to quantify the context impact.

## No-degradation A/B eval

```bash
tools/agentic-eval/run-eval.sh --models sonnet,opus --tasks t1,t2,t3 --reps 2
```

For each (model × task × condition × rep) cell the script:

1. Creates a detached worktree at HEAD and runs `yarn install` (postinstall regenerates the
   **baseline** rules from upstream ag-dev-prompts + tracked `.rulesync/`).
2. For the **modified** condition, overwrites the worktree's `.claude/rules` with the main
   checkout's current (candidate) rule set, snapshotted at eval start.
3. Runs the task prompt headless (`claude -p --output-format json`), capturing token usage, cost,
   turns, and duration.
4. Saves the resulting diff and has a condition-blind Opus judge score it against
   `judge-prompt.md` (test integrity, conventions, code quality).
5. `summarise-eval.mjs` prints per-cell and per-condition means and writes `summary.json`.

**Pass criteria**: modified condition's mean judge score is not below baseline (within noise for
the chosen rep count), with lower input tokens. A regressing cell usually means a rule was trimmed
too hard — restore that specific guidance and re-run the cell.

Notes:

- Runs are sequential to avoid resource contention skewing durations.
- Objective verification (tests/lint passing) is part of each task prompt; check the run's
  `*.result.json` final message and the diff rather than trusting the agent's claim.
- Tasks live in `tasks/`; keep prompts fixed between conditions.
