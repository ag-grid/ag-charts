import type { Locator, Page } from '@playwright/test';

import { test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    SELECTORS,
    gotoExample,
    hoverCanvas,
    locateCanvas,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    waitForAllChartUpdates,
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
});
