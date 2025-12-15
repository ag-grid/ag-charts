# AI Agent Instructions

⚠️ **IMPORTANT:** You are reading the bootstrap file. The **full authoritative agent instructions** are in [tools/prompts/AGENTS.md](tools/prompts/AGENTS.md). 

**READ THAT FILE FIRST.** It contains critical guidance on development workflows, testing requirements, code standards, and repository conventions.

## Quick Start

1. **Always consult** [tools/prompts/AGENTS.md](tools/prompts/AGENTS.md) for complete instructions
2. If the path doesn't exist, run `yarn install` to set up the prompts repository
3. For specialized topics, see the guides in `tools/prompts/guides/`

## Setup Instructions

The full agent instructions are located at:

-   `tools/prompts/AGENTS.md` (after setup) — **PRIMARY SOURCE OF TRUTH**

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

## Essential Commands (Summary)

-   **Main branch:** `latest`
-   **Format:** `yarn nx format` ← RUN BEFORE COMMITS
-   **Type-check:** `yarn nx build:types <package>` ← RUN BEFORE COMMITS
-   **Lint:** `yarn nx lint <package>` ← RUN BEFORE COMMITS
-   **Build:** `yarn nx build <package>`
-   **Test:** `yarn nx test <package>`
-   **E2E:** `yarn nx e2e ag-charts-website`
-   **Dev server:** `yarn nx dev`

---

## Full Instructions

@import tools/prompts/AGENTS.md
