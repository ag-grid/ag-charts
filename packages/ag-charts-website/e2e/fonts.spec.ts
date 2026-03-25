import { expect, test } from './fixture';
import { gotoExample, locateCanvas, setupIntrinsicAssertions, toExamplePageUrls, waitForAllChartUpdates } from './util';

test.describe('fonts', () => {
    setupIntrinsicAssertions(test);

    const testUrls = toExamplePageUrls('fonts', 'google-fonts');

    for (const { framework, url } of testUrls) {
        test.describe(`for ${framework}`, () => {
            // TODO: flaky — Google Font downloads intermittently timeout in CI.
            test.skip('google fonts', async ({ page }) => {
                await gotoExample(page, url);

                // Poll individual FontFace.status for each Google Font. Unlike
                // fonts.check() (which returns true when a matching @font-face exists,
                // before the file downloads) and fonts.ready (which resolves before
                // @import triggers downloads), FontFace.status tracks the actual
                // download lifecycle: 'unloaded' → 'loading' → 'loaded'.
                await page.waitForFunction(
                    (families: string[]) => {
                        const fonts = [...document.fonts];
                        return families.every((family) =>
                            fonts.some((f) => f.family.replace(/['"]/g, '') === family && f.status === 'loaded')
                        );
                    },
                    ['Pacifico', 'DM Serif Text', 'Orbitron'],
                    { timeout: 15_000 }
                );

                // Wait for the font-triggered re-render chain to complete:
                // fonts loaded → ResizeObserver fires → chart schedules update → re-render.
                // A short delay ensures the ResizeObserver has fired and the chart has begun
                // its update before we poll for completion.
                await page.waitForTimeout(200);
                await waitForAllChartUpdates(page);

                const { canvas } = await locateCanvas(page);
                await expect(canvas).toHaveScreenshot('google-fonts.png');
            });
        });
    }
});
