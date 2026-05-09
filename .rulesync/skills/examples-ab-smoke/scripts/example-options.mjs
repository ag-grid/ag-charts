// Mirror of:
//   packages/ag-charts-website/e2e/example-options.ts        → EXAMPLE_OPTIONS
//   packages/ag-charts-website/e2e/gallery-examples.spec.ts  → exampleOptions (gallery key)
//
// Keep in sync manually. discover.mjs reads both source files and warns if
// a top-level page key is present there but missing from this mirror.
//
// Schema (per page → per example or '*'):
//   {
//     frameworks?: string[],          // restrict to this subset; default = all
//     status?: 'ok' | '404',          // '404' → exclude from sweep
//     clickOrder?: 'normal' | 'reverse',
//     skipCanvasUpdateCheck?: boolean | string[],   // true = skip all; array = skip these button labels
//     ignoreConsoleWarnings?: boolean,
//     randomData?: boolean,
//     snapshot?: boolean,
//   }

export const FRAMEWORKS = ['vanilla', 'typescript', 'reactFunctional', 'reactFunctionalTs', 'angular', 'vue3'];

// From example-options.ts (docs pages).
export const DOCS_OPTIONS = {
    animation: {
        'initial-load': { skipCanvasUpdateCheck: true },
        'data-updates': { skipCanvasUpdateCheck: true },
        duration: { skipCanvasUpdateCheck: true },
    },
    'axes-labels': {
        'axis-label-rotation': { skipCanvasUpdateCheck: true },
    },
    'api-create-update': {
        'update-partial': { frameworks: ['vanilla', 'typescript'] },
        'wait-for-update': {
            frameworks: ['vanilla', 'typescript'],
            skipCanvasUpdateCheck: ['Stop'],
        },
    },
    'api-state': {
        'state-save-restore': { skipCanvasUpdateCheck: ['Save'] },
        'legend-state-save-restore': { skipCanvasUpdateCheck: ['Save'] },
    },
    'api-download': {
        download: { skipCanvasUpdateCheck: true },
    },
    events: {
        'interaction-ranges': { skipCanvasUpdateCheck: true },
        'node-click-select': { skipCanvasUpdateCheck: true },
    },
    'financial-chart-types': {
        'toggle-financial-features': { clickOrder: 'reverse' },
    },
    legend: {
        'legend-position': { clickOrder: 'reverse' },
    },
    'linear-gauge': {
        labels: { skipCanvasUpdateCheck: true },
        segmentation: { clickOrder: 'reverse' },
    },
    'radial-gauge': {
        needle: { skipCanvasUpdateCheck: true },
        segmentation: { clickOrder: 'reverse' },
    },
    'range-area-series': {
        'range-area-missing-data': { ignoreConsoleWarnings: true },
    },
    'range-bar-series': {
        'range-bar-missing-data': { ignoreConsoleWarnings: true },
    },
    'sankey-series': {
        alignment: { clickOrder: 'reverse' },
    },
    themes: {
        'stock-themes': { clickOrder: 'reverse' },
        'advanced-theme': { frameworks: [] },
    },
    tooltips: {
        'tooltip-position': { skipCanvasUpdateCheck: true },
        'tooltip-mode': { skipCanvasUpdateCheck: true },
        'tooltip-pagination': { skipCanvasUpdateCheck: true },
        'interaction-range': { skipCanvasUpdateCheck: true },
    },
    touch: {
        'long-tap': { skipCanvasUpdateCheck: true },
        'single-finger-touch-dragging': { skipCanvasUpdateCheck: true },
        'two-finger-zoompan': { skipCanvasUpdateCheck: true },
    },
    sparklines: {
        '*': { frameworks: ['vanilla'] },
    },
    'sparklines-test': {
        '*': { frameworks: ['vanilla'] },
    },
    'example-logger-test': {
        'console-logs': { frameworks: [] },
    },
    'layout-test': {
        'layout-inline': { frameworks: [] },
        'layout-matrix': { frameworks: [] },
    },
    'line-series-test': {
        'easeOut-very-slow': { frameworks: [] },
    },
    'pie-series-test': {
        'duplicate-labels': { ignoreConsoleWarnings: true },
    },
};

// From gallery-examples.spec.ts (gallery page).
export const GALLERY_OPTIONS = {
    gallery: {
        '*': { frameworks: ['vanilla', 'typescript'] },
        'time-axis-with-irregular-intervals': { status: '404' },
        'simple-bubble': { status: '404' },
        'scatter-series-error-bars': { status: '404' },
        'reversed-horizontal-bar': { status: '404' },
        'reversed-bar': { status: '404' },
        'per-marker-customisation': { status: '404' },
        'log-axis': { status: '404' },
        'line-series-error-bars': { status: '404' },
        'grouped-column': { status: '404' },
        'custom-tooltips': { status: '404' },
        'custom-marker-shapes': { status: '404' },
        'cross-lines': { status: '404' },
        'chart-customisation': { status: '404' },
        'bubble-with-labels': { status: '404' },
        'bubble-with-custom-markers': { status: '404' },
        'box-plot-scatter-combination': { status: '404' },
        'bar-with-labels': { status: '404' },
        'bar-series-error-bars': { status: '404' },
        '100--stacked-column': { status: '404' },
        '100--stacked-bar': { status: '404' },
        'fruit-comparison': { status: '404' },
    },
};

export const ALL_OPTIONS = { ...DOCS_OPTIONS, ...GALLERY_OPTIONS };

export const IGNORE_PAGES = ['benchmarks'];

// Resolve the merged options for a (page, example) pair, mirroring convertPageUrls
// in examples-util.ts. Returns the effective overrides object.
export function resolveOptions(page, example) {
    let pageOptions = ALL_OPTIONS[page];

    if (pageOptions == null) {
        for (const [key, value] of Object.entries(ALL_OPTIONS)) {
            if (!key.startsWith('/')) continue;
            const re = new RegExp(key.slice(1));
            if (re.test(page)) {
                pageOptions = value;
                break;
            }
        }
    }

    const defaults = page.endsWith('-test') ? { frameworks: ['vanilla'] } : {};

    return {
        frameworks: FRAMEWORKS,
        status: 'ok',
        clickOrder: 'normal',
        skipCanvasUpdateCheck: false,
        ignoreConsoleWarnings: false,
        randomData: false,
        snapshot: false,
        ...defaults,
        ...pageOptions?.['*'],
        ...pageOptions?.[example],
    };
}
