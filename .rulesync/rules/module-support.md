---
paths: 'packages/ag-charts-community/src/module-support.ts'
---

# module-support.ts — Barrel Export Guidelines

`module-support.ts` is the barrel re-export file that enterprise modules import as `_ModuleSupport`. Every runtime export here becomes part of the enterprise API surface and is pulled into every enterprise consumer's bundle.

## Why to avoid adding exports

The barrel prevents tree-shaking — when any enterprise module destructures from `_ModuleSupport`, **all** runtime exports are included in the bundle. Adding exports here increases bundle size for every enterprise consumer, even if only one module uses the new export.

## Before adding to module-support.ts

Check whether the export can live in `ag-charts-core` instead. Only add to `module-support.ts` as a last resort when the function genuinely depends on community-internal classes (e.g., `ColorScale`, scene graph nodes).

## Approved alternatives

1. **Pure utility functions** with no community-package dependencies → place in `ag-charts-core` and import directly with `import { fn } from 'ag-charts-core'`
2. **Functions/classes that depend on community internals** (e.g., `ColorScale`, `Selection`) → must stay in community; add to `module-support.ts` only if needed by enterprise
3. **Type-only exports** → use `import type` from the source file directly; type-only imports are erased at compile time and do not affect bundling

## Examples

```typescript
// GOOD: pure function in ag-charts-core, imported directly by enterprise
import { computeColorBins } from 'ag-charts-core';

// GOOD: community-dependent function, accessed via _ModuleSupport
const { configureColorScale } = _ModuleSupport;

// GOOD: type-only import from core
import type { GradientColorStop } from 'ag-charts-core';

// AVOID: adding pure functions to module-support.ts
export { myPureHelper } from './utils/myHelper'; // should be in ag-charts-core
```
