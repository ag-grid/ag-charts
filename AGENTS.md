Please also reference the following rules as needed. The list below is provided in TOON format, and `@` stands for the project root directory.

rules[26]:
  - path: @.agents/memories/api-contracts.md
  - path: @.agents/memories/benchmarks.md
    description: Running and creating performance benchmarks for AG Charts
    applyTo[2]: **/benchmarks/**,**/*.benchmark.ts
  - path: @.agents/memories/browser-benchmarks.md
    description: Browser-based benchmark harness for AG Charts performance testing
    applyTo[2]: **/*-test/_examples/**/main.ts,**/benchmarks/**/*
  - path: @.agents/memories/cartesian-series-types.md
    description: CartesianSeries consolidated generic types pattern documentation
    applyTo[2]: **/series/cartesian/**/*.ts,**/series/**/*Series.ts
  - path: @.agents/memories/code-quality.md
    description: "Code quality practices including avoiding bloat, comment guidelines, and review practices"
    applyTo[1]: packages/*/src/**/*.ts
  - path: @.agents/memories/data-model.md
    description: Data model principles and patterns for AG Charts series data processing
    applyTo[1]: packages/ag-charts-*/src/**/data-model/**/*.ts
  - path: @.agents/memories/defaults.md
    description: Understanding the three-tier default system and theme configuration in AG Charts
    applyTo[3]: packages/ag-charts-*/src/**/*Module.ts,packages/ag-charts-*/src/**/*Properties.ts,packages/ag-charts-*/src/**/*Options.ts
  - path: @.agents/memories/docker.md
    description: Docker usage patterns for AG Charts examples and SSR
    applyTo[3]: **/.docker/**,**/Dockerfile,**/docker-compose*
  - path: @.agents/memories/docs-checklist.md
    description: Pre-submission checklist for AG Charts documentation pages ensuring consistency and quality
    applyTo[1]: packages/ag-charts-website/src/content/docs/**/*.mdoc
  - path: @.agents/memories/docs-pages.md
    description: "Comprehensive guidance for creating high-quality, consistent AG Charts documentation pages"
    applyTo[2]: packages/ag-charts-website/src/content/docs/**/*.mdoc,packages/ag-charts-website/src/content/docs/**/_examples/**/*
  - path: @.agents/memories/docs-review-testing.md
  - path: @.agents/memories/examples-framework-patterns.md
    description: "Technical reference for how AG Charts examples are transformed from vanilla TypeScript into React, Angular, and Vue variants"
    applyTo[2]: **/_examples/**/*,plugins/ag-charts-generate-example-files/**/*
  - path: @.agents/memories/examples.md
    description: "Guidelines for working with examples in AG Charts including validation, path mappings, and framework generation"
    applyTo[2]: **/_examples/**/*,packages/ag-charts-website/src/content/gallery/**/*
  - path: @.agents/memories/jira.md
    description: Guidelines for searching and creating JIRA tickets in AG products
  - path: @.agents/memories/nx-conventions.md
    description: Nx project configuration conventions
    applyTo[2]: **/project.json,nx.json
  - path: @.agents/memories/playbook-bug-fix.md
    description: Bug fix and feature work playbook for core chart code
    applyTo[2]: packages/ag-charts-*/src/chart/**/*.ts,packages/ag-charts-*/src/series/**/*.ts
  - path: @.agents/memories/playbook-docs.md
    description: Documentation and content update playbook
    applyTo[1]: packages/ag-charts-website/src/content/docs/**/*
  - path: @.agents/memories/playbook-example.md
    description: Example creation and modification playbook
    applyTo[1]: **/_examples/**/*
  - path: @.agents/memories/series-performance-optimization.md
    description: Series performance quick reference - use /optimize-series for full guide
    applyTo[1]: **/series/**/*.ts
  - path: @.agents/memories/series.md
    description: "Series development guide for AG Charts including architecture, performance patterns, and data flow"
    applyTo[2]: **/series/**/*.ts,**/series/**/*.test.ts
  - path: @.agents/memories/server-side-rendering.md
    description: Server-side rendering patterns and global usage constraints
    applyTo[1]: packages/ag-charts-server-side/src/**/*
  - path: @.agents/memories/setup-prompts.md
    applyTo[2]: **/setup-prompts/**/*,**/patches/rulesync*
  - path: @.agents/memories/testing.md
    description: "Testing strategies, best practices, and philosophy for AG Charts development"
    applyTo[4]: **/*.test.ts,**/*.spec.ts,**/test/**,**/__tests__/**
  - path: @.agents/memories/website-astro-pages.md
    description: "Astro page creation patterns, layout props, content collections, and code conventions for AG product websites"
    applyTo[2]: **/src/pages/**/*.astro,**/src/layouts/**/*.astro
  - path: @.agents/memories/website-browser-testing.md
    description: Chrome DevTools MCP browser testing workflow for AG product websites
    applyTo[2]: **/src/pages/**/*.astro,**/src/layouts/**/*.astro
  - path: @.agents/memories/website-css.md
    description: "CSS architecture, design system, design tokens, utility classes, and styling patterns for AG product websites"
    applyTo[4]: **/src/pages-styles/**/*.scss,**/src/pages-styles/**/*.css,**/src/components/**/*.scss,external/ag-website-shared/src/design-system/**/*.scss

# Additional Conventions Beyond the Built-in Functions

As this project's AI coding tool, you must follow the additional conventions below, in addition to the built-in functions.

# AI Agent Instructions

## Project Overview

AG Charts is a TypeScript monorepo providing a canvas-based charting library with community (MIT) and enterprise (commercial) versions. Built with Nx and Yarn, it supports React, Angular, and Vue 3 via framework-agnostic core packages. Rendering uses a high-performance custom scene graph on HTML Canvas, with a modular plugin architecture for extensible chart types.

Build dependency chain: `ag-charts-core` → `ag-charts-types` → `ag-charts-locale` → `ag-charts-community` → `ag-charts-enterprise` → framework wrappers

## Critical Rules

-   **API verification:** Verify every property against both `ag-charts-types` AND a working example before using it. Training data is unreliable. Ask the user if no working examples are found; do not guess.
-   **Zero runtime dependencies:** Community and enterprise runtime bundles must have ZERO third-party dependencies beyond AG Charts packages.
-   **Language conventions:** UK/British English for documentation text, comments, and JSDocs; US English for API option names.

## Pre-Commit Requirements

Before proposing commits, always run from the repo root:

-   `yarn nx format` – format
-   `yarn nx build:types <package>` – type-check
-   `yarn nx lint <package>` – lint

After meaningful chart changes, also run:

-   `yarn nx test ag-charts-community`
-   `yarn nx test ag-charts-enterprise`
-   `yarn nx e2e ag-charts-website`

## Quick Reference

-   **Default branch:** `latest`
-   **Install:** `yarn install` (or `./external/ag-shared/scripts/install-for-cloud/install-for-cloud.sh` in cloud/remote environments)
-   **Build:** `yarn nx build <package>`
-   **Test:** `yarn nx test <package>` (add `--testPathPattern` and `--testNamePattern` to filter)
-   **E2E:** `yarn nx e2e ag-charts-website`
-   **Dev server:** `yarn nx dev`
-   **Clean:** `yarn nx clean` – purge dist folders when switching branches
-   **Benchmark:** `yarn nx benchmark <package>`
