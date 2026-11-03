import type { Page } from 'playwright/test';

import { evalPageFunction, getChartState } from './agE2E';
import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    SELECTORS,
    canvasToPageTransformer,
    delay,
    dragCanvas,
    gotoExample,
    hoverCanvas,
    locateCanvas,
    repeat,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    waitForAllChartUpdates,
} from './util';

test.describe('zoom', () => {
    setupIntrinsicAssertions(test);

    test('navigator', async ({ page }) => {
        const { url } = toExamplePageUrl('financial-charts-e2e', 'zoom-navigator', 'vanilla');

        await gotoExample(page, url);

        const { width, height } = await locateCanvas(page);

        const withoutNavigatorYAxisTop = { x: width - 30, y: height / 4 };
        const withoutNavigatorYAxisBottom = { x: width - 30, y: (height * 3) / 4 };

        const withoutNavigatorXAxisLeft = { x: width / 4, y: height - 10 };
        const withoutNavigatorXAxisRight = { x: (width * 3) / 4, y: height - 10 };

        const withNavigatorYAxisTop = { x: width - 30, y: height / 4 };
        const withNavigatorYAxisBottom = { x: width - 30, y: (height * 3) / 4 };

        const withNavigatorXAxisLeft = { x: (width * 3) / 4, y: height - 80 };
        const withNavigatorXAxisRight = { x: width / 4, y: height - 80 };

        await hoverCanvas(page, { x: 100, y: height - 100 });
        const zoomIn = page.getByTitle('Zoom in');
        await zoomIn.click();
        await zoomIn.click();
        await zoomIn.click();
        await zoomIn.click();
        await zoomIn.click();
        await zoomIn.click();
        await expectChartScreenshot(page, page, 'zoom-1-before-navigator-zoom-in.png', { animations: 'disabled' });

        await dragCanvas(page, withoutNavigatorYAxisBottom, withoutNavigatorYAxisTop);
        await expectChartScreenshot(page, page, 'zoom-2-before-navigator-drag-y-axis.png', { animations: 'disabled' });

        await page.locator('.example-controls button').getByText('Toggle Navigator').click();

        await dragCanvas(page, withNavigatorYAxisBottom, withNavigatorYAxisTop);
        await expectChartScreenshot(page, page, 'zoom-3-with-navigator-drag-y-axis.png', { animations: 'disabled' });

        await dragCanvas(page, withNavigatorXAxisLeft, withNavigatorXAxisRight);
        await expectChartScreenshot(page, page, 'zoom-4-with-navigator-drag-x-axis.png', { animations: 'disabled' });

        await page.locator('.example-controls button').getByText('Toggle Navigator').click();

        await dragCanvas(page, withoutNavigatorYAxisTop, withoutNavigatorYAxisBottom);
        await dragCanvas(page, withoutNavigatorYAxisTop, withoutNavigatorYAxisBottom);
        await expectChartScreenshot(page, page, 'zoom-5-after-navigator-drag-y-axis.png', { animations: 'disabled' });

        await dragCanvas(page, withoutNavigatorXAxisLeft, withoutNavigatorXAxisRight);
        await dragCanvas(page, withoutNavigatorXAxisLeft, withoutNavigatorXAxisRight);
        await delay(300); // Delay due to debounce in ZoomToolbar (ZOOM_VALID_CHECK_DEBOUNCE)
        await expectChartScreenshot(page, page, 'zoom-6-after-navigator-drag-x-axis.png', { animations: 'disabled' });
    });

    test('crosshairs', async ({ page }) => {
        const xAxisLabel = '.ag-charts-crosshair-label[data-key="pointer"][data-axis-id="x"]';
        const yAxisLabel = '.ag-charts-crosshair-label[data-key="yKey"]';
        const { url } = toExamplePageUrl('zoom-e2e', 'zoom-crosshairs', 'vanilla');

        await gotoExample(page, url);

        const { width, height } = await locateCanvas(page);
        const midPoint = { x: Math.round(width / 2), y: Math.round(height / 2) };

        await hoverCanvas(page, midPoint);
        await expect(page.locator(xAxisLabel)).toBeVisible();
        await expect(page.locator(yAxisLabel)).toBeVisible();

        await page.mouse.wheel(0, -100);
        await expect(page.locator(xAxisLabel)).not.toBeVisible();
        await expect(page.locator(yAxisLabel)).not.toBeVisible();

        await expectChartScreenshot(page, page, 'zoom-crosshairs-after-wheel-zoom.png', { animations: 'disabled' });

        await hoverCanvas(page, midPoint);
        await expect(page.locator(xAxisLabel)).toBeVisible();
        await expect(page.locator(yAxisLabel)).toBeVisible();

        await dragCanvas(page, midPoint, { x: midPoint.x + 50, y: midPoint.y });
        await expect(page.locator(xAxisLabel)).not.toBeVisible();
        await expect(page.locator(yAxisLabel)).not.toBeVisible();
    });

    test('axis overlap hover and drag over a crossing axis', async ({ page }) => {
        const { url } = toExamplePageUrl('zoom-e2e', 'zoom-axis-overlap', 'vanilla');

        await gotoExample(page, url);
        await waitForAllChartUpdates(page);

        const { width, height } = await locateCanvas(page);
        const wrapper = page.locator('.ag-charts-wrapper');
        const tooltip = page.locator('.ag-charts-tooltip');
        const readCursor = () => wrapper.evaluate((el) => getComputedStyle(el).cursor);

        // `crossAt` places both axes inside the plot area, so their pixel positions depend on data and
        // zoom; locate the axis from its own proxy element rather than an offset that would go stale.
        const band = await page.evaluate(() => {
            const proxy = document.querySelector('.ag-charts-canvas-proxy');
            const regions = Array.from(proxy?.querySelectorAll('.ag-charts-proxy-axis') ?? []);
            const xAxis = regions.find((el) => el.clientWidth > el.clientHeight);
            if (proxy == null || xAxis == null) throw new Error('No x-axis proxy found');
            const axisBox = xAxis.getBoundingClientRect();
            const proxyBox = proxy.getBoundingClientRect();
            return { top: axisBox.top - proxyBox.top, bottom: axisBox.bottom - proxyBox.top };
        });
        const bandY = Math.round((band.top + band.bottom) / 2);

        // A hover that lands on nothing renders nothing, so the cursor read straight after a move can
        // still hold the previous sample's value. Read it until two samples agree.
        const settledCursorAt = async (point: { x: number; y: number }) => {
            await hoverCanvas(page, point);
            let previous = '';
            for (let attempt = 0; attempt < 10; attempt++) {
                await delay(30);
                const cursor = await readCursor();
                if (cursor === previous) return cursor;
                previous = cursor;
            }
            return previous;
        };

        // Only the axis labels are interactive within the band, so sweep across it for one. Take the
        // label's midpoint, which holds still even where its edge pixels are marginal.
        const labelHits: number[] = [];
        for (let x = Math.round(width * 0.4); x < width * 0.75; x += 4) {
            if ((await settledCursorAt({ x, y: bandY })) === 'ew-resize') {
                labelHits.push(x);
            } else if (labelHits.length > 0) {
                break;
            }
        }
        expect(labelHits.length).toBeGreaterThan(0);

        // An axis label takes the hover from the bar it overlaps, so no series highlight appears.
        const labelX = Math.round((labelHits[0] + labelHits[labelHits.length - 1]) / 2);
        const axisLabel = { x: labelX, y: bandY };
        await hoverCanvas(page, axisLabel);
        await waitForAllChartUpdates(page);
        await expect(wrapper).toHaveCSS('cursor', 'ew-resize');
        await expect(tooltip).toBeHidden();
        await expectChartScreenshot(page, page, 'zoom-axis-overlap-crossing-axis-hover.png', {
            animations: 'disabled',
        });

        // Dragging the label zooms the axis, as it would on an axis at the edge of the plot.
        await dragCanvas(page, axisLabel, { x: labelX - 150, y: bandY }, { stepDelay: 40 });
        await waitForAllChartUpdates(page);
        await expectChartScreenshot(page, page, 'zoom-axis-overlap-crossing-axis-drag-zooms.png', {
            animations: 'disabled',
        });

        // Away from the axis the series takes the hover, highlighting the bar under the pointer. Sweep
        // for a bar rather than assuming which ones the zoom above left visible.
        const seriesY = Math.round(height * 0.8);
        let seriesX = -1;
        for (let x = Math.round(width * 0.1); x < width * 0.9; x += 10) {
            await hoverCanvas(page, { x, y: seriesY });
            await waitForAllChartUpdates(page);
            if (await tooltip.isVisible()) {
                seriesX = x;
                break;
            }
        }
        expect(seriesX).toBeGreaterThan(0);

        const seriesPoint = { x: seriesX, y: seriesY };
        await hoverCanvas(page, seriesPoint);
        await waitForAllChartUpdates(page);
        await expect(wrapper).toHaveCSS('cursor', 'default');
        await expectChartScreenshot(page, page, 'zoom-axis-overlap-series-area-hover-highlight.png', {
            animations: 'disabled',
        });

        // Dragging there pans instead of zooming, which the zoom applied above leaves room for.
        await dragCanvas(page, seriesPoint, { x: seriesPoint.x + 150, y: seriesY }, { stepDelay: 40 });
        await waitForAllChartUpdates(page);
        await expectChartScreenshot(page, page, 'zoom-axis-overlap-series-area-drag-pans.png', {
            animations: 'disabled',
        });
    });

    test('axis drag keeps the resize cursor when released over the axis', async ({ page }) => {
        const { url } = toExamplePageUrl('zoom-e2e', 'zoom-crosshairs', 'vanilla');

        await gotoExample(page, url);

        const { width, height } = await locateCanvas(page);
        const toPage = await canvasToPageTransformer(page);
        const wrapper = page.locator('.ag-charts-wrapper');
        const readCursor = () => wrapper.evaluate((el) => getComputedStyle(el).cursor);

        // Locate the x-axis band by hovering upward from the bottom until the resize cursor appears,
        // rather than hard-coding an offset that depends on the axis label geometry.
        const centreX = Math.round(width / 2);
        let axisY = -1;
        for (let y = height - 6; y > height - 70; y -= 4) {
            const p = toPage(centreX, y);
            await page.mouse.move(p.x, p.y);
            await delay(60);
            if ((await readCursor()) === 'ew-resize') {
                axisY = y;
                break;
            }
        }
        expect(axisY).toBeGreaterThan(0);

        // Drag the x-axis and release the mouse while it is still over the axis.
        await dragCanvas(page, { x: Math.round(width * 0.7), y: axisY }, { x: Math.round(width * 0.4), y: axisY });
        await waitForAllChartUpdates(page);

        // The pointer never left the axis, so the ew-resize cursor must remain after release.
        await expect(wrapper).toHaveCSS('cursor', 'ew-resize');
    });

    test('AG-13166 zoom keynav focus-visible', async ({ page }) => {
        const { url } = toExamplePageUrl('financial-charts-configuration', 'default-configuration', 'vanilla');
        await gotoExample(page, url);
        await page.mouse.click(100, 100);

        await page.keyboard.type('+');
        await expectChartScreenshot(page, page, 'zoom-pluskey-no-focus-visible.png', { animations: 'disabled' });
        await page.keyboard.type('-');
        await expectChartScreenshot(page, page, 'zoom-minuskey-no-focus-visible.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowLeft');
        await page.keyboard.type('+');
        await expectChartScreenshot(page, page, 'zoom-pluskey-focus-visible.png', { animations: 'disabled' });
        await page.keyboard.type('-');
        await expectChartScreenshot(page, page, 'zoom-minuskey-focus-visible.png', { animations: 'disabled' });
    });

    test.describe('AG-18127 drag-start on series-area and drag-end on axis', () => {
        const popEvents = async (page: Page) => evalPageFunction(page, 'popEvents');
        const approx = (v: number) => expect.closeTo(v, 2);
        const INITIAL_ZOOM_STATE = {
            autoScaledAxes: ['y'],
            rangeX: { end: 2025, start: 1626 },
            rangeY: { end: 30, start: -30 },
            ratioX: { end: 1, start: 0 },
            ratioY: { end: 1, start: 0 },
        } as const;
        const NEW_ZOOM_STATE = {
            autoScaledAxes: ['y'],
            rangeX: { end: approx(1825.21), start: 1626 },
            rangeY: { end: approx(23.96), start: approx(-26.17) },
            ratioX: { end: approx(0.5), start: 0 },
            ratioY: { end: approx(0.9), start: approx(0.06) },
        } as const;

        test.beforeEach(async ({ page }) => {
            const { url } = toExamplePageUrl('zoom-e2e', 'zoom-selection', 'vanilla');
            await gotoExample(page, url);

            await page.mouse.move(414, 286); // center of series-area.
            await page.mouse.down({ button: 'left' });
            await page.mouse.move(50, 286); // center of x-axis
        });
        test('screenshot', async ({ page }) => {
            await expect(page).toHaveScreenshot('AG-18127-drag-move.png', { animations: 'disabled' });
        });
        test('getState', async ({ page }) => {
            expect(await getChartState(page)).toEqual(expect.objectContaining({ zoom: INITIAL_ZOOM_STATE }));
        });
        test('popEvents', async ({ page }) => {
            expect(await popEvents(page)).toEqual([]);
        });

        test.describe('mouseup', () => {
            test.beforeEach(async ({ page }) => {
                await page.mouse.up({ button: 'left' });
            });
            test('screenshot', async ({ page }) => {
                await expect(page).toHaveScreenshot('AG-18127-drag-end.png', { animations: 'disabled' });
            });
            test('getState', async ({ page }) => {
                expect(await getChartState(page)).toEqual(expect.objectContaining({ zoom: NEW_ZOOM_STATE }));
            });
            test('popEvents', async ({ page }) => {
                expect(await popEvents(page)).toEqual([
                    { source: 'user-interaction', type: 'zoom', ...NEW_ZOOM_STATE },
                ]);
            });
        });
    });

    test.describe('AG-19077 map-shape keyboard pan fits the focus box', () => {
        type Ratio = { start: number; end: number };
        type FocusCase = {
            name: string;
            code: string;
            gdp: number;
            itemId: number;
            arrowRightCount: number;
            zoom: { ratioX: Ratio; ratioY: Ratio };
        };

        const popEvents = async (page: Page) => evalPageFunction(page, 'popEvents');
        const approx = (v: number) => expect.closeTo(v, 2);
        const approxRatio = ({ start, end }: Ratio) => ({ start: approx(start), end: approx(end) });
        const pressArrowRight = async (page: Page) => page.keyboard.press('ArrowRight');

        async function expectFocusIndicatorInSeriesArea(page: Page) {
            const seriesArea = await page.locator(SELECTORS.seriesArea).evaluate((e) => e.getBoundingClientRect());
            // The pan targets the outline: `boundingBox()`, and Firefox's `getBoundingClientRect()`, include the stroke.
            const focusBox = await page
                .locator(`${SELECTORS.focusIndicator} .ag-charts-focus-svg-outer-path`)
                .evaluate((path: SVGGraphicsElement) => {
                    const { x, y, width, height } = path.getBBox();
                    const { a, d, e, f } = path.getScreenCTM()!;
                    return {
                        left: e + a * x,
                        top: f + d * y,
                        right: e + a * (x + width),
                        bottom: f + d * (y + height),
                    };
                });

            // 1px tolerance: the pan places the focus box flush against the series-area edge.
            expect(focusBox.left).toBeGreaterThanOrEqual(seriesArea.left - 1);
            expect(focusBox.top).toBeGreaterThanOrEqual(seriesArea.top - 1);
            expect(focusBox.right).toBeLessThanOrEqual(seriesArea.right + 1);
            expect(focusBox.bottom).toBeLessThanOrEqual(seriesArea.bottom + 1);
        }

        function describeFocusOn(letterbox: string, focus: FocusCase) {
            const { name, code, gdp, itemId, arrowRightCount, zoom } = focus;
            const activeItem = { type: 'series-node', seriesId: 'MapShapeSeries-1', itemId };
            const expectedZoom = { ratioX: approxRatio(zoom.ratioX), ratioY: approxRatio(zoom.ratioY) };

            test.describe(`Focus on ${name}`, () => {
                test.beforeEach(async ({ page }) => {
                    // Move focus to the item before the target, then discard those events so that only the final
                    // focus move (and the pan it triggers) is asserted.
                    if (arrowRightCount > 0) {
                        await page.keyboard.press('Tab');
                        await repeat(arrowRightCount - 1, async () => await pressArrowRight(page));
                        await popEvents(page);
                        await pressArrowRight(page);
                    } else {
                        await popEvents(page);
                        await page.keyboard.press('Tab');
                    }
                    await waitForAllChartUpdates(page);
                });
                test('screenshots', async ({ page }) => {
                    await expectChartScreenshot(page, page, `AG-19077-${letterbox}-letterbox-${name}.png`);
                });
                test('getState', async ({ page }) => {
                    expect(await getChartState(page)).toEqual(
                        expect.objectContaining({ zoom: expectedZoom, active: { frozen: false, activeItem } })
                    );
                });
                test('popEvents', async ({ page }) => {
                    const inactiveEvents =
                        arrowRightCount > 0
                            ? [
                                  {
                                      type: 'activeChange',
                                      source: 'user-interaction',
                                      frozen: false,
                                      activeItem: undefined,
                                      datum: undefined,
                                      defaultPrevented: false,
                                  },
                              ]
                            : [];
                    expect(await popEvents(page)).toEqual([
                        ...inactiveEvents,
                        {
                            type: 'activeChange',
                            source: 'user-interaction',
                            frozen: false,
                            activeItem,
                            datum: { name, code, gdp },
                            defaultPrevented: false,
                        },
                        { type: 'zoom', source: 'user-interaction', ...expectedZoom },
                    ]);
                });
                test('focus indicator fits', async ({ page }) => {
                    await expectFocusIndicatorInSeriesArea(page);
                });
            });
        }

        test.beforeEach(async ({ page }) => {
            const { url } = toExamplePageUrl('zoom-e2e', 'map-keyboard-pan', 'vanilla');
            await gotoExample(page, url);
        });

        // The US map is wider than the series area, so it is letterboxed vertically.
        test.describe('vertical letterbox', () => {
            describeFocusOn('vertical', {
                name: 'Alabama',
                code: 'AL',
                gdp: 302289,
                itemId: 0,
                arrowRightCount: 0,
                zoom: { ratioX: { start: 0.3894, end: 0.6894 }, ratioY: { start: 0.2374, end: 0.5374 } },
            });
            describeFocusOn('vertical', {
                name: 'Connecticut',
                code: 'CT',
                gdp: 343186,
                itemId: 5,
                arrowRightCount: 5,
                zoom: { ratioX: { start: 0.6161, end: 0.9161 }, ratioY: { start: 0.3336, end: 0.6336 } },
            });
            describeFocusOn('vertical', {
                name: 'Florida',
                code: 'FL',
                gdp: 1595347,
                itemId: 7,
                arrowRightCount: 7,
                zoom: { ratioX: { start: 0.6161, end: 0.9161 }, ratioY: { start: 0.0334, end: 0.3334 } },
            });
        });

        // A short viewport makes the series area wider than the map, so it is letterboxed horizontally.
        test.describe('horizontal letterbox', () => {
            test.use({ viewport: { width: 800, height: 300 } });

            describeFocusOn('horizontal', {
                name: 'Alabama',
                code: 'AL',
                gdp: 302289,
                itemId: 0,
                arrowRightCount: 0,
                zoom: { ratioX: { start: 0.2199, end: 0.5199 }, ratioY: { start: 0.204, end: 0.504 } },
            });
            describeFocusOn('horizontal', {
                name: 'Connecticut',
                code: 'CT',
                gdp: 343186,
                itemId: 5,
                arrowRightCount: 5,
                zoom: { ratioX: { start: 0.4466, end: 0.7466 }, ratioY: { start: 0.367, end: 0.667 } },
            });
            describeFocusOn('horizontal', {
                name: 'Montana',
                code: 'MT',
                gdp: 71088,
                itemId: 23,
                arrowRightCount: 23,
                zoom: { ratioX: { start: 0.3196, end: 0.6196 }, ratioY: { start: 0.6815, end: 0.9815 } },
            });
        });
    });

    test('keeps range cross lines visible while panned partly past either edge', async ({ page }) => {
        const { url } = toExamplePageUrl('zoom-e2e', 'zoom-range-cross-line', 'vanilla');
        await gotoExample(page, url);

        const { width, height } = await locateCanvas(page);
        await hoverCanvas(page, { x: Math.round(width / 2), y: Math.round(height / 2) });
        const panRight = page.getByTitle('Pan right');
        for (let click = 0; click < 3; click++) {
            await panRight.click();
            await waitForAllChartUpdates(page);
        }
        await expectChartScreenshot(page, page, 'zoom-range-cross-line-clipped.png', { animations: 'disabled' });
    });
});
