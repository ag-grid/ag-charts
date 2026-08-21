import type { ConsoleMessage, Locator, Page } from '@playwright/test';

import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

type LocatorBoundingBox = NonNullable<Awaited<ReturnType<Locator['boundingBox']>>>;

async function getSceneRenders(page: Page): Promise<string> {
    await expect(page.locator(SELECTORS.wrapper)).toHaveAttribute('data-scene-renders');
    const sceneRenders: string | null = await page.locator(SELECTORS.wrapper).getAttribute('data-scene-renders');

    expect(sceneRenders).not.toBeNull();
    return sceneRenders!;
}

async function getBoundingBoxByText(page: Page, text: string): Promise<LocatorBoundingBox> {
    const bbox: LocatorBoundingBox | null = await page.getByText(text).boundingBox();
    expect(bbox).not.toBeNull();
    return bbox!;
}

test.describe('interactive-tooltip', () => {
    setupIntrinsicAssertions(test);

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('tooltips', 'tooltip-interaction', 'vanilla').url);
        await expectChartScreenshot(page, page, 'interactive-tooltip-hidden.png');
    });

    test('hover 1 step', async ({ page }) => {
        await page.mouse.move(400, 150);
        await expectChartScreenshot(page, page, 'interactive-tooltip-visible.png');
        const expectedRenders: string = await getSceneRenders(page);

        const bbox = await getBoundingBoxByText(page, 'Click here');
        await page.mouse.move(bbox.x, bbox.y);
        await expectChartScreenshot(page, page, 'interactive-tooltip-visible.png');
        const actualRenders: string = await getSceneRenders(page);
        expect(actualRenders).toBe(expectedRenders);

        await page.mouse.move(400, 400);
        await expectChartScreenshot(page, page, 'interactive-tooltip-moved-down.png');

        await page.mouse.move(20, 20);
        await expectChartScreenshot(page, page, 'interactive-tooltip-hidden.png');
    });

    test('hover 4 steps', async ({ page }) => {
        await page.mouse.move(400, 150);
        await expectChartScreenshot(page, page, 'interactive-tooltip-visible.png');
        const expectedRenders: string = await getSceneRenders(page);

        const bbox = await getBoundingBoxByText(page, 'Click here');
        await page.mouse.move(bbox.x, bbox.y, { steps: 4 });
        await expectChartScreenshot(page, page, 'interactive-tooltip-visible.png');
        const actualRenders: string = await getSceneRenders(page);
        expect(actualRenders).toBe(expectedRenders);

        await page.mouse.move(400, 400);
        await expectChartScreenshot(page, page, 'interactive-tooltip-moved-down.png');

        await page.mouse.move(20, 20);
        await expectChartScreenshot(page, page, 'interactive-tooltip-hidden.png');
    });

    test('tap', async ({ page }) => {
        // Playwright's touch support is limited, so only tooltip show/hide from taps is covered.
        await page.touchscreen.tap(400, 150);
        await expectChartScreenshot(page, page, 'interactive-tooltip-visible.png');

        await page.touchscreen.tap(20, 20);
        await expectChartScreenshot(page, page, 'interactive-tooltip-hidden.png');
    });

    test.describe('AG-14347', () => {
        const consoleMessages: ConsoleMessage[] = [];
        test.beforeEach(({ page }) => {
            consoleMessages.length = 0;
            page.on('console', (msg) => consoleMessages.push(msg));
        });
        function joinConsoleMessages(): string {
            return consoleMessages.map((msg) => `${msg.type()}: ${msg.text()}\n`).join('');
        }

        test.describe('click link', () => {
            test('out of focus', async () => {
                // skip straight to afterEach
            });
            test('in focus', async ({ page }) => {
                await page.mouse.click(20, 20);
            });
            test.afterEach(async ({ page }) => {
                await page.mouse.move(400, 150);
                await expectChartScreenshot(page, page, 'interactive-tooltip-visible.png');
                const expectedRenders: string = await getSceneRenders(page);

                // Click the centre of the link, not its top-left corner: text bbox edges are sub-pixel and
                // engine-specific, and on Firefox the corner lands just outside the anchor.
                const bbox = await getBoundingBoxByText(page, 'Click here');
                await page.mouse.click(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
                await expectChartScreenshot(page, page, 'interactive-tooltip-visible.png');
                const actualRenders: string = await getSceneRenders(page);
                expect(actualRenders).toBe(expectedRenders);

                expect(joinConsoleMessages()).toEqual(`log: Clicked within a tooltip\n`);
            });
        });

        test.describe('click text', () => {
            test('out of focus', async () => {
                // skip straight to afterEach
            });
            test('in focus', async ({ page }) => {
                await page.mouse.click(20, 20);
            });
            test.afterEach(async ({ page }) => {
                await page.mouse.move(400, 150);
                await expectChartScreenshot(page, page, 'interactive-tooltip-visible.png');
                const expectedRenders: string = await getSceneRenders(page);

                const bbox = await getBoundingBoxByText(page, ' Jul: 70 ');
                await page.mouse.click(bbox.x, bbox.y);
                await expectChartScreenshot(page, page, 'interactive-tooltip-visible.png');
                const actualRenders: string = await getSceneRenders(page);
                expect(actualRenders).toBe(expectedRenders);

                expect(joinConsoleMessages()).toEqual('');
            });
        });
    });
});
