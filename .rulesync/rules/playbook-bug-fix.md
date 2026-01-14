---
root: false
targets: ['*']
description: 'Bug fix and feature work playbook for core chart code'
globs: ['packages/ag-charts-*/src/chart/**/*.ts', 'packages/ag-charts-*/src/series/**/*.ts']
---

# Bug Fix / Feature Work Playbook

1. Update the affected implementation (typically under `packages/ag-charts-*/src/chart`)
2. Adjust public API surface in `packages/ag-charts-types` if signatures change
3. Sync any dependent docs/examples
4. Run verification:
   - `yarn nx test ag-charts-community`
   - `yarn nx test ag-charts-enterprise`
   - `yarn nx benchmark` when performance is at risk
