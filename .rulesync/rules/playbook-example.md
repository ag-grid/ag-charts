---
root: false
targets: ['*']
description: 'Example creation and modification playbook'
globs: ['**/_examples/**/*']
---

# Example Modification Playbook

1. Edit example files (`index.html`, `main.ts`, optional `styles.css`/`data.ts`)
2. Mirror updates in sibling `index.mdoc` docs page
3. Validate:
    - `yarn nx generate-examples ag-charts-website`
    - `yarn nx validate-examples`

See [Examples Guide](.rulesync/rules/examples.md) for framework compatibility requirements.
