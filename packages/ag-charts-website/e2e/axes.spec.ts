import type { Locator, Page } from '@playwright/test';

import { evalPageFunction } from './agE2E';
import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    SELECTORS,
    gotoExample,
    hoverCanvas,
    locateCanvas,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    waitForAllChartUpdates,
    waitForChartUpdate,
} from './util';

// Each consolidated axes example renders a deterministic layout (grouped-category axes, bigint / ISO
// datetime domains, label rotation); the screenshot is the visual-regression baseline for that render path.
const AXES_EXAMPLES = [
    'bigint-iso-datetime',
    'grouped-category',
    'grouped-category-2',
    'grouped-category-3',
    'grouped-category-4',
    'grouped-category-5',
    'grouped-category-6',
    'grouped-category-7',
    'grouped-category-8',
    'axis-label-rotation',
];

async function gotoAxesExample(page: Page, example: string): Promise<Locator> {
    const { url } = toExamplePageUrl('axes-e2e', example, 'vanilla');
    await gotoExample(page, url);
    return page.locator(SELECTORS.canvasCenter);
}

// The rotation control is a native range input; drive it the way a user drag does — set the value and
// dispatch the `input` event the example listens for — rather than guessing drag coordinates.
async function setRangeInput(input: Locator, value: number): Promise<void> {
    await input.evaluate((el, v) => {
        const range = el as HTMLInputElement;
        range.value = String(v);
        range.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
}

test.describe('axes', () => {
    setupIntrinsicAssertions(test);

    // Default render baselines for every consolidated example.
    for (const example of AXES_EXAMPLES) {
        test(`renders ${example}`, async ({ page }) => {
            const canvas = await gotoAxesExample(page, example);
            await expectChartScreenshot(page, canvas, `${example}.png`);
        });
    }

    // The `data:` select swaps the x-axis domain between bigint and ISO-datetime data — the whole point of
    // the example. The default (bigint-small) is covered by the render baseline above.
    for (const dataMode of ['bigint-large', 'iso-datetime']) {
        test(`bigint-iso-datetime renders the ${dataMode} domain`, async ({ page }) => {
            const canvas = await gotoAxesExample(page, 'bigint-iso-datetime');
            await page.selectOption('select[onchange^="onDataModeChange"]', dataMode);
            await waitForAllChartUpdates(page);
            await expectChartScreenshot(page, canvas, `bigint-iso-datetime-data-${dataMode}.png`);
        });
    }

    // The rotation slider re-lays-out the category axis labels. The default (270°) is covered by the render
    // baseline; 0° gives horizontal labels — a clearly distinct layout.
    for (const example of ['grouped-category-2', 'grouped-category-8']) {
        test(`${example} rotates category labels to horizontal`, async ({ page }) => {
            const canvas = await gotoAxesExample(page, example);
            await setRangeInput(page.locator('#myRotation'), 0);
            await waitForAllChartUpdates(page);
            await expectChartScreenshot(page, canvas, `${example}-rotation-0.png`);
        });
    }

    // `crossAt` splits the axis furniture between the crossing point and the `position` edge, and the title,
    // the axis labels and the crosshair label each choose independently — so every combination of the three
    // is a distinct layout with its own baseline.
    test.describe('cross-at-placement', () => {
        const PLACEMENTS = ['crossing', 'edge'] as const;

        test.beforeEach(async ({ page }) => {
            await gotoAxesExample(page, 'cross-at-placement');
        });

        // Both axes cross at 0 and their crosshairs do not snap, so a pointer in the top-right quadrant
        // puts each crosshair label on the far side of its axis line from the `position` edge.
        async function hoverQuadrant(page: Page): Promise<void> {
            await waitForAllChartUpdates(page);
            const { bbox } = await locateCanvas(page);
            await hoverCanvas(page, { x: Math.round(bbox.width * 0.7), y: Math.round(bbox.height * 0.3) });
        }

        for (const titlePlacement of PLACEMENTS) {
            for (const labelPlacement of PLACEMENTS) {
                for (const crosshairLabelPlacement of PLACEMENTS) {
                    const name = `title-${titlePlacement}-labels-${labelPlacement}-crosshair-${crosshairLabelPlacement}`;

                    test(`places the title at the ${titlePlacement}, the labels at the ${labelPlacement} and the crosshair label at the ${crosshairLabelPlacement}`, async ({
                        page,
                    }) => {
                        await page.selectOption('select[onchange^="setTitlePlacement"]', titlePlacement);
                        await page.selectOption('select[onchange^="setLabelPlacement"]', labelPlacement);
                        await page.selectOption(
                            'select[onchange^="setCrosshairLabelPlacement"]',
                            crosshairLabelPlacement
                        );
                        await hoverQuadrant(page);

                        await expectChartScreenshot(
                            page,
                            page.locator(SELECTORS.canvasCenter),
                            `cross-at-placement-${name}.png`
                        );
                    });
                }
            }
        }

        // The `position` edge each label falls back to differs per axis position, so sweep the new option
        // against the opposite two edges. `titlePlacement` and `labelPlacement` are position-independent
        // and already covered above.
        for (const crosshairLabelPlacement of PLACEMENTS) {
            test(`places the crosshair label at the ${crosshairLabelPlacement} of top and right axes`, async ({
                page,
            }) => {
                await page.selectOption('select[onchange^="setAxisPositions"]', 'top-right');
                await page.selectOption('select[onchange^="setTitlePlacement"]', 'crossing');
                await page.selectOption('select[onchange^="setCrosshairLabelPlacement"]', crosshairLabelPlacement);
                await hoverQuadrant(page);

                await expectChartScreenshot(
                    page,
                    page.locator(SELECTORS.canvasCenter),
                    `cross-at-placement-top-right-crosshair-${crosshairLabelPlacement}.png`
                );
            });
        }
    });

    // The default (auto rotation, uniform labels, collision detection on) is the render baseline above;
    // "No rotation" is byte-identical to it here since these uniform labels already fit.
    test.describe('axis-label-rotation controls', () => {
        test('fixed rotation applies a constant angle', async ({ page }) => {
            const canvas = await gotoAxesExample(page, 'axis-label-rotation');
            await page.getByRole('button', { name: 'Fixed rotation' }).click();
            await waitForAllChartUpdates(page);
            await expectChartScreenshot(page, canvas, 'axis-label-rotation-fixed-rotation.png');
        });

        // Irregular (long, varied) labels need collision avoidance; with detection on the axis rotates them
        // to keep them readable — the contrast to the collision-off overlap below.
        test('irregular labels with collision detection rotate to avoid overlap', async ({ page }) => {
            const canvas = await gotoAxesExample(page, 'axis-label-rotation');
            await page.getByRole('button', { name: 'Irregular labels' }).click();
            await page.getByRole('button', { name: 'On (default)', exact: true }).click();
            await waitForAllChartUpdates(page);
            await expectChartScreenshot(page, canvas, 'axis-label-rotation-irregular-collision.png');
        });

        test('irregular labels without collision detection overlap', async ({ page }) => {
            const canvas = await gotoAxesExample(page, 'axis-label-rotation');
            await page.getByRole('button', { name: 'Irregular labels' }).click();
            await page.getByRole('button', { name: 'Off', exact: true }).click();
            await waitForAllChartUpdates(page);
            await expectChartScreenshot(page, canvas, 'axis-label-rotation-irregular-no-collision.png');
        });
    });

    test.describe('axis-focus-rotated-labels', () => {
        test('outlines the focused tick with a box rotated to match its label', async ({ page }) => {
            await gotoAxesExample(page, 'axis-focus-rotated-labels');
            const focusedTick = page.locator('.ag-charts-proxy-axis button:focus');
            for (let i = 0; i < 10 && (await focusedTick.count()) === 0; i++) {
                await page.keyboard.press('Tab');
            }
            await page.keyboard.press('ArrowRight');
            await page.keyboard.press('ArrowRight');

            await expect(focusedTick).toHaveText('March 2025');
            // The button's positioned wrapper carries the rotation; a CSS matrix's second term is sin(angle).
            const transform = await focusedTick.evaluate((el) => getComputedStyle(el.parentElement!).transform);
            const sin = Number(/^matrix\([^,]+, ([^,]+)/.exec(transform)![1]);
            expect(sin).toBeCloseTo(Math.sin((335 * Math.PI) / 180), 3);
            await expectChartScreenshot(page, page, 'axis-focus-rotated-labels.png', { animations: 'disabled' });
        });
    });

    test.describe('axis-title-bounds', () => {
        type BoundingBox = { x: number; y: number; width: number; height: number };
        const readBoundingBox = async (page: Page, text: string) => {
            // Get the '.ag-charts-proxy-axis' element with the title matching `text`:
            // FIXME: Should just call getByText(), but the SVG text orientation is incorrect on left/right axes.
            const bb: BoundingBox | null = await page.getByText(text).locator('..').locator('..').boundingBox();
            if (bb == null) return bb;
            return {
                x: Math.floor(bb.x),
                y: Math.floor(bb.y),
                width: Math.floor(bb.width),
                height: Math.floor(bb.height),
            };
        };

        type T = (page: Page) => Promise<BoundingBox | null>;
        const leftBounds: T = async (page) => await readBoundingBox(page, 'The Axis On The Left');
        const rightBounds: T = async (page) => await readBoundingBox(page, 'The Axis On The Right');
        const bottomBounds: T = async (page) => await readBoundingBox(page, 'The Axis On The Bottom');
        const expectedLeftBounds: BoundingBox = { x: 36, y: 183, width: 15, height: 122 };
        const expectedRightBounds: BoundingBox = { x: 748, y: 179, width: 15, height: 131 };
        const expectedBottomBounds: BoundingBox = { x: 330, y: 503, width: 142, height: 15 };

        test('community', async ({ page }) => {
            await gotoAxesExample(page, 'axis-title-bounds-community');
            expect(await leftBounds(page)).toEqual(expectedLeftBounds);
            expect(await rightBounds(page)).toEqual(expectedRightBounds);
            expect(await bottomBounds(page)).toEqual(expectedBottomBounds);
        });

        test('enterprise', async ({ page }) => {
            await gotoAxesExample(page, 'axis-title-bounds-enterprise');
            expect(await leftBounds(page)).toEqual(expectedLeftBounds);
            expect(await rightBounds(page)).toEqual(expectedRightBounds);
            expect(await bottomBounds(page)).toEqual(expectedBottomBounds);
        });
    });

    test.describe('axis-tick-focus-removal', () => {
        const focused = (page: Page) => page.locator(':focus');

        const activeText = (page: Page) => page.evaluate(() => document.activeElement?.textContent);

        async function focusXTick(page: Page, label: string) {
            await gotoAxesExample(page, 'axis-tick-focus-removal');
            for (let i = 0; i < 20 && (await activeText(page)) !== 'Jan'; i++) {
                await page.keyboard.press('Tab');
            }
            for (let i = 0; i < 6 && (await activeText(page)) !== label; i++) {
                await page.keyboard.press('ArrowRight');
            }
            await expect(focused(page)).toHaveText(label);
        }

        async function update(page: Page, fnName: string) {
            await evalPageFunction(page, fnName);
            await waitForChartUpdate(page.locator(SELECTORS.wrapper));
        }

        test('removing the focused last tick moves focus to the previous tick', async ({ page }) => {
            await focusXTick(page, 'Jun');
            await update(page, 'removeLastMonth');
            await expect(page.locator(':focus-visible')).toHaveText('May');
        });

        test('removing every tick moves focus to the series area', async ({ page }) => {
            await focusXTick(page, 'Jun');
            await update(page, 'removeData');
            await expect(focused(page)).toHaveClass(/ag-charts-swapchain/);
        });

        test('removing the click listener moves focus to the series area', async ({ page }) => {
            await focusXTick(page, 'Mar');
            await update(page, 'removeXListener');
            await expect(focused(page)).toHaveClass(/ag-charts-swapchain/);
        });
    });
});
