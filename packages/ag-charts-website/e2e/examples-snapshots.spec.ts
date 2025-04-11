import { ExampleOverrides, convertPageUrls, createTestCase } from './examples-util';
import { expect, test } from './fixture';
import { SELECTORS, getExamples, setupIntrinsicAssertions } from './util';

const exampleOptions: Record<string, Record<string, ExampleOverrides>> = {
    'image-fill-test': {
        'image-url': {
            snapshot: true,
            frameworks: ['vanilla'],
        },
    },
};

test.describe('examples snapshots', () => {
    const config = setupIntrinsicAssertions();

    const examples = getExamples();

    for (const { path, affected } of examples) {
        for (const opts of convertPageUrls(path, exampleOptions, [])) {
            const { framework, pagePath, example, snapshot } = opts;
            if (pagePath === 'gallery') continue;

            if (!snapshot) continue;

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const testFn = affected ? test : test.skip;

            const finalCallback = async (page) => {
                const canvasCenter = page.locator(SELECTORS.canvasCenter);
                return await expect(canvasCenter).toHaveScreenshot(`${pagePath}-${example}-${framework}.png`);
            };

            test.describe(`Framework: ${framework}`, () => {
                test.skip(!affected, 'unaffected example');

                test.describe(`Example ${pagePath}: ${example}${affected ? '' : ' (!!!SKIPPED!!!)'}`, () => {
                    createTestCase(testFn as any, opts, config, undefined, finalCallback);
                });
            });
        }
    }
});
