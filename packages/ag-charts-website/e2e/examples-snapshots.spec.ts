import type { Page } from '@playwright/test';

import { ExampleOverrides, convertPageUrls, createTestCase } from './examples-util';
import { expect, test } from './fixture';
import { SELECTORS, getExamples, setupIntrinsicAssertions } from './util';

const exampleOptions: Record<string, Record<string, ExampleOverrides>> = {
    'image-fill-test': {
        'image-contain': {
            snapshot: true,
            frameworks: ['vanilla'],
        },
        'image-contain-repeat-x': {
            snapshot: true,
            frameworks: ['vanilla'],
        },
        'image-contain-width-height': {
            snapshot: true,
            frameworks: ['vanilla'],
        },
        'image-cover': {
            snapshot: true,
            frameworks: ['vanilla'],
        },
        'image-cover-width-height': {
            snapshot: true,
            frameworks: ['vanilla'],
        },
        'image-data-url': {
            snapshot: true,
            frameworks: ['vanilla'],
        },
        'image-default': {
            snapshot: true,
            frameworks: ['vanilla'],
        },
        'image-rotate': {
            snapshot: true,
            frameworks: ['vanilla'],
        },
        'image-scale': {
            snapshot: true,
            frameworks: ['vanilla'],
        },
        'image-url': {
            snapshot: true,
            frameworks: ['vanilla'],
        },
        'image-width-height': {
            snapshot: true,
            frameworks: ['vanilla'],
        },
    },
};

test.describe('examples snapshots', () => {
    const config = setupIntrinsicAssertions(test);

    const examples = getExamples();

    for (const { path, affected } of examples) {
        for (const opts of convertPageUrls(path, exampleOptions, [])) {
            const { framework, pagePath, example, snapshot } = opts;
            if (pagePath === 'gallery') continue;

            if (!snapshot) continue;

            // eslint-disable-next-line @typescript-eslint/unbound-method
            const testFn = affected ? test : test.skip;

            const finalCallback = async (page: Page) => {
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
