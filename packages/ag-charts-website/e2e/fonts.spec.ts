import { test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { gotoExample, locateCanvas, setupIntrinsicAssertions, toExamplePageUrls, waitForAllChartUpdates } from './util';

const GOOGLE_FONT_FAMILIES = ['Pacifico', 'DM Serif Text', 'Orbitron'];

// Recorded Google Fonts CDN responses, replayed so the test never depends on the live
// CDN being reachable (which made the `networkidle` wait hang and time out in CI).
// Re-record with `UPDATE_FONT_HAR=1` if the example's fonts change.
const FONT_HAR = 'e2e/fixtures/google-fonts.har.zip';
const FONT_CDN = /fonts\.(googleapis|gstatic)\.com/;

test.describe('fonts', () => {
    setupIntrinsicAssertions(test);

    const testUrls = toExamplePageUrls('text', 'google-fonts');

    for (const { framework, url } of testUrls) {
        test.describe(`for ${framework}`, () => {
            test('google fonts', async ({ page }) => {
                await page.routeFromHAR(FONT_HAR, { url: FONT_CDN, update: !!process.env.UPDATE_FONT_HAR });

                await gotoExample(page, url);
                await waitForAllChartUpdates(page);

                // Ensure the Google Fonts have settled before the snapshot, so canvas text is
                // measured and drawn with the intended families rather than a fallback.
                await page.evaluate(
                    (families) => Promise.all(families.map((f) => document.fonts.load(`16px "${f}"`))).then(() => {}),
                    GOOGLE_FONT_FAMILIES
                );

                const { canvas } = await locateCanvas(page);
                await expectChartScreenshot(page, canvas, 'google-fonts.png');
            });
        });
    }
});
