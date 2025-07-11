# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AG Charts is a sophisticated TypeScript monorepo providing canvas-based JavaScript charting library with both community (MIT) and enterprise (commercial) versions. Built with Nx, it supports React, Angular, and Vue 3 frameworks.

## Repository Conventions

-   The main branch of this repo is `latest`
-   Release branch names are of the form `b12.0.0`
-   JIRA-related branch should be named of the form `ag-12345/${kebabCaseChangeSummary}`

## Essential Commands

### Development Setup

```bash
yarn init                    # Install dependencies and setup
nx clean                   # Clean all dist folders
```

### Building

```bash
nx build <package>           # Build specific package
nx build:types <package>     # Generate TypeScript declarations
nx build:package <package>   # Create ESM/CJS bundles
nx build:umd <package>       # Create UMD browser bundles
nx run-many -t build         # Build all packages
```

### Testing

```bash
nx test <package>            # Run Jest unit tests
nx e2e <package>            # Run Playwright E2E tests
nx benchmark <package>       # Performance benchmarks
nx lint <package>           # ESLint + custom rules
```

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

### Adding New Chart Types

1. Implement in `packages/ag-charts-core/src/chart/series/`
2. Register module in appropriate community/enterprise package
3. Add TypeScript definitions in `packages/ag-charts-types/`
4. Update documentation in `packages/ag-charts-website/`

### Testing Changes

Always run both unit and visual regression tests:

```bash
nx test ag-charts-community
nx test ag-charts-enterprise
nx e2e ag-charts-website
```

### Performance Considerations

-   Use `nx benchmark` to check performance impact
-   Canvas rendering optimizations are critical
-   Memory profiling available through benchmark suite

## Technical Requirements

-   **Node.js**: ^20.10.0
-   **Package Manager**: Yarn v1.22.21
-   **Build Target**: ES2020 (excludes IE)
-   **TypeScript**: Strict mode enabled across all packages

## Nx Workflow

-   **Example Generation**:
    -   Use `nx generate-examples ag-charts-website` to exercise example generation

## Development Best Practices

-   Make sure to run `nx format` on any changes to ensure consistent formatting before commit.
-   Prefer running `nx format` in the root of the repo to format changes, as there are config nuances that aren't taken into account when directly running tooling in more specific places.

## Code Review Guidelines

-   When reviewing a PR, don't comment on lines not changed in the PR itself; we have tech-debt but can't fix it all at once.

## Tool Instructions

-   When asked to perform a review, use the instructions in tools/prompts/pr-review.md

## JIRA Ticket Search Guidelines

-   When searching for JIRA tickets using the MCP server `mcp-atlassian`, unless requested otherwise on this project we're only interested in tickets in the `AG` project with a component of `Charts`.
-   When searching for JIRA tickets that need review, we're usually interested in tickets with a status of `Needs Review`.

## Development Documentation Guidelines

-   When adding examples, make sure to also update the Markdoc page relating to the example (index.mdoc adjacent to the enclosing `_examples/` folder).

## Example File Requirements

-   Examples need to have a index.html file which nominally should just contain the content:
    ```
    <div id="myChart"></div>
    ```

## Documentation Resources

-   AG Charts architecture docs can be found at https://docs.ag-grid.com/architecture/charts/ag-charts-overview
    -   This provides an overview of the important aspects of the ag-charts codebase, as well as links to deeper dives into specific aspects. Use this as a reference if you need help navigating the code.

## Example Documentation Guidelines

-   Never add inline documentation to examples.
-   `-test` page examples are for internal testing and don't typically need much documentation.
-   Any other examples should be documented in the related `index.mdoc` file which should be a sibling of the enclosing parent folder `_examples`.

## Example Runner Guidelines

-   Examples have a `index.html` which is just a HTML snippet, not a full HTML document.
    -   Do not include <script> or other tags to load resources.
    -   `main.ts` is automatically included at runtime.
-   Styles for examples should be put into an adjacent `styles.css` file which will automatically be included at runtime.
    -   Styles in `external/ag-website-shared/src/components/example-runner/styles/example-controls.css` are applied automatically, and should be favoured for presenting controls in examples.

## Development Server Notes

-   Normally the Astro dev server is running on port 4600 (HTTPS) and you can just use it.
-   Note that example paths are mapped from repo paths:
    -   `packages/ag-charts-website/src/content/gallery/_examples/${exampleName}/index.html` => `/charts/gallery/examples/${exampleName}`
    -   `packages/ag-charts-website/src/content/docs/${pageName}/_examples/${exampleName}/index.html` => `/charts/vanilla/${pageName}/examples/${exampleName}`
-   Docs paths are mapped from repo paths:
    -   `packages/ag-charts-website/src/content/docs/${pageName}/index.mdoc` => `/charts/javascript/${pageName}/`

## Example Code Conventions

-   Examples typically have a `data.ts` with a `getData()` function (for single data-set examples) which includes the dataset used by the example.
-   If a TData type is useful for the example, `data.ts` should also declare this.