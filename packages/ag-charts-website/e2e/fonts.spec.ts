import { expect, test } from './fixture';
import { gotoExample, locateCanvas, setupIntrinsicAssertions, toExamplePageUrls, waitForAllChartUpdates } from './util';

const GOOGLE_FONT_FAMILIES = ['Pacifico', 'DM Serif Text', 'Orbitron'];

test.describe('fonts', () => {
    setupIntrinsicAssertions(test);

    const testUrls = toExamplePageUrls('fonts', 'google-fonts');

    for (const { framework, url } of testUrls) {
        test.describe(`for ${framework}`, () => {
            test('google fonts', async ({ page }) => {
                // Pre-warm the browser's font cache before navigating to the example.
                // This ensures fonts are already loaded when the chart renders, eliminating
                // the race between font download and initial chart render.
                const fontParams = GOOGLE_FONT_FAMILIES.map(
                    (f) => `family=${encodeURIComponent(f)}:wght@100;200;300;400;500;600;700;800;900`
                ).join('&');
                const fontUrl = `https://fonts.googleapis.com/css2?${fontParams}&display=swap`;
                await page.goto('about:blank');
                await page.addStyleTag({ url: fontUrl });
                await page.evaluate(
                    (families) => Promise.all(families.map((f) => document.fonts.load(`16px "${f}"`))),
                    GOOGLE_FONT_FAMILIES
                );

                await gotoExample(page, url);
                await waitForAllChartUpdates(page);

                const { canvas } = await locateCanvas(page);
                await expect(canvas).toHaveScreenshot('google-fonts.png');
            });
        });
    }
});
