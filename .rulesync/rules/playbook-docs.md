---
root: false
targets: ['*']
description: 'Documentation and content update playbook'
globs: ['packages/ag-charts-website/src/content/docs/**/*']
---

# Documentation Update Playbook

1. Load the `/spruce-docs` skill for comprehensive documentation patterns
2. For new pages: use `/docs-create` or templates from `.rulesync/skills/spruce-docs/`
3. Modify `.mdoc` under `packages/ag-charts-website/src/content/docs/`
4. Update `nav.json` if navigation changes
5. Create/update examples in `_examples/` (all MUST be framework-compatible)
6. Generate, format, and validate:
    - `yarn nx generate-examples ag-charts-website`
    - `yarn nx validate-examples`
    - `yarn nx format:mdoc ag-charts-website` — format mdoc code blocks (CI checks this separately from Prettier)
7. Test in dev server across all frameworks
8. For significant changes: `yarn nx e2e ag-charts-website`
9. Review the documentation checklist (`.rulesync/skills/spruce-docs/checklist.md`)
