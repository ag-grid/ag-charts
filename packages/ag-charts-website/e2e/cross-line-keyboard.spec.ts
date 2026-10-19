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

const CROSS_LINE_LIST = '.ag-charts-proxy-cross-lines';
const CROSS_LINE_PROXIES = `${CROSS_LINE_LIST} button`;

const BAND: CrossLineParams = {
    axisId: 'x',
    direction: 'x',
    crossLineId: 'band',
    crossLineType: 'range',
    range: ['Q2', 'Q3'],
};
const THRESHOLD: CrossLineParams = {
    axisId: 'y',
    direction: 'y',
    crossLineId: 'threshold',
    crossLineType: 'line',
    value: 5,
};

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

test.describe('cross-line-keyboard', () => {
    setupIntrinsicAssertions(test);

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('events-e2e', 'cross-line-keyboard-click', 'vanilla').url);
    });

    test('only clickable cross lines have a proxy', async ({ page }) => {
        await expect(page.locator(CROSS_LINE_LIST)).toHaveAttribute('aria-label', 'Cross Lines');
        await expect(page.locator(CROSS_LINE_PROXIES)).toHaveText(['Peak Season, Q2 - Q3', '5']);
    });

    test('hovering a cross line still highlights the series node below it', async ({ page }) => {
        // A point on the Q2 bar, inside the range band and so beneath the band's proxy.
        const bar = await page.evaluate(() => {
            const button = document.querySelector('.ag-charts-proxy-cross-lines button')!;
            const { x, y, width, height } = button.getBoundingClientRect();
            return { x: x + width / 4, y: y + height - 10 };
        });
        await page.mouse.move(bar.x, bar.y);

        await expect(page.locator(SELECTORS.tooltip)).toBeVisible();
        await expect(page.locator(SELECTORS.tooltip)).toContainText('Q2');
        await expectChartScreenshot(page, page, 'cross-line-keyboard-hover-through-band.png', {
            animations: 'disabled',
        });
    });

    test.describe('press Tab 2 times', () => {
        test.beforeEach(async ({ page }) => {
            await page.keyboard.press('Tab'); // -> series area
            await page.keyboard.press('Tab'); // -> first cross line
        });

        // Focus is on the range band.
        test.describe('checks', () => {
            test('screenshot', async ({ page }) => {
                await expectChartScreenshot(page, page, 'cross-line-keyboard-focus-band.png', {
                    animations: 'disabled',
                });
            });
            test('textContent', async ({ page }) => {
                expect(await focusedText(page)).toBe('Peak Season, Q2 - Q3');
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
                test('textContent', async ({ page }) => {
                    expect(await focusedText(page)).toBe('Peak Season, Q2 - Q3');
                });
                test('popEvents', async ({ page }) => {
                    expect(await popEvents(page)).toEqual(expectedEvents(BAND, ['crossLine', 'axis']));
                });
            });
        });

        test.describe('press ArrowDown', () => {
            test.beforeEach(async ({ page }) => {
                await page.keyboard.press('ArrowDown');
            });

            // Focus is on the threshold line; the target line has no listener, so it is skipped.
            test.describe('checks', () => {
                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'cross-line-keyboard-focus-threshold.png', {
                        animations: 'disabled',
                    });
                });
                test('textContent', async ({ page }) => {
                    expect(await focusedText(page)).toBe('5');
                });
                test('popEvents', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
            });

            test.describe('press Space', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Space');
                });

                test.describe('checks', () => {
                    test('popEvents', async ({ page }) => {
                        expect(await popEvents(page)).toEqual(expectedEvents(THRESHOLD, ['crossLine']));
                    });
                });
            });

            test.describe('press ArrowDown again', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                });

                // The threshold line is the last proxy, so focus stays on it.
                test.describe('checks', () => {
                    test('textContent', async ({ page }) => {
                        expect(await focusedText(page)).toBe('5');
                    });
                });
            });
        });
    });
});
