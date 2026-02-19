# Agentic Tooling Crib-Sheet

Quick-reference for all AI agent commands, skills, sub-agents, and rules available in this repo.

## How It Works

| Folder       | Purpose                                                                                           | Loaded by              |
| ------------ | ------------------------------------------------------------------------------------------------- | ---------------------- |
| `.rulesync/` | Canonical shared source — works across tools (Cursor, Claude Code, etc.)                          | All supported AI tools |
| `.claude/`   | Claude Code extensions — mirrors `.rulesync/` plus Claude Code-specific agents, skills, and rules | Claude Code only       |

**Loading behaviour:**

-   **Rules** load automatically based on file-pattern globs (e.g. editing a `.test.ts` file loads the `testing` rule). The root rule (`ag-charts`) loads for all files.
-   **Skills** load on-demand when invoked via `/skill-name`.
-   **Sub-agents** are spawned automatically by the AI when a task matches their speciality.
-   **Commands** are invoked explicitly via `/command-name`.

**Provenance key:**

-   🟢 **Local** — ag-charts specific (normal file in `.rulesync/`)
-   🔵 **Shared** — reusable across AG products (symlink to `external/ag-shared/`)
-   🟠 **Private** — ag-charts product-specific shared prompt (symlink to `external/prompts/`)

---

## Everyday Development

| Type    | Name                  | Invoke                  | What it does                                       |
| ------- | --------------------- | ----------------------- | -------------------------------------------------- |
| Command | 🔵 `/code-fixup`      | `/code-fixup <package>` | Fix build and lint errors across a package         |
| Command | 🔵 `/code-cleanup`    | `/code-cleanup`         | Remove bloat, duplication; improve clarity         |
| Command | 🔵 `/pr-create`       | `/pr-create`            | Commit, push, and open a PR                        |
| Command | 🔵 `/pr-review`       | `/pr-review <PR#>`      | Review a PR (Markdown output)                      |
| Command | 🔵 `/pr-review-json`  | `/pr-review-json <PR#>` | Review a PR (JSON for inline comments)             |
| Skill   | 🔵 `dev-server`       | `/dev-server`           | Start dev server, check build status               |
| Skill   | 🔵 `git-conventions`  | `/git-conventions`      | Branch, commit, and PR naming conventions          |
| Skill   | 🟢 `technology-stack` | `/technology-stack`     | Architecture constraints and zero-dependency rules |
| Agent   | 🔵 `code-reviewer`    | Auto (after edits)      | Quality, security, and maintainability review      |

## Testing and Quality

| Type    | Name                     | Invoke                | What it does                                         |
| ------- | ------------------------ | --------------------- | ---------------------------------------------------- |
| Command | 🔵 `/git-bisect`         | `/git-bisect`         | Find the commit that introduced a regression         |
| Command | 🟠 `/sonar-fix`          | `/sonar-fix`          | Fetch and fix SonarCloud issues                      |
| Command | 🔵 `/batch-lint-cleanup` | `/batch-lint-cleanup` | Auto-fix ESLint violations by rule                   |
| Command | 🟠 `/previs`             | `/previs`             | PREVis visual quality evaluation on gallery examples |
| Skill   | 🟠 `optimize-series`     | `/optimize-series`    | Series rendering performance and GC optimisation     |
| Agent   | 🟠 `test-writer`         | Auto                  | Create Jest snapshot and Playwright E2E tests        |
| Agent   | 🔵 `playwright-expert`   | Auto                  | Playwright test architecture and debugging           |
| Agent   | 🟠 `example-tester`      | Auto                  | Validate AG Charts example correctness               |
| Agent   | 🟠 `visual-qa`           | Auto                  | Review visual regression image diffs                 |
| Agent   | 🟠 `previs-evaluator`    | Auto                  | PREVis methodology evaluation of visualisations      |

## Documentation and Examples

| Type    | Name                   | Invoke            | What it does                                          |
| ------- | ---------------------- | ----------------- | ----------------------------------------------------- |
| Command | 🟠 `/docs-create`      | `/docs-create`    | Scaffold a new documentation page                     |
| Command | 🟠 `/docs-review`      | `/docs-review`    | Review docs for accuracy and example consistency      |
| Command | 🟠 `/spruce-example`   | `/spruce-example` | Improve gallery examples to professional quality      |
| Skill   | 🟠 `spruce-docs`       | `/spruce-docs`    | Create or improve docs following established patterns |
| Skill   | 🟠 `plunker`           | `/plunker`        | Create and manage Plunker demos for AG Charts         |
| Agent   | 🟠 `data-viz-designer` | Auto              | Dataset selection, chart type guidance                |

## Planning and Analysis

| Type    | Name                               | Invoke                          | What it does                                       |
| ------- | ---------------------------------- | ------------------------------- | -------------------------------------------------- |
| Command | 🔵 `/plan-review`                  | `/plan-review`                  | Review plans for completeness and correctness      |
| Command | 🔵 `/plan-implementation-review`   | `/plan-implementation-review`   | Review plan execution, identify delivery gaps      |
| Command | 🟠 `/product-requirement-analysis` | `/product-requirement-analysis` | Analyse requirements with competitor research      |
| Command | 🟠 `/analyze-jira-issue`           | `/analyze-jira-issue <key>`     | Analyse a JIRA issue and propose solutions         |
| Skill   | 🟠 `estimate-jira`                 | `/estimate-jira`                | Estimate complexity, effort, and risks for tickets |
| Skill   | 🟠 `jira-create`                   | `/jira-create`                  | Create JIRA tickets with proper formatting         |
| Agent   | 🟠 `technical-research-analyst`    | Auto                            | In-depth technical research with citations         |
| Agent   | 🔵 `nx-expert`                     | Auto                            | Nx monorepo configuration and build optimisation   |

## Memory

| Type    | Name                   | Invoke              | What it does                                       |
| ------- | ---------------------- | ------------------- | -------------------------------------------------- |
| Command | 🔵 `/remember`         | `/remember`         | Save branch context or project learnings as memory |
| Command | 🔵 `/recall`           | `/recall`           | Load branch context, browse project memories       |
| Command | 🟠 `/optimise-context` | `/optimise-context` | Audit and reduce agentic tooling token usage       |

## Git and Branch Management

| Type    | Name                     | Invoke                | What it does                             |
| ------- | ------------------------ | --------------------- | ---------------------------------------- |
| Command | 🔵 `/git-worktree-clean` | `/git-worktree-clean` | Hard-reset worktree to `origin/latest`   |
| Command | 🔵 `/git-split`          | `/git-split`          | Split large files preserving git history |
| Command | 🔵 `/pr-split`           | `/pr-split`           | Split a branch into stacked PRs          |

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

| Rule                             | Activates on                                      | Description                                 |
| -------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| 🟢 `docs-pages`                  | `**/docs/**/*.mdoc`, `**/docs/**/_examples/**`    | Creating high-quality documentation pages   |
| 🟢 `docs-checklist`              | `**/docs/**/*.mdoc`                               | Pre-submission documentation checklist      |
| 🟢 `examples`                    | `**/_examples/**`, `**/gallery/**`                | Working with examples in AG Charts          |
| 🟢 `examples-framework-patterns` | `**/_examples/**`, `**/generate-example-files/**` | React, Angular, Vue transformation patterns |
| 🔵 `website-astro-pages`         | `**/src/pages/**/*.astro`, `**/src/layouts/**/*.astro` | Astro page patterns, layouts, and code conventions |
| 🔵 `website-browser-testing`     | `**/src/pages/**/*.astro`, `**/src/layouts/**/*.astro` | Chrome DevTools MCP browser testing workflow |
| 🔵 `website-css`                 | `**/src/pages-styles/**/*.scss`, design-system     | CSS architecture, design system, and styling |

### Playbooks

| Rule                  | Activates on                            | Description                                |
| --------------------- | --------------------------------------- | ------------------------------------------ |
| 🟢 `playbook-bug-fix` | `**/chart/**/*.ts`, `**/series/**/*.ts` | Bug fix and feature work playbook          |
| 🟢 `playbook-docs`    | `**/docs/**/*`                          | Documentation update playbook              |
| 🟢 `playbook-example` | `**/_examples/**`                       | Example creation and modification playbook |

### Other Rules

| Rule               | Activates on                                  | Description                         |
| ------------------ | --------------------------------------------- | ----------------------------------- |
| 🟠 `jira`          | Always (no glob)                              | JIRA ticket creation and management |
| 🔵 `setup-prompts` | `**/setup-prompts/**`, `**/patches/rulesync*` | Rulesync patching guide             |

---

## Skills Reference

Skills load on-demand when invoked. All skills are invoked via `/skill-name`. All skills are shared across AI tools via `.rulesync/skills/`.

| Skill                 | Description                                               |
| --------------------- | --------------------------------------------------------- |
| 🔵 `dev-server`       | Start dev server, check build status                      |
| 🟠 `estimate-jira`    | Estimate complexity, effort, and risks for JIRA tickets   |
| 🔵 `git-conventions`  | Branch, commit, and PR naming conventions                 |
| 🟠 `jira-create`      | Create JIRA tickets with proper formatting and templates  |
| 🟠 `optimize-series`  | Series performance optimisation and GC pressure reduction |
| 🟠 `plunker`          | Create and manage Plunker demos for AG Charts             |
| 🟢 `releases`         | Release conventions, branch naming, and constraints       |
| 🟠 `spruce-docs`      | Create or improve documentation following patterns        |
| 🟠 `spruce-example`   | Improve gallery examples to professional quality          |
| 🟢 `technology-stack` | Architecture constraints and zero-dependency requirements |

---

## Sub-Agents Reference

Sub-agents are spawned automatically when the AI determines a task matches their speciality. They cannot be invoked directly.

| Agent                           | Description                                             |
| ------------------------------- | ------------------------------------------------------- |
| 🔵 `code-reviewer`              | Reviews code for quality, security, and maintainability |
| 🟠 `data-viz-designer`          | Guides dataset selection and chart type choices         |
| 🟠 `example-tester`             | Tests AG Charts examples for correctness                |
| 🔵 `nx-expert`                  | Nx monorepo configuration and build optimisation        |
| 🔵 `playwright-expert`          | Playwright E2E test architecture and debugging          |
| 🟠 `previs-evaluator`           | PREVis methodology evaluation of visualisations         |
| 🟠 `technical-research-analyst` | In-depth technical research with citations              |
| 🟠 `test-writer`                | Creates Jest snapshot and Playwright E2E tests          |
| 🟠 `visual-qa`                  | Reviews visual regression test diffs                    |
