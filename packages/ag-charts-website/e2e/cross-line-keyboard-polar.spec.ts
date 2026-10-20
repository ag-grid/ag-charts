import type { Page } from '@playwright/test';

import type { AgAxisDirection, AgAxisValue } from 'ag-charts-types';

import { evalPageFunction } from './agE2E';
import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForChartUpdate } from './util';

type Level = 'crossLine' | 'axis';
type CrossLineParams = {
    axisId: string;
    direction: AgAxisDirection;
    crossLineId: string;
    crossLineType: 'line' | 'range';
    value?: AgAxisValue;
    range?: [AgAxisValue, AgAxisValue];
};

const CROSS_LINE_PROXIES = '.ag-charts-proxy-cross-lines button';
const SHAPES = ['circle', 'polygon'] as const;

// In proxy order. The `target` line has no listener at any level, so it has no proxy.
const CROSS_LINES: Array<{ params: CrossLineParams; text: string; levels: Level[] }> = [
    {
        params: {
            axisId: 'angle',
            direction: 'angle',
            crossLineId: 'band',
            crossLineType: 'range',
            range: ['Mar', 'Apr'],
        },
        text: 'Peak Season, Mar - Apr',
        levels: ['crossLine', 'axis'],
    },
    {
        params: { axisId: 'angle', direction: 'angle', crossLineId: 'spoke', crossLineType: 'line', value: 'Feb' },
        text: 'Feb',
        levels: ['crossLine', 'axis'],
    },
    {
        params: { axisId: 'radius', direction: 'radius', crossLineId: 'threshold', crossLineType: 'line', value: 5 },
        text: '5',
        levels: ['crossLine'],
    },
    {
        params: { axisId: 'radius', direction: 'radius', crossLineId: 'ring', crossLineType: 'range', range: [7, 8] },
        text: '7 - 8',
        levels: ['crossLine'],
    },
];

// A keyboard click matches the focused cross line alone, so `allMatchedParams` never holds another element.
function expectedEvents(hit: CrossLineParams, levels: Level[]) {
    const type = 'crossLineClick';
    const allMatchedParams = [{ type, ...hit }];
    return levels.map((level) => ({ level, type, ...hit, allMatchedParams }));
}

async function popEvents(page: Page): Promise<unknown> {
    await waitForChartUpdate(page.locator(SELECTORS.wrapper));
    return evalPageFunction(page, 'popEvents');
}

async function focusedText(page: Page): Promise<string | null> {
    return page.evaluate(() =>
        document.activeElement?.matches('.ag-charts-proxy-cross-lines button')
            ? document.activeElement.textContent
            : null
    );
}

test.describe('cross-line-keyboard-polar', () => {
    setupIntrinsicAssertions(test);

    for (const shape of SHAPES) {
        test.describe(`shape ${shape}`, () => {
            test.beforeEach(async ({ page }) => {
                await gotoExample(
                    page,
                    toExamplePageUrl('events-e2e', 'cross-line-keyboard-click-polar', 'vanilla').url
                );
                await page.locator('#angleShape').selectOption(shape);
                await page.locator('#radiusShape').selectOption(shape);
                await page.locator('#update').click();
                await waitForChartUpdate(page.locator(SELECTORS.wrapper));
            });

            test('only clickable cross lines have a proxy', async ({ page }) => {
                await expect(page.locator(CROSS_LINE_PROXIES)).toHaveText(CROSS_LINES.map(({ text }) => text));
            });

            test('hovering a cross line still highlights the series node below it', async ({ page }) => {
                // The Mar marker, inside the range band and so beneath the band's proxy.
                await page.mouse.move(472, 364);

                await expect(page.locator(SELECTORS.tooltip)).toBeVisible();
                await expect(page.locator(SELECTORS.tooltip)).toContainText('Mar');
                await expectChartScreenshot(page, page, `cross-line-keyboard-polar-${shape}-hover-through-band.png`, {
                    animations: 'disabled',
                });
            });

            test.describe('press Tab 2 times', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                });

                for (const [index, { params, text, levels }] of CROSS_LINES.entries()) {
                    test.describe(`press ArrowDown ${index} times`, () => {
                        test.beforeEach(async ({ page }) => {
                            for (let i = 0; i < index; i++) {
                                await page.keyboard.press('ArrowDown');
                            }
                        });

                        // Focus is on the `params.crossLineId` cross line.
                        test.describe('checks', () => {
                            test('screenshot', async ({ page }) => {
                                await expectChartScreenshot(
                                    page,
                                    page,
                                    `cross-line-keyboard-polar-${shape}-${params.crossLineId}.png`,
                                    { animations: 'disabled' }
                                );
                            });
                            test('textContent', async ({ page }) => {
                                expect(await focusedText(page)).toBe(text);
                            });
                            test('popEvents', async ({ page }) => {
                                expect(await popEvents(page)).toEqual([]);
                            });
                        });

                        test.describe('press Enter', () => {
                            test.beforeEach(async ({ page }) => {
                                await page.keyboard.press('Enter');
                            });

                            test.describe('checks', () => {
                                test('popEvents', async ({ page }) => {
                                    expect(await popEvents(page)).toEqual(expectedEvents(params, levels));
                                });
                            });
                        });
                    });
                }
            });
        });
    }
});
