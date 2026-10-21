import type { Page } from '@playwright/test';

import type { AgAxisDirection, AgAxisValue, AgPolarAxisShape } from 'ag-charts-types';

import { evalPageFunction } from './agE2E';
import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    SELECTORS,
    canvasToPageTransformer,
    createConsoleLogs,
    gotoExample,
    locateCanvas,
    repeat,
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
const CARTESIAN = {
    band: { axisId: 'x', direction: 'x', crossLineId: 'band', crossLineType: 'range', range: ['Q2', 'Q3'] },
    threshold: { axisId: 'y', direction: 'y', crossLineId: 'threshold', crossLineType: 'line', value: 5 },
    points: {
        band: { x: 400, y: 150 },
        threshold: { x: 105, y: 270 },
        both: { x: 400, y: 270 },
        miss: { x: 105, y: 150 },
    },
} satisfies { band: CrossLineParams; threshold: CrossLineParams; points: Record<string, CanvasPoint> };

const POLAR = {
    band: { axisId: 'angle', direction: 'angle', crossLineId: 'band', crossLineType: 'range', range: ['Q2', 'Q3'] },
    threshold: { axisId: 'radius', direction: 'radius', crossLineId: 'threshold', crossLineType: 'line', value: 5 },
    points: {
        band: { x: 560, y: 300 },
        threshold: { x: 255, y: 285 },
        both: { x: 515, y: 285 },
        miss: { x: 330, y: 285 },
    },
} satisfies { band: CrossLineParams; threshold: CrossLineParams; points: Record<string, CanvasPoint> };

// Every matched cross line delivers the event to its own listener and its axis listener, then the chart hears it
// once with the first match as the root params.
function expectedEvents(type: EventType, hits: CrossLineParams[]) {
    const allMatchedParams = hits.map((hit) => ({ type, ...hit }));
    const at = (level: Level, params: CrossLineParams) => ({ level, type, ...params, allMatchedParams });
    return [...hits.map((hit) => at('crossLine', hit)), ...hits.map((hit) => at('axis', hit)), at('chart', hits[0])];
}

// A double click is preceded by the two clicks that make it up.
function expectedDoubleClickEvents(hits: CrossLineParams[]) {
    const click = expectedEvents('crossLineClick', hits);
    return [...click, ...click, ...expectedEvents('crossLineDoubleClick', hits)];
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

async function activeElementText(page: Page): Promise<string | null | undefined> {
    return page.evaluate(() => document.activeElement?.textContent);
}

const KEYBOARD_CARTESIAN = {
    band: { axisId: 'x', direction: 'x', crossLineId: 'band', crossLineType: 'range', range: ['Q2', 'Q3'] },
    threshold: { axisId: 'y', direction: 'y', crossLineId: 'threshold', crossLineType: 'line', value: 5 },
} satisfies Record<string, CrossLineParams>;

const KEYBOARD_POLAR = {
    band: { axisId: 'angle', direction: 'angle', crossLineId: 'band', crossLineType: 'range', range: ['Mar', 'Apr'] },
    spoke: { axisId: 'angle', direction: 'angle', crossLineId: 'spoke', crossLineType: 'line', value: 'Feb' },
    threshold: { axisId: 'radius', direction: 'radius', crossLineId: 'threshold', crossLineType: 'line', value: 5 },
    ring: { axisId: 'radius', direction: 'radius', crossLineId: 'ring', crossLineType: 'range', range: [7, 8] },
} satisfies Record<string, CrossLineParams>;

/** Sets both polar axes to `shape`, through the example's controls. */
async function gotoPolarExample(page: Page, example: string, shape: AgPolarAxisShape): Promise<void> {
    await gotoExample(page, toExamplePageUrl('events-e2e', example, 'vanilla').url);
    await page.locator('#angleShape').selectOption(shape);
    await page.locator('#radiusShape').selectOption(shape);
    await page.locator('#update').click();
    await waitForChartUpdate(page.locator(SELECTORS.wrapper));
}

/** Screenshots the chart alone, leaving out the example's controls. */
async function expectCanvasScreenshot(page: Page, name: string): Promise<void> {
    const { canvas } = await locateCanvas(page);
    await expectChartScreenshot(page, canvas, name, { animations: 'disabled' });
}

const CONTEXT_MENU = '.ag-charts-context-menu';
const CONTEXT_MENU_ITEMS = `${CONTEXT_MENU}__item`;

// Accessible text of the cross line proxies in the Cartesian context menu example.
const FIRST_LOCKDOWN_TEXT =
    'First lockdown, Mon Mar 23 2020 00:00:00 GMT+0000 (Coordinated Universal Time) - Mon Jun 01 2020 00:00:00 GMT+0000 (Coordinated Universal Time)';
const ALPHA_VARIANT_TEXT = 'Alpha, Tue Dec 01 2020 00:00:00 GMT+0000 (Coordinated Universal Time)';
const ICU_CAPACITY_TEXT = 'ICU capacity (700 beds), 700';
const SURGE_ZONE_TEXT = 'Surge zone, 500 - 600';

test.describe('cross-line-events', () => {
    setupIntrinsicAssertions(test);

    test.describe('cartesian', () => {
        let toPage: (x: number, y: number) => CanvasPoint;

        test.beforeEach(async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('events-e2e', 'cross-line-click-event-cartesian', 'vanilla').url);
            toPage = await canvasToPageTransformer(page);
        });

        test.describe('band', () => {
            test('click', async ({ page }) => {
                const { x, y } = toPage(CARTESIAN.points.band.x, CARTESIAN.points.band.y);
                await page.mouse.click(x, y);

                expect(await popEvents(page)).toEqual(expectedEvents('crossLineClick', [CARTESIAN.band]));
            });

            test('double click', async ({ page }) => {
                const { x, y } = toPage(CARTESIAN.points.band.x, CARTESIAN.points.band.y);
                await page.mouse.dblclick(x, y);

                expect(await popEvents(page)).toEqual(expectedDoubleClickEvents([CARTESIAN.band]));
            });
        });

        test.describe('threshold', () => {
            test('click', async ({ page }) => {
                const { x, y } = toPage(CARTESIAN.points.threshold.x, CARTESIAN.points.threshold.y);
                await page.mouse.click(x, y);

                expect(await popEvents(page)).toEqual(expectedEvents('crossLineClick', [CARTESIAN.threshold]));
            });

            test('double click', async ({ page }) => {
                const { x, y } = toPage(CARTESIAN.points.threshold.x, CARTESIAN.points.threshold.y);
                await page.mouse.dblclick(x, y);

                expect(await popEvents(page)).toEqual(expectedDoubleClickEvents([CARTESIAN.threshold]));
            });
        });

        test.describe('both', () => {
            test('click', async ({ page }) => {
                const { x, y } = toPage(CARTESIAN.points.both.x, CARTESIAN.points.both.y);
                await page.mouse.click(x, y);

                expect(await popEvents(page)).toEqual(
                    expectedEvents('crossLineClick', [CARTESIAN.band, CARTESIAN.threshold])
                );
            });

            test('double click', async ({ page }) => {
                const { x, y } = toPage(CARTESIAN.points.both.x, CARTESIAN.points.both.y);
                await page.mouse.dblclick(x, y);

                expect(await popEvents(page)).toEqual(expectedDoubleClickEvents([CARTESIAN.band, CARTESIAN.threshold]));
            });
        });

        test('a click clear of every cross line reaches only the chart click listener', async ({ page }) => {
            const { x, y } = toPage(CARTESIAN.points.miss.x, CARTESIAN.points.miss.y);
            await page.mouse.click(x, y);
            expect(await popEvents(page)).toEqual([CHART_CLICK]);

            await page.mouse.dblclick(x, y);
            expect(await popEvents(page)).toEqual([CHART_CLICK, CHART_CLICK]);
        });
    });

    test.describe('polar', () => {
        let toPage: (x: number, y: number) => CanvasPoint;

        test.beforeEach(async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('events-e2e', 'cross-line-click-event-polar', 'vanilla').url);
            toPage = await canvasToPageTransformer(page);
        });

        test.describe('band', () => {
            test('click', async ({ page }) => {
                const { x, y } = toPage(POLAR.points.band.x, POLAR.points.band.y);
                await page.mouse.click(x, y);

                expect(await popEvents(page)).toEqual(expectedEvents('crossLineClick', [POLAR.band]));
            });

            test('double click', async ({ page }) => {
                const { x, y } = toPage(POLAR.points.band.x, POLAR.points.band.y);
                await page.mouse.dblclick(x, y);

                expect(await popEvents(page)).toEqual(expectedDoubleClickEvents([POLAR.band]));
            });
        });

        test.describe('threshold', () => {
            test('click', async ({ page }) => {
                const { x, y } = toPage(POLAR.points.threshold.x, POLAR.points.threshold.y);
                await page.mouse.click(x, y);

                expect(await popEvents(page)).toEqual(expectedEvents('crossLineClick', [POLAR.threshold]));
            });

            test('double click', async ({ page }) => {
                const { x, y } = toPage(POLAR.points.threshold.x, POLAR.points.threshold.y);
                await page.mouse.dblclick(x, y);

                expect(await popEvents(page)).toEqual(expectedDoubleClickEvents([POLAR.threshold]));
            });
        });

        test.describe('both', () => {
            test('click', async ({ page }) => {
                const { x, y } = toPage(POLAR.points.both.x, POLAR.points.both.y);
                await page.mouse.click(x, y);

                expect(await popEvents(page)).toEqual(expectedEvents('crossLineClick', [POLAR.band, POLAR.threshold]));
            });

            test('double click', async ({ page }) => {
                const { x, y } = toPage(POLAR.points.both.x, POLAR.points.both.y);
                await page.mouse.dblclick(x, y);

                expect(await popEvents(page)).toEqual(expectedDoubleClickEvents([POLAR.band, POLAR.threshold]));
            });
        });

        test('a click clear of every cross line reaches only the chart click listener', async ({ page }) => {
            const { x, y } = toPage(POLAR.points.miss.x, POLAR.points.miss.y);
            await page.mouse.click(x, y);
            expect(await popEvents(page)).toEqual([CHART_CLICK]);

            await page.mouse.dblclick(x, y);
            expect(await popEvents(page)).toEqual([CHART_CLICK, CHART_CLICK]);
        });
    });

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

            test.describe('focus band', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                });

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

                test('press Enter: textContent', async ({ page }) => {
                    await page.keyboard.press('Enter');
                    expect(await focusedText(page)).toBe('Peak Season, Q2 - Q3');
                });
                test('press Enter: popEvents', async ({ page }) => {
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual(
                        expectedKeyboardEvents(KEYBOARD_CARTESIAN.band, ['crossLine', 'axis'])
                    );
                });
            });

            // The target line has no listener, so ArrowDown skips it.
            test.describe('focus threshold', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await page.keyboard.press('ArrowDown');
                });

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

                test('press Space: popEvents', async ({ page }) => {
                    await page.keyboard.press('Space');
                    expect(await popEvents(page)).toEqual(
                        expectedKeyboardEvents(KEYBOARD_CARTESIAN.threshold, ['crossLine'])
                    );
                });

                // The threshold line is the last proxy, so focus stays on it.
                test('press ArrowDown again: textContent', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    expect(await focusedText(page)).toBe('5');
                });
            });
        });

        // In proxy order: band, spoke, threshold, ring. The `target` line has no listener at any level, so it has
        // no proxy.
        test.describe('polar shape circle', () => {
            test.beforeEach(async ({ page }) => {
                await gotoPolarExample(page, 'cross-line-keyboard-click-polar', 'circle');
            });

            test('only clickable cross lines have a proxy', async ({ page }) => {
                await expect(page.locator(CROSS_LINE_PROXIES)).toHaveText([
                    'Peak Season, Mar - Apr',
                    'Feb',
                    '5',
                    '7 - 8',
                ]);
            });

            test('hovering a cross line still highlights the series node below it', async ({ page }) => {
                // The Mar marker, inside the range band and so beneath the band's proxy.
                await page.mouse.move(472, 364);

                await expect(page.locator(SELECTORS.tooltip)).toBeVisible();
                await expect(page.locator(SELECTORS.tooltip)).toContainText('Mar');
                await expectCanvasScreenshot(page, 'cross-line-keyboard-polar-circle-hover-through-band.png');
            });

            test.describe('focus band', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                });

                test('screenshot', async ({ page }) => {
                    await expectCanvasScreenshot(page, 'cross-line-keyboard-polar-circle-band.png');
                });
                test('textContent', async ({ page }) => {
                    expect(await focusedText(page)).toBe('Peak Season, Mar - Apr');
                });
                test('popEvents', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Enter: popEvents', async ({ page }) => {
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual(
                        expectedKeyboardEvents(KEYBOARD_POLAR.band, ['crossLine', 'axis'])
                    );
                });
            });

            test.describe('focus spoke', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await page.keyboard.press('ArrowDown');
                });

                test('screenshot', async ({ page }) => {
                    await expectCanvasScreenshot(page, 'cross-line-keyboard-polar-circle-spoke.png');
                });
                test('textContent', async ({ page }) => {
                    expect(await focusedText(page)).toBe('Feb');
                });
                test('popEvents', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Enter: popEvents', async ({ page }) => {
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual(
                        expectedKeyboardEvents(KEYBOARD_POLAR.spoke, ['crossLine', 'axis'])
                    );
                });
            });

            test.describe('focus threshold', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await repeat(2, () => page.keyboard.press('ArrowDown'));
                });

                test('screenshot', async ({ page }) => {
                    await expectCanvasScreenshot(page, 'cross-line-keyboard-polar-circle-threshold.png');
                });
                test('textContent', async ({ page }) => {
                    expect(await focusedText(page)).toBe('5');
                });
                test('popEvents', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Enter: popEvents', async ({ page }) => {
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual(
                        expectedKeyboardEvents(KEYBOARD_POLAR.threshold, ['crossLine'])
                    );
                });
            });

            test.describe('focus ring', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await repeat(3, () => page.keyboard.press('ArrowDown'));
                });

                test('screenshot', async ({ page }) => {
                    await expectCanvasScreenshot(page, 'cross-line-keyboard-polar-circle-ring.png');
                });
                test('textContent', async ({ page }) => {
                    expect(await focusedText(page)).toBe('7 - 8');
                });
                test('popEvents', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Enter: popEvents', async ({ page }) => {
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual(expectedKeyboardEvents(KEYBOARD_POLAR.ring, ['crossLine']));
                });
            });
        });

        // Same as 'polar shape circle', with polygon axes.
        test.describe('polar shape polygon', () => {
            test.beforeEach(async ({ page }) => {
                await gotoPolarExample(page, 'cross-line-keyboard-click-polar', 'polygon');
            });

            test('only clickable cross lines have a proxy', async ({ page }) => {
                await expect(page.locator(CROSS_LINE_PROXIES)).toHaveText([
                    'Peak Season, Mar - Apr',
                    'Feb',
                    '5',
                    '7 - 8',
                ]);
            });

            test('hovering a cross line still highlights the series node below it', async ({ page }) => {
                // The Mar marker, inside the range band and so beneath the band's proxy.
                await page.mouse.move(472, 364);

                await expect(page.locator(SELECTORS.tooltip)).toBeVisible();
                await expect(page.locator(SELECTORS.tooltip)).toContainText('Mar');
                await expectCanvasScreenshot(page, 'cross-line-keyboard-polar-polygon-hover-through-band.png');
            });

            test.describe('focus band', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                });

                test('screenshot', async ({ page }) => {
                    await expectCanvasScreenshot(page, 'cross-line-keyboard-polar-polygon-band.png');
                });
                test('textContent', async ({ page }) => {
                    expect(await focusedText(page)).toBe('Peak Season, Mar - Apr');
                });
                test('popEvents', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Enter: popEvents', async ({ page }) => {
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual(
                        expectedKeyboardEvents(KEYBOARD_POLAR.band, ['crossLine', 'axis'])
                    );
                });
            });

            test.describe('focus spoke', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await page.keyboard.press('ArrowDown');
                });

                test('screenshot', async ({ page }) => {
                    await expectCanvasScreenshot(page, 'cross-line-keyboard-polar-polygon-spoke.png');
                });
                test('textContent', async ({ page }) => {
                    expect(await focusedText(page)).toBe('Feb');
                });
                test('popEvents', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Enter: popEvents', async ({ page }) => {
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual(
                        expectedKeyboardEvents(KEYBOARD_POLAR.spoke, ['crossLine', 'axis'])
                    );
                });
            });

            test.describe('focus threshold', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await repeat(2, () => page.keyboard.press('ArrowDown'));
                });

                test('screenshot', async ({ page }) => {
                    await expectCanvasScreenshot(page, 'cross-line-keyboard-polar-polygon-threshold.png');
                });
                test('textContent', async ({ page }) => {
                    expect(await focusedText(page)).toBe('5');
                });
                test('popEvents', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Enter: popEvents', async ({ page }) => {
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual(
                        expectedKeyboardEvents(KEYBOARD_POLAR.threshold, ['crossLine'])
                    );
                });
            });

            test.describe('focus ring', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await repeat(3, () => page.keyboard.press('ArrowDown'));
                });

                test('screenshot', async ({ page }) => {
                    await expectCanvasScreenshot(page, 'cross-line-keyboard-polar-polygon-ring.png');
                });
                test('textContent', async ({ page }) => {
                    expect(await focusedText(page)).toBe('7 - 8');
                });
                test('popEvents', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Enter: popEvents', async ({ page }) => {
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual(expectedKeyboardEvents(KEYBOARD_POLAR.ring, ['crossLine']));
                });
            });
        });
    });

    // The menu holds the focused cross line's item alone, whatever lies at the centre of its proxy. Opening the menu
    // moves focus to its first item, `Download`; ArrowDown then moves to the cross line's item.
    test.describe('keyboard context menu', () => {
        const consoleLogs = createConsoleLogs();

        // The example's cross line listeners log to the console with a `[listener name]` prefix.
        async function popListenerLogs(page: Page): Promise<string[]> {
            await waitForChartUpdate(page.locator(SELECTORS.wrapper));
            return consoleLogs.getLogs().filter((log) => log.startsWith('['));
        }

        test.describe('cartesian', () => {
            test.beforeEach(async ({ page }) => {
                await gotoExample(
                    page,
                    toExamplePageUrl('events-e2e', 'cross-line-contextmenu-event-cartesian', 'vanilla').url
                );
            });

            test.describe('x range first-lockdown', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    expect(await focusedText(page)).toBe(FIRST_LOCKDOWN_TEXT);

                    consoleLogs.clear();
                    await page.keyboard.press('ContextMenu');
                    await expect(page.locator(CONTEXT_MENU)).toBeVisible();
                });

                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'cross-line-contextmenu-cartesian-first-lockdown.png', {
                        animations: 'disabled',
                    });
                });
                test('items', async ({ page }) => {
                    await expect(page.locator(CONTEXT_MENU_ITEMS)).toHaveText([
                        'Download',
                        'Say hello to range cross line first-lockdown',
                    ]);
                });
                test('activeElement', async ({ page }) => {
                    expect(await activeElementText(page)).toBe('Download');
                });
                test('listeners', async ({ page }) => {
                    expect(await popListenerLogs(page)).toEqual([]);
                });
                test('press Escape: menu', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    await expect(page.locator(CONTEXT_MENU)).toBeHidden();
                });
                test('press Escape: textContent', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    expect(await focusedText(page)).toBe(FIRST_LOCKDOWN_TEXT);
                });
                test('press ArrowDown, Enter: console', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await consoleLogs.expectLogs(['Hello x-range undefined!']);
                });
                test('press ArrowDown, Enter: listeners', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    expect(await popListenerLogs(page)).toEqual([]);
                });
            });

            test.describe('x line alpha-variant', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await repeat(3, () => page.keyboard.press('ArrowDown'));
                    expect(await focusedText(page)).toBe(ALPHA_VARIANT_TEXT);

                    consoleLogs.clear();
                    await page.keyboard.press('ContextMenu');
                    await expect(page.locator(CONTEXT_MENU)).toBeVisible();
                });

                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'cross-line-contextmenu-cartesian-alpha-variant.png', {
                        animations: 'disabled',
                    });
                });
                test('items', async ({ page }) => {
                    await expect(page.locator(CONTEXT_MENU_ITEMS)).toHaveText([
                        'Download',
                        'Say hello to line cross line alpha-variant',
                    ]);
                });
                test('activeElement', async ({ page }) => {
                    expect(await activeElementText(page)).toBe('Download');
                });
                test('listeners', async ({ page }) => {
                    expect(await popListenerLogs(page)).toEqual([]);
                });
                test('press Escape: menu', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    await expect(page.locator(CONTEXT_MENU)).toBeHidden();
                });
                test('press Escape: textContent', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    expect(await focusedText(page)).toBe(ALPHA_VARIANT_TEXT);
                });
                test('press ArrowDown, Enter: console', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await consoleLogs.expectLogs([
                        'Hello x-line Tue Dec 01 2020 00:00:00 GMT+0000 (Coordinated Universal Time)!',
                    ]);
                });
                test('press ArrowDown, Enter: listeners', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    expect(await popListenerLogs(page)).toEqual([]);
                });
            });

            test.describe('y line icu-capacity', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await repeat(6, () => page.keyboard.press('ArrowDown'));
                    expect(await focusedText(page)).toBe(ICU_CAPACITY_TEXT);

                    consoleLogs.clear();
                    await page.keyboard.press('ContextMenu');
                    await expect(page.locator(CONTEXT_MENU)).toBeVisible();
                });

                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'cross-line-contextmenu-cartesian-icu-capacity.png', {
                        animations: 'disabled',
                    });
                });
                test('items', async ({ page }) => {
                    await expect(page.locator(CONTEXT_MENU_ITEMS)).toHaveText([
                        'Download',
                        'Say hello to line cross line icu-capacity',
                    ]);
                });
                test('activeElement', async ({ page }) => {
                    expect(await activeElementText(page)).toBe('Download');
                });
                test('listeners', async ({ page }) => {
                    expect(await popListenerLogs(page)).toEqual([]);
                });
                test('press Escape: menu', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    await expect(page.locator(CONTEXT_MENU)).toBeHidden();
                });
                test('press Escape: textContent', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    expect(await focusedText(page)).toBe(ICU_CAPACITY_TEXT);
                });
                test('press ArrowDown, Enter: console', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await consoleLogs.expectLogs(['Hello y-line 700!']);
                });
                test('press ArrowDown, Enter: listeners', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    expect(await popListenerLogs(page)).toEqual([]);
                });
            });

            test.describe('y range surge-zone', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await repeat(7, () => page.keyboard.press('ArrowDown'));
                    expect(await focusedText(page)).toBe(SURGE_ZONE_TEXT);

                    consoleLogs.clear();
                    await page.keyboard.press('ContextMenu');
                    await expect(page.locator(CONTEXT_MENU)).toBeVisible();
                });

                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'cross-line-contextmenu-cartesian-surge-zone.png', {
                        animations: 'disabled',
                    });
                });
                test('items', async ({ page }) => {
                    await expect(page.locator(CONTEXT_MENU_ITEMS)).toHaveText([
                        'Download',
                        'Say hello to range cross line surge-zone',
                    ]);
                });
                test('activeElement', async ({ page }) => {
                    expect(await activeElementText(page)).toBe('Download');
                });
                test('listeners', async ({ page }) => {
                    expect(await popListenerLogs(page)).toEqual([]);
                });
                test('press Escape: menu', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    await expect(page.locator(CONTEXT_MENU)).toBeHidden();
                });
                test('press Escape: textContent', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    expect(await focusedText(page)).toBe(SURGE_ZONE_TEXT);
                });
                test('press ArrowDown, Enter: console', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await consoleLogs.expectLogs(['Hello y-range undefined!']);
                });
                test('press ArrowDown, Enter: listeners', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    expect(await popListenerLogs(page)).toEqual([]);
                });
            });
        });

        // In proxy order: band, spoke, threshold, ring.
        test.describe('polar shape circle', () => {
            test.beforeEach(async ({ page }) => {
                await gotoPolarExample(page, 'cross-line-contextmenu-event-polar', 'circle');
            });

            test.describe('angle range band', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    expect(await focusedText(page)).toBe('Q2 - Q3');

                    consoleLogs.clear();
                    await page.keyboard.press('ContextMenu');
                    await expect(page.locator(CONTEXT_MENU)).toBeVisible();
                });

                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'cross-line-contextmenu-polar-circle-band.png', {
                        animations: 'disabled',
                    });
                });
                test('items', async ({ page }) => {
                    await expect(page.locator(CONTEXT_MENU_ITEMS)).toHaveText([
                        'Download',
                        'Say hello to range cross line band',
                    ]);
                });
                test('activeElement', async ({ page }) => {
                    expect(await activeElementText(page)).toBe('Download');
                });
                test('listeners', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Escape: menu', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    await expect(page.locator(CONTEXT_MENU)).toBeHidden();
                });
                test('press Escape: textContent', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    expect(await focusedText(page)).toBe('Q2 - Q3');
                });
                test('press ArrowDown, Enter: console', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await consoleLogs.expectLogs(['Hello angle-range undefined!']);
                });
                test('press ArrowDown, Enter: listeners', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual([]);
                });
            });

            test.describe('angle line spoke', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await page.keyboard.press('ArrowDown');
                    expect(await focusedText(page)).toBe('Q1');

                    consoleLogs.clear();
                    await page.keyboard.press('ContextMenu');
                    await expect(page.locator(CONTEXT_MENU)).toBeVisible();
                });

                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'cross-line-contextmenu-polar-circle-spoke.png', {
                        animations: 'disabled',
                    });
                });
                test('items', async ({ page }) => {
                    await expect(page.locator(CONTEXT_MENU_ITEMS)).toHaveText([
                        'Download',
                        'Say hello to line cross line spoke',
                    ]);
                });
                test('activeElement', async ({ page }) => {
                    expect(await activeElementText(page)).toBe('Download');
                });
                test('listeners', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Escape: menu', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    await expect(page.locator(CONTEXT_MENU)).toBeHidden();
                });
                test('press Escape: textContent', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    expect(await focusedText(page)).toBe('Q1');
                });
                test('press ArrowDown, Enter: console', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await consoleLogs.expectLogs(['Hello angle-line Q1!']);
                });
                test('press ArrowDown, Enter: listeners', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual([]);
                });
            });

            test.describe('radius line threshold', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await repeat(2, () => page.keyboard.press('ArrowDown'));
                    expect(await focusedText(page)).toBe('5');

                    consoleLogs.clear();
                    await page.keyboard.press('ContextMenu');
                    await expect(page.locator(CONTEXT_MENU)).toBeVisible();
                });

                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'cross-line-contextmenu-polar-circle-threshold.png', {
                        animations: 'disabled',
                    });
                });
                test('items', async ({ page }) => {
                    await expect(page.locator(CONTEXT_MENU_ITEMS)).toHaveText([
                        'Download',
                        'Say hello to line cross line threshold',
                    ]);
                });
                test('activeElement', async ({ page }) => {
                    expect(await activeElementText(page)).toBe('Download');
                });
                test('listeners', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Escape: menu', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    await expect(page.locator(CONTEXT_MENU)).toBeHidden();
                });
                test('press Escape: textContent', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    expect(await focusedText(page)).toBe('5');
                });
                test('press ArrowDown, Enter: console', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await consoleLogs.expectLogs(['Hello radius-line 5!']);
                });
                test('press ArrowDown, Enter: listeners', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual([]);
                });
            });

            test.describe('radius range ring', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await repeat(3, () => page.keyboard.press('ArrowDown'));
                    expect(await focusedText(page)).toBe('7 - 8');

                    consoleLogs.clear();
                    await page.keyboard.press('ContextMenu');
                    await expect(page.locator(CONTEXT_MENU)).toBeVisible();
                });

                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'cross-line-contextmenu-polar-circle-ring.png', {
                        animations: 'disabled',
                    });
                });
                test('items', async ({ page }) => {
                    await expect(page.locator(CONTEXT_MENU_ITEMS)).toHaveText([
                        'Download',
                        'Say hello to range cross line ring',
                    ]);
                });
                test('activeElement', async ({ page }) => {
                    expect(await activeElementText(page)).toBe('Download');
                });
                test('listeners', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Escape: menu', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    await expect(page.locator(CONTEXT_MENU)).toBeHidden();
                });
                test('press Escape: textContent', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    expect(await focusedText(page)).toBe('7 - 8');
                });
                test('press ArrowDown, Enter: console', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await consoleLogs.expectLogs(['Hello radius-range undefined!']);
                });
                test('press ArrowDown, Enter: listeners', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual([]);
                });
            });
        });

        // Same as 'polar shape circle', with polygon axes.
        test.describe('polar shape polygon', () => {
            test.beforeEach(async ({ page }) => {
                await gotoPolarExample(page, 'cross-line-contextmenu-event-polar', 'polygon');
            });

            test.describe('angle range band', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    expect(await focusedText(page)).toBe('Q2 - Q3');

                    consoleLogs.clear();
                    await page.keyboard.press('ContextMenu');
                    await expect(page.locator(CONTEXT_MENU)).toBeVisible();
                });

                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'cross-line-contextmenu-polar-polygon-band.png', {
                        animations: 'disabled',
                    });
                });
                test('items', async ({ page }) => {
                    await expect(page.locator(CONTEXT_MENU_ITEMS)).toHaveText([
                        'Download',
                        'Say hello to range cross line band',
                    ]);
                });
                test('activeElement', async ({ page }) => {
                    expect(await activeElementText(page)).toBe('Download');
                });
                test('listeners', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Escape: menu', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    await expect(page.locator(CONTEXT_MENU)).toBeHidden();
                });
                test('press Escape: textContent', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    expect(await focusedText(page)).toBe('Q2 - Q3');
                });
                test('press ArrowDown, Enter: console', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await consoleLogs.expectLogs(['Hello angle-range undefined!']);
                });
                test('press ArrowDown, Enter: listeners', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual([]);
                });
            });

            test.describe('angle line spoke', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await page.keyboard.press('ArrowDown');
                    expect(await focusedText(page)).toBe('Q1');

                    consoleLogs.clear();
                    await page.keyboard.press('ContextMenu');
                    await expect(page.locator(CONTEXT_MENU)).toBeVisible();
                });

                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'cross-line-contextmenu-polar-polygon-spoke.png', {
                        animations: 'disabled',
                    });
                });
                test('items', async ({ page }) => {
                    await expect(page.locator(CONTEXT_MENU_ITEMS)).toHaveText([
                        'Download',
                        'Say hello to line cross line spoke',
                    ]);
                });
                test('activeElement', async ({ page }) => {
                    expect(await activeElementText(page)).toBe('Download');
                });
                test('listeners', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Escape: menu', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    await expect(page.locator(CONTEXT_MENU)).toBeHidden();
                });
                test('press Escape: textContent', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    expect(await focusedText(page)).toBe('Q1');
                });
                test('press ArrowDown, Enter: console', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await consoleLogs.expectLogs(['Hello angle-line Q1!']);
                });
                test('press ArrowDown, Enter: listeners', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual([]);
                });
            });

            test.describe('radius line threshold', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await repeat(2, () => page.keyboard.press('ArrowDown'));
                    expect(await focusedText(page)).toBe('5');

                    consoleLogs.clear();
                    await page.keyboard.press('ContextMenu');
                    await expect(page.locator(CONTEXT_MENU)).toBeVisible();
                });

                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'cross-line-contextmenu-polar-polygon-threshold.png', {
                        animations: 'disabled',
                    });
                });
                test('items', async ({ page }) => {
                    await expect(page.locator(CONTEXT_MENU_ITEMS)).toHaveText([
                        'Download',
                        'Say hello to line cross line threshold',
                    ]);
                });
                test('activeElement', async ({ page }) => {
                    expect(await activeElementText(page)).toBe('Download');
                });
                test('listeners', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Escape: menu', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    await expect(page.locator(CONTEXT_MENU)).toBeHidden();
                });
                test('press Escape: textContent', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    expect(await focusedText(page)).toBe('5');
                });
                test('press ArrowDown, Enter: console', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await consoleLogs.expectLogs(['Hello radius-line 5!']);
                });
                test('press ArrowDown, Enter: listeners', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual([]);
                });
            });

            test.describe('radius range ring', () => {
                test.beforeEach(async ({ page }) => {
                    await page.keyboard.press('Tab'); // Update button -> series area
                    await page.keyboard.press('Tab'); // -> first cross line
                    await repeat(3, () => page.keyboard.press('ArrowDown'));
                    expect(await focusedText(page)).toBe('7 - 8');

                    consoleLogs.clear();
                    await page.keyboard.press('ContextMenu');
                    await expect(page.locator(CONTEXT_MENU)).toBeVisible();
                });

                test('screenshot', async ({ page }) => {
                    await expectChartScreenshot(page, page, 'cross-line-contextmenu-polar-polygon-ring.png', {
                        animations: 'disabled',
                    });
                });
                test('items', async ({ page }) => {
                    await expect(page.locator(CONTEXT_MENU_ITEMS)).toHaveText([
                        'Download',
                        'Say hello to range cross line ring',
                    ]);
                });
                test('activeElement', async ({ page }) => {
                    expect(await activeElementText(page)).toBe('Download');
                });
                test('listeners', async ({ page }) => {
                    expect(await popEvents(page)).toEqual([]);
                });
                test('press Escape: menu', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    await expect(page.locator(CONTEXT_MENU)).toBeHidden();
                });
                test('press Escape: textContent', async ({ page }) => {
                    await page.keyboard.press('Escape');
                    expect(await focusedText(page)).toBe('7 - 8');
                });
                test('press ArrowDown, Enter: console', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    await consoleLogs.expectLogs(['Hello radius-range undefined!']);
                });
                test('press ArrowDown, Enter: listeners', async ({ page }) => {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                    expect(await popEvents(page)).toEqual([]);
                });
            });
        });
    });
});
