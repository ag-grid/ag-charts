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
        async function setStateInactive(version: string, page: Page): Promise<void> {
            await setChartState(page, {
                version,
                active: { frozen: false, activeItem: undefined },
            });
        }

        test.describe('line-example', () => {
            let canvas: Locator;

            async function pickDatum(page: Page, datum: { country: string; year: string }): Promise<void> {
                await page.selectOption('#myCountry', datum.country);
                await page.selectOption('#myYear', datum.year);
                await page.click('#mySetState');
            }

            async function checkFrozen(page: Page): Promise<void> {
                await page.check('#myFreeze');
            }

            async function hoverInCenter(page: Page): Promise<void> {
                const { width, height } = await locateCanvas(page);
                await page.mouse.move(width / 2, height / 2);
            }

            async function clickInCenter(page: Page): Promise<void> {
                const { width, height } = await locateCanvas(page);
                await page.mouse.move(width / 2, height / 2);
            }

            async function hoverInTopLeft(page: Page): Promise<void> {
                await page.mouse.move(20, 20);
            }

            async function hoverOnUKLegend(page: Page): Promise<void> {
                await page.mouse.move(304, 556);
            }

            async function clickOnUKLegend(page: Page): Promise<void> {
                await page.mouse.move(304, 556);
            }

            async function setStateInvalidNodeId(consoleLogs: ConsoleLogs, page: Page, version: string): Promise<void> {
                await setChartState(page, {
                    version,
                    active: {
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 10000, seriesId: 'LineSeries-1' },
                    },
                });
                expect(consoleLogs.getLogs()).toEqual(['AG Charts - Cannot find itemId: 10000']);
                consoleLogs.clear();
            }

            async function setStateStringNodeId(consoleLogs: ConsoleLogs, page: Page, version: string): Promise<void> {
                await setChartState(page, {
                    version,
                    active: {
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: '0', seriesId: 'LineSeries-1' },
                    },
                });
                expect(consoleLogs.getLogs()).toEqual(['AG Charts - Cannot find itemId: "0"']);
                consoleLogs.clear();
            }

            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('active-e2e-test', 'line-example', 'vanilla').url);
                canvas = page.locator(SELECTORS.canvasCenter);
            });

            test.describe('3 setState calls', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('line-example-canvas-inactive.png');

                    await pickDatum(page, { country: 'Spain', year: '2010' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-Spain-2010.png');

                    await pickDatum(page, { country: 'France', year: '2014' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-France-2014.png');

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await pickDatum(page, { country: 'Spain', year: '2010' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 0, seriesId: 'LineSeries-1' },
                    });

                    await pickDatum(page, { country: 'France', year: '2014' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 4, seriesId: 'LineSeries-4' },
                    });

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 13, seriesId: 'LineSeries-2' },
                    });
                });
            });

            test.describe('3 setState calls frozen', () => {
                test('screenshots', async ({ page }) => {
                    await checkFrozen(page);
                    await pickDatum(page, { country: 'Spain', year: '2010' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-Spain-2010.png');

                    await pickDatum(page, { country: 'France', year: '2014' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-France-2014.png');

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023.png');
                });

                test('states', async ({ page }) => {
                    await checkFrozen(page);
                    let state: AgChartState;

                    await checkFrozen(page);
                    await pickDatum(page, { country: 'Spain', year: '2010' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: true,
                        activeItem: { type: 'series-area', itemId: 0, seriesId: 'LineSeries-1' },
                    });

                    await pickDatum(page, { country: 'France', year: '2014' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: true,
                        activeItem: { type: 'series-area', itemId: 4, seriesId: 'LineSeries-4' },
                    });

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: true,
                        activeItem: { type: 'series-area', itemId: 13, seriesId: 'LineSeries-2' },
                    });
                });
            });

            test.describe('2 duplicate setState calls', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('line-example-canvas-inactive.png');

                    await pickDatum(page, { country: 'France', year: '2014' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-France-2014.png');

                    await pickDatum(page, { country: 'France', year: '2014' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-France-2014.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await pickDatum(page, { country: 'France', year: '2014' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 4, seriesId: 'LineSeries-4' },
                    });

                    await pickDatum(page, { country: 'France', year: '2014' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 4, seriesId: 'LineSeries-4' },
                    });
                });
            });

            test.describe('hover events clear unfrozen setState', () => {
                test('screenshots', async ({ page }) => {
                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023.png');

                    await hoverInCenter(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-hover-center.png');

                    await hoverInTopLeft(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-inactive.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 13, seriesId: 'LineSeries-2' },
                    });

                    await hoverInCenter(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 6, seriesId: 'LineSeries-5' },
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
                        activeItem: { type: 'series-area', itemId: 6, seriesId: 'LineSeries-5' },
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
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023.png');

                    await setStateInactive(version, page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-inactive.png');
                });

                test('states', async ({ page }) => {
                    const { version } = await getChartState(page);
                    let state: AgChartState;

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 13, seriesId: 'LineSeries-2' },
                    });

                    await setStateInactive(version, page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();
                });
            });

            test.describe('[ignoreConsoleWarnings] setState with invalid node id should deactivate', () => {
                const consoleLogs = createConsoleLogs();

                test('screenshots', async ({ page }) => {
                    const { version } = await getChartState(page);

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023.png');

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
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 13, seriesId: 'LineSeries-2' },
                    });

                    await setStateInvalidNodeId(consoleLogs, page, version);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await consoleLogs.expectLogs([]);
                });
            });

            test.describe('[ignoreConsoleWarnings] setState with incorrect string-type id should deactivate', () => {
                const consoleLogs = createConsoleLogs();

                test('screenshots', async ({ page }) => {
                    const { version } = await getChartState(page);

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023.png');

                    await setStateStringNodeId(consoleLogs, page, version);
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
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 13, seriesId: 'LineSeries-2' },
                    });

                    await setStateStringNodeId(consoleLogs, page, version);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await consoleLogs.expectLogs([]);
                });
            });

            test.describe('series-area focus events clear unfrozen setState', () => {
                test('screenshots', async ({ page }) => {
                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023.png');

                    await repeat(3, async () => await page.keyboard.press('Tab'));
                    await expect(canvas).toHaveScreenshot('line-example-canvas-focus-Spain-2010.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 13, seriesId: 'LineSeries-2' },
                    });

                    await repeat(3, async () => await page.keyboard.press('Tab'));
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 0, seriesId: 'LineSeries-1' },
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

                    await setStateInactive(version, page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-focus-Ireland-2011-inactive.png');

                    await page.keyboard.press('ArrowRight');
                    await expect(canvas).toHaveScreenshot('line-example-canvas-focus-Ireland-2012.png');
                });

                test('states', async ({ page }) => {
                    const { version } = await getChartState(page);
                    let state: AgChartState;

                    await repeat(6, async () => await page.keyboard.press('Tab'));
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 0, seriesId: 'LineSeries-1' },
                    });

                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('ArrowRight');
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 1, seriesId: 'LineSeries-3' },
                    });

                    await setStateInactive(version, page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await page.keyboard.press('ArrowRight');
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 2, seriesId: 'LineSeries-3' },
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
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 6, seriesId: 'LineSeries-5' },
                    });

                    await hoverOnUKLegend(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 'UK', seriesId: 'LineSeries-2' },
                    });
                });
            });

            test.describe('frozen chart ignores mouse events', () => {
                test('screenshots', async ({ page }) => {
                    await checkFrozen(page);
                    await pickDatum(page, { country: 'France', year: '2014' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-France-2014.png');

                    await hoverInCenter(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-France-2014.png');

                    await clickInCenter(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-France-2014.png');

                    await hoverOnUKLegend(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-France-2014.png');

                    await clickOnUKLegend(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-France-2014.png');

                    await hoverInCenter(page);
                    await hoverInTopLeft(page); // test 'mouseleave'
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-France-2014.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;
                    const expectedFrozenState = {
                        frozen: true,
                        activeItem: { type: 'series-area', itemId: 4, seriesId: 'LineSeries-4' },
                    } as const;

                    await checkFrozen(page);
                    await pickDatum(page, { country: 'France', year: '2014' });
                    state = await getChartState(page);
                    expect(state.active).toEqual(expectedFrozenState);

                    await hoverInCenter(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual(expectedFrozenState);

                    await clickInCenter(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual(expectedFrozenState);

                    await hoverOnUKLegend(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual(expectedFrozenState);

                    await clickOnUKLegend(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual(expectedFrozenState);

                    await hoverInCenter(page);
                    await hoverInTopLeft(page); // test 'mouseleave'
                    state = await getChartState(page);
                    expect(state.active).toEqual(expectedFrozenState);
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

            async function setStateCurrentYearBond(version: string, page: Page): Promise<void> {
                await setChartState(page, {
                    version,
                    active: {
                        frozen: false,
                        activeItem: {
                            type: 'series-area',
                            seriesId: 'DonutSeries-2',
                            itemId: 1,
                        },
                    },
                });
            }

            async function setStateRealEstateLegend(version: string, page: Page): Promise<void> {
                await setChartState(page, {
                    version,
                    active: {
                        frozen: false,
                        activeItem: {
                            type: 'legend',
                            seriesId: 'DonutSeries-1',
                            itemId: 3,
                        },
                    },
                });
            }

            async function setStateBondsLegend(version: string, page: Page): Promise<void> {
                await setChartState(page, {
                    version,
                    active: {
                        frozen: false,
                        activeItem: {
                            type: 'legend',
                            seriesId: 'DonutSeries-1',
                            itemId: 1,
                        },
                    },
                });
            }

            async function setInvalidStateShowInLegend(logs: ConsoleLogs, version: string, page: Page): Promise<void> {
                await setChartState(page, {
                    version,
                    active: {
                        frozen: false,
                        activeItem: {
                            type: 'legend',
                            seriesId: 'DonutSeries-2', // showInLegend is false for this series
                            itemId: 3,
                        },
                    },
                });
                expect(logs.getLogs()).toEqual([
                    'AG Charts - cannot find legend item: {"seriesId":"DonutSeries-2","itemId":3}',
                ]);
                logs.clear();
            }

            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('active-e2e-test', 'multi-donut-example', 'vanilla').url);
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
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 1, seriesId: 'DonutSeries-2' },
                    });

                    await hoverSeriesAreaMiss(page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();
                });
            });

            test.describe('legend hover events clear active state from series-area mouse events', () => {
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
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 1, seriesId: 'DonutSeries-2' },
                    });

                    await hoverOnRealEstateLegendItem(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 3, seriesId: 'DonutSeries-1' },
                    });
                });
            });

            test.describe('series-area hover events clear active state from series-area mouse events', () => {
                test('screenshots', async ({ page }) => {
                    await hoverOnRealEstateLegendItem(page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-active-realestatelegend.png');

                    await hoverOnCurrentYearBond(page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-active-currentyearbond.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    await hoverOnRealEstateLegendItem(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 3, seriesId: 'DonutSeries-1' },
                    });

                    await hoverOnCurrentYearBond(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 1, seriesId: 'DonutSeries-2' },
                    });
                });
            });

            test.describe('setState for legend overwrites state from legend mouse events', () => {
                test('screenshots', async ({ page }) => {
                    const { version } = await getChartState(page);

                    await hoverOnRealEstateLegendItem(page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-active-realestatelegend.png');

                    await setStateBondsLegend(version, page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-active-bondslegend.png');

                    await setStateInactive(version, page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-inactive.png');
                });

                test('states', async ({ page }) => {
                    const { version } = await getChartState(page);
                    let state: AgChartState;

                    await hoverOnRealEstateLegendItem(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 3, seriesId: 'DonutSeries-1' },
                    });

                    await setStateBondsLegend(version, page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 1, seriesId: 'DonutSeries-1' },
                    });

                    await setStateInactive(version, page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({ frozen: false });
                });
            });

            test.describe('setState for series-area overwrites state from legend mouse events', () => {
                test('screenshots', async ({ page }) => {
                    const { version } = await getChartState(page);

                    await hoverOnRealEstateLegendItem(page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-active-realestatelegend.png');

                    await setStateCurrentYearBond(version, page);
                    // Same as 'donut-example-canvas-active-currentyearbond-midpoint.png', but with the tooltip is
                    // slightly different point (based on datum.midPoint)
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-active-currentyearbond-midpoint.png');

                    await setStateInactive(version, page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-inactive.png');
                });

                test('states', async ({ page }) => {
                    const { version } = await getChartState(page);
                    let state: AgChartState;

                    await hoverOnRealEstateLegendItem(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 3, seriesId: 'DonutSeries-1' },
                    });

                    await setStateCurrentYearBond(version, page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 1, seriesId: 'DonutSeries-2' },
                    });

                    await setStateInactive(version, page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({ frozen: false });
                });
            });

            test.describe('setState for legend highlights both donuts', () => {
                test('screenshots', async ({ page }) => {
                    const { version } = await getChartState(page);

                    await hoverOnCurrentYearBond(page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-active-currentyearbond.png');

                    await setStateRealEstateLegend(version, page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-active-realestatelegend.png');
                });

                test('states', async ({ page }) => {
                    const { version } = await getChartState(page);
                    let state: AgChartState;

                    await hoverOnCurrentYearBond(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 1, seriesId: 'DonutSeries-2' },
                    });

                    await setStateRealEstateLegend(version, page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 3, seriesId: 'DonutSeries-1' },
                    });
                });
            });

            test.describe('[ignoreConsoleWarnings] should ignore legend setState with showInLegend false', () => {
                const consoleLogs = createConsoleLogs();

                test('screenshots', async ({ page }) => {
                    const { version } = await getChartState(page);

                    await setStateBondsLegend(version, page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-active-bondslegend.png');

                    await setInvalidStateShowInLegend(consoleLogs, version, page);
                    await expect(canvas).toHaveScreenshot('donut-example-canvas-active-bondslegend.png');
                });

                test('states', async ({ page }) => {
                    const { version } = await getChartState(page);
                    let state: AgChartState;

                    await setStateBondsLegend(version, page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 1, seriesId: 'DonutSeries-1' },
                    });

                    await setInvalidStateShowInLegend(consoleLogs, version, page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();
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
                await gotoExample(page, toExamplePageUrl('active-e2e-test', 'bubble-example', 'vanilla').url);
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
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 1, seriesId: 'BubbleSeries-2' },
                    });

                    await nextCandidate(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 4, seriesId: 'BubbleSeries-2' },
                    });

                    await nextCandidate(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 4, seriesId: 'BubbleSeries-1' },
                    });

                    await hoverInTopLeft(page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();
                });
            });
        });

        test.describe('grouped-category-bars', () => {
            let canvas: Locator;

            async function hoverOnCoalLegendItem(page: Page): Promise<void> {
                await page.mouse.move(50, 300);
            }

            async function hoverOnChinaRenewable2025(page: Page): Promise<void> {
                await page.mouse.move(547, 247);
            }

            async function keynavToGermanyGas2024(page: Page): Promise<void> {
                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowDown');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
            }

            async function keynavToNaturalGasLegendItem(page: Page): Promise<void> {
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('ArrowDown');
            }

            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('active-e2e-test', 'grouped-category-bars', 'vanilla').url);
                canvas = page.locator(SELECTORS.canvasCenter);
            });

            test.describe('series-area hover updates state', () => {
                test('screenshots', async ({ page }) => {
                    await hoverOnChinaRenewable2025(page);
                    await expect(canvas).toHaveScreenshot('grouped-category-bars-canvas-chinarenewable2025-hover.png');
                });

                test('states', async ({ page }) => {
                    await hoverOnChinaRenewable2025(page);
                    const state: AgChartState = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 7, seriesId: 'BarSeries-3' },
                    });
                });
            });

            test.describe('legend hover updates state', () => {
                test('screenshots', async ({ page }) => {
                    await hoverOnCoalLegendItem(page);
                    await expect(canvas).toHaveScreenshot('grouped-category-bars-canvas-coallegend-hover.png');
                });

                test('states', async ({ page }) => {
                    await hoverOnCoalLegendItem(page);
                    const state: AgChartState = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 'coal', seriesId: 'BarSeries-1' },
                    });
                });
            });

            test.describe('series-area keynav updates state', () => {
                test('screenshots', async ({ page }) => {
                    await keynavToGermanyGas2024(page);
                    await expect(canvas).toHaveScreenshot('grouped-category-bars-canvas-germangas2024-focused.png');
                });

                test('states', async ({ page }) => {
                    await keynavToGermanyGas2024(page);
                    const state: AgChartState = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 3, seriesId: 'BarSeries-2' },
                    });
                });
            });

            test.describe('legend keynav updates state', () => {
                test('screenshots', async ({ page }) => {
                    await keynavToNaturalGasLegendItem(page);
                    await expect(canvas).toHaveScreenshot('grouped-category-bars-canvas-gaslegend-focused.png');
                });

                test('states', async ({ page }) => {
                    await keynavToNaturalGasLegendItem(page);
                    const state: AgChartState = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 'gas', seriesId: 'BarSeries-2' },
                    });
                });
            });
        });

        test.describe('sankey-example', () => {
            let canvas: Locator;

            async function hoverOnLinkFromBtoE(page: Page): Promise<void> {
                await page.mouse.move(394, 269);
            }

            async function hoverOnNodeC(page: Page): Promise<void> {
                await page.mouse.move(399, 464);
            }

            async function hoverMiss(page: Page): Promise<void> {
                await page.mouse.move(383, 33);
            }

            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('active-e2e-test', 'sankey-example', 'vanilla').url);
                canvas = page.locator(SELECTORS.canvasCenter);
            });

            test.describe('getState on link-hover and restore with setState', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('sankey-example-canvas-inactive.png');

                    await hoverOnLinkFromBtoE(page);
                    const state: AgChartState = await getChartState(page);
                    await expect(canvas).toHaveScreenshot('sankey-example-canvas-active-linkBE.png');

                    await hoverMiss(page);
                    await expect(canvas).toHaveScreenshot('sankey-example-canvas-inactive.png');

                    await setChartState(page, state);
                    await expect(canvas).toHaveScreenshot('sankey-example-canvas-active-linkBE.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    await hoverOnLinkFromBtoE(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 'link-TODO', seriesId: 'SankeySeries-1' },
                    });
                    const hoverLinkState: AgChartState = state;

                    await hoverMiss(page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await setChartState(page, hoverLinkState);
                    expect(state.active).toEqual(hoverLinkState.active);
                });
            });

            test.describe('getState on node-hover and restore with setState', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('sankey-example-canvas-inactive.png');

                    await hoverOnNodeC(page);
                    const state: AgChartState = await getChartState(page);
                    await expect(canvas).toHaveScreenshot('sankey-example-canvas-active-nodeC.png');

                    await hoverMiss(page);
                    await expect(canvas).toHaveScreenshot('sankey-example-canvas-inactive.png');

                    await setChartState(page, state);
                    await expect(canvas).toHaveScreenshot('sankey-example-canvas-active-nodeC.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    await hoverOnNodeC(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-area', itemId: 'node-1', seriesId: 'SankeySeries-1' },
                    });
                    const hoverLinkState: AgChartState = state;

                    await hoverMiss(page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await setChartState(page, hoverLinkState);
                    expect(state.active).toEqual(hoverLinkState.active);
                });
            });
        });
    });
});
