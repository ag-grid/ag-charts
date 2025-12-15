# AI Agent Instructions

This file bootstraps the full agent instructions from the `@ag-grid/ag-charts-prompts` package.

## Loading Instructions

The full agent instructions are located at:

-   `tools/prompts/AGENTS.md` (after setup)

If this path doesn't exist, set up the prompts package:

```bash
# Clone the prompts repo adjacent to ag-charts
git clone git@github.com:ag-grid/ag-charts-prompts.git ../ag-charts-prompts

# Run yarn install - it will auto-detect the adjacent checkout
yarn install
```

The postinstall script automatically detects `../ag-charts-prompts` and creates the `tools/prompts/` symlink.

## Full Instructions

@import tools/prompts/AGENTS.md

---

<!-- Fallback quick reference if @import not supported -->

## Quick Reference

-   **Main branch:** `latest`
-   **Build:** `yarn nx build <package>`
-   **Test:** `yarn nx test <package>`
-   **Format:** `yarn nx format`
-   **Dev server:** `yarn nx dev`

For full instructions, guides, and commands, read `tools/prompts/AGENTS.md`.
