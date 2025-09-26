# AI Agent Instructions

This file provides guidance to AI Agents when working with code in this repository.

## Must-Know Checklist

-   **Main constraint:** Community and enterprise runtime bundles stay dependency-free beyond AG Charts code.
-   **Default branch:** Target `latest`; follow release/JIRA naming conventions below for topic branches.
-   **Build monitoring:** Check `node_modules/.cache/ag-watch-status.json` to monitor watch state (`nx dev`) and build health (see [Build Watch Status Monitoring](#build-watch-status-monitoring)).
-   **Formatting:** Run `nx format` from the repo root before proposing commits.
-   **Typechecking:** Run `nx build:types <package>` from the repo root before proposing commits.
-   **Linting:** Run `nx lint <package>` from the repo root before proposing commits.
-   **Baseline verification:** Expect to run `nx test ag-charts-community`, `nx test ag-charts-enterprise`, and `nx e2e ag-charts-website` after meaningful chart changes.
-   **Context docs:** Skim `tools/prompts/technology-stack.md` for stack or architectural decisions before introducing new patterns.

## Project Overview

AG Charts is a sophisticated TypeScript monorepo providing canvas-based JavaScript charting library with both community (MIT) and enterprise (commercial) versions. Built with Nx, it supports React, Angular, and Vue 3 frameworks.

## Technology Stack

For detailed information about preferred technologies and architectural constraints, see [Technology Stack](tools/prompts/technology-stack.md).

**Key Constraint:** The main AG Charts libraries must have ZERO third-party runtime dependencies.

## Repository Conventions

-   The main branch of this repo is `latest`
-   Release branch names are of the form `b12.0.0`
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
-   `nx e2e <package>` – run Playwright flows when altering website behaviour.
-   `nx lint <package>` – apply ESLint and custom rules before final review.
-   `nx benchmark <package>` – assess performance regressions; filter via `-- -t "pattern"` when needed.

## Slash Commands

NOTE: These are only intended for agentic tools that don't support custom slash commands, such as Cursor or Codex.

-   `/spruce-example` - execute `tools/prompts/commands/spruce-example.md` on specified example.
-   `/pr-review` - execute `tools/prompts/commands/pr-review.md` on specified PR.
-   `/release-options-review` - execute `tools/prompts/commands/release-options-review.md` on specified release options.
-   `/docs-review` - execute `tools/prompts/commands/docs-review.md` on specified docs.

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

### Testing Strategy

-   **Unit tests**: Jest with jsdom environment and image snapshots
-   **E2E tests**: Playwright for website interaction testing
-   **Benchmarks**: Performance regression testing with memory profiling
-   **Visual regression**: Canvas rendering snapshot comparisons

### Code Quality

-   **ESLint**: Comprehensive setup with TypeScript rules, SonarJS, and custom AG Charts rules
-   **TypeScript**: Strict type checking with multiple tsconfig files for different build targets
-   **Nx**: Advanced caching and task orchestration for optimal build performance

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
-   **Example-only change**
    1. Edit the example files (`index.html`, `main.ts`, optional `styles.css`/`data.ts`).
    2. Mirror updates in the sibling `index.mdoc` docs page.
    3. Run the relevant generation/typecheck command plus `nx validate-examples` (see [Example Validation + Building](#example-validation--building)).

### Adding New Chart Types

-   Implement the series in `packages/ag-charts-core/src/chart/series/`.
-   Register the module in the matching community and/or enterprise package.
-   Extend TypeScript definitions in `packages/ag-charts-types/`.
-   Document the feature within `packages/ag-charts-website/` (including examples when appropriate).

### Performance Considerations

-   Use `nx benchmark` to check performance impact on hotspots.
-   Focus on canvas rendering efficiency and memory churn.
-   Enable `AG_BENCHMARK_DEBUG=1` locally for detailed memory output.

### Benchmarks

-   Benchmark suites live in `packages/ag-charts-{community,enterprise}/benchmarks/`.
-   Visual snapshots run by default; set `BENCHMARK_SOFT_FAIL=1` in CI to skip them.
-   Enterprise benchmarks re-export community utilities via `packages/ag-charts-enterprise/benchmarks/benchmark.ts`.

#### Running Benchmarks

-   `nx benchmark ag-charts-community -- -t "initial load"` runs all "initial load" cases for community.
-   `nx benchmark ag-charts-enterprise -- -t "initial load"` does the same for enterprise.
-   Filtering is by test name pattern (xargs prevents targeting individual files).

## Technical Requirements

-   **Node.js**: ^20.19.4
-   **Package Manager**: Yarn v1.22.21
-   **Build Target**: ES2020 (excludes IE)
-   **TypeScript**: Strict mode enabled across all packages

## Nx Workflow

-   **Example Generation**:
    -   Use `nx generate-examples ag-charts-website` to exercise example generation
    -   Use `nx generate-thumbnails ag-charts-website` to exercise thumbnail generation

## Development Best Practices

-   Make sure to run `nx format` on any changes to ensure consistent formatting before commit.
-   Prefer running `nx format` in the root of the repo to format changes, as there are config nuances that aren't taken into account when directly running tooling in more specific places.

## Code Review Guidelines

-   When reviewing a PR, don't comment on lines not changed in the PR itself; we have tech-debt but can't fix it all at once.
-   See `tools/prompts/pr-review.md` for detailed PR review instructions.

## JIRA Ticket Search Guidelines

-   When searching for JIRA tickets using the MCP server `mcp-ag-jira`, unless requested otherwise on this project we're only interested in tickets in the `AG` project with a component of `Charts`.
-   When searching for JIRA tickets that need review, we're usually interested in tickets with a status of `Needs Review`.

## Documentation Resources

-   AG Charts architecture overview: https://docs.ag-grid.com/architecture/charts/ag-charts-overview (entry point to deeper design references).

## Production URLs

-   The production base URLs for the Astro site is https://www.ag-grid.com/

## Staging URLs

-   The staging base URLs for the Astro site is https://charts-staging.ag-grid.com/
    -   NOTE: That the `/charts` path prefix is not used for paths on the staging site.

## Development Server Notes

### Astro Dev Server Checklist

-   Prefer the shared HTTPS server on port 4600 when available.
-   When using the Puppeteer MCP tool, pass `allowDangerous: true`, run headless, and include `--ignore-certificate-errors` to handle the self-signed cert.
-   Start a local watcher with `nx dev` whenever you need live rebuilds across packages and the website.
-   `packages/ag-charts-website/src/content/gallery/data.json` owns gallery example metadata.
-   `packages/ag-charts-website/src/content/docs-nav/nav.json` owns docs navigation structure.
-   Docs map from `packages/ag-charts-website/src/content/docs/${pageName}/index.mdoc` to `/charts/javascript/${pageName}/`.

### Build Watch Status Monitoring

The `nx dev` watch script (`external/ag-shared/scripts/watch/watch.js`) maintains a status file at `node_modules/.cache/ag-watch-status.json` for monitoring build state.

**Check this file to**:

-   Ensure no builds are in progress before starting operations (status != `BUILDING`)
-   Monitor build health via `recentBuilds` array and `targetHistory` stats
-   Track build progress after file changes

**Key fields**:

-   `status`: `STARTING` | `RUNNING` | `BUILDING` | `IDLE` | `STOPPED`
-   `currentBuild`: Active build details (only when `BUILDING`)
-   `recentBuilds`: Last 10 builds with status/duration/errors
-   `targetHistory`: Per-target success/failure counts

**Usage**:

```bash
# Wait for idle before operations
while [ "$(jq -r '.status' node_modules/.cache/ag-watch-status.json 2>/dev/null)" = "BUILDING" ]; do
  sleep 2
done

# Start watch if needed
node external/ag-shared/scripts/watch/watch.js charts &
```

## Examples

### Repo to dev server paths

-   Note that example paths are mapped from repo paths:
    -   `packages/ag-charts-website/src/content/gallery/_examples/${exampleName}/index.html` => `/charts/gallery/examples/${exampleName}`
    -   `packages/ag-charts-website/src/content/docs/${pageName}/_examples/${exampleName}/index.html` => `/charts/vanilla/${pageName}/examples/${exampleName}`

### Example Guidelines

-   When adding examples, make sure to also update the Markdoc page relating to the example (index.mdoc adjacent to the enclosing `_examples/` folder).
-   Never add inline documentation to examples.
-   `-test` page examples are for internal testing and don't typically need much documentation.
-   Any other examples should be documented in the related `index.mdoc` file which should be a sibling of the enclosing parent folder `_examples`.
-   Examples have a `index.html` which is just a HTML snippet, not a full HTML document.
    -   Do not include <script> or other tags to load resources.
    -   `main.ts` is automatically included at runtime.
    -   Example:
        ```
        <div id="myChart"></div>
        ```
-   Styles for examples should be put into an adjacent `styles.css` file which will automatically be included at runtime.
    -   Styles in `external/ag-website-shared/src/components/example-runner/styles/example-controls.css` are applied automatically, and should be favoured for presenting controls in examples.
-   Examples typically have a `data.ts` with a `getData()` function (for single data-set examples) which includes the dataset used by the example.
-   If a TData type is useful for the example, `data.ts` should also declare this.
-   For deeper architectural context, see [Documentation Resources](#documentation-resources).

### Example Validation + Building

-   **Gallery example** (`packages/ag-charts-website/src/content/gallery/_examples/${exampleName}/`)
    -   `nx run ag-charts-website-gallery_${exampleName}_main.ts:generate`
    -   `nx run ag-charts-website-gallery_${exampleName}_main.ts:typecheck`
-   **Docs example** (`packages/ag-charts-website/src/content/docs/${pageName}/_examples/${exampleName}/`)
    -   `nx run ag-charts-website-${pageName}_${exampleName}_main.ts:generate`
    -   `nx run ag-charts-website-${pageName}_${exampleName}_main.ts:typecheck`
-   **All examples**
    -   `nx validate-examples` (batch typecheck; much faster than individual targets).
-   **Ad-hoc or `-test` examples**
    -   Add `// @ag-skip-fws` to `main.ts` to skip framework variant generation.

## Releases

-   Releases are typically monthly for minor releases, and 6-monthly for major releases (typically in June and December).
-   Patch releases are typically only for critical bug fixes, at most weekly.
-   Minor releases cannot have breaking changes, we must hold these back for major releases.
    -   Deprecations are allowed, but must be clearly marked as deprecated and still work as before.
    -   Deprecated features/options are typically immediately removed from public website documentation to discourage use.
