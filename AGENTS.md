# AI Agent Instructions

This file provides guidance to AI Agents when working with code in this repository.

## Quick Reference

-   **Main branch:** `latest`
-   **Format:** `yarn nx format` (run before commits)
-   **Type-check:** `yarn nx build:types <package>` (run before commits)
-   **Lint:** `yarn nx lint <package>` (run before commits)
-   **Build:** `yarn nx build <package>`
-   **Test:** `yarn nx test <package>`
-   **E2E:** `yarn nx e2e ag-charts-website`
-   **Dev server:** `yarn nx dev`

## Content Locations

-   **Rules:** `.rulesync/rules/` (guides, checklists, and domain-specific rules)
-   **Private prompts:** `external/prompts/` (commands, agents, skills, templates)

---

## Must-Know Checklist

-   **Yarn and Nx based repo:** Use Yarn for package management and Nx for build and test orchestration.
-   **Main constraint:** Community and enterprise runtime bundles stay dependency-free beyond AG Charts code.
-   **Default branch:** Target `latest`; follow release/JIRA naming conventions below for topic branches.
-   **Build monitoring:** Check `node_modules/.cache/ag-watch-status.json` to monitor watch state (`yarn nx dev`) and build health (see [Development Server Guide](.rulesync/rules/dev-server.md)).
-   **Formatting:** Run `yarn nx format` from the repo root before proposing commits.
-   **Typechecking:** Run `yarn nx build:types <package>` from the repo root before proposing commits.
-   **Linting:** Run `yarn nx lint <package>` from the repo root before proposing commits.
-   **Baseline verification:** Expect to run `yarn nx test ag-charts-community`, `yarn nx test ag-charts-enterprise`, and `yarn nx e2e ag-charts-website` after meaningful chart changes.
-   **Test verification patterns:** When writing or modifying tests, review similar tests to ensure consistent verification patterns (see [Testing Guide](.rulesync/rules/testing.md)).
-   **Technology stack:** Review the [technology stack rules](.rulesync/rules/technology-stack.md) for architectural decisions before introducing new patterns.

## Specialized Guides

For detailed information on specific topics, consult these guides:

-   **[Testing Guide](.rulesync/rules/testing.md)** - Testing strategies, best practices, and philosophy
-   **[Examples Guide](.rulesync/rules/examples.md)** - Working with examples, validation, and path mappings
-   **[Documentation Pages Guide](.rulesync/rules/docs-pages.md)** - Creating consistent, high-quality documentation pages
-   **[JIRA Guide](.rulesync/rules/jira.md)** - JIRA ticket search and creation guidelines
-   **[Code Quality Guide](.rulesync/rules/code-quality.md)** - Code bloat avoidance, comments, and review practices
-   **[Default Values Guide](.rulesync/rules/defaults.md)** - Understanding the three-tier default system and theme configuration
-   **[Development Server Guide](.rulesync/rules/dev-server.md)** - Dev server setup and build watch monitoring
-   **[Benchmarks Guide](.rulesync/rules/benchmarks.md)** - Running and creating performance benchmarks
-   **[Releases Guide](.rulesync/rules/releases.md)** - Release conventions and guidelines
-   **[Series Guide](.rulesync/rules/series.md)** - Series development architecture and patterns
-   **[Data Model Guide](.rulesync/rules/data-model.md)** - Data processing principles

## Project Overview

AG Charts is a sophisticated TypeScript monorepo providing canvas-based JavaScript charting library with both community (MIT) and enterprise (commercial) versions. Built with Nx, it supports React, Angular, and Vue 3 frameworks.

## Technology Stack

**Key Constraint:** The main AG Charts libraries must have ZERO third-party runtime dependencies.

See the [Technology Stack](.rulesync/rules/technology-stack.md) for detailed information about preferred technologies and architectural constraints.

## Repository Conventions

-   The main branch of this repo is `latest`
-   Release branch names are of the form `b12.0.0` (see [Releases Guide](.rulesync/rules/releases.md))
-   JIRA-related branch should be named of the form `ag-12345/${kebabCaseChangeSummary}`
-   **Language conventions:** UK/British English for documentation text, comments, and JSDocs; US English for API option names (see [Documentation Pages Guide](.rulesync/rules/docs-pages.md#language-conventions))

## Essential Commands

-   `yarn install` – install dependencies after cloning or when the Yarn lockfile changes.
    -   `./external/ag-shared/scripts/install-for-cloud/install-for-cloud.sh` – install dependencies and tooling in a remote environment - use this in preference to `yarn install` to ensure all global tools are installed.
-   `yarn nx clean` – purge all dist folders when switching branches or before packaging releases.
-   `yarn nx format` – format repo files; run from the project root before committing.
-   `yarn nx build <package>` – compile a specific package after code edits.
-   `yarn nx build:types <package>` – regenerate declaration files when touching exported APIs.
-   `yarn nx build:package <package>` – create ESM/CJS bundles to validate publishable output.
-   `yarn nx build:umd <package>` – produce UMD bundles for browser distribution smoke-tests.
-   `yarn nx run-many -t build` – rebuild all packages when changes span the dependency graph.
-   `yarn nx test <package>` – execute Jest suites for the affected package.
-   `yarn nx test <package> --testPathPattern="<file-name>"` - test specific test file
-   `yarn nx test <package> --testPathPattern="<file-name>" --testNamePattern="<test-name>"` - test specific test name in a specific test file
-   `yarn nx e2e <package>` – run Playwright flows when altering website behaviour.
-   `yarn nx lint <package>` – apply ESLint and custom rules before final review.
-   `yarn nx benchmark <package>` – assess performance regressions; filter via `-- -t "pattern"` when needed.

## Slash Commands

NOTE: These are only intended for agentic tools that don't support custom slash commands, such as Cursor or Codex.

-   `/spruce-example` - execute `external/prompts/commands/spruce-example.md` on specified example.
-   `/pr-review` - execute `external/prompts/commands/pr-review.md` on specified PR.
-   `/release-options-review` - execute `external/prompts/commands/release-options-review.md` on specified release options.
-   `/release-docs-review` - execute `external/prompts/commands/release-docs-review.md` to review all documentation changes between releases.
-   `/prepare-release-notes` - execute `external/prompts/commands/prepare-release-notes.md` to prepare release notes.
-   `/docs-create` - execute `external/prompts/commands/docs-create.md` to scaffold a new documentation page.
-   `/docs-review` - execute `external/prompts/commands/docs-review.md` on specified docs.
-   `/distil` - execute `external/prompts/commands/distil.md` to reduce code bloat, redundant code and comments, and productionize changes on the current branch.
-   `/sonar-fix` - execute `external/prompts/commands/sonar-fix.md` to review and fix SonarCloud issues.
-   `/lint-fix` - execute `external/prompts/commands/lint-fix.md` to fix linting issues.
-   `/fixup` - execute `external/prompts/commands/fixup.md` for quick fixes to common issues.
-   `/split` - execute `external/prompts/commands/split.md` to split large changes into smaller commits.
-   `/previs` - execute `external/prompts/commands/previs.md` to run PREVis visual quality evaluation.

## Architecture

### Monorepo Structure

-   **packages/ag-charts-core/**: Core utilities and shared code
-   **packages/ag-charts-community/**: MIT licensed version
-   **packages/ag-charts-enterprise/**: Commercial version with advanced features
-   **packages/ag-charts-types/**: TypeScript definitions
-   **packages/ag-charts-locale/**: Internationalization (40+ languages)
-   **packages/ag-charts-react/angular/vue3/**: Framework wrappers
-   **packages/ag-charts-website/**: Astro documentation site
-   **libraries/**: Internal utilities and shared code
-   **plugins/**: Nx plugins for code generation
-   **external/**: Shared AG Grid ecosystem code

### Build Dependencies

Core dependency chain: `ag-charts-core` → `ag-charts-types` → `ag-charts-locale` → `ag-charts-community` → `ag-charts-enterprise` → framework wrappers

### Key Patterns

-   **Canvas-based rendering**: High-performance custom scene graph
-   **Modular plugin architecture**: Extensible chart types through module registration
-   **Framework agnostic core**: Clean separation with framework-specific wrappers
-   **Enterprise/community split**: Feature flagging through separate packages

## Development Workflow

### Testing

For comprehensive testing information, see [Testing Guide](.rulesync/rules/testing.md).

Key testing tools:

-   **Unit tests**: Jest with jsdom environment and image snapshots
-   **E2E tests**: Playwright for website interaction testing
-   **Benchmarks**: Performance regression testing with memory profiling
-   **Visual regression**: Canvas rendering snapshot comparisons

### Code Quality

For code quality guidelines, see [Code Quality Guide](.rulesync/rules/code-quality.md).

Essential practices:

-   Run `yarn nx format` before committing
-   Self-review your changes before proposing commits
-   Ensure tests exercise real implementations, not test helpers

## Common Development Tasks

### Quick Playbooks

-   **Bug fix or feature work (core/community/enterprise)**
    1. Update the affected implementation (typically under `packages/ag-charts-*/src/chart`).
    2. Adjust public API surface in `packages/ag-charts-types` if signatures change.
    3. Sync any dependent docs/examples.
    4. Run `yarn nx test ag-charts-community`, `yarn nx test ag-charts-enterprise`, and targeted `yarn nx benchmark` commands when performance is at risk.
-   **Documentation/content update**
    1. Consult the [Documentation Pages Guide](.rulesync/rules/docs-pages.md) for structure and patterns.
    2. If creating a new page, use `/docs-create` command or select appropriate template from `external/prompts/templates/`.
    3. Modify the relevant `.mdoc` under `packages/ag-charts-website/src/content/docs/`.
    4. Update `packages/ag-charts-website/src/content/docs-nav/nav.json` if navigation changes.
    5. Create or update examples in `_examples/` folder following the [Examples Guide](.rulesync/rules/examples.md).
    6. Ensure all examples are framework-compatible (NO `@ag-skip-fws` for public documentation).
    7. Run `yarn nx generate-examples ag-charts-website` to generate framework variants.
    8. Run `yarn nx validate-examples` to verify examples typecheck correctly.
    9. Test page in dev server with `yarn nx dev` across all frameworks.
    10. For significant doc changes, sanity-check with `yarn nx e2e ag-charts-website`.
    11. Optionally run `/docs-review` command to validate technical accuracy.
    12. Review [Documentation Checklist](.rulesync/rules/docs-checklist.md) before finalizing.
-   **Example-only change** (see [Examples Guide](.rulesync/rules/examples.md))
    1. Edit the example files (`index.html`, `main.ts`, optional `styles.css`/`data.ts`).
    2. Mirror updates in the sibling `index.mdoc` docs page.
    3. Run the relevant generation/typecheck command plus `yarn nx validate-examples`.

### Adding New Chart Types

-   Implement the series in `packages/ag-charts-core/src/chart/series/`.
-   Register the module in the matching community and/or enterprise package.
-   Extend TypeScript definitions in `packages/ag-charts-types/`.
-   Document the feature within `packages/ag-charts-website/` (including examples when appropriate).

### Working with Examples

For detailed example guidelines, see [Examples Guide](.rulesync/rules/examples.md).

**Framework Generation:**

Examples are automatically transformed from vanilla TypeScript into React, Angular, and Vue variants. **All public documentation examples MUST work across all frameworks.**

When creating or modifying examples:

-   **Public examples MUST be framework-compatible**: All documentation examples must work in vanilla, TypeScript, React, Angular, and Vue
-   **Write framework-compatible vanilla examples first**: Follow patterns in the Examples Guide to ensure clean transformation
-   **Use simple, declarative patterns**: Top-level options, chart instance, and simple event handlers transform cleanly
-   **Test generated variants**: Run `yarn nx validate-examples` and visually test framework switcher in dev server
-   **`@ag-skip-fws` is for internal use ONLY**: Only use for `benchmarks` and `*-test` pages, never for public documentation
-   **Redesign instead of skip**: If a public example can't transform cleanly, simplify or redesign it to be framework-compatible
-   **Review transformation patterns**: See [Framework Patterns Guide](.rulesync/rules/examples-framework-patterns.md) for detailed technical reference

**Quick Framework Compatibility Checklist:**

-   Container uses `document.getElementById('myChart')`
-   Options stored in top-level variable
-   Chart instance stored in top-level variable
-   Event handlers are simple function calls: `onclick="updateChart()"`
-   Functions are top-level (not nested)
-   No complex DOM manipulation beyond controls
-   No external library dependencies

### Performance and Benchmarks

For benchmark guidelines, see [Benchmarks Guide](.rulesync/rules/benchmarks.md).

Key points:

-   Use `yarn nx benchmark` to check performance impact on hotspots.
-   Focus on canvas rendering efficiency and memory churn.
-   Enable `AG_BENCHMARK_DEBUG=1` locally for detailed memory output.

## Technical Requirements

-   **Node.js**: ^20.19.4
-   **Package Manager**: Yarn v1.22.21
-   **Build Target**: ES2020 (excludes IE)
-   **TypeScript**: Strict mode enabled across all packages

## Nx Workflow

-   **Example Generation**:
    -   Use `yarn nx generate-examples ag-charts-website` to exercise example generation
    -   Use `yarn nx generate-thumbnails ag-charts-website` to exercise thumbnail generation

## JIRA Tickets

For JIRA ticket guidelines, see [JIRA Guide](.rulesync/rules/jira.md).

## Documentation Resources

-   AG Charts architecture overview: https://docs.ag-grid.com/architecture/charts/ag-charts-overview (entry point to deeper design references).
