import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    canvasToPageTransformer,
    delay,
    dragCanvas,
    gotoExample,
    hoverCanvas,
    locateCanvas,
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

        // 1. Click the zoom-in button the floating zoom buttons
        await hoverCanvas(page, { x: 100, y: height - 100 });
        const zoomIn = page.getByTitle('Zoom in');
        await zoomIn.click();
        await zoomIn.click();
        await zoomIn.click();
        await zoomIn.click();
        await zoomIn.click();
        await zoomIn.click();
        await expectChartScreenshot(page, page, 'zoom-1-before-navigator-zoom-in.png', { animations: 'disabled' });

        // 2. Drag the y-axis with the navigator hidden to zoom in
        await dragCanvas(page, withoutNavigatorYAxisBottom, withoutNavigatorYAxisTop);
        await expectChartScreenshot(page, page, 'zoom-2-before-navigator-drag-y-axis.png', { animations: 'disabled' });

        // Show navigator with minichart
        await page.locator('.example-controls button').getByText('Toggle Navigator').click();

        // 3. Drag the y-axis with the navigator visible to zoom in
        await dragCanvas(page, withNavigatorYAxisBottom, withNavigatorYAxisTop);
        await expectChartScreenshot(page, page, 'zoom-3-with-navigator-drag-y-axis.png', { animations: 'disabled' });

        // 4. Drag the x-axis with the navigator visible to zoom in
        await dragCanvas(page, withNavigatorXAxisLeft, withNavigatorXAxisRight);
        await expectChartScreenshot(page, page, 'zoom-4-with-navigator-drag-x-axis.png', { animations: 'disabled' });

        // Hide navigator
        await page.locator('.example-controls button').getByText('Toggle Navigator').click();

        // 5. Drag the y-axis twice with the navigator hidden again to zoom out
        await dragCanvas(page, withoutNavigatorYAxisTop, withoutNavigatorYAxisBottom);
        await dragCanvas(page, withoutNavigatorYAxisTop, withoutNavigatorYAxisBottom);
        await expectChartScreenshot(page, page, 'zoom-5-after-navigator-drag-y-axis.png', { animations: 'disabled' });

        // 6. Drag the x-axis twice with the navigator hidden again to zoom out
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

        // Expect crosshairs to be visible on first hover.
        await hoverCanvas(page, midPoint);
        await expect(page.locator(xAxisLabel)).toBeVisible();
        await expect(page.locator(yAxisLabel)).toBeVisible();

        // Mousewheel to zoom should remove crosshairs.
        await page.mouse.wheel(0, -100);
        await expect(page.locator(xAxisLabel)).not.toBeVisible();
        await expect(page.locator(yAxisLabel)).not.toBeVisible();

        await expectChartScreenshot(page, page, 'zoom-crosshairs-after-wheel-zoom.png', { animations: 'disabled' });

        // Expect crosshairs to become visible on second hover.
        await hoverCanvas(page, midPoint);
        await expect(page.locator(xAxisLabel)).toBeVisible();
        await expect(page.locator(yAxisLabel)).toBeVisible();

        // Drag canvas (pan zoom)
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

        // `crossAt` places both axes inside the plot area, so their pixel positions depend on the data,
        // the zoom and how much axis width the layout reclaims. Locate the axis from its own proxy
        // region and its labels by their resize cursor, rather than from offsets that go stale.
        const band = await page.evaluate(() => {
            const proxy = document.querySelector('.ag-charts-canvas-proxy');
            const regions = Array.from(proxy?.querySelectorAll('[role="region"]') ?? []);
            const xAxis = regions.find((el) => el.clientWidth > el.clientHeight);
            if (proxy == null || xAxis == null) throw new Error('No x-axis region found');
            const axisBox = xAxis.getBoundingClientRect();
            const proxyBox = proxy.getBoundingClientRect();
            return { top: axisBox.top - proxyBox.top, bottom: axisBox.bottom - proxyBox.top };
        });
        const bandY = Math.round((band.top + band.bottom) / 2);

        // Only the axis labels are interactive within the band, so sweep across it for one of them.
        let labelX = -1;
        for (let x = Math.round(width * 0.4); x < width * 0.75; x += 6) {
            await hoverCanvas(page, { x, y: bandY });
            await delay(60);
            if ((await readCursor()) === 'ew-resize') {
                labelX = x;
                break;
            }
        }
        expect(labelX).toBeGreaterThan(0);

        // An axis label takes the hover from the bar it overlaps, so no series highlight appears.
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
            await delay(60);
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
});
