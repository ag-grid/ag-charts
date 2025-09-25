# AG-15953 — Adding New Transaction Types

This guide captures the decisions and touch points from the AG-15953 high-frequency spike so future work on the transaction pipeline follows the same patterns.

## Architectural quick tour

| Concern                     | Where it lives                                                               | Notes                                                                                                                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transaction state container | `packages/ag-charts-community/src/chart/data/dataRef.ts`                     | `DataRef<T>` owns the base dataset and the pending transaction queue, and exposes helpers for previewing, committing, and sizing transactions. Keep all mutation logic encapsulated here.                                         |
| Transaction application     | `packages/ag-charts-community/src/chart/data/dataModel.ts`                   | `applyTransactions` now delegates to `applyAppendTransactions` / `applyPrependTransactions` and shared helpers (`mergeExtractedData`, `updateDomainsFromExtracted`, etc.). Extend these helpers when introducing new operations.  |
| Controller orchestration    | `packages/ag-charts-community/src/chart/data/dataController.ts`              | Coordinates requests, caches, and calls into `DataRef.previewPendingTransactions()` / `commitPendingTransactions()`. New transaction types usually need controller awareness so previews remain accurate.                         |
| Incremental series handling | e.g. `packages/ag-charts-community/src/chart/series/cartesian/lineSeries.ts` | Series rely on incremental metadata (`processedData.incremental`) to avoid full rebuilds. If a new transaction shape affects ordering or span construction, update the series-specific incremental code and accompanying helpers. |

## Checklist for adding a transaction type

1. **Model the mutation in `DataRef`.**

    - Add strongly typed accessors or helpers rather than sprinkling `any` casts.
    - Update `previewPendingTransactions()` and `commitPendingTransactions()` so preview/apply both understand the new shape.
    - For removals, accept the source datum references (`remove?: T[]`) so identity checks work without recomputing keys.
    - If the transaction changes the net size calculation, adjust `netSize()` and the associated unit tests.

2. **Teach the data model how to apply it.**

    - Extend `DataModelTransaction<D>` in `dataModel.ts` with the new fields.
    - Introduce a dedicated helper if the operation differs from append/prepend (for example, `applyReplaceTransactions`). Reuse the existing domain-update utilities so modified-domain bookkeeping stays accurate.
    - Ensure `TransactionUpdateContext` carries any new metadata you want to surface (e.g. indices of replaced rows) and feed that through to `processedData.incremental`.

3. **Update controller orchestration.**

    - Adjust `DataController.execute()` to recognise the new pending shape when building preview sources.
    - Maintain the error handling pattern: validate each transaction object, guard against malformed input, and include debug logging for failure cases.

4. **Surface incremental metadata to series.**

    - If `processedData.incremental` gains new fields, update each series that consumes it (line, bar, etc.). The new `SpanBuilder` / `buildIncrementalNodeUpdates()` split in `lineSeries.ts` is the template—extend or mirror that pattern for other series types.

5. **Audit visual + analytics side effects.**

    - Check that `calculateSegments`, cross-filtering flags, and animation validation still behave with the new metadata.
    - Add or update Jest tests covering: `DataRef` preview/apply, `DataController` error handling, `DataModel` transaction merging, and any series-level incremental logic.

6. **Document the behaviour.**
    - Record expected transaction payload shapes in `packages/ag-charts-types/src/chart/dataTransaction.ts` if the public API changes.
    - Update relevant docs/examples under `packages/ag-charts-website` so the website showcases the new capability.

## Testing expectations

-   `yarn nx lint ag-charts-community`
-   `yarn nx build:types ag-charts-community`
-   Focused Jest runs (`yarn nx test ag-charts-community --testFile=…`) for data pipeline + affected series.
-   Any new example code should run through `nx validate-examples` before commit.

Following this checklist keeps future transaction work aligned with the AG-15953 refactor and avoids regressions in the high-frequency update path.
