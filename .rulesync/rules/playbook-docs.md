---
root: false
targets: ['*']
description: 'Documentation and content update playbook'
globs: ['packages/ag-charts-website/src/content/docs/**/*']
---

# Documentation Update Playbook

1. Consult [Documentation Pages Guide](.rulesync/rules/docs-pages.md)
2. For new pages: use `/docs-create` or templates from `external/prompts/templates/`
3. Modify `.mdoc` under `packages/ag-charts-website/src/content/docs/`
4. Update `nav.json` if navigation changes
5. Create/update examples in `_examples/` (all MUST be framework-compatible)
6. Generate and validate:
   - `yarn nx generate-examples ag-charts-website`
   - `yarn nx validate-examples`
7. Test in dev server across all frameworks
8. For significant changes: `yarn nx e2e ag-charts-website`
9. Review [Documentation Checklist](.rulesync/rules/docs-checklist.md)
