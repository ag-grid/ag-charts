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
-   **NX daemon:** Always use `NX_DAEMON=false` for nx commands to avoid pipe hangs (set automatically via SessionStart hook)
