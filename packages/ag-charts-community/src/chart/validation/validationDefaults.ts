import type { AgChartValidationSeverity } from 'ag-charts-types';

/** The default `validations.consoleOn` — every severity, including deprecation notices. */
export const DEFAULT_CONSOLE_ON: readonly AgChartValidationSeverity[] = Object.freeze<AgChartValidationSeverity[]>([
    'error',
    'warning',
    'deprecation',
]);

/** The default `validations.showOverlayOn` — the overlay is opt-in, so no severity raises one. */
export const DEFAULT_SHOW_OVERLAY_ON: readonly AgChartValidationSeverity[] = Object.freeze([]);

/** The default `validations.throwOn` — fail-fast is opt-in, so nothing throws unless a consumer asks for it. */
export const DEFAULT_THROW_ON: readonly AgChartValidationSeverity[] = Object.freeze([]);
