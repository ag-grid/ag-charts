# Agentic Tooling Crib-Sheet

Quick-reference for all AI agent commands, skills, sub-agents, and rules available in this repo.

## How It Works

| Folder       | Purpose                                                                                           | Loaded by              |
| ------------ | ------------------------------------------------------------------------------------------------- | ---------------------- |
| `.rulesync/` | Canonical shared source — works across tools (Cursor, Claude Code, etc.)                          | All supported AI tools |
| `.claude/`   | Claude Code extensions — mirrors `.rulesync/` plus Claude Code-specific agents, skills, and rules | Claude Code only       |

**Loading behaviour:**

-   **Rules** load automatically based on file-pattern globs (e.g. editing a `.test.ts` file loads the `testing` rule). The root rule (`ag-charts`) loads for all files.
-   **Skills** load on-demand when invoked via `/skill-name`. Skills marked **(user)** are user-invocable only — the LLM should not invoke them autonomously via the Skill tool.
-   **Sub-agents** are spawned automatically by the AI when a task matches their speciality.
-   **Commands** are invoked explicitly via `/command-name`.

**Provenance key:**

-   🟢 **Local** — ag-charts specific (normal file in `.rulesync/`)
-   🔵 **Shared** — reusable across AG products (symlink to `external/ag-shared/`)
-   🟠 **Private** — ag-charts product-specific shared prompt (symlink to `external/prompts/`)

---

## Everyday Development

| Type  | Name                  | Invoke                                     | What it does                                               |
| ----- | --------------------- | ------------------------------------------ | ---------------------------------------------------------- |
| Skill | 🔵 `code-fixup`       | `/code-fixup <package>` (user)             | Fix build and lint errors across a package                 |
| Skill | 🔵 `pr-create`        | `/pr-create` (user)                        | Commit, push, and open a PR                                |
| Skill | 🔵 `pr-review`        | `/pr-review [--json] [--all] <PR#>` (user) | Review a PR (Markdown default; `--all` adds DA + Simplify) |
| Skill | 🔵 `dev-server`       | `/dev-server`                              | Start dev server, check build status                       |
| Skill | 🔵 `git-conventions`  | `/git-conventions`                         | Branch, commit, and PR naming conventions                  |
| Skill | 🟢 `technology-stack` | `/technology-stack`                        | Architecture constraints and zero-dependency rules         |

## Testing and Quality

| Type    | Name                    | Invoke                       | What it does                                         |
| ------- | ----------------------- | ---------------------------- | ---------------------------------------------------- |
| Skill   | 🔵 `git-bisect`         | `/git-bisect` (user)         | Find the commit that introduced a regression         |
| Command | 🟠 `/sonar-fix`         | `/sonar-fix`                 | Fetch and fix SonarCloud issues                      |
| Skill   | 🔵 `batch-lint-cleanup` | `/batch-lint-cleanup` (user) | Auto-fix ESLint violations by rule                   |
| Command | 🟠 `/previs`            | `/previs`                    | PREVis visual quality evaluation on gallery examples |
| Skill   | 🟠 `optimize-series`    | `/optimize-series`           | Series rendering performance and GC optimisation     |
| Agent   | 🟠 `test-writer`        | Auto                         | Create Jest snapshot and Playwright E2E tests        |
| Agent   | 🔵 `playwright-expert`  | Auto                         | Playwright test architecture and debugging           |
| Agent   | 🟠 `example-tester`     | Auto                         | Validate AG Charts example correctness               |
| Agent   | 🟠 `visual-qa`          | Auto                         | Review visual regression image diffs                 |
| Agent   | 🟠 `previs-evaluator`   | Auto                         | PREVis methodology evaluation of visualisations      |

## Documentation and Examples

| Type    | Name                   | Invoke            | What it does                                          |
| ------- | ---------------------- | ----------------- | ----------------------------------------------------- |
| Command | 🟠 `/docs-create`      | `/docs-create`    | Scaffold a new documentation page                     |
| Command | 🟠 `/docs-review`      | `/docs-review`    | Review docs for accuracy and example consistency      |
| Skill   | 🟠 `spruce-docs`       | `/spruce-docs`    | Create or improve docs following established patterns |
| Skill   | 🟠 `plunker`           | `/plunker`        | Create and manage Plunker demos for AG Charts         |
| Skill   | 🔵 `batch-plunkers`    | `/batch-plunkers` | Create multiple Plunkers in parallel via sub-agents   |
| Agent   | 🟠 `data-viz-designer` | Auto              | Dataset selection, chart type guidance                |

## Planning and Analysis

| Type    | Name                               | Invoke                               | What it does                                               |
| ------- | ---------------------------------- | ------------------------------------ | ---------------------------------------------------------- |
| Skill   | 🔵 `plan-review`                   | `/plan-review` (user)                | Review plans for completeness and correctness              |
| Skill   | 🔵 `plan-implementation-review`    | `/plan-implementation-review` (user) | Review plan execution, identify delivery gaps              |
| Command | 🟠 `/product-requirement-analysis` | `/product-requirement-analysis`      | Analyse requirements with competitor research              |
| Skill   | 🔵 `jira`                          | `/jira`                              | Create, estimate, or analyse JIRA tickets                  |
| Agent   | 🟠 `technical-research-analyst`    | Auto                                 | In-depth technical research with citations                 |
| Skill   | 🟢 `nx-performance`                | `/nx-performance`                    | Nx caching, build pipeline, and performance best practices |
| Agent   | 🔵 `nx-expert`                     | Auto                                 | Nx monorepo configuration and build optimisation           |

## Prompt Hygiene

| Type  | Name                  | Invoke                     | What it does                                     |
| ----- | --------------------- | -------------------------- | ------------------------------------------------ |
| Skill | 🔵 `validate-prompts` | `/validate-prompts` (user) | Validate prompt file references for path hygiene |

## Memory

| Type    | Name                   | Invoke              | What it does                                       |
| ------- | ---------------------- | ------------------- | -------------------------------------------------- |
| Skill   | 🔵 `remember`          | `/remember` (user)  | Save branch context or project learnings as memory |
| Skill   | 🔵 `recall`            | `/recall` (user)    | Load branch context, browse project memories       |
| Command | 🟠 `/optimise-context` | `/optimise-context` | Audit and reduce agentic tooling token usage       |

## Git and Branch Management

| Type  | Name                    | Invoke                       | What it does                             |
| ----- | ----------------------- | ---------------------------- | ---------------------------------------- |
| Skill | 🔵 `sync-ag-shared`     | `/sync-ag-shared` (user)     | Sync ag-shared subrepo across AG repos   |
| Skill | 🔵 `git-worktree-clean` | `/git-worktree-clean` (user) | Hard-reset worktree to `origin/latest`   |
| Skill | 🔵 `git-split`          | `/git-split` (user)          | Split large files preserving git history |
| Skill | 🔵 `pr-split`           | `/pr-split` (user)           | Split a branch into stacked PRs          |

## Release Management

| Type    | Name                         | Invoke                    | What it does                                      |
| ------- | ---------------------------- | ------------------------- | ------------------------------------------------- |
| Command | 🟢 `/release-summary`        | `/release-summary`        | Summarise feature threads by author for a release |
| Command | 🟠 `/prepare-release-notes`  | `/prepare-release-notes`  | Generate release notes for a version              |
| Command | 🟠 `/release-blog-writer`    | `/release-blog-writer`    | Write a release blog post from template           |
| Command | 🟠 `/release-docs-review`    | `/release-docs-review`    | Review all doc changes between releases           |
| Command | 🟠 `/release-options-review` | `/release-options-review` | Check API compatibility and breaking changes      |
| Skill   | 🟢 `releases`                | `/releases`               | Release conventions, branch naming, constraints   |

---

## Rules Reference

Rules load automatically when you edit files matching their glob patterns.

### Root Rule (always loaded)

| Rule           | Description                                           |
| -------------- | ----------------------------------------------------- |
| 🟢 `ag-charts` | Project overview, build chain, development guidelines |

### Core Code Rules

| Rule                                 | Activates on                                           | Description                                       |
| ------------------------------------ | ------------------------------------------------------ | ------------------------------------------------- |
| 🟢 `api-contracts`                   | `ag-charts-types/**/*.ts`, `**/config/**/*.ts`         | Public API vs undocumented options patterns       |
| 🟢 `data-model`                      | `**/data-model/**/*.ts`                                | DataModel principles and data processing patterns |
| 🟢 `defaults`                        | `**/*Module.ts`, `**/*Properties.ts`, `**/*Options.ts` | Three-tier default system and theme configuration |
| 🟢 `series`                          | `**/series/**/*.ts`                                    | Series architecture, rendering, and performance   |
| 🟠 `series-performance-optimization` | `**/series/**/*.ts`                                    | Series perf optimisation guide                    |
| 🟠 `cartesian-series-types`          | `**/series/cartesian/**/*.ts`                          | Consolidated generic type patterns                |
| 🔵 `code-quality`                    | `packages/*/src/**/*.ts`                               | Bloat avoidance and comment guidelines            |
| 🟢 `server-side-rendering`           | `ag-charts-server-side/src/**/*`                       | SSR patterns and global usage constraints         |

### Testing and Benchmarks

| Rule                    | Activates on                            | Description                                        |
| ----------------------- | --------------------------------------- | -------------------------------------------------- |
| 🟢 `testing`            | `**/*.test.ts`, `**/*.spec.ts`          | Testing strategies, philosophy, and best practices |
| 🟢 `benchmarks`         | `**/benchmarks/**`, `**/*.benchmark.ts` | Running and creating performance benchmarks        |
| 🟠 `browser-benchmarks` | `**/*-test/_examples/**/main.ts`        | Browser-based benchmark harness                    |

### Documentation and Examples

| Rule                             | Activates on                                           | Description                                        |
| -------------------------------- | ------------------------------------------------------ | -------------------------------------------------- |
| 🟢 `docs-pages`                  | `**/docs/**/*.mdoc`, `**/docs/**/_examples/**`         | Slim pointer → `/spruce-docs` skill                |
| 🟢 `docs-checklist`              | `**/docs/**/*.mdoc`                                    | Slim pointer → `/spruce-docs` skill                |
| 🟢 `examples`                    | `**/_examples/**`, `**/gallery/**`                     | Slim pointer → `/example` skill                    |
| 🟢 `examples-framework-patterns` | `**/_examples/**`, `**/generate-example-files/**`      | Slim pointer → `/example` skill                    |
| 🔵 `website-astro-pages`         | `**/src/pages/**/*.astro`, `**/src/layouts/**/*.astro` | Astro page patterns, layouts, and code conventions |
| 🔵 `website-browser-testing`     | `**/src/pages/**/*.astro`, `**/src/layouts/**/*.astro` | Chrome DevTools MCP browser testing workflow       |
| 🔵 `website-css`                 | `**/src/pages-styles/**/*.scss`, design-system         | CSS architecture, design system, and styling       |

### Playbooks

| Rule                  | Activates on                            | Description                                |
| --------------------- | --------------------------------------- | ------------------------------------------ |
| 🟢 `playbook-bug-fix` | `**/chart/**/*.ts`, `**/series/**/*.ts` | Bug fix and feature work playbook          |
| 🟢 `playbook-docs`    | `**/docs/**/*`                          | Documentation update playbook              |
| 🟢 `playbook-example` | `**/_examples/**`                       | Example creation and modification playbook |

### Other Rules

| Rule               | Activates on                                  | Description             |
| ------------------ | --------------------------------------------- | ----------------------- |
| 🔵 `setup-prompts` | `**/setup-prompts/**`, `**/patches/rulesync*` | Rulesync patching guide |

---

## Skills Reference

Skills load on-demand when invoked. All skills are invoked via `/skill-name`. All skills are shared across AI tools via `.rulesync/skills/`.

-   **✂ = context fork** — runs in a forked context (`context: fork`), so loaded instructions don't persist after completion.
-   **👤 = user-only** — `disable-model-invocation: true`; the LLM cannot invoke autonomously.
-   **🤖 = auto** — the LLM may invoke via the Skill tool when it matches the task.

| Skill                           | Fork | Invoke | Description                                                 |
| ------------------------------- | ---- | ------ | ----------------------------------------------------------- |
| 🔵 `batch-lint-cleanup`         |      | 👤     | Auto-fix ESLint violations by rule                          |
| 🔵 `batch-plunkers`             | ✂   | 🤖     | Create multiple Plunkers in parallel via sub-agents         |
| 🔵 `code-fixup`                 |      | 👤     | Fix build and lint errors across a package                  |
| 🔵 `dev-server`                 |      | 🤖     | Start dev server, check build status                        |
| 🟠 `docs-create`                | ✂   | 👤     | Scaffold a new documentation page                           |
| 🔵 `example`                    | ✂   | 🤖     | AG Charts/Grid/Studio example conventions and patterns      |
| 🔵 `git-bisect`                 |      | 👤     | Find the commit that introduced a regression                |
| 🔵 `git-conventions`            |      | 🤖     | Branch, commit, and PR naming conventions                   |
| 🔵 `git-split`                  |      | 👤     | Split large files preserving git history                    |
| 🔵 `git-worktree-clean`         |      | 👤     | Hard-reset worktree to `origin/latest`                      |
| 🔵 `jira`                       | ✂   | 🤖     | Create, estimate, or analyse JIRA tickets (all AG products) |
| 🟠 `optimize-series`            | ✂   | 🤖     | Series performance optimisation and GC pressure reduction   |
| 🔵 `plan-implementation-review` | ✂   | 👤     | Review plan execution, identify delivery gaps               |
| 🔵 `plan-review`                | ✂   | 👤     | Review plans for completeness and correctness               |
| 🟠 `plunker`                    | ✂   | 🤖     | Create and manage Plunker demos for AG Charts               |
| 🔵 `pr-create`                  |      | 👤     | Commit, push, and open a PR                                 |
| 🔵 `pr-review`                  |      | 👤     | Review a PR (Markdown default, JSON with `--json`)          |
| 🔵 `pr-split`                   |      | 👤     | Split a branch into stacked PRs                             |
| 🔵 `recall`                     | ✂   | 👤     | Load branch context, browse project memories                |
| 🟢 `releases`                   |      | 🤖     | Release conventions, branch naming, and constraints         |
| 🔵 `remember`                   | ✂   | 👤     | Save branch context or project learnings as memory          |
| 🟠 `sonar-fix`                  | ✂   | 👤     | Fetch and fix SonarCloud issues                             |
| 🟠 `spruce-docs`                | ✂   | 🤖     | Create or improve documentation following patterns          |
| 🟠 `spruce-example`             | ✂   | 🤖     | Improve gallery examples to professional quality            |
| 🔵 `sync-ag-shared`             | ✂   | 👤     | Sync ag-shared subrepo changes across AG repos              |
| 🟢 `technology-stack`           |      | 🤖     | Architecture constraints and zero-dependency requirements   |
| 🔵 `validate-prompts`           |      | 👤     | Validate prompt file references for consistency and hygiene |

---

## Sub-Agents Reference

Sub-agents are spawned automatically when the AI determines a task matches their speciality. They cannot be invoked directly.

| Agent                           | Description                                      |
| ------------------------------- | ------------------------------------------------ |
| 🟠 `data-viz-designer`          | Guides dataset selection and chart type choices  |
| 🟠 `example-tester`             | Tests AG Charts examples for correctness         |
| 🔵 `nx-expert`                  | Nx monorepo configuration and build optimisation |
| 🔵 `playwright-expert`          | Playwright E2E test architecture and debugging   |
| 🟠 `previs-evaluator`           | PREVis methodology evaluation of visualisations  |
| 🟠 `technical-research-analyst` | In-depth technical research with citations       |
| 🟠 `test-writer`                | Creates Jest snapshot and Playwright E2E tests   |
| 🟠 `visual-qa`                  | Reviews visual regression test diffs             |
