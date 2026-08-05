import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixture';
import {
    SELECTORS,
    canvasToPageTransformer,
    delay,
    gotoExample,
    locateCanvas,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    waitForAllChartUpdates,
} from './util';

const LOCKED = /ag-charts-wrapper--cursor-locked/;

type Point = { x: number; y: number };

/** Intermediate mouse moves per drag — enough for the drag interpreter to see real movement. */
const STEPS = 4;

function readCursor(locator: Locator) {
    return locator.evaluate((el) => getComputedStyle(el).cursor);
}

/**
 * Locate a band which restyles the wrapper cursor to `ew-resize` on hover, by scanning upward from
 * the bottom of the canvas rather than hard-coding an offset that depends on the axis geometry.
 * Returns a canvas-relative y, or -1 when no such band was found.
 */
async function findResizeBandY(page: Page, wrapper: Locator, width: number, height: number) {
    const toPage = await canvasToPageTransformer(page);
    // Offset from the horizontal centre so the scan misses a vertical (y) axis drawn through it.
    const scanX = Math.round(width * 0.7);
    for (let y = height - 6; y > 6; y -= 4) {
        const p = toPage(scanX, y);
        await page.mouse.move(Math.round(p.x), Math.round(p.y));
        await delay(60);
        if ((await readCursor(wrapper)) === 'ew-resize') {
            return y;
        }
    }
    return -1;
}

/**
 * Press on the canvas, drag towards `end`, run `assertions` **while the button is still held**, then
 * release. The release is in a `finally` so a failed assertion never leaves a stuck mouse button
 * behind for the next test.
 *
 * The travel must stay well above `DRAG_THRESHOLD_PX` (3px, `dragInterpreter.ts`) or the gesture is
 * interpreted as a click and no cursor lock is taken — do not shrink the distance or the step count.
 */
async function withCanvasDragHeld(page: Page, start: Point, end: Point, assertions: () => Promise<void>, steps = 4) {
    await waitForAllChartUpdates(page);
    const toPage = await canvasToPageTransformer(page);
    const from = toPage(start.x, start.y);

    await page.mouse.move(Math.round(from.x), Math.round(from.y));
    await page.mouse.down();
    try {
        for (let step = 1; step <= STEPS; step++) {
            const x = start.x + ((end.x - start.x) * step) / STEPS;
            const y = start.y + ((end.y - start.y) * step) / STEPS;
            const p = toPage(x, y);
            await page.mouse.move(Math.round(p.x), Math.round(p.y));
        }
        await assertions();
    } finally {
        await page.mouse.up();
    }
}

/** As `withCanvasDragHeld`, but the press starts from the centre of `locator`'s bounding box. */
async function withElementDragHeld(page: Page, locator: Locator, delta: Point, assertions: () => Promise<void>) {
    await waitForAllChartUpdates(page);
    const box = await locator.boundingBox();
    expect(box, 'drag target must have a bounding box').not.toBeNull();
    expect(box!.width, 'drag target width').toBeGreaterThan(0);
    expect(box!.height, 'drag target height').toBeGreaterThan(0);

    const centre = { x: Math.round(box!.x + box!.width / 2), y: Math.round(box!.y + box!.height / 2) };

    await page.mouse.move(centre.x, centre.y);
    await page.mouse.down();
    try {
        for (let step = 1; step <= STEPS; step++) {
            await page.mouse.move(
                Math.round(centre.x + (delta.x * step) / STEPS),
                Math.round(centre.y + (delta.y * step) / STEPS)
            );
        }
        await assertions();
    } finally {
        await page.mouse.up();
    }
}

test.describe('cursor lock during drag', () => {
    setupIntrinsicAssertions(test);

    test.describe('zoom-crosshairs', () => {
        test.beforeEach(async ({ page }) => {
            const { url } = toExamplePageUrl('zoom-e2e', 'zoom-crosshairs', 'vanilla');
            await gotoExample(page, url);
        });

        test('axis drag locks the wrapper cursor to the resize cursor', async ({ page }) => {
            const { wrapper, width, height } = await locateCanvas(page);

            await expect(wrapper).not.toHaveClass(LOCKED);

            const axisY = await findResizeBandY(page, wrapper, width, height);
            expect(axisY, 'x-axis band with an ew-resize hover cursor').toBeGreaterThan(0);

            await withCanvasDragHeld(
                page,
                { x: Math.round(width * 0.7), y: axisY },
                { x: Math.round(width * 0.4), y: axisY },
                async () => {
                    await expect(wrapper).toHaveClass(LOCKED);
                    await expect(wrapper).toHaveCSS('cursor', 'ew-resize');
                }
            );

            await expect(wrapper).not.toHaveClass(LOCKED);
        });
    });

    test.describe('zoom-navigator', () => {
        test.beforeEach(async ({ page }) => {
            const { url } = toExamplePageUrl('financial-charts-e2e', 'zoom-navigator', 'vanilla');
            await gotoExample(page, url);
        });

        async function zoomIn(page: Page, height: number) {
            await page.hover(SELECTORS.canvasProxy, { position: { x: 100, y: height - 100 } });
            const zoomInButton = page.getByTitle('Zoom in');
            for (let i = 0; i < 6; i++) {
                await zoomInButton.click();
            }
            await waitForAllChartUpdates(page);
        }

        test('series-area pan locks the wrapper cursor to grabbing', async ({ page }) => {
            const { wrapper, width, height } = await locateCanvas(page);

            await zoomIn(page, height);
            await expect(wrapper).not.toHaveClass(LOCKED);

            await withCanvasDragHeld(
                page,
                { x: Math.round(width * 0.35), y: Math.round(height * 0.4) },
                { x: Math.round(width * 0.65), y: Math.round(height * 0.4) },
                async () => {
                    await expect(wrapper).toHaveClass(LOCKED);
                    await expect(wrapper).toHaveCSS('cursor', 'grabbing');
                }
            );

            // `expect` polls, so there is no need to wait for the pan's zoom updates to settle
            // first — and waiting for them is a flake source while the chart is still animating.
            await expect(wrapper).not.toHaveClass(LOCKED);
        });

        test('navigator proxy element defers to the pinned cursor', async ({ page }) => {
            const { wrapper, width, height } = await locateCanvas(page);

            // The fixture ships `navigator: false`, so the navigator proxy elements only exist once
            // the example's own control has been clicked.
            await page.locator('.example-controls button').getByText('Toggle Navigator').click();
            await waitForAllChartUpdates(page);

            // Resolve the pan slider by its inline cursor rather than by index — the `domIndex`
            // ordering in navigatorDOMProxy.ts is an implementation detail.
            const proxyElements = page.locator('.ag-charts-proxy-navigator-toolbar .ag-charts-proxy-elem');
            const proxyCount = await proxyElements.count();
            expect(proxyCount, 'navigator toolbar proxy elements').toBeGreaterThan(0);

            let panIndex = -1;
            for (let i = 0; i < proxyCount; i++) {
                const inlineCursor = await proxyElements.nth(i).evaluate((el) => (el as HTMLElement).style.cursor);
                if (inlineCursor === 'grab') {
                    expect(panIndex, 'exactly one navigator proxy element has an inline grab cursor').toBe(-1);
                    panIndex = i;
                }
            }
            expect(panIndex, 'navigator pan slider (inline cursor: grab)').toBeGreaterThanOrEqual(0);
            const panSlider = proxyElements.nth(panIndex);

            // Control assertion: while nothing is locked the slider shows its own cursor. Without
            // this the locked assertion below would prove nothing.
            await expect(panSlider).toHaveCSS('cursor', 'grab');

            await zoomIn(page, height);
            await waitForAllChartUpdates(page);

            const box = await panSlider.boundingBox();
            expect(box, 'navigator pan slider bounding box').not.toBeNull();
            expect(box!.width, 'navigator pan slider width').toBeGreaterThan(0);
            expect(box!.height, 'navigator pan slider height').toBeGreaterThan(0);
            const sliderCentre = { x: Math.round(box!.x + box!.width / 2), y: Math.round(box!.y + box!.height / 2) };

            // AC 2's "confirm the proxy element sits under the drag path" as a machine assertion: a
            // layout change that moves the slider out of the pointer's path fails the test rather
            // than silently degrading it.
            const sliderIsUnderPoint = await panSlider.evaluate(
                (el, { x, y }) => document.elementFromPoint(x, y)?.closest('.ag-charts-proxy-elem') === el,
                sliderCentre
            );
            expect(sliderIsUnderPoint, 'the pan slider sits under the pass-over point').toBe(true);

            await withCanvasDragHeld(
                page,
                { x: Math.round(width * 0.35), y: Math.round(height * 0.4) },
                { x: Math.round(width * 0.65), y: Math.round(height * 0.4) },
                async () => {
                    await expect(wrapper).toHaveClass(LOCKED);

                    // Still held: cross over the navigator pan slider. `container.css`'s
                    // `.ag-charts-wrapper--cursor-locked .ag-charts-proxy-elem { cursor: inherit
                    // !important }` must beat the slider's own inline `grab`.
                    await page.mouse.move(sliderCentre.x, sliderCentre.y);
                    await expect(panSlider).toHaveCSS('cursor', 'grabbing');
                }
            );

            await expect(wrapper).not.toHaveClass(LOCKED);
            await expect(panSlider).toHaveCSS('cursor', 'grab');
        });
    });

    test.describe('scrollbar-cross-at', () => {
        test.beforeEach(async ({ page }) => {
            const { url } = toExamplePageUrl('scrollbar-test', 'scrollbar-cross-at', 'vanilla');
            await gotoExample(page, url);
        });

        test('scrollbar drag keeps the default cursor across a region that restyles it', async ({ page }) => {
            const { wrapper, width, height } = await locateCanvas(page);
            const toPage = await canvasToPageTransformer(page);

            // Control: this fixture enables axis dragging, so the axis band genuinely restyles the
            // wrapper cursor on hover. That is what the scrollbar's lock has to defeat.
            const axisY = await findResizeBandY(page, wrapper, width, height);
            expect(axisY, 'axis band with an ew-resize hover cursor').toBeGreaterThan(0);
            const axisPoint = toPage(Math.round(width * 0.7), axisY);

            const slider = page.locator('.ag-charts-proxy-scrollbar-horizontal .ag-charts-proxy-scrollbar-slider');
            await expect(wrapper).not.toHaveClass(LOCKED);

            await withElementDragHeld(page, slider, { x: 40, y: 0 }, async () => {
                await expect(wrapper).toHaveClass(LOCKED);
                await expect(wrapper).toHaveCSS('cursor', 'default');

                // Still held, cross onto the axis band. Without the lock this becomes `ew-resize`,
                // so this — unlike the `default` value on its own — is genuinely falsifiable.
                await page.mouse.move(Math.round(axisPoint.x), Math.round(axisPoint.y));
                await expect(wrapper).toHaveCSS('cursor', 'default');
                await expect(wrapper).toHaveClass(LOCKED);
            });

            await expect(wrapper).not.toHaveClass(LOCKED);
        });
    });

    test.describe('scrollbar-visibility', () => {
        test.beforeEach(async ({ page }) => {
            const { url } = toExamplePageUrl('scrollbar', 'scrollbar-visibility', 'vanilla');
            await gotoExample(page, url);
        });

        test('scrollbar drag marks the wrapper cursor-locked for the drag duration', async ({ page }) => {
            const { wrapper } = await locateCanvas(page);
            const slider = page.locator('.ag-charts-proxy-scrollbar-horizontal .ag-charts-proxy-scrollbar-slider');

            await expect(wrapper).not.toHaveClass(LOCKED);

            await withElementDragHeld(page, slider, { x: 40, y: 0 }, async () => {
                await expect(wrapper).toHaveClass(LOCKED);
                // The `default` value is corroborative only: the wrapper's idle cursor is already
                // `default`, so this assertion passes with the lock removed. The class assertion
                // above (and the cross-region case on scrollbar-cross-at) are the actual pins.
                await expect(wrapper).toHaveCSS('cursor', 'default');
            });

            await expect(wrapper).not.toHaveClass(LOCKED);
        });
    });
});
