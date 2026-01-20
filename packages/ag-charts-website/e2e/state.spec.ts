import type { Locator, Page } from '@playwright/test';

import type { AgChartState } from 'ag-charts-types';

import { expect, test } from './fixture';
import {
    SELECTORS,
    createConsoleLogs,
    gotoExample,
    locateCanvas,
    repeat,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    waitForChartUpdate,
} from './util';

type ConsoleLogs = ReturnType<typeof createConsoleLogs>;

async function getChartState(page: Page): Promise<AgChartState> {
    const state = await page.evaluate(() => {
        const chart: unknown = (window as any)?.agE2E?.chart;
        if (!chart) {
            throw new Error('window.agE2E.chart is not defined');
        } else if (typeof chart !== 'object') {
            throw new Error('window.agE2E.chart is not an object');
        } else if (!('getState' in chart)) {
            throw new Error('window.agE2E.chart does not have getState property');
        } else if (typeof chart.getState !== 'function') {
            throw new Error('window.agE2E.chart.getState is not a function');
        }
        return chart.getState();
    });

    expect(state).toBeDefined();
    expect(typeof state).toBe('object');
    return state;
}

async function setChartState(page: Page, state: AgChartState): Promise<void> {
    await page.evaluate(
        async ({ newState }) => {
            const chart: unknown = (window as any)?.agE2E?.chart;
            if (!chart) {
                throw new Error('window.agE2E.chart is not defined');
            } else if (typeof chart !== 'object') {
                throw new Error('window.agE2E.chart is not an object');
            } else if (!('setState' in chart)) {
                throw new Error('window.agE2E.chart does not have setState property');
            } else if (typeof chart.setState !== 'function') {
                throw new Error('window.agE2E.chart.setState is not a function');
            }

            const setStateReturn = chart.setState(newState);
            if (!(setStateReturn instanceof Promise)) {
                throw new Error('window.agE2E.chart.setState did not return a Promise');
            }
            await setStateReturn;
        },
        { newState: state }
    );
    await waitForChartUpdate(page.locator('.ag-charts-wrapper'));
}

test.describe('state', () => {
    setupIntrinsicAssertions(test);

    test('legend and zoom', async ({ page }) => {
        const { url } = toExamplePageUrl('api-state-test', 'legend-zoom-e2e', 'vanilla');

        await gotoExample(page, url);

        const legendItems = await page.locator(SELECTORS.legendItems).all();
        const bbox0 = await legendItems[0].boundingBox();
        if (!bbox0) throw new Error('Legend item not found');

        await page.mouse.click(bbox0.x, bbox0.y);
        await page.locator('.example-controls button').getByText('Save').click();
        await expect(page).toHaveScreenshot('state-legend-zoom-1-saved.png', { animations: 'disabled' });

        await page.locator('.example-controls button').getByText('Reload').click();
        await expect(page).toHaveScreenshot('state-legend-zoom-1-reloaded.png', { animations: 'disabled' });

        await page.locator('.example-controls button').getByText('Restore').click();
        await expect(page).toHaveScreenshot('state-legend-zoom-1-restored.png', { animations: 'disabled' });
    });

    test.describe('active', () => {
        test.describe('line-example', () => {
            let canvas: Locator;

            async function pickDatum(page: Page, datum: { country: string; year: string }): Promise<void> {
                await page.selectOption('#myCountry', datum.country);
                await page.selectOption('#myYear', datum.year);
                await page.click('#mySetState');
            }

            async function hoverInCenter(page: Page): Promise<void> {
                const { width, height } = await locateCanvas(page);
                await page.mouse.move(width / 2, height / 2);
            }

            async function hoverInTopLeft(page: Page): Promise<void> {
                await page.mouse.move(20, 20);
            }

            async function hoverOnUKLegend(page: Page): Promise<void> {
                await page.mouse.move(304, 556);
            }

            async function setStateInvalidNodeId(consoleLogs: ConsoleLogs, page: Page, version: string): Promise<void> {
                await setChartState(page, {
                    version,
                    active: {
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: '10000', seriesId: 'LineSeries-1' },
                    },
                });
                expect(consoleLogs.getLogs()).toEqual([
                    "AG Charts - Cannot find datum: { seriesId: 'LineSeries-1', itemId: '10000' }",
                ]);
                consoleLogs.clear();
            }

            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('active', 'line-example', 'vanilla').url);
                canvas = page.locator(SELECTORS.canvasCenter);
            });

            test.describe('3 setState calls', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('line-example-canvas-inactive.png');

                    await pickDatum(page, { country: 'Spain', year: '2010' });
                    await expect(page).toHaveScreenshot('line-example-page-active-Spain-2010.png');

                    await pickDatum(page, { country: 'France', year: '2014' });
                    await expect(page).toHaveScreenshot('line-example-page-active-France-2014.png');

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(page).toHaveScreenshot('line-example-page-active-UK-2023.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await pickDatum(page, { country: 'Spain', year: '2010' });
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '0', seriesId: 'LineSeries-1' },
                    });

                    await pickDatum(page, { country: 'France', year: '2014' });
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '4', seriesId: 'LineSeries-4' },
                    });

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '13', seriesId: 'LineSeries-2' },
                    });
                });
            });

            test.describe('hover events clear unfrozen setState', () => {
                test('screenshots', async ({ page }) => {
                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(page).toHaveScreenshot('line-example-page-active-UK-2023.png');

                    await hoverInCenter(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-hover-center.png');

                    await hoverInTopLeft(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-inactive.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '13', seriesId: 'LineSeries-2' },
                    });

                    await hoverInCenter(page);
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '6', seriesId: 'LineSeries-5' },
                    });

                    await hoverInTopLeft(page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();
                });
            });

            test.describe('series-area mouse events clear unfrozen setState from legend', () => {
                test('screenshots', async ({ page }) => {
                    await pickDatum(page, { country: 'UK', year: 'Legend' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-Legend.png');

                    await hoverInCenter(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-hover-center.png');

                    await hoverInTopLeft(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-inactive.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    await pickDatum(page, { country: 'UK', year: 'Legend' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 'UK', seriesId: 'LineSeries-2' },
                    });

                    await hoverInCenter(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: '6', seriesId: 'LineSeries-5' },
                    });

                    await hoverInTopLeft(page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();
                });
            });

            test.describe('setState with undefined active clears current highlight', () => {
                test('screenshots', async ({ page }) => {
                    const { version } = await getChartState(page);

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(page).toHaveScreenshot('line-example-page-active-UK-2023.png');

                    await setChartState(page, { version, active: { activeItem: undefined } });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-inactive.png');
                });

                test('states', async ({ page }) => {
                    const { version } = await getChartState(page);
                    let state: AgChartState;

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '13', seriesId: 'LineSeries-2' },
                    });

                    await setChartState(page, { version, active: { activeItem: undefined } });
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();
                });
            });

            test.describe('[ignoreConsoleWarnings] setState with invalid node id should deactive', () => {
                const consoleLogs = createConsoleLogs();

                test('screenshots', async ({ page }) => {
                    const { version } = await getChartState(page);

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(page).toHaveScreenshot('line-example-page-active-UK-2023.png');

                    await setStateInvalidNodeId(consoleLogs, page, version);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-inactive.png');

                    await consoleLogs.expectLogs([]);
                });

                test('states', async ({ page }) => {
                    const { version } = await getChartState(page);

                    let state: AgChartState;

                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '13', seriesId: 'LineSeries-2' },
                    });

                    await setStateInvalidNodeId(consoleLogs, page, version);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await consoleLogs.expectLogs([]);
                });
            });

            test.describe('series-area focus events clear unfrozen setState', () => {
                test('screenshots', async ({ page }) => {
                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(page).toHaveScreenshot('line-example-page-active-UK-2023.png');

                    await repeat(3, async () => await page.keyboard.press('Tab'));
                    await expect(canvas).toHaveScreenshot('line-example-canvas-focus-Spain-2010.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '13', seriesId: 'LineSeries-2' },
                    });

                    await repeat(3, async () => await page.keyboard.press('Tab'));
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '0', seriesId: 'LineSeries-1' },
                    });
                });
            });

            test.describe('series-area keydown events clear unfrozen setState', () => {
                test('screenshots', async ({ page }) => {
                    const { version } = await getChartState(page);

                    await repeat(6, async () => await page.keyboard.press('Tab'));
                    await expect(canvas).toHaveScreenshot('line-example-canvas-focus-Spain-2010.png');

                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('ArrowRight');
                    await expect(canvas).toHaveScreenshot('line-example-canvas-focus-Ireland-2011.png');

                    await setChartState(page, { version, active: { activeItem: undefined } });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-focus-Ireland-2011-inactive.png');

                    await page.keyboard.press('ArrowRight');
                    await expect(canvas).toHaveScreenshot('line-example-canvas-focus-Ireland-2012.png');
                });

                test('states', async ({ page }) => {
                    const { version } = await getChartState(page);
                    let state: AgChartState;

                    await repeat(6, async () => await page.keyboard.press('Tab'));
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '0', seriesId: 'LineSeries-1' },
                    });

                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('ArrowRight');
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '1', seriesId: 'LineSeries-3' },
                    });

                    await setChartState(page, { version, active: { activeItem: undefined } });
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await page.keyboard.press('ArrowRight');
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '2', seriesId: 'LineSeries-3' },
                    });
                });
            });

            test.describe('legend hover clear active state from mouse', () => {
                test('screenshots', async ({ page }) => {
                    await hoverInCenter(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-hover-center.png');

                    await hoverOnUKLegend(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-Legend.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    await hoverInCenter(page);
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '6', seriesId: 'LineSeries-5' },
                    });

                    await hoverOnUKLegend(page);
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { seriesId: 'LineSeries-2' },
                    });
                });
            });
        });

        test.describe('donut-example', () => {
            let canvas: Locator;

            async function hoverOnCurrentYearBond(page: Page): Promise<void> {
                await page.mouse.move(354, 368);
            }

            async function hoverOnRealEstateLegendItem(page: Page): Promise<void> {
                await page.mouse.move(455, 555);
            }

            async function hoverSeriesAreaMiss(page: Page): Promise<void> {
                await page.mouse.move(400, 330);
            }

            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('active', 'multi-donut-example', 'vanilla').url);
                canvas = page.locator(SELECTORS.canvasCenter);
            });

            test.describe('pick-misses clears active state', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-inactive.png');

                    await hoverOnCurrentYearBond(page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-active-currentyearbond.png');

                    await hoverSeriesAreaMiss(page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-inactive.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await hoverOnCurrentYearBond(page);
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '1', seriesId: 'DonutSeries-2' },
                    });

                    await hoverSeriesAreaMiss(page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();
                });
            });

            test.describe('legend hover clear active state from mouse', () => {
                test('screenshots', async ({ page }) => {
                    await hoverOnCurrentYearBond(page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-active-currentyearbond.png');

                    await hoverOnRealEstateLegendItem(page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-active-realestatelegend.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    await hoverOnCurrentYearBond(page);
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: '1', seriesId: 'DonutSeries-2' },
                    });

                    await hoverOnRealEstateLegendItem(page);
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: 3, seriesId: 'DonutSeries-1' },
                    });
                });
            });
        });

        test.describe('bubble-example', () => {
            const THREE_CANDIDATED_COORDS = { x: 383, y: 313 } as const;
            let canvas: Locator;

            async function hoverOnThreeCandidates(page: Page): Promise<void> {
                await page.mouse.move(THREE_CANDIDATED_COORDS.x, THREE_CANDIDATED_COORDS.y);
            }

            async function nextCandidate(page: Page): Promise<void> {
                await page.mouse.click(THREE_CANDIDATED_COORDS.x, THREE_CANDIDATED_COORDS.y);
            }

            async function hoverInTopLeft(page: Page): Promise<void> {
                await page.mouse.move(0, 0);
            }

            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('active', 'bubble-example', 'vanilla').url);
                canvas = page.locator(SELECTORS.canvasCenter);
            });

            test.describe('activeItem is current tooltip candidate', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('bubble-example-canvas-inactive.png');

                    await hoverOnThreeCandidates(page);
                    await expect(canvas).toHaveScreenshot('bubble-example-canvas-active-candidate0.png');

                    await nextCandidate(page);
                    await expect(canvas).toHaveScreenshot('bubble-example-canvas-active-candidate1.png');

                    await nextCandidate(page);
                    await expect(canvas).toHaveScreenshot('bubble-example-canvas-active-candidate2.png');

                    await hoverInTopLeft(page);
                    await expect(canvas).toHaveScreenshot('bubble-example-canvas-inactive.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await hoverOnThreeCandidates(page);
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: 'crashRate', seriesId: 'BubbleSeries-2' },
                    });

                    await nextCandidate(page);
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: 'crashRate', seriesId: 'BubbleSeries-2' },
                    });

                    await nextCandidate(page);
                    state = await getChartState(page);
                    expect(state.active).toMatchObject({
                        frozen: false,
                        activeItem: { itemId: 'crashRate', seriesId: 'BubbleSeries-1' },
                    });

                    await hoverInTopLeft(page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();
                });
            });
        });
    });
});
