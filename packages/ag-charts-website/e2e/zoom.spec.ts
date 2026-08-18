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

    test('axis overlap hover keeps highlighting active', async ({ page }) => {
        const { url } = toExamplePageUrl('zoom-e2e', 'zoom-axis-overlap', 'vanilla');

        await gotoExample(page, url);

        const { height } = await locateCanvas(page);

        // `crossAt` places the y-axis inside the plot area, so its position depends on how much axis
        // width the layout reclaims. Anchor the probes to the axis' own region rather than to the
        // canvas centre, which stops straddling the axis as soon as that width changes.
        const yAxisBandRight = await page.evaluate(() => {
            const proxy = document.querySelector('.ag-charts-canvas-proxy');
            const regions = Array.from(proxy?.querySelectorAll('[role="region"]') ?? []);
            const yAxis = regions.find((el) => el.clientHeight > el.clientWidth);
            if (proxy == null || yAxis == null) throw new Error('No y-axis region found');
            return yAxis.getBoundingClientRect().right - proxy.getBoundingClientRect().left;
        });

        const probeY = Math.round(height / 2) + 45;
        const axisCentre = { x: Math.round(yAxisBandRight) - 20, y: probeY };
        await hoverCanvas(page, axisCentre);
        await waitForAllChartUpdates(page);
        await expectChartScreenshot(page, page, 'zoom-axis-overlap-axis-hover-highlight.png', {
            animations: 'disabled',
        });

        await dragCanvas(page, axisCentre, { x: 10, y: axisCentre.y });
        await expectChartScreenshot(page, page, 'zoom-axis-overlap-axis-does-not-drag-with-highlight.png', {
            animations: 'disabled',
        });

        const axisHoverNoHighlight = { x: axisCentre.x - 35, y: probeY };
        await hoverCanvas(page, axisHoverNoHighlight);
        await waitForAllChartUpdates(page);
        await expectChartScreenshot(page, page, 'zoom-axis-overlap-axis-hover-no-highlight.png', {
            animations: 'disabled',
        });

        await hoverCanvas(page, axisHoverNoHighlight);
        await dragCanvas(page, axisHoverNoHighlight, {
            x: axisHoverNoHighlight.x - 50,
            y: axisHoverNoHighlight.y + 10,
        });
        await waitForAllChartUpdates(page);
        await expectChartScreenshot(page, page, 'zoom-axis-overlap-axis-does-drag-without-highlight.png', {
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
