# AI Agent Instructions

This file provides guidance to AI Agents when working with code in this repository.

## Must-Know Checklist

-   **Yarn and Nx based repo:** Use Yarn for package management and Nx for build and test orchestration.
-   **Main constraint:** Community and enterprise runtime bundles stay dependency-free beyond AG Charts code.
-   **Default branch:** Target `latest`; follow release/JIRA naming conventions below for topic branches.
-   **Build monitoring:** Check `node_modules/.cache/ag-watch-status.json` to monitor watch state (`nx dev`) and build health (see [Development Server Guide](tools/prompts/guides/dev-server.md)).
-   **Formatting:** Run `nx format` from the repo root before proposing commits.
-   **Typechecking:** Run `nx build:types <package>` from the repo root before proposing commits.
-   **Linting:** Run `nx lint <package>` from the repo root before proposing commits.
-   **Baseline verification:** Expect to run `nx test ag-charts-community`, `nx test ag-charts-enterprise`, and `nx e2e ag-charts-website` after meaningful chart changes.
-   **Test verification patterns:** When writing or modifying tests, review similar tests to ensure consistent verification patterns (see [Testing Guide](tools/prompts/guides/testing.md)).
-   **Context docs:** Skim `tools/prompts/technology-stack.md` for stack or architectural decisions before introducing new patterns.

## Specialized Guides

For detailed information on specific topics, consult these guides:

-   **[Testing Guide](tools/prompts/guides/testing.md)** - Testing strategies, best practices, and philosophy
-   **[Examples Guide](tools/prompts/guides/examples.md)** - Working with examples, validation, and path mappings
-   **[JIRA Guide](tools/prompts/guides/jira.md)** - JIRA ticket search and creation guidelines
-   **[Code Quality Guide](tools/prompts/guides/code-quality.md)** - Code bloat avoidance, comments, and review practices
-   **[Default Values Guide](tools/prompts/guides/defaults.md)** - Understanding the three-tier default system and theme configuration
-   **[Development Server Guide](tools/prompts/guides/dev-server.md)** - Dev server setup and build watch monitoring
-   **[Benchmarks Guide](tools/prompts/guides/benchmarks.md)** - Running and creating performance benchmarks
-   **[Releases Guide](tools/prompts/guides/releases.md)** - Release conventions and guidelines

## Project Overview

AG Charts is a sophisticated TypeScript monorepo providing canvas-based JavaScript charting library with both community (MIT) and enterprise (commercial) versions. Built with Nx, it supports React, Angular, and Vue 3 frameworks.

## Technology Stack

For detailed information about preferred technologies and architectural constraints, see [Technology Stack](tools/prompts/technology-stack.md).

**Key Constraint:** The main AG Charts libraries must have ZERO third-party runtime dependencies.

## Repository Conventions

-   The main branch of this repo is `latest`
-   Release branch names are of the form `b12.0.0` (see [Releases Guide](tools/prompts/guides/releases.md))
-   JIRA-related branch should be named of the form `ag-12345/${kebabCaseChangeSummary}`

## Essential Commands

-   `yarn init` – install dependencies after cloning or when the Yarn lockfile changes.
-   `nx clean` – purge all dist folders when switching branches or before packaging releases.
-   `nx format` – format repo files; run from the project root before committing.
-   `nx build <package>` – compile a specific package after code edits.
-   `nx build:types <package>` – regenerate declaration files when touching exported APIs.
-   `nx build:package <package>` – create ESM/CJS bundles to validate publishable output.
-   `nx build:umd <package>` – produce UMD bundles for browser distribution smoke-tests.
-   `nx run-many -t build` – rebuild all packages when changes span the dependency graph.
-   `nx test <package>` – execute Jest suites for the affected package.
-   `nx test <package> --testPathPattern="<file-name>"` - test specific test file
-   `nx test <package> --testPathPattern="<file-name>" --testNamePattern="<test-name>"` - test specific test name in a specific test file
-   `nx e2e <package>` – run Playwright flows when altering website behaviour.
-   `nx lint <package>` – apply ESLint and custom rules before final review.
-   `nx benchmark <package>` – assess performance regressions; filter via `-- -t "pattern"` when needed.

## Slash Commands

NOTE: These are only intended for agentic tools that don't support custom slash commands, such as Cursor or Codex.

-   `/spruce-example` - execute `tools/prompts/commands/spruce-example.md` on specified example.
-   `/pr-review` - execute `tools/prompts/commands/pr-review.md` on specified PR.
-   `/release-options-review` - execute `tools/prompts/commands/release-options-review.md` on specified release options.
-   `/release-docs-review` - execute `tools/prompts/commands/release-docs-review.md` to review all documentation changes between releases.
-   `/docs-review` - execute `tools/prompts/commands/docs-review.md` on specified docs.
-   `/distil` - execute `tools/prompts/commands/distil.md` to reduce code bloat, redundant code and comments, and productionize changes on the current branch.
-   `/sonar-fix` - execute `tools/prompts/commands/sonar-fix.md` to review and fix SonarCloud issues.

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

For comprehensive testing information, see [Testing Guide](tools/prompts/guides/testing.md).

Key testing tools:

-   **Unit tests**: Jest with jsdom environment and image snapshots
-   **E2E tests**: Playwright for website interaction testing
-   **Benchmarks**: Performance regression testing with memory profiling
-   **Visual regression**: Canvas rendering snapshot comparisons

### Code Quality

For code quality guidelines, see [Code Quality Guide](tools/prompts/guides/code-quality.md).

Essential practices:

-   Run `nx format` before committing
-   Self-review your changes before proposing commits
-   Ensure tests exercise real implementations, not test helpers

## Common Development Tasks

### Quick Playbooks

-   **Bug fix or feature work (core/community/enterprise)**
    1. Update the affected implementation (typically under `packages/ag-charts-*/src/chart`).
    2. Adjust public API surface in `packages/ag-charts-types` if signatures change.
    3. Sync any dependent docs/examples.
    4. Run `nx test ag-charts-community`, `nx test ag-charts-enterprise`, and targeted `nx benchmark` commands when performance is at risk.
-   **Documentation/content update**
    1. Modify the relevant `.mdoc` under `packages/ag-charts-website/src/content/docs/`.
    2. Update `packages/ag-charts-website/src/content/docs-nav/nav.json` if navigation changes.
    3. For significant doc changes, sanity-check with `nx e2e ag-charts-website`.
-   **Example-only change** (see [Examples Guide](tools/prompts/guides/examples.md))
    1. Edit the example files (`index.html`, `main.ts`, optional `styles.css`/`data.ts`).
    2. Mirror updates in the sibling `index.mdoc` docs page.
    3. Run the relevant generation/typecheck command plus `nx validate-examples`.

### Adding New Chart Types

-   Implement the series in `packages/ag-charts-core/src/chart/series/`.
-   Register the module in the matching community and/or enterprise package.
-   Extend TypeScript definitions in `packages/ag-charts-types/`.
-   Document the feature within `packages/ag-charts-website/` (including examples when appropriate).

### Working with Examples

For detailed example guidelines, see [Examples Guide](tools/prompts/guides/examples.md).

### Performance and Benchmarks

For benchmark guidelines, see [Benchmarks Guide](tools/prompts/guides/benchmarks.md).

Key points:

-   Use `nx benchmark` to check performance impact on hotspots.
-   Focus on canvas rendering efficiency and memory churn.
-   Enable `AG_BENCHMARK_DEBUG=1` locally for detailed memory output.

## Technical Requirements

-   **Node.js**: ^20.19.4
-   **Package Manager**: Yarn v1.22.21
-   **Build Target**: ES2020 (excludes IE)
-   **TypeScript**: Strict mode enabled across all packages

## Nx Workflow

-   **Example Generation**:
    -   Use `nx generate-examples ag-charts-website` to exercise example generation
    -   Use `nx generate-thumbnails ag-charts-website` to exercise thumbnail generation

## JIRA Tickets

For JIRA ticket guidelines, see [JIRA Guide](tools/prompts/guides/jira.md).

## Documentation Resources

-   AG Charts architecture overview: https://docs.ag-grid.com/architecture/charts/ag-charts-overview (entry point to deeper design references).
