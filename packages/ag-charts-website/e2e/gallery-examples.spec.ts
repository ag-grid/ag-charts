import { ExampleOverrides, convertPageUrls, createTestCase, triggerExampleTooltips } from './examples-util';
import { expect, test } from './fixture';
import { getExamples, setupIntrinsicAssertions } from './util';

const exampleOptions: Record<string, Record<string, ExampleOverrides>> = {
    gallery: {
        '*': { frameworks: ['vanilla', 'typescript'] },

        // Hidden gallery examples
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

test.describe('gallery examples', () => {
    const designSystemViewportConstraints = { width: 1166, height: 586 };
    const config = setupIntrinsicAssertions(test, { viewportSize: designSystemViewportConstraints });

    const examples = getExamples();

    for (const { path, affected } of examples) {
        for (const opts of convertPageUrls(path, exampleOptions)) {
            const { framework, pagePath, example } = opts;
            if (pagePath !== 'gallery') continue;

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const testFn = affected ? test : test.skip;

            test.describe(`Framework: ${framework}`, () => {
                test.skip(!affected, 'unaffected example');

                test.describe(`Example ${pagePath}: ${example}${affected ? '' : ' (!!!SKIPPED!!!)'}`, () => {
                    createTestCase(testFn as any, opts, config, async (page) => {
                        await triggerExampleTooltips(page);
                        if (opts.randomData) return;

                        await expect(page).toHaveScreenshot(`gallery-${opts.example}.png`);
                    });
                });
            });
        }
    }
});
