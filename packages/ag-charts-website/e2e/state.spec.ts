import type { Locator, Page } from '@playwright/test';

import type { DeepReadonly } from 'ag-charts-core';
import type { AgChartState } from 'ag-charts-types';

import { expect, test } from './fixture';
import {
    SELECTORS,
    createConsoleLogs,
    gotoExample,
    locateCanvas,
    readSwapchainText,
    repeat,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    waitForChartUpdate,
} from './util';

type ConsoleLogs = ReturnType<typeof createConsoleLogs>;

const PREVENT_DEFAULT_STUB = () => {};

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

async function popChartEvents(page: Page): Promise<unknown> {
    const events = await page.evaluate(() => {
        const popEvents: unknown = (window as any)?.agE2E?.popEvents;
        if (!popEvents) {
            throw new Error('window.agE2E.popEvents is not defined');
        } else if (typeof popEvents !== 'function') {
            throw new Error('window.agE2E.popEvents is not a function');
        }
        return popEvents();
    });

    expect(events).toBeDefined();
    expect(typeof events).toBe('object');
    return events.map((elem: unknown) => {
        if (typeof elem === 'object') {
            return { ...elem, preventDefault: PREVENT_DEFAULT_STUB };
        } else {
            return elem;
        }
    });
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

        async function clickPreventDefaultTickbox(page: Page): Promise<void> {
            await page.locator('#myPreventDefault').click();
        }

        test.describe('line-example', () => {
            let canvas: Locator;

            const COMMON_THAWED_UI_ACTIVECHANGE = Object.freeze({
                dataIdKey: undefined,
                frozen: false,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'user-interaction',
                type: 'activeChange',
            });

            const INACTIVE_THAWED_UI_ACTIVECHANGE = Object.freeze({
                ...COMMON_THAWED_UI_ACTIVECHANGE,
                activeItem: undefined,
                datum: undefined,
            });

            const SPAIN2010_THAWED_ACTIVEITEM = Object.freeze({
                type: 'series-node',
                itemId: 0,
                seriesId: 'LineSeries-1',
            });
            const SPAIN2010_THAWED_ACTIVESTATE = Object.freeze({
                activeItem: SPAIN2010_THAWED_ACTIVEITEM,
                frozen: false,
            });
            const SPAIN2010_THAWED_UI_ACTIVECHANGE = Object.freeze({
                ...COMMON_THAWED_UI_ACTIVECHANGE,
                ...SPAIN2010_THAWED_ACTIVESTATE,
                datum: { Year: '2010', Spain: -50000, UK: 245000, Ireland: -30000, France: 70000, Germany: 128000 },
            });

            const GERMANY2015_THAWED_ACTIVEITEM = Object.freeze({
                type: 'series-node',
                itemId: 5,
                seriesId: 'LineSeries-5',
            });
            const GERMANY2015_THAWED_ACTIVESTATE = Object.freeze({
                activeItem: GERMANY2015_THAWED_ACTIVEITEM,
                frozen: false,
            });
            const GERMANY2015_THAWED_UI_ACTIVECHANGE = Object.freeze({
                ...COMMON_THAWED_UI_ACTIVECHANGE,
                ...GERMANY2015_THAWED_ACTIVESTATE,
                datum: { Year: '2015', Spain: 10000, UK: 330000, Ireland: 20000, France: 120000, Germany: 1139000 },
            });

            const SPAINLEGEND_THAWED_ACTIVEITEM = Object.freeze({
                type: 'legend',
                itemId: 'Spain',
                seriesId: 'LineSeries-1',
            });
            const SPAINLEGEND_THAWED_ACTIVESTATE = Object.freeze({
                activeItem: SPAINLEGEND_THAWED_ACTIVEITEM,
                frozen: false,
            });
            const SPAINLEGEND_THAWED_UI_ACTIVECHANGE = Object.freeze({
                ...COMMON_THAWED_UI_ACTIVECHANGE,
                ...SPAINLEGEND_THAWED_ACTIVESTATE,
                datum: undefined,
            });

            const UKLEGEND_THAWED_ACTIVEITEM = Object.freeze({
                type: 'legend',
                itemId: 'UK',
                seriesId: 'LineSeries-2',
            });
            const UKLEGEND_THAWED_ACTIVESTATE = Object.freeze({
                activeItem: UKLEGEND_THAWED_ACTIVEITEM,
                frozen: false,
            });
            const UKLEGEND_THAWED_UI_ACTIVECHANGE = Object.freeze({
                ...COMMON_THAWED_UI_ACTIVECHANGE,
                ...UKLEGEND_THAWED_ACTIVESTATE,
                datum: undefined,
            });

            const IRELANDLEGEND_THAWED_ACTIVEITEM = Object.freeze({
                type: 'legend',
                itemId: 'Ireland',
                seriesId: 'LineSeries-3',
            });
            const IRELANDLEGEND_THAWED_ACTIVESTATE = Object.freeze({
                activeItem: IRELANDLEGEND_THAWED_ACTIVEITEM,
                frozen: false,
            });
            const IRELANDLEGEND_THAWED_UI_ACTIVECHANGE = Object.freeze({
                ...COMMON_THAWED_UI_ACTIVECHANGE,
                ...IRELANDLEGEND_THAWED_ACTIVESTATE,
                datum: undefined,
            });

            const FRANCELEGEND_THAWED_ACTIVEITEM = Object.freeze({
                type: 'legend',
                itemId: 'France',
                seriesId: 'LineSeries-4',
            });
            const FRANCELEGEND_THAWED_ACTIVESTATE = Object.freeze({
                activeItem: FRANCELEGEND_THAWED_ACTIVEITEM,
                frozen: false,
            });
            const FRANCELEGEND_THAWED_UI_ACTIVECHANGE = Object.freeze({
                ...COMMON_THAWED_UI_ACTIVECHANGE,
                ...FRANCELEGEND_THAWED_ACTIVESTATE,
                datum: undefined,
            });

            const GERMANYLEGEND_THAWED_ACTIVEITEM = Object.freeze({
                type: 'legend',
                itemId: 'Germany',
                seriesId: 'LineSeries-5',
            });
            const GERMANYLEGEND_THAWED_ACTIVESTATE = Object.freeze({
                activeItem: GERMANYLEGEND_THAWED_ACTIVEITEM,
                frozen: false,
            });
            const GERMANYLEGEND_THAWED_UI_ACTIVECHANGE = Object.freeze({
                ...COMMON_THAWED_UI_ACTIVECHANGE,
                ...GERMANYLEGEND_THAWED_ACTIVESTATE,
                datum: undefined,
            });

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
                await page.mouse.click(304, 556);
            }

            async function clickOnGermanyLegend(page: Page): Promise<void> {
                await page.mouse.click(574, 556);
            }

            async function setStateInvalidNodeId(consoleLogs: ConsoleLogs, page: Page, version: string): Promise<void> {
                await setChartState(page, {
                    version,
                    active: {
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 10000, seriesId: 'LineSeries-1' },
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
                        activeItem: { type: 'series-node', itemId: '0', seriesId: 'LineSeries-1' },
                    },
                });
                expect(consoleLogs.getLogs()).toEqual(['AG Charts - Cannot find itemId: "0"']);
                consoleLogs.clear();
            }

            async function setStateSpain2010(page: Page, version: string): Promise<void> {
                await setChartState(page, {
                    version,
                    active: {
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 0, seriesId: 'LineSeries-1' },
                    },
                });
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
                        activeItem: { type: 'series-node', itemId: 0, seriesId: 'LineSeries-1' },
                    });

                    await pickDatum(page, { country: 'France', year: '2014' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 4, seriesId: 'LineSeries-4' },
                    });

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 13, seriesId: 'LineSeries-2' },
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
                    let state: AgChartState;

                    await checkFrozen(page);
                    await pickDatum(page, { country: 'Spain', year: '2010' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: true,
                        activeItem: { type: 'series-node', itemId: 0, seriesId: 'LineSeries-1' },
                    });

                    await pickDatum(page, { country: 'France', year: '2014' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: true,
                        activeItem: { type: 'series-node', itemId: 4, seriesId: 'LineSeries-4' },
                    });

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: true,
                        activeItem: { type: 'series-node', itemId: 13, seriesId: 'LineSeries-2' },
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
                        activeItem: { type: 'series-node', itemId: 4, seriesId: 'LineSeries-4' },
                    });

                    await pickDatum(page, { country: 'France', year: '2014' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 4, seriesId: 'LineSeries-4' },
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
                        activeItem: { type: 'series-node', itemId: 13, seriesId: 'LineSeries-2' },
                    });

                    await hoverInCenter(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 6, seriesId: 'LineSeries-5' },
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
                        activeItem: { type: 'series-node', itemId: 6, seriesId: 'LineSeries-5' },
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
                        activeItem: { type: 'series-node', itemId: 13, seriesId: 'LineSeries-2' },
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
                        activeItem: { type: 'series-node', itemId: 13, seriesId: 'LineSeries-2' },
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
                        activeItem: { type: 'series-node', itemId: 13, seriesId: 'LineSeries-2' },
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
                        activeItem: { type: 'series-node', itemId: 13, seriesId: 'LineSeries-2' },
                    });

                    await repeat(3, async () => await page.keyboard.press('Tab'));
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 0, seriesId: 'LineSeries-1' },
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
                        activeItem: { type: 'series-node', itemId: 0, seriesId: 'LineSeries-1' },
                    });

                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('ArrowRight');
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 1, seriesId: 'LineSeries-3' },
                    });

                    await setStateInactive(version, page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await page.keyboard.press('ArrowRight');
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 2, seriesId: 'LineSeries-3' },
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
                        activeItem: { type: 'series-node', itemId: 6, seriesId: 'LineSeries-5' },
                    });

                    await hoverOnUKLegend(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 'UK', seriesId: 'LineSeries-2' },
                    });
                });
            });

            test.describe('legend hover clears active active from setState-series-node', () => {
                test('screenshots', async ({ page }) => {
                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023.png');

                    await hoverOnUKLegend(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-Legend.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 13, seriesId: 'LineSeries-2' },
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

                    await hoverInCenter(page);
                    await hoverInTopLeft(page); // test 'mouseleave'
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-France-2014.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;
                    const expectedFrozenState = {
                        frozen: true,
                        activeItem: { type: 'series-node', itemId: 4, seriesId: 'LineSeries-4' },
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

                    await hoverInCenter(page);
                    await hoverInTopLeft(page); // test 'mouseleave'
                    state = await getChartState(page);
                    expect(state.active).toEqual(expectedFrozenState);
                });
            });

            test.describe('setState when hovering clears hovered datum', () => {
                test('screenshots', async ({ page }) => {
                    const { version } = await getChartState(page);

                    await hoverInCenter(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-hover-center.png');

                    await setStateSpain2010(page, version);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-Spain-2010.png');
                });

                test('states', async ({ page }) => {
                    const { version } = await getChartState(page);
                    let state: AgChartState;

                    await hoverInCenter(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 6, seriesId: 'LineSeries-5' },
                    });

                    await setStateSpain2010(page, version);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 0, seriesId: 'LineSeries-1' },
                    });
                });
            });

            test.describe('frozen series-node hides and shows on legend toggles', () => {
                test('screenshots', async ({ page }) => {
                    await checkFrozen(page);
                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023.png');

                    await hoverOnUKLegend(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023.png');

                    await clickOnUKLegend(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-inactive-UK-hidden.png');

                    await clickOnUKLegend(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;
                    const frozenState: DeepReadonly<Pick<AgChartState, 'active'>> = Object.freeze({
                        active: {
                            frozen: true,
                            activeItem: { type: 'series-node', itemId: 13, seriesId: 'LineSeries-2' },
                        },
                    });

                    await checkFrozen(page);
                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toEqual(frozenState.active);

                    await hoverOnUKLegend(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual(frozenState.active);

                    await clickOnUKLegend(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual(frozenState.active);

                    await clickOnUKLegend(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual(frozenState.active);
                });
            });

            test.describe('frozen series-node highlight moves when Germany legend clicked', () => {
                test('screenshots', async ({ page }) => {
                    await checkFrozen(page);
                    await pickDatum(page, { country: 'UK', year: '2023' });
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023.png');

                    await clickOnGermanyLegend(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023-Germany-hidden.png');

                    await clickOnGermanyLegend(page);
                    await expect(canvas).toHaveScreenshot('line-example-canvas-active-UK-2023.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;
                    const frozenState: DeepReadonly<Pick<AgChartState, 'active'>> = Object.freeze({
                        active: {
                            frozen: true,
                            activeItem: { type: 'series-node', itemId: 13, seriesId: 'LineSeries-2' },
                        },
                    });

                    await checkFrozen(page);
                    await pickDatum(page, { country: 'UK', year: '2023' });
                    state = await getChartState(page);
                    expect(state.active).toEqual(frozenState.active);

                    await clickOnGermanyLegend(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual(frozenState.active);

                    await clickOnGermanyLegend(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual(frozenState.active);
                });
            });

            test.describe('AG-16741', () => {
                async function tabIntoChart(page: Page): Promise<void> {
                    await repeat(7, async () => await page.keyboard.press('Tab'));
                }

                async function tabToSpainLegend(page: Page): Promise<void> {
                    await page.keyboard.press('Tab');
                }

                async function arrowRightToGermanyLegend(page: Page): Promise<void> {
                    await repeat(4, async () => await page.keyboard.press('ArrowRight'));
                }

                async function tabToGermanyLegend(page: Page): Promise<void> {
                    await tabToSpainLegend(page);
                    await arrowRightToGermanyLegend(page);
                }

                async function hoverNearGermany2015(page: Page): Promise<void> {
                    await page.mouse.move(358, 174);
                }

                test.describe('without mousemove', () => {
                    test('screenshots', async ({ page }) => {
                        await tabIntoChart(page);
                        await expect(canvas).toHaveScreenshot('line-example-canvas-focus-Spain-2010.png');

                        await tabToGermanyLegend(page);
                        await expect(canvas).toHaveScreenshot('line-example-canvas-focus-Germany-Legend.png');
                    });

                    test('states', async ({ page }) => {
                        await tabIntoChart(page);
                        expect((await getChartState(page)).active).toEqual(SPAIN2010_THAWED_ACTIVESTATE);

                        await tabToGermanyLegend(page);
                        expect((await getChartState(page)).active).toEqual(GERMANYLEGEND_THAWED_ACTIVESTATE);
                    });
                    test('popStates', async ({ page }) => {
                        await tabIntoChart(page);
                        expect(await popChartEvents(page)).toEqual([SPAIN2010_THAWED_UI_ACTIVECHANGE]);

                        await tabToGermanyLegend(page);
                        expect(await popChartEvents(page)).toEqual([
                            INACTIVE_THAWED_UI_ACTIVECHANGE, // FIXME: AG-16973
                            SPAINLEGEND_THAWED_UI_ACTIVECHANGE,
                            INACTIVE_THAWED_UI_ACTIVECHANGE, // FIXME: AG-16973
                            UKLEGEND_THAWED_UI_ACTIVECHANGE,
                            INACTIVE_THAWED_UI_ACTIVECHANGE, // FIXME: AG-16973
                            IRELANDLEGEND_THAWED_UI_ACTIVECHANGE,
                            INACTIVE_THAWED_UI_ACTIVECHANGE, // FIXME: AG-16973
                            FRANCELEGEND_THAWED_UI_ACTIVECHANGE,
                            INACTIVE_THAWED_UI_ACTIVECHANGE, // FIXME: AG-16973
                            GERMANYLEGEND_THAWED_UI_ACTIVECHANGE,
                        ]);
                    });
                });

                test.describe('with mousemove', () => {
                    test('screenshots', async ({ page }) => {
                        await tabIntoChart(page);
                        await tabToSpainLegend(page);
                        await expect(canvas).toHaveScreenshot('line-example-canvas-focus-Spain-Legend.png');

                        await hoverNearGermany2015(page);
                        await expect(canvas).toHaveScreenshot(
                            'line-example-canvas-focus-Spain-Legend-active-Germany-2015.png'
                        );

                        await arrowRightToGermanyLegend(page);
                        await expect(canvas).toHaveScreenshot('line-example-canvas-focus-Germany-Legend.png');
                    });

                    test('states', async ({ page }) => {
                        await tabIntoChart(page);
                        await tabToSpainLegend(page);
                        expect((await getChartState(page)).active).toEqual(SPAINLEGEND_THAWED_ACTIVESTATE);

                        await hoverNearGermany2015(page);
                        expect((await getChartState(page)).active).toEqual(GERMANY2015_THAWED_ACTIVESTATE);

                        await arrowRightToGermanyLegend(page);
                        expect((await getChartState(page)).active).toEqual(GERMANYLEGEND_THAWED_ACTIVESTATE);
                    });
                    test('popStates', async ({ page }) => {
                        await tabIntoChart(page);
                        await tabToSpainLegend(page);
                        expect(await popChartEvents(page)).toEqual([
                            SPAIN2010_THAWED_UI_ACTIVECHANGE,
                            INACTIVE_THAWED_UI_ACTIVECHANGE, // FIXME: AG-16973
                            SPAINLEGEND_THAWED_UI_ACTIVECHANGE,
                        ]);

                        await hoverNearGermany2015(page);
                        expect(await popChartEvents(page)).toEqual([GERMANY2015_THAWED_UI_ACTIVECHANGE]);

                        await arrowRightToGermanyLegend(page);
                        expect(await popChartEvents(page)).toEqual([
                            INACTIVE_THAWED_UI_ACTIVECHANGE, // FIXME: AG-16973
                            UKLEGEND_THAWED_UI_ACTIVECHANGE,
                            INACTIVE_THAWED_UI_ACTIVECHANGE, // FIXME: AG-16973
                            IRELANDLEGEND_THAWED_UI_ACTIVECHANGE,
                            INACTIVE_THAWED_UI_ACTIVECHANGE, // FIXME: AG-16973
                            FRANCELEGEND_THAWED_UI_ACTIVECHANGE,
                            INACTIVE_THAWED_UI_ACTIVECHANGE, // FIXME: AG-16973
                            GERMANYLEGEND_THAWED_UI_ACTIVECHANGE,
                        ]);
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

            async function setStateCurrentYearBond(version: string, page: Page): Promise<void> {
                await setChartState(page, {
                    version,
                    active: {
                        frozen: false,
                        activeItem: {
                            type: 'series-node',
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
                        activeItem: { type: 'series-node', itemId: 1, seriesId: 'DonutSeries-2' },
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
                        activeItem: { type: 'series-node', itemId: 1, seriesId: 'DonutSeries-2' },
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
                        activeItem: { type: 'series-node', itemId: 1, seriesId: 'DonutSeries-2' },
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
                        activeItem: { type: 'series-node', itemId: 1, seriesId: 'DonutSeries-2' },
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
                        activeItem: { type: 'series-node', itemId: 1, seriesId: 'DonutSeries-2' },
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
            const ANDROID_HOMEFEED_COORDS = { x: 404, y: 355 } as const;
            let canvas: Locator;

            const INACTIVE_CHANGE = Object.freeze({
                activeItem: undefined,
                datum: undefined,
                dataIdKey: undefined,
                frozen: false,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'user-interaction',
                type: 'activeChange',
            });

            const ANDROID_HOMEFEED_ACTIVE_ITEM = Object.freeze({
                type: 'series-node',
                seriesId: 'BubbleSeries-2',
                itemId: 1,
            });
            const ANDROID_HOMEFEED_ACTIVE_CHANGE = Object.freeze({
                activeItem: ANDROID_HOMEFEED_ACTIVE_ITEM,
                datum: { name: 'Home Feed', sessionMinutes: 5.3, crashRate: 1.1, dau: 680 },
                dataIdKey: undefined,
                frozen: false,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'user-interaction',
                type: 'activeChange',
            });

            const ANDROID_LEGEND_ACTIVE_ITEM = Object.freeze({
                type: 'legend',
                seriesId: 'BubbleSeries-2',
                itemId: 'crashRate',
            });
            const ANDROID_LEGEND_ACTIVE_CHANGE = Object.freeze({
                activeItem: ANDROID_LEGEND_ACTIVE_ITEM,
                datum: undefined,
                dataIdKey: undefined,
                frozen: false,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'user-interaction',
                type: 'activeChange',
            });

            const IOS_LEGEND_ACTIVE_ITEM = Object.freeze({
                type: 'legend',
                seriesId: 'BubbleSeries-1',
                itemId: 'crashRate',
            });
            const IOS_LEGEND_ACTIVE_CHANGE = Object.freeze({
                activeItem: IOS_LEGEND_ACTIVE_ITEM,
                datum: undefined,
                dataIdKey: undefined,
                frozen: false,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'user-interaction',
                type: 'activeChange',
            });

            const IOS_MESSAGING_ACTIVE_ITEM = Object.freeze({
                type: 'series-node',
                seriesId: 'BubbleSeries-1',
                itemId: 4,
            });
            const IOS_MESSAGING_ACTIVE_CHANGE = Object.freeze({
                activeItem: IOS_MESSAGING_ACTIVE_ITEM,
                datum: { name: 'Messaging', sessionMinutes: 5.3, crashRate: 1.1, dau: 510 },
                dataIdKey: undefined,
                frozen: false,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'user-interaction',
                type: 'activeChange',
            });
            const IOS_SEARCH_ACTIVE_ITEM = Object.freeze({
                type: 'series-node',
                seriesId: 'BubbleSeries-1',
                itemId: 0,
            });
            const IOS_SEARCH_ACTIVE_CHANGE = Object.freeze({
                activeItem: IOS_SEARCH_ACTIVE_ITEM,
                datum: { name: 'Search', sessionMinutes: 5.1, crashRate: 0.8, dau: 420 },
                dataIdKey: undefined,
                frozen: false,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'user-interaction',
                type: 'activeChange',
            });

            async function hoverOnThreeCandidates(page: Page): Promise<void> {
                await page.mouse.move(THREE_CANDIDATED_COORDS.x, THREE_CANDIDATED_COORDS.y);
            }

            async function hoverOnAndroidHomeFeed(page: Page): Promise<void> {
                await page.mouse.move(ANDROID_HOMEFEED_COORDS.x, ANDROID_HOMEFEED_COORDS.y);
            }

            async function clickOnAndroidHomeFeed(page: Page): Promise<void> {
                await page.mouse.click(ANDROID_HOMEFEED_COORDS.x, ANDROID_HOMEFEED_COORDS.y);
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
                        activeItem: { type: 'series-node', itemId: 1, seriesId: 'BubbleSeries-2' },
                    });

                    await nextCandidate(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 4, seriesId: 'BubbleSeries-2' },
                    });

                    await nextCandidate(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 4, seriesId: 'BubbleSeries-1' },
                    });

                    await hoverInTopLeft(page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();
                });
            });

            test.describe('calling activeChange-preventDefault keep highlight/tooltip unchanged', () => {
                test('screenshots', async ({ page }) => {
                    await clickPreventDefaultTickbox(page);
                    await expect(canvas).toHaveScreenshot('bubble-example-canvas-inactive.png');

                    await hoverOnAndroidHomeFeed(page);
                    await expect(canvas).toHaveScreenshot('bubble-example-canvas-active-androidhomefeed.png');

                    await clickOnAndroidHomeFeed(page);
                    await expect(canvas).toHaveScreenshot('bubble-example-canvas-active-androidhomefeed.png');
                });

                test('states', async ({ page }) => {
                    await clickPreventDefaultTickbox(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await hoverOnAndroidHomeFeed(page);
                    expect((await getChartState(page)).active?.activeItem).toEqual(ANDROID_HOMEFEED_ACTIVE_ITEM);

                    await clickOnAndroidHomeFeed(page);
                    expect((await getChartState(page)).active?.activeItem).toEqual(ANDROID_HOMEFEED_ACTIVE_ITEM);
                });

                test('popEvents', async ({ page }) => {
                    await clickPreventDefaultTickbox(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await hoverOnAndroidHomeFeed(page);
                    expect(await popChartEvents(page)).toEqual([ANDROID_HOMEFEED_ACTIVE_CHANGE]);

                    await clickOnAndroidHomeFeed(page);
                    expect(await popChartEvents(page)).toEqual([IOS_MESSAGING_ACTIVE_CHANGE]);
                });
            });

            test.describe('AG-16744 legend responds to hover events when series-area focus indicator is shown', () => {
                async function hoverOveriOSLegend(page: Page): Promise<void> {
                    await page.mouse.move(724, 329);
                }
                async function hoverOverAndroidLegend(page: Page): Promise<void> {
                    await page.mouse.move(726, 356);
                }
                async function tabIntoChart(page: Page): Promise<void> {
                    await repeat(4, async () => page.keyboard.press('Tab'));
                }
                test('screenshots', async ({ page }) => {
                    await tabIntoChart(page);
                    await expect(canvas).toHaveScreenshot('bubble-example-canvas-active-focus-iossearch.png');

                    await hoverOverAndroidLegend(page);
                    await expect(canvas).toHaveScreenshot('bubble-example-canvas-active-legend2-focus-iossearch.png');

                    await hoverOveriOSLegend(page);
                    await expect(canvas).toHaveScreenshot('bubble-example-canvas-active-legend1-focus-iossearch.png');
                });

                test('states', async ({ page }) => {
                    await tabIntoChart(page);
                    expect((await getChartState(page)).active?.activeItem).toEqual(IOS_SEARCH_ACTIVE_ITEM);

                    await hoverOverAndroidLegend(page);
                    expect((await getChartState(page)).active?.activeItem).toEqual(ANDROID_LEGEND_ACTIVE_ITEM);

                    await hoverOveriOSLegend(page);
                    expect((await getChartState(page)).active?.activeItem).toEqual(IOS_LEGEND_ACTIVE_ITEM);
                });

                test('popEvents', async ({ page }) => {
                    await tabIntoChart(page);
                    expect(await popChartEvents(page)).toEqual([IOS_SEARCH_ACTIVE_CHANGE]);

                    await hoverOverAndroidLegend(page);
                    expect(await popChartEvents(page)).toEqual([ANDROID_LEGEND_ACTIVE_CHANGE]);

                    await hoverOveriOSLegend(page);
                    expect(await popChartEvents(page)).toEqual([
                        INACTIVE_CHANGE, // FIXME: AG-16973
                        IOS_LEGEND_ACTIVE_CHANGE,
                    ]);
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
                        activeItem: { type: 'series-node', itemId: 7, seriesId: 'BarSeries-3' },
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
                        activeItem: { type: 'series-node', itemId: 3, seriesId: 'BarSeries-2' },
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
                    await expect(canvas).toHaveScreenshot('sankey-example-canvas-active-linkBE-tooltip-moved.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    await hoverOnLinkFromBtoE(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 'link-3', seriesId: 'SankeySeries-1' },
                    });
                    const hoverLinkState: AgChartState = state;

                    await hoverMiss(page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await setChartState(page, hoverLinkState);
                    state = await getChartState(page);
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
                    await expect(canvas).toHaveScreenshot('sankey-example-canvas-active-nodeC-tooltip-moved.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    await hoverOnNodeC(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 'node-1', seriesId: 'SankeySeries-1' },
                    });
                    const hoverLinkState: AgChartState = state;

                    await hoverMiss(page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await setChartState(page, hoverLinkState);
                    state = await getChartState(page);
                    expect(state.active).toEqual(hoverLinkState.active);
                });
            });
        });

        test.describe('initial-state', () => {
            let canvas: Locator;

            async function hoverOnUKLegend(page: Page): Promise<void> {
                await page.mouse.move(303, 554);
            }

            async function hoverOnGermany2015(page: Page): Promise<void> {
                await page.mouse.move(339, 319);
            }

            async function hoverMiss(page: Page): Promise<void> {
                const { width, height } = await locateCanvas(page);
                await page.mouse.move(width / 2, height / 2);
                await page.mouse.move(9, 9);
            }

            test.describe('series-node initialState matches hover event', () => {
                test.beforeEach(async ({ page }) => {
                    await gotoExample(
                        page,
                        toExamplePageUrl('active-e2e-test', 'initial-state-series-node', 'vanilla').url
                    );
                    canvas = page.locator(SELECTORS.canvasCenter);
                });

                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('initial-state-Germany2015-active.png');

                    await hoverMiss(page);
                    await expect(canvas).toHaveScreenshot('initial-state-inactive.png');

                    await hoverOnGermany2015(page);
                    await expect(canvas).toHaveScreenshot('initial-state-Germany2015-active.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 5, seriesId: 'AreaSeries-3' },
                    });

                    await hoverMiss(page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await hoverOnGermany2015(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', itemId: 5, seriesId: 'AreaSeries-3' },
                    });
                });
            });

            test.describe('legend initialState matches hover event', () => {
                test.beforeEach(async ({ page }) => {
                    await gotoExample(page, toExamplePageUrl('active-e2e-test', 'initial-state-legend', 'vanilla').url);
                    canvas = page.locator(SELECTORS.canvasCenter);
                });

                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('initial-state-UKLegend-active.png');

                    await hoverMiss(page);
                    await expect(canvas).toHaveScreenshot('initial-state-inactive.png');

                    await hoverOnUKLegend(page);
                    await expect(canvas).toHaveScreenshot('initial-state-UKLegend-active.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 'UK', seriesId: 'AreaSeries-2' },
                    });

                    await hoverMiss(page);
                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await hoverOnUKLegend(page);
                    state = await getChartState(page);
                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'legend', itemId: 'UK', seriesId: 'AreaSeries-2' },
                    });
                });
            });
        });

        test.describe('AG-16703 zoom and active restoration', () => {
            let canvas: Locator;

            test.beforeEach(async ({ page }) => {
                const url = toExamplePageUrl('active-e2e-test', 'zoom-and-active-restoration', 'vanilla').url;
                await gotoExample(page, url);
                canvas = page.locator(SELECTORS.canvasCenter);
            });

            test.describe('updateDelta', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('zoom-and-active-restoration-canvas-inactive.png');

                    await page.click('#myUpdateDelta');
                    await expect(canvas).toHaveScreenshot('zoom-and-active-restoration-canvas-active.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await page.click('#myUpdateDelta');
                    state = await getChartState(page);

                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', seriesId: 'sales', itemId: 9 },
                    });
                });
            });

            test.describe('setState', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('zoom-and-active-restoration-canvas-inactive.png');

                    await page.click('#mySetState');
                    await expect(canvas).toHaveScreenshot('zoom-and-active-restoration-canvas-active.png');
                });

                test('states', async ({ page }) => {
                    let state: AgChartState;

                    state = await getChartState(page);
                    expect(state.active?.activeItem).toBeUndefined();

                    await page.click('#mySetState');
                    state = await getChartState(page);

                    expect(state.active).toEqual({
                        frozen: false,
                        activeItem: { type: 'series-node', seriesId: 'sales', itemId: 9 },
                    });
                });
            });
        });

        test.describe('interactive-tooltip', () => {
            let canvas: Locator;

            const activeState2ndBar = Object.freeze({
                frozen: false,
                activeItem: { itemId: 1, seriesId: 'BarSeries-1', type: 'series-node' },
            });

            const activeChange2ndBarMouse = Object.freeze({
                ...activeState2ndBar,
                datum: { month: 'Jul', sweaters: 70 },
                dataIdKey: undefined,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'user-interaction',
                type: 'activeChange',
            });

            const activeChangeDeactivateCommon = Object.freeze({
                frozen: false,
                activeItem: undefined,
                datum: undefined,
                dataIdKey: undefined,
                preventDefault: PREVENT_DEFAULT_STUB,
                type: 'activeChange',
            });

            const activeChangeDeactivateMouse = Object.freeze({
                ...activeChangeDeactivateCommon,
                source: 'user-interaction',
            });

            const activeChangeDeactivateSetState = Object.freeze({
                ...activeChangeDeactivateCommon,
                source: 'state-change',
            });

            async function mouseMove2ndBar(page: Page): Promise<void> {
                await page.mouse.move(400, 300);
            }

            async function mouseLeave(page: Page): Promise<void> {
                await page.mouse.move(100, 100);
            }

            async function clickMyButton(page: Page): Promise<void> {
                await page.locator('#myButton').click();
            }

            async function growTextArea(page: Page): Promise<void> {
                await page.evaluate(async () => {
                    const ta = document.querySelector('textarea');
                    if (ta) ta.style.height = '300px';
                    await new Promise((resolve) => requestAnimationFrame(resolve));
                });
                await waitForChartUpdate(page.locator(SELECTORS.wrapper));
            }

            test.beforeEach(async ({ page }) => {
                const url = toExamplePageUrl('active-e2e-test', 'interactive-tooltip-example', 'vanilla').url;
                await gotoExample(page, url);
                canvas = page.locator(SELECTORS.canvasCenter);
            });

            test.describe('mouseleave events prevented', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-inactive.png');

                    await mouseMove2ndBar(page);
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-2nd-bar-hovered.png');

                    await mouseLeave(page);
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-2nd-bar-hovered.png');

                    await mouseMove2ndBar(page);
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-2nd-bar-hovered.png');
                });

                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await mouseMove2ndBar(page);
                    expect((await getChartState(page)).active).toEqual(activeState2ndBar);

                    await mouseLeave(page);
                    expect((await getChartState(page)).active).toEqual(activeState2ndBar);

                    await mouseMove2ndBar(page);
                    expect((await getChartState(page)).active).toEqual(activeState2ndBar);
                });

                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await mouseMove2ndBar(page);
                    expect(await popChartEvents(page)).toEqual([activeChange2ndBarMouse]);

                    await mouseLeave(page);
                    expect(await popChartEvents(page)).toEqual([activeChangeDeactivateMouse]);

                    await mouseMove2ndBar(page);
                    expect(await popChartEvents(page)).toEqual([]);
                });
            });

            test.describe('button clears highlight', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-inactive.png');

                    await mouseMove2ndBar(page);
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-2nd-bar-hovered.png');

                    await clickMyButton(page);
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-inactive.png');

                    await mouseMove2ndBar(page);
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-2nd-bar-hovered.png');
                });

                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await mouseMove2ndBar(page);
                    expect((await getChartState(page)).active).toEqual(activeState2ndBar);

                    await clickMyButton(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await mouseMove2ndBar(page);
                    expect((await getChartState(page)).active).toEqual(activeState2ndBar);
                });

                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await mouseMove2ndBar(page);
                    expect(await popChartEvents(page)).toEqual([activeChange2ndBarMouse]);

                    await clickMyButton(page);
                    expect(await popChartEvents(page)).toEqual([activeChangeDeactivateSetState]);

                    await mouseMove2ndBar(page);
                    expect(await popChartEvents(page)).toEqual([activeChange2ndBarMouse]);
                });
            });

            test.describe('highlight persists on resize (preventDefault)', () => {
                // The highlight-update fires two redraws when resizing. Looks fine to the end-user, but e2e
                // image-snapshot comparison fails because it compares in intermediate frame.
                // See https://ag-grid.atlassian.net/browse/AG-16704?focusedCommentId=103437
                test.skip('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-inactive.png');

                    await mouseMove2ndBar(page);
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-2nd-bar-hovered.png');

                    await mouseLeave(page);
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-2nd-bar-hovered.png');

                    await growTextArea(page);
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-2nd-bar-resized.png');
                });

                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await mouseMove2ndBar(page);
                    expect((await getChartState(page)).active).toEqual(activeState2ndBar);

                    await mouseLeave(page);
                    expect((await getChartState(page)).active).toEqual(activeState2ndBar);

                    await growTextArea(page);
                    expect((await getChartState(page)).active).toEqual(activeState2ndBar);
                });

                test.skip('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await mouseMove2ndBar(page);
                    expect(await popChartEvents(page)).toEqual([activeChange2ndBarMouse]);

                    await mouseLeave(page);
                    expect(await popChartEvents(page)).toEqual([activeChangeDeactivateMouse]);

                    await growTextArea(page);
                    // FIXME: When testing this manually, I only get one activeChange deactivation event. But in the e2e
                    // test multiple dom:resize events are firing for some reason.
                    expect(await popChartEvents(page)).toEqual([
                        activeChangeDeactivateMouse,
                        activeChangeDeactivateMouse,
                        activeChangeDeactivateMouse,
                        activeChangeDeactivateMouse,
                    ]);
                });
            });

            test.describe('highlight persists on resize (permitDefault)', () => {
                test('screenshots', async ({ page }) => {
                    await clickPreventDefaultTickbox(page);
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-inactive.png');

                    await mouseMove2ndBar(page);
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-2nd-bar-hovered.png');

                    await growTextArea(page);
                    await expect(canvas).toHaveScreenshot('interactive-tooltip-inactive-resized.png');
                });

                test('states', async ({ page }) => {
                    await clickPreventDefaultTickbox(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await mouseMove2ndBar(page);
                    expect((await getChartState(page)).active).toEqual(activeState2ndBar);

                    await growTextArea(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();
                });

                test('popEvents', async ({ page }) => {
                    await clickPreventDefaultTickbox(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await mouseMove2ndBar(page);
                    expect(await popChartEvents(page)).toEqual([activeChange2ndBarMouse]);

                    await growTextArea(page);
                    expect(await popChartEvents(page)).toEqual([activeChangeDeactivateMouse]);
                });
            });
        });

        test.describe('map-prevent-default', () => {
            let canvas: Locator;

            const FRANCE_ACTIVE_CHANGE = Object.freeze({
                activeItem: {
                    itemId: 0,
                    seriesId: 'MapShapeSeries-1',
                    type: 'series-node',
                },
                datum: {
                    gdp_md: 2715518,
                    iso2: 'FR',
                    iso3: 'FRA',
                    name: 'France',
                    pop_est: 67059887,
                    pop_rank: 16,
                },
                frozen: false,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'user-interaction',
                type: 'activeChange',
            });

            const UK_ACTIVE_CHANGE = Object.freeze({
                activeItem: { itemId: 0, seriesId: 'MapShapeSeries-3', type: 'series-node' },
                datum: {
                    gdp_md: 2829108,
                    iso2: 'GB',
                    iso3: 'GBR',
                    name: 'United Kingdom',
                    pop_est: 66834405,
                    pop_rank: 16,
                },
                frozen: false,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'user-interaction',
                type: 'activeChange',
            });

            const ICELAND_ACTIVE_CHANGE = Object.freeze({
                activeItem: { itemId: 1, seriesId: 'MapShapeSeries-5', type: 'series-node' },
                datum: {
                    gdp_md: 24188,
                    iso2: 'IS',
                    iso3: 'ISL',
                    name: 'Iceland',
                    pop_est: 361313,
                    pop_rank: 10,
                },
                frozen: false,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'user-interaction',
                type: 'activeChange',
            });

            const EU_NONEUROZONE_ACTIVE_CHANGE = Object.freeze({
                activeItem: { itemId: 'MapShapeSeries-2', seriesId: 'MapShapeSeries-2', type: 'legend' },
                datum: undefined,
                frozen: false,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'user-interaction',
                type: 'activeChange',
            });

            const OTHERCOUNTRY_ACTIVE_CHANGE = Object.freeze({
                activeItem: { itemId: 'MapShapeSeries-7', seriesId: 'MapShapeSeries-7', type: 'legend' },
                datum: undefined,
                frozen: false,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'user-interaction',
                type: 'activeChange',
            });

            async function hoverFranceShape(page: Page): Promise<void> {
                await page.mouse.move(250, 415);
            }

            async function hoverUKShape(page: Page): Promise<void> {
                await page.mouse.move(224, 363);
            }

            async function hoverIcelandShape(page: Page): Promise<void> {
                await page.mouse.move(124, 214);
            }

            async function hoverEUNonEurozoneLegendItem(page: Page): Promise<void> {
                await page.mouse.move(655, 295);
            }

            async function hoverOtherLegendItem(page: Page): Promise<void> {
                await page.mouse.move(655, 415);
            }

            async function hoverMiss(page: Page): Promise<void> {
                await page.mouse.move(500, 200);
            }

            test.beforeEach(async ({ page }) => {
                const url = toExamplePageUrl('active-e2e-test', 'map-prevent-default', 'vanilla').url;
                await gotoExample(page, url);
                canvas = page.locator(SELECTORS.canvasCenter);
            });

            test.describe('hovering over country shapes prevents activeChange events', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('map-prevent-default-inactive.png');

                    await hoverFranceShape(page);
                    await expect(canvas).toHaveScreenshot('map-prevent-default-inactive.png');

                    await hoverMiss(page);
                    await expect(canvas).toHaveScreenshot('map-prevent-default-inactive.png');

                    await hoverUKShape(page);
                    await expect(canvas).toHaveScreenshot('map-prevent-default-inactive.png');

                    await hoverIcelandShape(page);
                    await expect(canvas).toHaveScreenshot('map-prevent-default-inactive.png');
                });

                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await hoverFranceShape(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await hoverMiss(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await hoverUKShape(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await hoverIcelandShape(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();
                });

                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await hoverFranceShape(page);
                    expect(await popChartEvents(page)).toEqual([FRANCE_ACTIVE_CHANGE]);

                    await hoverMiss(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await hoverUKShape(page);
                    expect(await popChartEvents(page)).toEqual([UK_ACTIVE_CHANGE]);

                    await hoverIcelandShape(page);
                    expect(await popChartEvents(page)).toEqual([ICELAND_ACTIVE_CHANGE]);
                });
            });

            test.describe('hovering over legend items prevents activeChange events', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('map-prevent-default-inactive.png');

                    await hoverEUNonEurozoneLegendItem(page);
                    await expect(canvas).toHaveScreenshot('map-prevent-default-inactive.png');

                    await hoverMiss(page);
                    await expect(canvas).toHaveScreenshot('map-prevent-default-inactive.png');

                    await hoverEUNonEurozoneLegendItem(page);
                    await expect(canvas).toHaveScreenshot('map-prevent-default-inactive.png');

                    await hoverOtherLegendItem(page);
                    await expect(canvas).toHaveScreenshot('map-prevent-default-inactive.png');
                });

                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await hoverEUNonEurozoneLegendItem(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await hoverMiss(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await hoverEUNonEurozoneLegendItem(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await hoverOtherLegendItem(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();
                });

                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await hoverEUNonEurozoneLegendItem(page);
                    expect(await popChartEvents(page)).toEqual([EU_NONEUROZONE_ACTIVE_CHANGE]);

                    await hoverMiss(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await hoverEUNonEurozoneLegendItem(page);
                    expect(await popChartEvents(page)).toEqual([EU_NONEUROZONE_ACTIVE_CHANGE]);

                    await hoverOtherLegendItem(page);
                    expect(await popChartEvents(page)).toEqual([OTHERCOUNTRY_ACTIVE_CHANGE]);
                });
            });
        });

        test.describe('click-to-freeze', () => {
            let canvas: Locator;

            const Q1_2024_ACTIVE = Object.freeze({
                activeItem: { type: 'series-node', seriesId: 'sales-series', itemId: 0 },
            });

            const Q2_2024_ACTIVE = Object.freeze({
                activeItem: { type: 'series-node', seriesId: 'sales-series', itemId: 1 },
            });

            const Q3_2024_ACTIVE = Object.freeze({
                activeItem: { type: 'series-node', seriesId: 'sales-series', itemId: 2 },
            });

            const Q4_2024_ACTIVE = Object.freeze({
                activeItem: { type: 'series-node', seriesId: 'sales-series', itemId: 3 },
            });

            const Q1_2024_ACTIVE_CHANGE = Object.freeze({
                ...Q1_2024_ACTIVE,
                datum: { quarter: 'Q1 2024', sales: 450 },
                preventDefault: PREVENT_DEFAULT_STUB,
                type: 'activeChange',
            });

            const Q2_2024_ACTIVE_CHANGE = Object.freeze({
                ...Q2_2024_ACTIVE,
                datum: { quarter: 'Q2 2024', sales: 720 },
                preventDefault: PREVENT_DEFAULT_STUB,
                type: 'activeChange',
            });

            const Q3_2024_ACTIVE_CHANGE = Object.freeze({
                ...Q3_2024_ACTIVE,
                datum: { quarter: 'Q3 2024', sales: 610 },
                preventDefault: PREVENT_DEFAULT_STUB,
                type: 'activeChange',
            });

            const Q4_2024_ACTIVE_CHANGE = Object.freeze({
                ...Q4_2024_ACTIVE,
                datum: { quarter: 'Q4 2024', sales: 890 },
                preventDefault: PREVENT_DEFAULT_STUB,
                type: 'activeChange',
            });

            async function hover2024q2(page: Page): Promise<void> {
                await page.mouse.move(300, 330);
                await waitForChartUpdate(page.locator(SELECTORS.wrapper));
            }

            async function click2024q2(page: Page): Promise<void> {
                await page.mouse.click(300, 400);
                await waitForChartUpdate(page.locator(SELECTORS.wrapper));
            }

            async function hover2024q4(page: Page): Promise<void> {
                await page.mouse.move(600, 300);
                await waitForChartUpdate(page.locator(SELECTORS.wrapper));
            }

            async function click2024q4(page: Page): Promise<void> {
                await page.mouse.click(600, 300);
                await waitForChartUpdate(page.locator(SELECTORS.wrapper));
            }

            async function clickMiss(page: Page): Promise<void> {
                await page.mouse.click(20, 20);
                await waitForChartUpdate(page.locator(SELECTORS.wrapper));
            }

            async function tabIntoChart(page: Page): Promise<void> {
                await clickMiss(page);
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
            }

            async function twoArrowRight(page: Page): Promise<void> {
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
            }

            async function keyboardClick(page: Page): Promise<void> {
                await page.keyboard.press('Space');
            }

            async function tabInTwoArrowRightAndKeyboardClick(page: Page): Promise<void> {
                await tabIntoChart(page);
                await twoArrowRight(page);
                await keyboardClick(page);
            }

            test.beforeEach(async ({ page }) => {
                const url = toExamplePageUrl('active-e2e-test', 'click-to-freeze', 'vanilla').url;
                await gotoExample(page, url);
                canvas = page.locator(SELECTORS.canvasCenter);
            });

            test.describe('clicking 2024q2 toggles frozen state', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('click-to-freeze-canvas-inactive.png');

                    await hover2024q2(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q2-hover.png');

                    await click2024q2(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q2-frozen.png');

                    await click2024q2(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q2-thawed.png');
                });
                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await hover2024q2(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q2_2024_ACTIVE, frozen: false });

                    await click2024q2(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q2_2024_ACTIVE, frozen: true });

                    await click2024q2(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q2_2024_ACTIVE, frozen: false });
                });
                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await hover2024q2(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...Q2_2024_ACTIVE_CHANGE, source: 'user-interaction', frozen: false },
                    ]);

                    await click2024q2(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...Q2_2024_ACTIVE_CHANGE, source: 'state-change', frozen: true },
                    ]);

                    await click2024q2(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...Q2_2024_ACTIVE_CHANGE, source: 'state-change', frozen: false },
                    ]);
                });
            });

            test.describe('clicking 2024q4 on frozen chart updates frozen state', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('click-to-freeze-canvas-inactive.png');

                    await hover2024q4(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q4-hover.png');

                    await hover2024q2(page);
                    await click2024q2(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q2-frozen.png');

                    await click2024q4(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q4-frozen.png');

                    await click2024q4(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q4-thawed.png');
                });
                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await hover2024q4(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q4_2024_ACTIVE, frozen: false });

                    await hover2024q2(page);
                    await click2024q2(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q2_2024_ACTIVE, frozen: true });

                    await click2024q4(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q4_2024_ACTIVE, frozen: true });

                    await click2024q4(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q4_2024_ACTIVE, frozen: false });
                });
                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await hover2024q4(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...Q4_2024_ACTIVE_CHANGE, source: 'user-interaction', frozen: false },
                    ]);

                    await hover2024q2(page);
                    await click2024q2(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...Q2_2024_ACTIVE_CHANGE, source: 'user-interaction', frozen: false },
                        { ...Q2_2024_ACTIVE_CHANGE, source: 'state-change', frozen: true },
                    ]);

                    await click2024q4(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...Q4_2024_ACTIVE_CHANGE, source: 'state-change', frozen: true },
                    ]);

                    await click2024q4(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...Q4_2024_ACTIVE_CHANGE, source: 'state-change', frozen: false },
                    ]);
                });
            });

            test.describe('clicking 2024q2 blocks keyboard activation but not keyboard input', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('click-to-freeze-canvas-inactive.png');

                    await click2024q4(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q4-frozen.png');

                    await tabIntoChart(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q4-frozen-2024q1-focused.png');

                    await twoArrowRight(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q4-frozen-2024q3-focused.png');

                    await keyboardClick(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q3-frozen-and-focused.png');
                });
                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await click2024q4(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q4_2024_ACTIVE, frozen: true });

                    await tabIntoChart(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q4_2024_ACTIVE, frozen: true });

                    await twoArrowRight(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q4_2024_ACTIVE, frozen: true });

                    await keyboardClick(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q3_2024_ACTIVE, frozen: true });
                });
                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await click2024q4(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...Q4_2024_ACTIVE_CHANGE, source: 'state-change', frozen: true },
                    ]);

                    await tabIntoChart(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await twoArrowRight(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await keyboardClick(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...Q3_2024_ACTIVE_CHANGE, source: 'state-change', frozen: true },
                    ]);
                });
                test('ariaLabel', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await click2024q4(page);
                    expect(await readSwapchainText(page)).toBe('Q1 2024; Sales; 450');

                    await tabIntoChart(page);
                    expect(await readSwapchainText(page)).toBe('Q1 2024; Sales; 450');

                    await page.keyboard.press('ArrowRight');
                    expect(await readSwapchainText(page)).toBe('Q2 2024; Sales; 720');
                    await page.keyboard.press('ArrowRight');
                    expect(await readSwapchainText(page)).toBe('Q3 2024; Sales; 610');

                    await keyboardClick(page);
                    expect(await readSwapchainText(page)).toBe('Q3 2024; Sales; 610');
                });
            });

            test.describe('keyboard-clicking 2024q3 blocks keyboard activation but not keyboard input', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('click-to-freeze-canvas-inactive.png');

                    await tabInTwoArrowRightAndKeyboardClick(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q3-frozen-and-focused.png');

                    await twoArrowRight(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q3-frozen-2025q1-focused.png');
                });
                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await tabInTwoArrowRightAndKeyboardClick(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q3_2024_ACTIVE, frozen: true });

                    await twoArrowRight(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q3_2024_ACTIVE, frozen: true });
                });
                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await tabInTwoArrowRightAndKeyboardClick(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...Q1_2024_ACTIVE_CHANGE, source: 'user-interaction', frozen: false },
                        { ...Q2_2024_ACTIVE_CHANGE, source: 'user-interaction', frozen: false },
                        { ...Q3_2024_ACTIVE_CHANGE, source: 'user-interaction', frozen: false },
                        { ...Q3_2024_ACTIVE_CHANGE, source: 'state-change', frozen: true },
                    ]);

                    await twoArrowRight(page);
                    expect(await popChartEvents(page)).toEqual([]);
                });
                test('ariaLabel', async ({ page }) => {
                    await tabInTwoArrowRightAndKeyboardClick(page);
                    expect(await readSwapchainText(page)).toBe('Q3 2024; Sales; 610');

                    await page.keyboard.press('ArrowRight');
                    expect(await readSwapchainText(page)).toBe('Q4 2024; Sales; 890');
                    await page.keyboard.press('ArrowRight');
                    expect(await readSwapchainText(page)).toBe('Q1 2025; Sales; 530');
                });
            });

            test.describe('keyboard-clicking 2024q1 updates mouse-click frozen chart', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('click-to-freeze-canvas-inactive.png');

                    await click2024q4(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q4-frozen.png');

                    await keyboardClick(page);
                    await expect(page).toHaveScreenshot('click-to-freeze-page-2024q1-frozen-and-focused.png');
                });
                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await click2024q4(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q4_2024_ACTIVE, frozen: true });

                    await keyboardClick(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...Q1_2024_ACTIVE, frozen: true });
                });
                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await click2024q4(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...Q4_2024_ACTIVE_CHANGE, source: 'state-change', frozen: true },
                    ]);

                    await keyboardClick(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...Q1_2024_ACTIVE_CHANGE, source: 'state-change', frozen: true },
                    ]);
                });
                test('ariaLabel', async ({ page }) => {
                    await click2024q4(page);
                    expect(await readSwapchainText(page)).toBe('Q1 2024; Sales; 450');

                    await keyboardClick(page);
                    expect(await readSwapchainText(page)).toBe('Q1 2024; Sales; 450');
                });
            });
        });

        test.describe('candlestick-crosshairs', () => {
            let canvas: Locator;

            const DATUM7_ACTIVE = Object.freeze({
                activeItem: { type: 'series-node', seriesId: 'CandleStickSeries-1', itemId: 17 },
            });

            const DATUM7_ACTIVE_CHANGE = Object.freeze({
                ...DATUM7_ACTIVE,
                datum: { date: new Date('2026-02-10T00:00:00Z'), open: 3715, high: 3730, low: 3670, close: 3688 },
                preventDefault: PREVENT_DEFAULT_STUB,
                type: 'activeChange',
            });

            async function hoverOnCandlestick7(page: Page): Promise<void> {
                await page.mouse.move(260, 325);
            }

            async function clickOnCandlestick7(page: Page): Promise<void> {
                await page.mouse.click(260, 325);
            }

            async function hoverElsewhereInSeriesArea(page: Page): Promise<void> {
                await page.mouse.move(524, 163);
            }

            async function leaveSeriesArea(page: Page): Promise<void> {
                await page.mouse.move(20, 20);
            }

            test.beforeEach(async ({ page }) => {
                const url = toExamplePageUrl('active-e2e-test', 'candlestick-crosshairs', 'vanilla').url;
                await gotoExample(page, url);
                canvas = page.locator(SELECTORS.canvasCenter);
            });

            test.describe('non-snap Y crosshairs respond to mousemove on frozen charts', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('crosshairs-inactive.png');

                    await hoverOnCandlestick7(page);
                    await expect(canvas).toHaveScreenshot('crosshairs-candlestick7-hover.png');

                    await clickOnCandlestick7(page);
                    await expect(canvas).toHaveScreenshot('crosshairs-candlestick7-frozen.png');

                    await hoverElsewhereInSeriesArea(page);
                    await expect(canvas).toHaveScreenshot('crosshairs-candlestick7-y-crosshair-updated.png');

                    await leaveSeriesArea(page);
                    await expect(canvas).toHaveScreenshot('crosshairs-candlestick7-y-crosshair-dismissed.png');
                });
                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await hoverOnCandlestick7(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...DATUM7_ACTIVE, frozen: false });

                    await clickOnCandlestick7(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...DATUM7_ACTIVE, frozen: true });

                    await hoverElsewhereInSeriesArea(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...DATUM7_ACTIVE, frozen: true });

                    await leaveSeriesArea(page);
                    expect((await getChartState(page)).active).toMatchObject({ ...DATUM7_ACTIVE, frozen: true });
                });
                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await hoverOnCandlestick7(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...DATUM7_ACTIVE_CHANGE, source: 'user-interaction', frozen: false },
                    ]);

                    await clickOnCandlestick7(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...DATUM7_ACTIVE_CHANGE, source: 'state-change', frozen: true },
                    ]);

                    await hoverElsewhereInSeriesArea(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await leaveSeriesArea(page);
                    expect(await popChartEvents(page)).toEqual([]);
                });
            });
        });

        test.describe('data-mutation', () => {
            const MARCHBAR_ACTIVE_ITEM = Object.freeze({
                type: 'series-node',
                seriesId: 'BarSeries-1',
                itemId: 'Mar',
            });

            const MARCHBAR_ACTIVE_STATE = Object.freeze({
                activeItem: MARCHBAR_ACTIVE_ITEM,
                frozen: true,
            });

            const MARCHBAR_ACTIVE_CHANGE = Object.freeze({
                ...MARCHBAR_ACTIVE_STATE,
                datum: { month: 'Mar', value: 130 },
                dataIdKey: 'month',
                preventDefault: PREVENT_DEFAULT_STUB,
                type: 'activeChange',
            });

            async function hoverMiss(page: Page): Promise<void> {
                await page.mouse.move(1, 1);
            }

            async function clickMarchBar(page: Page): Promise<void> {
                await page.mouse.move(360, 392);
                await page.mouse.click(360, 392);
                await waitForChartUpdate(page.locator(SELECTORS.wrapper));
            }

            async function clickAddStart(page: Page): Promise<void> {
                await page.getByText('Add Start').click();
            }

            async function clickRemoveStart(page: Page): Promise<void> {
                await page.getByText('Remove Start').click();
            }

            async function clickAddStart2Times(page: Page): Promise<void> {
                await repeat(2, async () => await clickAddStart(page));
                await hoverMiss(page);
                await waitForChartUpdate(page.locator(SELECTORS.wrapper));
            }

            async function clickRemoveStart3Times(page: Page): Promise<void> {
                await repeat(3, async () => await clickRemoveStart(page));
                await hoverMiss(page);
                await waitForChartUpdate(page.locator(SELECTORS.wrapper));
            }

            test.beforeEach(async ({ page }) => {
                const url = toExamplePageUrl('active-e2e-test', 'data-mutation', 'vanilla').url;
                await gotoExample(page, url);
            });

            test.describe('adding and removing datums at start keeps frozen datum active', () => {
                test('screenshots', async ({ page }) => {
                    await expect(page).toHaveScreenshot('data-mutation-initial.png');

                    await clickMarchBar(page);
                    await expect(page).toHaveScreenshot('data-mutation-marchbar-clicked.png');

                    await clickAddStart2Times(page);
                    await expect(page).toHaveScreenshot('data-mutation-marchbar-2-addstart.png');

                    await clickRemoveStart3Times(page);
                    await expect(page).toHaveScreenshot('data-mutation-marchbar-3-removestart.png');
                });
                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await clickMarchBar(page);
                    expect((await getChartState(page)).active).toEqual(MARCHBAR_ACTIVE_STATE);

                    await clickAddStart2Times(page);
                    expect((await getChartState(page)).active).toEqual(MARCHBAR_ACTIVE_STATE);

                    await clickRemoveStart3Times(page);
                    expect((await getChartState(page)).active).toEqual(MARCHBAR_ACTIVE_STATE);
                });
                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await clickMarchBar(page);
                    expect(await popChartEvents(page)).toEqual([
                        { ...MARCHBAR_ACTIVE_CHANGE, frozen: false, source: 'user-interaction' }, // hover
                        { ...MARCHBAR_ACTIVE_CHANGE, frozen: true, source: 'state-change' }, // click
                    ]);

                    await clickAddStart2Times(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await clickRemoveStart3Times(page);
                    expect(await popChartEvents(page)).toEqual([]);
                });
            });
        });

        test.describe('frozen-zoompan', () => {
            let canvas: Locator;

            const APRIL_ACTIVE_ITEM = Object.freeze({
                type: 'series-node',
                seriesId: 'sales-series',
                itemId: 3,
            });

            const APRIL_ACTIVE_STATE = Object.freeze({
                activeItem: APRIL_ACTIVE_ITEM,
                frozen: true,
            });

            const APRIL_ACTIVE_CHANGE = Object.freeze({
                ...APRIL_ACTIVE_STATE,
                datum: { month: 'Apr', sales: 220 },
                dataIdKey: undefined,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'state-change',
                type: 'activeChange',
            });

            async function clickFreezeOnApril(page: Page): Promise<void> {
                await page.getByText('Freeze on April (index 3)').click();
                await waitForChartUpdate(page.locator(SELECTORS.wrapper));
            }

            async function slideNavigatorMaxLeft(page: Page): Promise<void> {
                await page.mouse.move(762, 554);
                await page.mouse.down({ button: 'left' });
                await page.mouse.move(413, 554);
                await page.mouse.up({ button: 'left' });
            }

            async function slideNavigatorPanRight(page: Page): Promise<void> {
                await page.mouse.move(269, 554);
                await page.mouse.down({ button: 'left' });
                await page.mouse.move(698, 554);
                await page.mouse.up({ button: 'left' });
            }

            async function slideNavigatorPanLeft(page: Page): Promise<void> {
                await page.mouse.move(698, 554);
                await page.mouse.down({ button: 'left' });
                await page.mouse.move(269, 554);
                await page.mouse.up({ button: 'left' });
            }

            async function tabIntoChart(page: Page): Promise<void> {
                await page.mouse.click(5, 5);
                await repeat(4, async () => await page.keyboard.press('Tab'));
            }

            async function keyPlus4Times(page: Page): Promise<void> {
                await repeat(4, async () => await page.keyboard.press('+'));
            }

            async function keyArrowRight(page: Page): Promise<void> {
                await page.keyboard.press('ArrowRight');
            }

            async function keyEnd(page: Page): Promise<void> {
                await page.keyboard.press('End');
            }

            test.beforeEach(async ({ page }) => {
                const url = toExamplePageUrl('active-e2e-test', 'frozen-zoompan', 'vanilla').url;
                await gotoExample(page, url);
                canvas = page.locator(SELECTORS.canvasCenter);
            });

            test.describe('frozen series-node survives navigator mouse dragging', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('frozen-zoompan-initial.png');

                    await clickFreezeOnApril(page);
                    await expect(canvas).toHaveScreenshot('frozen-zoompan-initial-frozen.png');

                    await slideNavigatorMaxLeft(page);
                    await expect(canvas).toHaveScreenshot('frozen-zoompan-navigator-on-left.png');

                    await slideNavigatorPanRight(page);
                    await expect(canvas).toHaveScreenshot('frozen-zoompan-navigator-on-right.png');

                    await slideNavigatorPanLeft(page);
                    await expect(canvas).toHaveScreenshot('frozen-zoompan-navigator-on-left.png');
                });
                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await clickFreezeOnApril(page);
                    expect((await getChartState(page)).active).toEqual(APRIL_ACTIVE_STATE);

                    await slideNavigatorMaxLeft(page);
                    expect((await getChartState(page)).active).toEqual(APRIL_ACTIVE_STATE);

                    await slideNavigatorPanRight(page);
                    expect((await getChartState(page)).active).toEqual(APRIL_ACTIVE_STATE);

                    await slideNavigatorPanLeft(page);
                    expect((await getChartState(page)).active).toEqual(APRIL_ACTIVE_STATE);
                });
                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await clickFreezeOnApril(page);
                    expect(await popChartEvents(page)).toEqual([APRIL_ACTIVE_CHANGE]);

                    await slideNavigatorMaxLeft(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await slideNavigatorPanRight(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await slideNavigatorPanLeft(page);
                    expect(await popChartEvents(page)).toEqual([]);
                });
            });

            test.describe('frozen series-node survives keyboard navigation', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('frozen-zoompan-initial.png');

                    await clickFreezeOnApril(page);
                    await expect(canvas).toHaveScreenshot('frozen-zoompan-initial-frozen.png');

                    await tabIntoChart(page);
                    await expect(canvas).toHaveScreenshot('frozen-zoompan-initial-focus.png');

                    await keyPlus4Times(page);
                    await expect(canvas).toHaveScreenshot('frozen-zoompan-plus4times.png');

                    await keyArrowRight(page);
                    await expect(canvas).toHaveScreenshot('frozen-zoompan-datum2-focus.png');

                    await keyEnd(page);
                    await expect(canvas).toHaveScreenshot('frozen-zoompan-end-focus.png');
                });
                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await clickFreezeOnApril(page);
                    expect((await getChartState(page)).active).toEqual(APRIL_ACTIVE_STATE);

                    await tabIntoChart(page);
                    expect((await getChartState(page)).active).toEqual(APRIL_ACTIVE_STATE);

                    await keyPlus4Times(page);
                    expect((await getChartState(page)).active).toEqual(APRIL_ACTIVE_STATE);

                    await keyArrowRight(page);
                    expect((await getChartState(page)).active).toEqual(APRIL_ACTIVE_STATE);

                    await keyEnd(page);
                    expect((await getChartState(page)).active).toEqual(APRIL_ACTIVE_STATE);
                });
                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await clickFreezeOnApril(page);
                    expect(await popChartEvents(page)).toEqual([APRIL_ACTIVE_CHANGE]);

                    await tabIntoChart(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await keyPlus4Times(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await keyArrowRight(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await keyEnd(page);
                    expect(await popChartEvents(page)).toEqual([]);
                });
            });
        });

        test.describe('external-legend', () => {
            let canvas: Locator;

            const LEGENDITEM_PUBLICTRANSIT_ACTIVE = Object.freeze({
                activeItem: {
                    itemId: 'publicTransit',
                    seriesId: 'publicTransit',
                    type: 'legend',
                },
            });

            const LEGENDITEM_CYCLE_ACTIVE = Object.freeze({
                activeItem: {
                    itemId: 'cycle',
                    seriesId: 'cycle',
                    type: 'legend',
                },
            });

            const COMMON_ACTIVE_CHANGE = Object.freeze({
                frozen: false,
                datum: undefined,
                preventDefault: PREVENT_DEFAULT_STUB,
                source: 'state-change',
                type: 'activeChange',
            });

            const LEGENDITEM_PUBLICTRANSIT_ACTIVE_CHANGE = Object.freeze({
                ...LEGENDITEM_PUBLICTRANSIT_ACTIVE,
                ...COMMON_ACTIVE_CHANGE,
            });

            const LEGENDITEM_CYCLE_ACTIVE_CHANGE = Object.freeze({
                ...LEGENDITEM_CYCLE_ACTIVE,
                ...COMMON_ACTIVE_CHANGE,
            });

            const INACTIVE_CHANGE = Object.freeze({
                activeItem: undefined,
                ...COMMON_ACTIVE_CHANGE,
            });

            async function clickLegendCheckbox(page: Page): Promise<void> {
                await page.locator('#myLegendEnabled').click();
            }

            async function hoverOverExternalLegendItemPublicTransit(page: Page): Promise<void> {
                await page.mouse.move(84, 75);
            }

            async function hoverOverExternalLegendItemCycle(page: Page): Promise<void> {
                await page.mouse.move(321, 74);
            }

            async function hoverMiss(page: Page): Promise<void> {
                await page.mouse.move(10, 10);
            }

            test.beforeEach(async ({ page }) => {
                const url = toExamplePageUrl('active-e2e-test', 'legend-disabled', 'vanilla').url;
                await gotoExample(page, url);
                canvas = page.locator(SELECTORS.canvasCenter);
            });

            test.describe('check that legend.enabled toggling updates correctly', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('external-legend-canvas-inactive.png');

                    await clickLegendCheckbox(page);
                    await expect(canvas).toHaveScreenshot('external-legend-canvas-inactive-legend-enabled.png');

                    await clickLegendCheckbox(page);
                    await expect(canvas).toHaveScreenshot('external-legend-canvas-inactive.png');
                });
                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await clickLegendCheckbox(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await clickLegendCheckbox(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();
                });
                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await clickLegendCheckbox(page);
                    expect(await popChartEvents(page)).toEqual([]);

                    await clickLegendCheckbox(page);
                    expect(await popChartEvents(page)).toEqual([]);
                });
            });

            test.describe('external legend works with internal legend disabled', () => {
                test('screenshots', async ({ page }) => {
                    await expect(canvas).toHaveScreenshot('external-legend-canvas-inactive.png');

                    await hoverOverExternalLegendItemPublicTransit(page);
                    await expect(page).toHaveScreenshot('external-legend-page-publictransit-active.png');

                    await hoverOverExternalLegendItemCycle(page);
                    await expect(page).toHaveScreenshot('external-legend-page-cycle-active.png');

                    await hoverMiss(page);
                    await expect(canvas).toHaveScreenshot('external-legend-canvas-inactive.png');
                });
                test('states', async ({ page }) => {
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();

                    await hoverOverExternalLegendItemPublicTransit(page);
                    expect((await getChartState(page)).active).toMatchObject(LEGENDITEM_PUBLICTRANSIT_ACTIVE);

                    await hoverOverExternalLegendItemCycle(page);
                    expect((await getChartState(page)).active).toMatchObject(LEGENDITEM_CYCLE_ACTIVE);

                    await hoverMiss(page);
                    expect((await getChartState(page)).active?.activeItem).toBeUndefined();
                });
                test('popEvents', async ({ page }) => {
                    expect(await popChartEvents(page)).toEqual([]);

                    await hoverOverExternalLegendItemPublicTransit(page);
                    expect(await popChartEvents(page)).toEqual([LEGENDITEM_PUBLICTRANSIT_ACTIVE_CHANGE]);

                    await hoverOverExternalLegendItemCycle(page);
                    expect(await popChartEvents(page)).toEqual([INACTIVE_CHANGE, LEGENDITEM_CYCLE_ACTIVE_CHANGE]);

                    await hoverMiss(page);
                    expect(await popChartEvents(page)).toEqual([INACTIVE_CHANGE]);
                });
            });
        });
    });
});
