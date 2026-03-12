---
root: false
targets: ['*']
description: 'Example conventions for AG Charts — loads /example skill for full guide'
globs: ['**/_examples/**/*', 'packages/ag-charts-website/src/content/gallery/**/*']
---

# Example Conventions

When creating or editing AG Charts examples, follow these conventions:

1. **Module registration**: Register modules with `ModuleRegistry` before chart creation
2. **Object-based axes** (v13+): Use `axes: { x: { type: 'category' }, y: { type: 'number' } }` — not legacy array syntax
3. **Container pattern**: Use `document.getElementById('myChart')` for container setup
4. **Top-level functions**: Event handlers and chart update functions must be top-level
5. **Framework compatible**: All public docs examples MUST work across all frameworks (NO `@ag-skip-fws`)
6. **Controls in HTML**: Place controls BEFORE chart div, wrapped in `class="example-controls"`

For full reference (guidelines, validation, framework generation, Plnkr integration), load the `/example` skill.
