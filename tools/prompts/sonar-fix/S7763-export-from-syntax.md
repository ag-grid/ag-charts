# Use export...from syntax for re-exports

Rule ID: typescript:S7763
Rule URL: https://sonarcloud.io/api/rules/show?key=typescript%3AS7763&organization=ag-grid

When importing from a module only to immediately export the same identifiers, use the `export...from` syntax instead.

## Why This Matters

-   **Conciseness**: One statement instead of two
-   **Clarity**: Makes it obvious this is a re-export, not local usage
-   **Maintainability**: Reduces unnecessary intermediate variables

## Example Violations

```typescript
// Noncompliant
import { namedExport } from './bar.js';
import defaultExport from './foo.js';

export default defaultExport; // Noncompliant

export { namedExport }; // Noncompliant
```

## Example Fixes

```typescript
export { default } from './foo.js'; // Compliant

export { namedExport } from './bar.js'; // Compliant
```

## AG Charts Context

In AG Charts, this pattern commonly appears in:

-   Module barrel files (main.ts, main-modules.ts)
-   Package entry points re-exporting from internal modules
-   Framework wrapper packages re-exporting core types

When refactoring, ensure:

-   The export is truly a pass-through (not used locally)
-   Type exports are preserved with `export type { ... } from` if needed
