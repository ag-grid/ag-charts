Add a Playwright e2e test under `packages/ag-charts-website/e2e/` that verifies clicking a legend
item hides the corresponding series and clicking it again restores it, asserted via screenshots.
Use an existing suitable example page, or add a minimal dedicated example if none fits, following
the established e2e example conventions in this repo.

Run the new spec with the repo's e2e tooling and report the result, including how screenshot
baselines are expected to be produced. Do not commit.
