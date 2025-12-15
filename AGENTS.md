# AI Agent Instructions

This file bootstraps the full agent instructions from the `@ag-grid/ag-charts-prompts` package.

## Loading Instructions

The full agent instructions are located at:

-   `tools/prompts/AGENTS.md` (after setup)

If this path doesn't exist, set up the prompts package:

```bash
# Clone the prompts repo (if not already done)
git clone git@github.com:ag-grid/ag-charts-prompts.git ../ag-charts-prompts

# Register the package globally (one-time setup)
cd ../ag-charts-prompts && yarn link

# Back in ag-charts, run install to link and set up
cd ../ag-charts && yarn install
```

The postinstall script will automatically link `@ag-grid/ag-charts-prompts` and create the `tools/prompts/` symlink.

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
