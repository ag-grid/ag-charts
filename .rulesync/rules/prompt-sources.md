---
globs:
  - '.rulesync/**/*'
  - '.claude/**/*'
  - 'external/prompts/**/*'
  - 'external/ag-shared/prompts/**/*'
alwaysApply: false
---

# Canonical Prompt Source Lookup

When editing a prompt file, find its canonical source using this lookup sequence:

1. **`.rulesync/`** — repo-specific rules, skills, and commands (🟢 Local)
2. **`external/prompts/`** — product-specific shared prompts (🟠 Private), symlinked to the `ag-charts-prompts` subrepo
3. **`external/ag-shared/prompts/`** — cross-product shared prompts (🔵 Shared), symlinked to the `ag-shared` subrepo

**Note:** `external/prompts/` and `external/ag-shared/` are symlinks to separate Git repos. The Glob tool does not follow symlinks, so use `readlink -f` or `ls` to resolve paths.

## Subrepo PR Workflow

Changes to files under `external/prompts/` must be committed and PR'd in the **`ag-charts-prompts`** repo (resolve the symlink to find the actual path). Changes to `external/ag-shared/` go to the **`ag-shared`** repo. Neither can be committed via the main `ag-charts` repo.
