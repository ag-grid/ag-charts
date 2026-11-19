---
root: false
targets: ['*']
description: 'Type-checking the generated TypeScript, React, Angular and Vue variants of docs and gallery examples'
globs: ['packages/ag-charts-website/src/content/**/_examples/**/*', 'plugins/ag-charts-generate-example-files/**/*', 'packages/ag-charts-website/scripts/validate-generated-examples.ts']
---

# Type-checking the generated example variants

`validate-generated-examples` type-checks what users receive: the TypeScript, React TS, Angular and Vue 3 variants of every docs and gallery example, in both `dark-mode` and `plain`, with `strict` (as `tsconfig.examples.json`) against the workspace-built types. `validate-examples` checks only the example's source, so a generator bug, or source the generator mishandles in one framework, is caught here and nowhere else. CI runs it in the Validate Examples job.

-   One example: `yarn nx validate-generated-examples ag-charts-website --examples=<name>`. A name is a bare example name, `<page>/<name>`, or an `_examples` directory path; several are comma-separated. `--modes=plain` and `--frameworks=vue3,angular` narrow it further. An entry that matches nothing is an error.
-   Everything: `yarn nx validate-generated-examples ag-charts-website`. It depends on `generate-examples`, so it generates what it checks.
-   Fixing a failure: the output names the example, mode and framework; a run that fails in `tsc` keeps its checked files and prints `Checked files kept in dist/validate-generated-examples/run-…`, laid out as `<framework>/<mode>/<docs|gallery>/…` with a `tsconfig.json` per framework to open or run `tsc -p` on. A passing run, or one that stops on a missing `contents.json` or an `error.txt`, leaves nothing behind. Fix the generator in `plugins/ag-charts-generate-example-files/` when the source is sound, and the source only when it is genuinely wrong.
-   It fails closed: a missing `contents.json`, an `error.txt` or any `tsc` error in a selected variant fails it. There is no allow-list. An example the generator cannot support in the frameworks is marked `// @ag-skip-fws` (internal fixtures and unreleased pages only), which swaps in a placeholder that the check then passes.

Run it after changing an example or the generator, alongside `yarn nx validate-examples` (which checks the example source).
