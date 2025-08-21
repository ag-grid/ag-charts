# Context Loader for Non-Claude Code Agents

This file provides standardized instructions for loading AG Charts repository context when using AI agents other than Claude Code (like GitHub Copilot).

## Repository Context Loading

### For Non-Claude Code Agents

If you are not Claude Code, **you must first load the repository context** before proceeding with your assigned task:

#### Step 1: Load Primary Context Files

1. **Read `tools/prompts/CLAUDE.md`** (or `CLAUDE.md` in repo root) - Complete repository context
2. **Read `tools/prompts/technology-stack.md`** if relevant to the task - Technology constraints and preferences

#### Step 2: Understand Directory Structure

```bash
${REPO_ROOT}/tools/prompts # Prompt and agent directory structure
├── agents/             # Agent definitions you can invoke
│   ├── code-reviewer.md
│   ├── data-viz-designer.md
│   ├── example-tester.md
│   └── visual-qa.md
├── CLAUDE.md          # Repository context (CRITICAL to read)
├── technology-stack.md # Technology constraints
└── commands/          # Command prompts
    ├── context-loader.md  # This file
    ├── docs-review.md
    ├── pr-review.md
    └── release-options-review.md
```

#### Step 3: Key Repository Structure

-   **packages/ag-charts-core/** - Core utilities and shared code
-   **packages/ag-charts-community/** - MIT licensed version
-   **packages/ag-charts-enterprise/** - Commercial version
-   **packages/ag-charts-types/** - TypeScript definitions
-   **packages/ag-charts-website/** - Astro documentation site
-   **.github/prompts/** - Symlinked prompts for GitHub Copilot
