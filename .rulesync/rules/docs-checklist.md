---
root: false
targets: ['*']
description: 'Documentation checklist quick reference — loads /spruce-docs for full checklist'
globs: ['packages/ag-charts-website/src/content/docs/**/*.mdoc']
---

# Documentation Checklist — Quick Reference

Before submitting documentation changes:

1. **Frontmatter**: `title` + `description` with `$framework` placeholder present
2. **Structure**: Progressive disclosure (simple -> complex -> API Reference at end)
3. **Examples**: All `chartExampleRunner` names match `_examples/` folders, framework-compatible (NO `@ag-skip-fws`)
4. **Technical accuracy**: Property names match TypeScript definitions, default values verified
5. **Components**: Code blocks use `format="snippet"`, callouts used appropriately
6. **Cross-references**: Relative paths, links to related features, API sections linked

For comprehensive validation checklist, load the `/spruce-docs` skill and read the `checklist.md` sub-doc.
