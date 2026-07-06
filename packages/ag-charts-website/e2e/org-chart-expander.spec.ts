import { expect, test } from './fixture';
import { canvasToPageTransformer, gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

// AG-17263: org-chart expand/collapse must be triggered ONLY by clicking the
// expander pill, not by clicking the node card body.
test.describe('org-chart-expander', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('org-chart', 'simple-org-chart')) {
        test.describe(`for ${framework}`, () => {
            test('collapse only on expander click', async ({ page }) => {
                await gotoExample(page, url);
                const point = await canvasToPageTransformer(page);

                // The CEO "Ashley Rivers" node is centred at the top of the tree.
                // Card body: solidly inside the card, above the expander pill.
                // Expander: the pill hanging off the card's bottom centre.
                const cardBody = point(421, 206);
                const expander = point(421, 242);

                // 1. Initial state — full expanded tree.
                await expect(page).toHaveScreenshot('org-chart-initial.png', { animations: 'disabled' });

                // 2. Clicking the card body must NOT toggle collapse — tree unchanged.
                await page.mouse.click(cardBody.x, cardBody.y);
                await expect(page).toHaveScreenshot('org-chart-card-click.png', { animations: 'disabled' });

                // 3. Clicking the expander pill collapses the CEO subtree — the whole
                //    tree collapses to just the CEO card.
                await page.mouse.click(expander.x, expander.y);
                await expect(page).toHaveScreenshot('org-chart-expander-collapsed.png', { animations: 'disabled' });
            });
        });
    }
});
