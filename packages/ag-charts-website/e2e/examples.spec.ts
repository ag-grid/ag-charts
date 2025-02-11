import { ExampleOverrides, convertPageUrls, createTestCase } from './examples-util';
import { test } from './fixture';
import { getExamples, setupIntrinsicAssertions } from './util';

const exampleOptions: Record<string, Record<string, ExampleOverrides>> = {
    animation: {
        // FIXME: Some examples could tested in reverse click-order. Skip for now.
        'initial-load': { skipCanvasUpdateCheck: true /* clickOrder: 'reverse' */ },
        'data-updates': { skipCanvasUpdateCheck: true /* clickOrder: 'reverse' */ },
        duration: { skipCanvasUpdateCheck: true },
    },

    'axes-labels': {
        // Too complex to test with a naive button-click sweep
        'axis-label-rotation': { skipCanvasUpdateCheck: true },
    },
    'api-create-update': {
        // No framework examples
        'update-partial': { frameworks: ['vanilla', 'typescript'] },
        // No framework examples, stop button does not cause visible change
        'wait-for-update': {
            frameworks: ['vanilla', 'typescript'],
            skipCanvasUpdateCheck: ['Stop'],
        },
    },
    'api-state': {
        // Buttons have no visible rendering change
        'state-save-restore': { skipCanvasUpdateCheck: ['Save'] },
        'legend-state-save-restore': { skipCanvasUpdateCheck: ['Save'] },
    },
    'api-download': {
        // No canvas updates for downloading
        download: { skipCanvasUpdateCheck: true },
    },
    events: {
        // Buttons have no visible rendering change
        'interaction-ranges': { skipCanvasUpdateCheck: true },
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
        // Warns for missing data
        'range-area-missing-data': { ignoreConsoleWarnings: true },
    },
    'range-bar-series': {
        // Warns for missing data
        'range-bar-missing-data': { ignoreConsoleWarnings: true },
    },
    'sankey-series': {
        alignment: { clickOrder: 'reverse' },
    },
    themes: {
        'stock-themes': { clickOrder: 'reverse' },
        // The canvas element changes, and we don't currently have a way to handle this
        'advanced-theme': { frameworks: [] },
    },
    tooltips: {
        // Buttons have no visible rendering change
        'interaction-range': { skipCanvasUpdateCheck: true },
    },
    touch: {
        'long-tap': { skipCanvasUpdateCheck: true },
        'single-finger-touch-dragging': { skipCanvasUpdateCheck: true },
        'two-finger-zoompan': { skipCanvasUpdateCheck: true },
    },

    sparklines: {
        // FWs not ready yet
        '*': { frameworks: ['vanilla'] },
    },
};

test.describe('examples', () => {
    const config = setupIntrinsicAssertions();

    const examples = getExamples();

    for (const { path, affected } of examples) {
        for (const opts of convertPageUrls(path, exampleOptions)) {
            const { framework, pagePath, example } = opts;
            if (pagePath === 'gallery') continue;

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const testFn = affected ? test : test.skip;

            test.describe(`Framework: ${framework}`, () => {
                test.skip(!affected, 'unaffected example');

                test.describe(`Example ${pagePath}: ${example}${affected ? '' : ' (!!!SKIPPED!!!)'}`, () => {
                    createTestCase(testFn as any, opts, config);
                });
            });
        }
    }
});
