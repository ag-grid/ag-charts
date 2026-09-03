import type { AgChartValidationSeverity } from 'ag-charts-types';

// Frozen and shared between `OptionsModule` and `Chart`, which re-apply the same three options from
// chart state: two independently hoisted literals would be free to drift apart. They live in this
// leaf module rather than in `optionsModule` so that `chart.ts` can read them without a value import
// of `optionsModule`, which would pull the whole options-definition graph into every bundle that
// contains a chart (~19 kB brotlied on the tree-shaken `CartesianChart only` entry point).

/** The default `validations.consoleOn` — every severity, including deprecation notices. */
export const DEFAULT_CONSOLE_ON: readonly AgChartValidationSeverity[] = Object.freeze<AgChartValidationSeverity[]>([
    'error',
    'warning',
    'deprecation',
]);

/** The default `validations.showOverlayOn` — the overlay is opt-in, so no severity raises one. */
export const DEFAULT_SHOW_OVERLAY_ON: readonly AgChartValidationSeverity[] = Object.freeze<AgChartValidationSeverity[]>([]);

/** The default `validations.throwOn` — fail-fast is opt-in, so nothing throws unless a consumer asks for it. */
export const DEFAULT_THROW_ON: readonly AgChartValidationSeverity[] = Object.freeze<AgChartValidationSeverity[]>([]);
