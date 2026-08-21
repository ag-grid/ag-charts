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
    'examples-controls-test': {
        // A style guide for the controls themselves — none of them drive the chart.
        'examples-controls-tester': { skipCanvasUpdateCheck: true },
    },
    'context-menu-e2e': {
        'captions-declarative': { frameworks: ['vanilla'] },
        'captions-dynamic': { frameworks: ['vanilla'] },
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
    'dev-validation': {
        'validation-overlay': { ignoreConsoleWarnings: true },
        'validation-overlay-multi': { ignoreConsoleWarnings: true, frameworks: ['vanilla'] },
        'validation-overlay-dark': { ignoreConsoleWarnings: true, frameworks: ['vanilla'] },
    },
    'range-area-series': {
        'range-area-missing-data': { ignoreConsoleWarnings: true },
    },
    'range-bar-series': {
        'range-bar-missing-data': { ignoreConsoleWarnings: true },
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
    },
    'sync-e2e': {
        '*': { frameworks: ['vanilla'] },
    },
    'api-state-e2e': {
        '*': { frameworks: ['vanilla'] },
    },
    'themes-e2e': {
        '*': { frameworks: ['vanilla'] },
    },
    'bar-series-e2e': {
        '*': { frameworks: ['vanilla'] },
    },
    'stylers-e2e': {
        '*': { frameworks: ['vanilla'] },
    },
    'axes-e2e': {
        '*': { frameworks: ['vanilla'] },
    },
    'accessibility-e2e': {
        '*': { frameworks: ['vanilla'] },
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
};
