---
root: false
targets: ['*']
description: 'Documentation page conventions for AG Charts — loads /spruce-docs skill for details'
globs:
    [
        'packages/ag-charts-website/src/content/docs/**/*.mdoc',
        'packages/ag-charts-website/src/content/docs/**/_examples/**/*',
    ]
---

# Documentation Page Conventions

When editing `.mdoc` documentation files for AG Charts, follow these conventions:

1. **Frontmatter**: Include `title` and `description` (with `$framework` placeholder)
2. **Progressive disclosure**: Start simple, progress to complex — API Reference always at end
3. **Examples first**: Show `chartExampleRunner` before explaining configuration
4. **Code snippets**: Always use `format="snippet"` for configuration objects
5. **UK/British English**: For documentation text (US English for API property names)
6. **Cross-references**: Use `./page-name/` for links between docs pages (e.g., `./tooltips/`, `./axes-types/`). Never use `../page-name/` — all docs pages are siblings under the same base path

For full reference (page types, Markdoc components, content patterns, writing guidelines), load the `/spruce-docs` skill.
