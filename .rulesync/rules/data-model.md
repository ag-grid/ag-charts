---
root: false
targets: ['*']
description: 'Data model principles and patterns for AG Charts series data processing'
globs: ['**/data-model/**/*.ts', '**/data-model/**/*.test.ts']
---

# DataModel Principles

-   The data model is the single source of truth for the data used by series.
-   The intent is to minimise the number of times the data is processed by aggregating multiple series requirements into a single processing pass.
-   We aim to minimise the amount of memory churn during the processing of the data.
-   We aim to be efficient with memory and execution time.
    -   We avoid use of lambdas and prefer to use native functions where possible.
    -   We treat the source data as immutable and do not mutate it.
    -   ProcessedData is the only object that is mutated during the processing of the data.
-   We support full processing of all data into a new ProcessedData object.
-   We support incremental processing of transactional updates which mutate an existing ProcessedData object.
    -   Incremental updates should be as efficient and fast as possible.
    -   However this should not come at the expense of the full processing performance.
