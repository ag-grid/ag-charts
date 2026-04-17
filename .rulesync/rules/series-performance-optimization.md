---
root: false
targets: ['*']
description: 'Series performance quick reference - use /optimize-series for full guide'
globs: ['**/series/**/*.ts']
---

# Series Performance Optimization

For comprehensive optimization guidance, invoke the `/optimize-series` skill.

## Quick Reference

Key patterns:

- Use `@DeclaredSceneChangeDetection` with `declare __fieldName` for backing field access
- Use `setStyleProperties()` / `setStaticProperties()` for batched updates
- Cache expensive lookups in context objects
- Use scratch objects to avoid GC pressure in loops

## Key Files

| Pattern               | Reference File                           |
| --------------------- | ---------------------------------------- |
| Context caching       | `barSeries.ts`                           |
| Backing fields        | `shape.ts`, `barShape.ts`                |
| Deferred aggregation  | `deferredExecutor.ts`                    |
| Animation reset       | `barUtil.ts`, `markerUtil.ts`            |
| TypedArray reuse      | `barAggregation.ts`                      |

For full implementation details, run `/optimize-series`.
