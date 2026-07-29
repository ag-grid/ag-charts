---
root: false
targets: ['*']
description: 'Default entry-point hygiene — keep internals out of the documented public API surface'
globs: ['packages/ag-charts-*/src/main.ts']
---

# Default entry-point hygiene

Package default entry points (`main.ts` in community and enterprise) define the documented public API surface. Nothing internal — runtime value or type — belongs here.

## Why

Every export from `main.ts` appears in consumer IDE autocomplete, generated API docs, and the `.d.ts` files shipped to npm. Adding internals here:

- Expands the implicit public contract. Once shipped, external consumers depend on it and removal becomes a breaking change.
- Pollutes autocomplete with symbols users have no business using.
- Leaks internal naming and structural types into published typings.

Tree-shakability is not a sufficient justification. Tree-shaking only affects runtime bundle size — the type surface and discoverability cost are paid regardless.

## How to apply

Route internals through the restricted barrel, not `main.ts`:

- **Community internals** → `module-support.ts` (re-exported as `_ModuleSupport`). See `module-support.md` for the bundle-cost discipline on that barrel.
- **Enterprise internals** → the enterprise equivalent barrel.

Type-only exports belong in `_ModuleSupport` too (`export type { ... }`). Direct-import ergonomics or type-identity concerns are not a reason to elevate a type to the default surface — the `_ModuleSupport` namespace preserves structural identity equally well.

## Examples

```typescript
// BAD: internal runtime class leaked into the default surface.
export { AnnotationManager } from './chart/annotation/annotationManager';

// BAD: internal typed service surface elevated to the public contract.
export type { ChartRegistry, ChartAxisRegistry } from './module/moduleContext';

// GOOD: both live in module-support.ts instead.
//   export { AnnotationManager } from './chart/annotation/annotationManager';
//   export type { ChartRegistry, ChartAxisRegistry } from './module/moduleContext';
// Enterprise consumes them as `_ModuleSupport.AnnotationManager` and `_ModuleSupport.ChartRegistry`.
```

## When a symbol genuinely is public

Promotion to `main.ts` requires all of:

1. Documentation on the public docs site.
2. Coverage under the semantic-versioning and breaking-change policy.
3. A stable definition in `ag-charts-types` (for options) or a stable exported contract.

If any of those is missing, the symbol is not public. Keep it in `_ModuleSupport`.
