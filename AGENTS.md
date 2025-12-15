# AI Agent Instructions

This file bootstraps the full agent instructions from the `@ag-grid/ag-charts-prompts` package.

## Loading Instructions

The full agent instructions are located at:

-   `tools/prompts/AGENTS.md` (after setup)

If this path doesn't exist, simply run `yarn install` - the setup script will offer to clone the prompts repo automatically if you have agentic tools (Claude, Cursor, etc.) installed.

Manual setup:

```bash
git clone git@github.com:ag-grid/ag-charts-prompts.git ../ag-charts-prompts
yarn install
```

The postinstall script automatically:

-   Detects if you have agentic tools installed
-   Offers to clone `ag-charts-prompts` if not present
-   Offers to update if your checkout is behind
-   Creates the `tools/prompts/` symlink

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
