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
