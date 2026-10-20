import type { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForAllChartUpdates } from './util';

declare global {
    interface Window {
        agE2ELayerClears: { width: number; height: number; canvasWidth: number; canvasHeight: number }[];
    }
}

/** Records every clearRect that a layer's offscreen context performs, from now on. */
async function recordLayerClears(page: Page) {
    await page.evaluate(() => {
        window.agE2ELayerClears = [];
        const proto = OffscreenCanvasRenderingContext2D.prototype;
        const clearRect: typeof proto.clearRect = Reflect.get(proto, 'clearRect');
        proto.clearRect = function (this: OffscreenCanvasRenderingContext2D, x, y, width, height) {
            window.agE2ELayerClears.push({
                width,
                height,
                canvasWidth: this.canvas.width,
                canvasHeight: this.canvas.height,
            });
            return clearRect.call(this, x, y, width, height);
        };
    });
}

/** True if some layer was cleared over a small part of its bitmap since the last call, as a partial repaint does. */
async function popPartialClear(page: Page) {
    return await page.evaluate(() => {
        const clears = window.agE2ELayerClears.splice(0);
        return clears.some(
            ({ width, height, canvasWidth, canvasHeight }) =>
                width * height < 0.5 * canvasWidth * canvasHeight && canvasWidth > 1 && canvasHeight > 1
        );
    });
}

/** The pixels that the visible chart canvas holds. */
function readPixels(page: Page) {
    return page.evaluate(() => {
        const canvas = document.querySelector<HTMLCanvasElement>('#myChart canvas')!;
        const { width, height } = canvas;
        const { data } = canvas.getContext('2d')!.getImageData(0, 0, width, height);
        return { width, height, data: Array.from(data) };
    });
}

test.describe('heatmap partial repaint', () => {
    setupIntrinsicAssertions(test);
    test.skip(({ browserName }) => browserName !== 'chromium', 'Chrome rasterises the layers on the GPU path');

    const { url } = toExamplePageUrl('heatmap-e2e', 'heatmap-partial-repaint', 'vanilla');

    for (const deviceScaleFactor of [1, 1.5]) {
        test.describe(`at a device pixel ratio of ${deviceScaleFactor}`, () => {
            test.use({ deviceScaleFactor });

            test('a transaction paints the same pixels as a forced full redraw', async ({ page }) => {
                await gotoExample(page, url);
                await recordLayerClears(page);

                for (const [column, level] of [
                    [3, 90],
                    [17, 10],
                    [3, 40],
                ]) {
                    await page.evaluate(([c, l]) => (window as any).agE2E.updateColumn(c, l), [column, level]);
                    await waitForAllChartUpdates(page);
                    // The frame must have been a partial one, or the comparison below proves nothing.
                    expect(await popPartialClear(page)).toBe(true);
                    const partial = await readPixels(page);

                    await page.evaluate(() => (window as any).agE2E.forceFullRedraw());
                    await waitForAllChartUpdates(page);
                    expect(await popPartialClear(page)).toBe(false);
                    const full = await readPixels(page);

                    expect(full.width).toBe(partial.width);
                    expect(full.height).toBe(partial.height);
                    const differing = full.data.reduce((n, byte, i) => n + (byte === partial.data[i] ? 0 : 1), 0);
                    expect(differing).toBe(0);
                }
            });
        });
    }
});
