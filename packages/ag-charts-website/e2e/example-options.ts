import { ExampleOverrides } from './examples-util';

/**
 * Shared configuration for example test options.
 * Maps page paths to example-specific overrides.
 */
export const EXAMPLE_OPTIONS: Record<string, Record<string, ExampleOverrides>> = {
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
        // Restore is a no-op until a state has been saved.
        'active-save-restore': { skipCanvasUpdateCheck: ['Restore'] },
        'state-save-restore': { skipCanvasUpdateCheck: ['Save'] },
        'legend-state-save-restore': { skipCanvasUpdateCheck: ['Save'] },
    },
    'api-download': {
        download: { skipCanvasUpdateCheck: true },
    },
    events: {
        'interaction-ranges': { skipCanvasUpdateCheck: true },
    },
    'examples-controls-test': {
        // A style guide for the controls themselves — none of them drive the chart.
        'examples-controls-tester': { skipCanvasUpdateCheck: true },
    },
    'zoom-e2e': {
        'zoom-range-cross-line': { frameworks: ['vanilla'] },
    },
    'context-menu-e2e': {
        'captions-declarative': { frameworks: ['vanilla'] },
        'captions-dynamic': { frameworks: ['vanilla'] },
    },
    'financial-chart-types': {
        'toggle-financial-features': { clickOrder: 'reverse' },
    },
    'high-performance-charts': {
        // The React and Vue ports deep-clone the options on every change, which takes longer than the test
        // timeout once the 1m data size is selected.
        'bubble-scatter': { frameworks: ['vanilla', 'typescript', 'angular'] },
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
    'dev-validation': {
        'validation-overlay-multi': { ignoreConsoleWarnings: true, frameworks: ['vanilla'] },
        // Selecting a consoleOn radio only changes state; only the button redraws the chart.
        'validation-console': { skipCanvasUpdateCheck: ['[]'] },
    },
    'dev-validation-test': {
        // Selecting a throwOn radio only changes state; only the button redraws the chart.
        'validation-throw': { skipCanvasUpdateCheck: ['[]'] },
    },
    'range-area-series': {
        'range-area-missing-data': { ignoreConsoleWarnings: true },
    },
    'range-bar-series': {
        'range-bar-missing-data': { ignoreConsoleWarnings: true },
    },
    'series-highlighting': {
        'highlight-mode': { skipCanvasUpdateCheck: true },
    },
    themes: {
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
    'sparklines-e2e': {
        '*': { frameworks: ['vanilla'] },
        // Each button creates or moves extra sparkline charts, leaving the first chart untouched.
        'sparkline-reflow': { frameworks: ['vanilla'], skipCanvasUpdateCheck: true },
    },
    'sync-e2e': {
        '*': { frameworks: ['vanilla'] },
    },
    'api-state-e2e': {
        '*': { frameworks: ['vanilla'] },
        'legend-zoom': { frameworks: ['vanilla'], skipCanvasUpdateCheck: ['Save'] },
    },
    'api-state-test': {
        'initial-state': { skipCanvasUpdateCheck: ['Save'] },
    },
    'active-e2e': {
        // popEvents() and getState() only log; the other entries only store state read by a later action.
        '*': { skipCanvasUpdateCheck: ['popEvents()', 'getState() (1s delay)', '#myPreventDefault'] },
        'bubble-example': { skipCanvasUpdateCheck: ['popEvents()', 'getState() (1s delay)', '#myPreventDefault'] },
        'line-example': {
            skipCanvasUpdateCheck: ['popEvents()', 'getState() (1s delay)', '#myCountry', '#myYear', '#myFreeze'],
        },
        // The Invalid restores name a missing item on purpose, which AG Charts warns about.
        'frozen-legendtoggle': { ignoreConsoleWarnings: true },
    },
    selection: {
        // Nothing is selected during the sweep, so Save, Restore and Clear change nothing.
        'selection-api': { skipCanvasUpdateCheck: ['Log Selection', 'Save', 'Restore', 'Clear'] },
    },
    'selection-test': {
        // Nothing is selected during the sweep, so Save, Set and Clear change nothing.
        'multiple-series': { skipCanvasUpdateCheck: ['Save', 'Get', 'Set', 'Clear'] },
        'org-chart-selection': { skipCanvasUpdateCheck: ['Get Selection'] },
    },
    'financial-charts-test': {
        'annotation-save-restore': { skipCanvasUpdateCheck: ['Save'] },
    },
    zoom: {
        // Stopping the update timer leaves the chart as it is.
        'on-data-change-preserve-domain': { skipCanvasUpdateCheck: ['Stop Updates'] },
        'on-data-change-preserve-ratio': { skipCanvasUpdateCheck: ['Stop Updates'] },
        'on-data-change-stick-to-end': { skipCanvasUpdateCheck: ['Stop Updates'] },
    },
    'zoom-data-change-test': {
        'live-streaming': { skipCanvasUpdateCheck: ['Stop Streaming'] },
        'stick-to-end': { skipCanvasUpdateCheck: ['Stop Streaming'] },
    },
    'zoom-test': {
        // The axis-type select and the 63 unlabelled number inputs only store values read by Update Data.
        'on-data-change': { skipCanvasUpdateCheck: true },
    },
    'themes-e2e': {
        '*': { frameworks: ['vanilla'] },
        // The buttons create and update detached charts, not the first one; one of them warns on purpose.
        'css-variables-attach': { frameworks: ['vanilla'], skipCanvasUpdateCheck: true, ignoreConsoleWarnings: true },
        // Once the chart moves into a shadow root, the sweep cannot find it.
        'css-variables-shadow-root': {
            frameworks: ['vanilla'],
            clickOrder: 'reverse',
            skipCanvasUpdateCheck: ['Move to shadow root'],
        },
    },
    'bar-series-e2e': {
        '*': { frameworks: ['vanilla'] },
    },
    'stylers-e2e': {
        '*': { frameworks: ['vanilla'] },
        'item-styler-test': { frameworks: ['vanilla'], skipCanvasUpdateCheck: ['Clear Console', 'Reset Status'] },
    },
    'axes-e2e': {
        '*': { frameworks: ['vanilla'] },
    },
    'accessibility-e2e': {
        '*': { frameworks: ['vanilla'] },
        // These selects only store a value read by a later action.
        'initial-focus': { frameworks: ['vanilla'], skipCanvasUpdateCheck: ['#myUpdateMode'] },
        'initial-focus-large-dataset': { frameworks: ['vanilla'], skipCanvasUpdateCheck: ['#myUpdateMode'] },
        'keyboard-navigation-interactive-captions': { frameworks: ['vanilla'], skipCanvasUpdateCheck: ['#myTestMode'] },
    },
    'events-e2e': {
        // The shape selects have no handler; Update reads them.
        'cross-line-contextmenu-event-polar': { skipCanvasUpdateCheck: ['popEvents()', '#angleShape', '#radiusShape'] },
        'cross-line-keyboard-click-polar': { skipCanvasUpdateCheck: ['popEvents()', '#angleShape', '#radiusShape'] },
    },
    'security-e2e': {
        '*': { frameworks: ['vanilla'] },
    },
    'org-chart-e2e': {
        // Only this example is vanilla-pinned; `e2e-org-chart-collapse` is swept across frameworks.
        'e2e-org-chart-active-node': { frameworks: ['vanilla'] },
    },
    'sparklines-test': {
        'debug-sequential-render': { frameworks: [] },
    },
    'example-logger-test': {
        'console-logs': { frameworks: [] },
    },
    'layout-test': {
        'layout-inline': { frameworks: [] },
        'layout-matrix': { frameworks: [] },
    },
    'org-chart-test': {
        // The 100K segment opens a confirm() dialog; Playwright auto-dismisses it, so the
        // handler cancels and nothing is redrawn.
        'org-chart-zoom-scale': { skipCanvasUpdateCheck: ['100K'] },
    },
    'range-area-series-e2e': {
        'shared-low-high-match': { frameworks: ['vanilla'] },
    },
};
