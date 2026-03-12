import { expect, test } from './fixture';
import { gotoExample, locateCanvas, setupIntrinsicAssertions, toExamplePageUrls, waitForAllChartUpdates } from './util';

test.describe('fonts', () => {
    setupIntrinsicAssertions(test);

    const testUrls = toExamplePageUrls('fonts', 'google-fonts');

    for (const { framework, url } of testUrls) {
        test.describe(`for ${framework}`, () => {
            test('google fonts', async ({ page }) => {
                await gotoExample(page, url);

                // document.fonts.ready is unreliable with @import CSS — it can resolve
                // before fonts start downloading. Poll document.fonts.check() instead.
                await page.waitForFunction(
                    () => {
                        return (
                            document.fonts.check('25px "Pacifico"') &&
                            document.fonts.check('18px "DM Serif Text"') &&
                            document.fonts.check('12px "Orbitron"')
                        );
                    },
                    null,
                    { timeout: 15_000 }
                );

                // Wait for ResizeObserver callbacks to propagate and trigger chart update
                await page.evaluate(
                    () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
                );
                await waitForAllChartUpdates(page);

                const { canvas } = await locateCanvas(page);
                await expect(canvas).toHaveScreenshot('google-fonts.png');
            });
        });
    }
});
