---
root: false
targets: ['*']
description: 'Example creation and modification playbook'
globs: ['**/_examples/**/*']
---

# Example Modification Playbook

1. Edit example files (`index.html`, `main.ts`, optional `styles.css`/`data.ts`)
2. Mirror updates in sibling `index.mdoc` docs page
3. **When deleting or renaming examples**: grep all `.mdoc` files across the entire docs tree for references — not just the parent page. Examples may be referenced from other pages (e.g., `benchmarks/index.mdoc`). Orphaned references cause build failures.
    - `grep -r 'name="example-name"' packages/ag-charts-website/src/content/docs/ --include='*.mdoc'`
4. Validate:
    - `yarn nx generate-examples ag-charts-website`
    - `yarn nx validate-examples`

Load the `/example` skill for full guidelines, framework compatibility requirements, and validation details.
