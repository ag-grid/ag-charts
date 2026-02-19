---
targets: ['*']
description: 'Nx project configuration conventions'
globs: ['**/project.json', 'nx.json']
---

# Nx Conventions

## Project Configuration

- In `project.json` files, use `{projectRoot}` to reference paths relative to the project root. Do **not** prefix with `./` — Nx interpolates `{projectRoot}` as a complete relative path from the workspace root (e.g. `tools/ssr-example`), so `{projectRoot}/script.sh` is correct while `./{projectRoot}/script.sh` is invalid.
- To prevent Nx from inferring targets from npm scripts in a `package.json`-only project, set `"nx": {"includedScripts": []}` in the package.json. An empty array suppresses all inferred script targets while keeping the project visible to Nx for dependency tracking.
