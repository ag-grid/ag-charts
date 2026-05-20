/**
 * Shared chart-level theme defaults composed into every chart-type module's
 * `themeTemplate`.
 *
 * Per `defaults.md`, module `themeTemplate`s are the canonical home for runtime
 * defaults. Each chart-type module (`CartesianChartModule`, `PolarChartModule`,
 * `StandaloneChartModule`, `TopologyChartModule`, …) merges this constant via
 * `mergeDefaults` so chart-level Normalised keys are guaranteed populated
 * post-theme-merge.
 *
 * Add an entry here only when the default genuinely applies to every chart
 * type. Per-chart-type overrides live in the relevant module's own
 * `themeTemplate`.
 */
export const commonChartThemeTemplate = {
    mode: 'standalone',
    suppressFieldDotNotation: false,
    keyboard: { initialFocus: 'data-start' },
    touch: { dragAction: 'drag' },
};
