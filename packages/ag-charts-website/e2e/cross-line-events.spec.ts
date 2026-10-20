import type { Page } from '@playwright/test';

import type { AgAxisDirection, AgAxisValue } from 'ag-charts-types';

import { evalPageFunction } from './agE2E';
import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    SELECTORS,
    canvasToPageTransformer,
    gotoExample,
    locateCanvas,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    waitForChartUpdate,
} from './util';

type Level = 'crossLine' | 'axis' | 'chart';
type EventType = 'crossLineClick' | 'crossLineDoubleClick';
type CrossLineParams = {
    axisId: string;
    direction: AgAxisDirection;
    crossLineId: string;
    crossLineType: 'line' | 'range';
    value?: AgAxisValue;
    range?: [AgAxisValue, AgAxisValue];
};
type CanvasPoint = { x: number; y: number };

// The Cartesian chart is the reference behaviour; the polar chart must report the same events with the same
// params. Points are canvas coordinates found by scanning each example at the e2e viewport.
const CHARTS = [
    {
        name: 'cartesian',
        example: 'cross-line-click-event-cartesian',
        band: { axisId: 'x', direction: 'x', crossLineId: 'band', crossLineType: 'range', range: ['Q2', 'Q3'] },
        threshold: { axisId: 'y', direction: 'y', crossLineId: 'threshold', crossLineType: 'line', value: 5 },
        points: {
            band: { x: 400, y: 150 },
            threshold: { x: 105, y: 270 },
            both: { x: 400, y: 270 },
            miss: { x: 105, y: 150 },
        },
    },
    {
        name: 'polar',
        example: 'cross-line-click-event-polar',
        band: {
            axisId: 'angle',
            direction: 'angle',
            crossLineId: 'band',
            crossLineType: 'range',
            range: ['Q2', 'Q3'],
        },
        threshold: { axisId: 'radius', direction: 'radius', crossLineId: 'threshold', crossLineType: 'line', value: 5 },
        points: {
            band: { x: 560, y: 300 },
            threshold: { x: 255, y: 285 },
            both: { x: 515, y: 285 },
            miss: { x: 330, y: 285 },
        },
    },
] satisfies Array<{
    name: string;
    example: string;
    band: CrossLineParams;
    threshold: CrossLineParams;
    points: Record<'band' | 'threshold' | 'both' | 'miss', CanvasPoint>;
}>;

// Every matched cross line delivers the event to its own listener and its axis listener, then the chart hears it
// once with the first match as the root params.
function expectedEvents(type: EventType, hits: CrossLineParams[]) {
    const allMatchedParams = hits.map((hit) => ({ type, ...hit }));
    const at = (level: Level, params: CrossLineParams) => ({ level, type, ...params, allMatchedParams });
    return [...hits.map((hit) => at('crossLine', hit)), ...hits.map((hit) => at('axis', hit)), at('chart', hits[0])];
}

const CHART_CLICK = { level: 'chart', type: 'click' };

async function popEvents(page: Page): Promise<unknown> {
    await waitForChartUpdate(page.locator(SELECTORS.wrapper));
    return evalPageFunction(page, 'popEvents');
}

const CROSS_LINE_LIST = '.ag-charts-proxy-cross-lines';
const CROSS_LINE_PROXIES = `${CROSS_LINE_LIST} button`;

// A keyboard click matches the focused cross line alone, so `allMatchedParams` never holds another element.
function expectedKeyboardEvents(hit: CrossLineParams, levels: Level[]) {
    const type = 'crossLineClick';
    const allMatchedParams = [{ type, ...hit }];
    return levels.map((level) => ({ level, type, ...hit, allMatchedParams }));
}

async function focusedText(page: Page): Promise<string | null> {
    return page.evaluate(() =>
        document.activeElement?.matches('.ag-charts-proxy-cross-lines button')
            ? document.activeElement.textContent
            : null
    );
}

const KEYBOARD_CARTESIAN = {
    band: { axisId: 'x', direction: 'x', crossLineId: 'band', crossLineType: 'range', range: ['Q2', 'Q3'] },
    threshold: { axisId: 'y', direction: 'y', crossLineId: 'threshold', crossLineType: 'line', value: 5 },
} satisfies Record<string, CrossLineParams>;

const POLAR_SHAPES = ['circle', 'polygon'] as const;

// In proxy order. The `target` line has no listener at any level, so it has no proxy.
const KEYBOARD_POLAR: Array<{ params: CrossLineParams; text: string; levels: Level[] }> = [
    {
        params: { axisId: 'angle', direction: 'angle', crossLineId: 'band', crossLineType: 'range', range: ['Mar', 'Apr'] },
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

/** Screenshots the chart alone, leaving out the example's controls. */
async function expectCanvasScreenshot(page: Page, name: string): Promise<void> {
    const { canvas } = await locateCanvas(page);
    await expectChartScreenshot(page, canvas, name, { animations: 'disabled' });
}

test.describe('cross-line-events', () => {
    setupIntrinsicAssertions(test);

    for (const chart of CHARTS) {
        test.describe(chart.name, () => {
            let toPage: (x: number, y: number) => CanvasPoint;

            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('events-e2e', chart.example, 'vanilla').url);
                toPage = await canvasToPageTransformer(page);
            });

            const cases = [
                { point: 'band', hits: [chart.band] },
                { point: 'threshold', hits: [chart.threshold] },
                { point: 'both', hits: [chart.band, chart.threshold] },
            ] as const;

            for (const { point, hits } of cases) {
                test.describe(point, () => {
                    test('click', async ({ page }) => {
                        const { x, y } = toPage(chart.points[point].x, chart.points[point].y);
                        await page.mouse.click(x, y);

                        expect(await popEvents(page)).toEqual(expectedEvents('crossLineClick', [...hits]));
                    });

                    test('double click', async ({ page }) => {
                        const { x, y } = toPage(chart.points[point].x, chart.points[point].y);
                        await page.mouse.dblclick(x, y);

                        const click = expectedEvents('crossLineClick', [...hits]);
                        const doubleClick = expectedEvents('crossLineDoubleClick', [...hits]);
                        expect(await popEvents(page)).toEqual([...click, ...click, ...doubleClick]);
                    });
                });
            }

            test('a click clear of every cross line reaches only the chart click listener', async ({ page }) => {
                const { x, y } = toPage(chart.points.miss.x, chart.points.miss.y);
                await page.mouse.click(x, y);
                expect(await popEvents(page)).toEqual([CHART_CLICK]);

                await page.mouse.dblclick(x, y);
                expect(await popEvents(page)).toEqual([CHART_CLICK, CHART_CLICK]);
            });
        });
    }

    test.describe('keyboard', () => {
        test.describe('cartesian', () => {
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
                            expect(await popEvents(page)).toEqual(
                                expectedKeyboardEvents(KEYBOARD_CARTESIAN.band, ['crossLine', 'axis'])
                            );
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
                                expect(await popEvents(page)).toEqual(
                                    expectedKeyboardEvents(KEYBOARD_CARTESIAN.threshold, ['crossLine'])
                                );
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

        for (const shape of POLAR_SHAPES) {
            test.describe(`polar shape ${shape}`, () => {
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
                    await expect(page.locator(CROSS_LINE_PROXIES)).toHaveText(KEYBOARD_POLAR.map(({ text }) => text));
                });

                test('hovering a cross line still highlights the series node below it', async ({ page }) => {
                    // The Mar marker, inside the range band and so beneath the band's proxy.
                    await page.mouse.move(472, 364);

                    await expect(page.locator(SELECTORS.tooltip)).toBeVisible();
                    await expect(page.locator(SELECTORS.tooltip)).toContainText('Mar');
                    await expectCanvasScreenshot(page, `cross-line-keyboard-polar-${shape}-hover-through-band.png`);
                });

                test.describe('press Tab 2 times', () => {
                    test.beforeEach(async ({ page }) => {
                        await page.keyboard.press('Tab'); // Update button -> series area
                        await page.keyboard.press('Tab'); // -> first cross line
                    });

                    for (const [index, { params, text, levels }] of KEYBOARD_POLAR.entries()) {
                        test.describe(`press ArrowDown ${index} times`, () => {
                            test.beforeEach(async ({ page }) => {
                                for (let i = 0; i < index; i++) {
                                    await page.keyboard.press('ArrowDown');
                                }
                            });

                            // Focus is on the `params.crossLineId` cross line.
                            test.describe('checks', () => {
                                test('screenshot', async ({ page }) => {
                                    await expectCanvasScreenshot(
                                        page,
                                        `cross-line-keyboard-polar-${shape}-${params.crossLineId}.png`
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
                                        expect(await popEvents(page)).toEqual(expectedKeyboardEvents(params, levels));
                                    });
                                });
                            });
                        });
                    }
                });
            });
        }
    });
});
