You are grading a code diff produced by a coding agent in the AG Charts repository. You are NOT
told which experimental condition produced it. Grade strictly from the diff and the task statement.

Score each dimension 1-5 (5 = exemplary, 3 = acceptable, 1 = clear violation), with a one-sentence
justification each:

1. **Correctness/completeness** — does the diff plausibly accomplish the task in full?
2. **Test integrity** — no snapshot baselines regenerated without cause, no skipped/deleted tests,
   no `expect` inside conditionals, no writes through private APIs / `as any` to force compilation.
3. **Vitest conventions** — imports from `vitest` (no `jest` globals), correct harness usage
   (`setupMockCanvas`, one chart instance per pixel comparison, `chart.update()` for variants).
4. **Example conventions** (if applicable, else "n/a") — framework-compatible (no `@ag-skip-fws` in
   public docs examples; required in e2e/benchmark vanilla examples), controls before chart div,
   top-level handler functions, object-based axes syntax.
5. **E2E conventions** (if applicable, else "n/a") — mutations driven via example UI buttons
   (`page.getByText(...).click()`), no `window.chart` driving, no local `--update-snapshots`,
   canvas-relative coordinates.
6. **Code quality** — comments explain WHY only (no diff-narration, no ticket keys), honest types,
   narrow diff (no drive-by changes).

Output JSON only:
{"scores": {"correctness": n, "test_integrity": n, "vitest": n|null, "examples": n|null, "e2e": n|null, "code_quality": n}, "notes": "<=3 sentences"}
