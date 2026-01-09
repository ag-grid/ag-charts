---
root: false
targets: ['*']
description: 'Technology stack and architectural constraints for AG Charts'
globs: ['**/*']
---

# AG Charts Technology Stack

This document outlines the preferred technologies and architectural constraints for the AG Charts monorepo.

## Critical Requirement: Zero Runtime Dependencies

**The main AG Charts libraries (`ag-charts-core`, `ag-charts-community`, `ag-charts-enterprise`) MUST have ZERO third-party runtime dependencies.** Only internal AG Charts packages and dev dependencies for build/test tooling are allowed.

## Core Libraries

| Package                | Runtime Dependencies                                    | Purpose                                  |
| ---------------------- | ------------------------------------------------------- | ---------------------------------------- |
| `ag-charts-types`      | **NONE** (zero dependencies)                            | TypeScript type definitions              |
| `ag-charts-core`       | `ag-charts-types` only                                  | Core rendering engine and utilities      |
| `ag-charts-locale`     | **NONE** (zero dependencies)                            | Internationalization (40+ languages)     |
| `ag-charts-community`  | `ag-charts-core`, `ag-charts-types`, `ag-charts-locale` | MIT licensed charts library              |
| `ag-charts-enterprise` | `ag-charts-community`, `ag-charts-core`                 | Commercial charts with advanced features |

**Core Technologies:**

-   **TypeScript**: Primary language with strict mode enabled
-   **Canvas API**: Custom high-performance rendering with scene graph
-   **Pure JavaScript**: No external runtime dependencies

## Framework Wrappers

| Package             | Runtime Dependencies           | Peer Dependencies                                      |
| ------------------- | ------------------------------ | ------------------------------------------------------ |
| `ag-charts-react`   | `ag-charts-community`          | `react ^18.0.0 \|\| ^19.0.0`                           |
| `ag-charts-angular` | `ag-charts-community`, `tslib` | `@angular/common >= 17.0.0`, `@angular/core >= 17.0.0` |
| `ag-charts-vue3`    | `ag-charts-community`          | `vue ^3.5.0`                                           |

## Documentation Website (`ag-charts-website`)

| Technology         | Purpose                             |
| ------------------ | ----------------------------------- |
| **Astro** (v5.8.2) | Static site generator               |
| **Markdoc**        | Content authoring for documentation |
| **React**          | Interactive components within Astro |
| **Vite**           | Development server and build tool   |
| **Prism.js**       | Syntax highlighting                 |
| **Algolia**        | Documentation search                |
| **Nanostores**     | Lightweight state management        |
| **Cheerio**        | Server-side HTML parsing            |

## Development & Build Tools

| Tool                    | Purpose                            | Used By            |
| ----------------------- | ---------------------------------- | ------------------ |
| **Nx** (v20.3.1)        | Monorepo orchestration and caching | All packages       |
| **TypeScript** (v5.4.5) | Type checking and compilation      | All packages       |
| **SWC**                 | Fast transpilation                 | Build system       |
| **ESBuild**             | High-performance bundling          | Production builds  |
| **Jest**                | Unit testing with visual snapshots | Core libraries     |
| **Playwright**          | E2E testing                        | Website            |
| **Vitest**              | Fast unit testing                  | Website components |
| **ESLint**              | Code linting with custom rules     | All packages       |
| **Prettier**            | Code formatting                    | All packages       |
| **Size Limit**          | Bundle size monitoring             | Core libraries     |

## Version Requirements

-   **Node.js**: ^20.19.4
-   **Yarn**: ^1.22.21
-   **Build Target**: ES2020 (excludes IE)
-   **TypeScript**: Strict mode enabled across all packages
