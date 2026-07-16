Add a regression test to `packages/ag-charts-community/src/chart/series/cartesian/barSeries.test.ts`:
verify that a bar series given a single datum renders correctly (image snapshot) and produces no
console warnings, and that updating the chart to add a second datum re-renders correctly (second
snapshot on the same chart instance).

Follow the existing patterns in that file. When done, run the test file and report the result.
Do not commit.
