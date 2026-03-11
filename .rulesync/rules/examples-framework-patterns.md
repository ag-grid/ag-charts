---
root: false
targets: ['*']
description: 'Framework transformation patterns — loads /example skill for full reference'
globs: ['**/_examples/**/*', 'plugins/ag-charts-generate-example-files/**/*']
---

# Framework Transformation Patterns

When working with example framework generation, key patterns:

1. **Options → State**: Options object becomes `useState` (React), class property (Angular), `ref` (Vue)
2. **Chart instance → Ref**: Chart variable becomes `useRef` (React), component method (Angular), template ref (Vue)
3. **HTML events → Framework handlers**: `onclick` → `onClick` (React), `(click)` (Angular), `@click` (Vue)
4. **Supported patterns**: Static charts, top-level options, simple event handlers, `chart.update()`, `updateDelta()`
5. **Unsupported**: Complex DOM manipulation, external libraries, multiple charts, window assignments
6. **Directives**: `@ag-skip-fws` (internal only), `@ag-skip-clone` (perf), `/** inScope */` (utility functions)

For full reference (parser architecture, framework transformations, debugging), load the `/example` skill.
