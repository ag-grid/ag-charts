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

/** Keeps the pixels that the visible chart canvas holds, in the page, so only a count crosses to the test. */
function keepPixels(page: Page, key: 'partial' | 'full') {
    return page.evaluate((slot) => {
        const canvas = document.querySelector<HTMLCanvasElement>('#myChart canvas')!;
        const { width, height } = canvas;
        const { data } = canvas.getContext('2d')!.getImageData(0, 0, width, height);
        ((window as any).agE2EPixels ??= {})[slot] = { width, height, data };
    }, key);
}

/** The size of the two kept frames, and the number of bytes in which they differ. */
function comparePixels(page: Page) {
    return page.evaluate(() => {
        const { partial, full } = (window as any).agE2EPixels;
        let differing = 0;
        for (let i = 0; i < full.data.length; i++) if (full.data[i] !== partial.data[i]) differing++;
        return { partial: [partial.width, partial.height], full: [full.width, full.height], differing };
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
                    await keepPixels(page, 'partial');

                    await page.evaluate(() => (window as any).agE2E.forceFullRedraw());
                    await waitForAllChartUpdates(page);
                    expect(await popPartialClear(page)).toBe(false);
                    await keepPixels(page, 'full');

                    const { partial, full, differing } = await comparePixels(page);
                    expect(full).toEqual(partial);
                    expect(differing).toBe(0);
                }
            });
        });
    }
});
