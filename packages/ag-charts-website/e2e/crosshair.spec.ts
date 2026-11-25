import { test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl, toExamplePageUrls } from './util';

test.describe('crosshair', () => {
    setupIntrinsicAssertions(test);
    test.describe.configure({ retries: 3 });
    const x = 666;
    const y = 400;

    for (const { framework, url } of toExamplePageUrls('axes-crosshairs', 'enabling-crosshairs')) {
        test.describe(`for ${framework}`, () => {
            test('keynav with snapping', async ({ page }) => {
                await gotoExample(page, url);

                await page.mouse.click(x, y, { button: 'left' });
                await expectChartScreenshot(page, page, 'snap-enabled-mouse.png');

                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await expectChartScreenshot(page, page, 'snap-enabled-keyboard.png');
            });
        });
    }

    for (const { framework, url } of toExamplePageUrls('axes-crosshairs', 'crosshair-snap')) {
        test.describe(`for ${framework}`, () => {
            test('keynav without snapping', async ({ page }) => {
                await gotoExample(page, url);

                await page.mouse.click(x, y, { button: 'left' });
                await expectChartScreenshot(page, page, 'snap-disabled-mouse.png');

                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await expectChartScreenshot(page, page, 'snap-disabled-keyboard.png');
            });
        });
    }

    test('click', async ({ page }) => {
        const { url } = toExamplePageUrl('financial-charts-configuration', 'default-configuration', 'vanilla');
        await gotoExample(page, url);

        await page.mouse.move(400, 300);
        await expectChartScreenshot(page, page, 'crosshair-visible.png');

        await page.mouse.click(400, 300, { button: 'left' });
        await expectChartScreenshot(page, page, 'crosshair-visible.png');
    });
});

test.describe('band highlight', () => {
    // The default band fill is within the global 0.05 threshold of a white background.
    const bandOptions = { threshold: 0.02 };

    test('hover over axisButton does not unhighlight the band', async ({ page }) => {
        const { url } = toExamplePageUrl('axes-crosshairs-e2e', 'band-highlight-with-annotations', 'vanilla');
        await gotoExample(page, url);

        await page.mouse.move(159, 247);
        await expectChartScreenshot(page, page, 'band-jan-highlighted.png');

        await page.mouse.move(141, 247);
        await expectChartScreenshot(page, page, 'band-axisButton-hovered.png');

        await page.mouse.click(141, 247);
        await expectChartScreenshot(page, page, 'band-axisButton-clicked.png');
    });

    for (const { framework, url } of toExamplePageUrls('axes-crosshairs', 'band-highlight')) {
        test.describe(`for ${framework}`, () => {
            test('keynav highlights the band of the focused datum', async ({ page }) => {
                await gotoExample(page, url);

                await page.mouse.click(666, 400, { button: 'left' });
                await expectChartScreenshot(page, page, 'band-keynav-mouse.png', bandOptions);

                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await expectChartScreenshot(page, page, 'band-keynav-right.png', bandOptions);

                await page.keyboard.press('ArrowLeft');
                await expectChartScreenshot(page, page, 'band-keynav-left.png', bandOptions);
            });
        });
    }

    test('keynav highlights the bands on both category axes', async ({ page }) => {
        const { url } = toExamplePageUrl('axes-crosshairs-e2e', 'band-highlight-both-axes', 'vanilla');
        await gotoExample(page, url);

        await page.mouse.click(400, 300, { button: 'left' });
        await expectChartScreenshot(page, page, 'band-both-axes-mouse.png', bandOptions);

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await expectChartScreenshot(page, page, 'band-both-axes-right.png', bandOptions);

        await page.keyboard.press('ArrowLeft');
        await expectChartScreenshot(page, page, 'band-both-axes-left.png', bandOptions);
    });

    test('tabbing in and out shows then clears the bands of the focused datum', async ({ page }) => {
        const { url } = toExamplePageUrl('axes-crosshairs-e2e', 'band-highlight-both-axes', 'vanilla');
        await gotoExample(page, url);

        await expectChartScreenshot(page, page, 'band-tab-unfocused.png', { threshold: 0 });

        await page.keyboard.press('Tab');
        await expectChartScreenshot(page, page, 'band-tab-focused.png', bandOptions);

        await page.keyboard.press('Tab');
        await expectChartScreenshot(page, page, 'band-tab-unfocused.png', { threshold: 0 });
    });
});
