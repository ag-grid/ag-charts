import { expect, test } from './fixture';
import {
    SELECTORS,
    gotoExample,
    locateCanvas,
    setupIntrinsicAssertions,
    toExamplePageUrls,
    waitForAllChartUpdates,
} from './util';

test.describe('fonts', () => {
    setupIntrinsicAssertions(test);

    const testUrls = toExamplePageUrls('fonts', 'google-fonts');

    for (const { framework, url } of testUrls) {
        test.describe(`for ${framework}`, () => {
            // TODO: flaky — Google Font downloads intermittently timeout in CI.
            test.skip('google fonts', async ({ page }) => {
                await gotoExample(page, url);

                // Record the current scene-render count so we can detect re-renders
                // triggered by font loading.
                const renderCountBefore = await page
                    .locator(SELECTORS.wrapper)
                    .first()
                    .getAttribute('data-scene-renders');

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
                // Poll until the scene-render count increments, confirming the chart has
                // processed the font change, then wait for full stability.
                const wrapper = page.locator(SELECTORS.wrapper).first();
                await expect
                    .poll(
                        async () => {
                            const current = await wrapper.getAttribute('data-scene-renders');
                            return current !== renderCountBefore;
                        },
                        { timeout: 5_000, message: 'Waiting for font-triggered re-render' }
                    )
                    .toBeTruthy();
                await waitForAllChartUpdates(page);

                const { canvas } = await locateCanvas(page);
                await expect(canvas).toHaveScreenshot('google-fonts.png');
            });
        });
    }
});
