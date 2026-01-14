import type { Locator, Page } from '@playwright/test';

import type { AgChartState } from 'ag-charts-types';

import { expect, test } from './fixture';
import { SELECTORS, gotoExample, locateCanvas, setupIntrinsicAssertions, toExamplePageUrl } from './util';

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
        });
    });
});
