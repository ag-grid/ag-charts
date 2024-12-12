import { ExampleOptions, ExampleOverrides, createTestCase } from './examples-util';
import { test } from './fixture';
import { getExamples, setupIntrinsicAssertions, toExamplePageUrls, toGalleryPageUrls } from './util';

const ignorePages = ['benchmarks', /.*-test/];
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
    },
};

function convertPageUrls(path: string) {
    const astroPath = path.split('content/').at(1)!;
    const [pagePath, examplePath] = astroPath.split('/_examples/');
    const example = examplePath.replace(/\/[a-zA-Z-]+\.ts$/, '');

    const page = pagePath.replace(/^docs\//, '');
    const pages = pagePath === 'gallery' ? toGalleryPageUrls(example) : toExamplePageUrls(page, example);

    if (ignorePages.some((m) => (typeof m === 'string' ? m === page : m.test(page)))) {
        return [];
    }

    const {
        frameworks,
        status = 'ok',
        clickOrder = 'normal',
        skipCanvasUpdateCheck = false,
        ignoreConsoleWarnings = false,
    } = {
        ...exampleOptions[page]?.['*'],
        ...exampleOptions[page]?.[example],
    };

    return pages
        .filter((r) => frameworks?.includes(r.framework) !== false)
        .map(
            ({ url, example: pageExample, framework }): ExampleOptions => ({
                pagePath,
                url,
                example: pageExample,
                framework,
                status,
                clickOrder,
                skipCanvasUpdateCheck,
                ignoreConsoleWarnings,
            })
        );
}

test.describe('gallery examples', () => {
    const config = setupIntrinsicAssertions();

    const examples = getExamples();

    for (const { path, affected } of examples) {
        for (const opts of convertPageUrls(path)) {
            const { framework, pagePath, example } = opts;
            if (pagePath !== 'gallery') continue;

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const testFn = affected ? test : test.skip;

            test.describe(`Framework: ${framework}`, () => {
                test.skip(!affected, 'unaffected example');

                test.describe(`Example ${pagePath}: ${example}${affected ? '' : ' (!!!SKIPPED!!!)'}`, () => {
                    createTestCase(testFn as any, opts, { initialScreenshot: false, ...config });
                });
            });
        }
    }
});
