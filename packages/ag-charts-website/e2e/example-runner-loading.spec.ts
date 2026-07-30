import type { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoUrl, toPageUrl } from './util';

test.use({ viewport: { width: 1400, height: 900 } });

const PAGE_NAME = 'axes-cross-lines';
const EXAMPLE_NAME = 'axis-cross-lines-adding';
const IFRAME_ID = `loading-frame-${PAGE_NAME}-${EXAMPLE_NAME}`;

interface LoadingStatesSeen {
    loadingLogo: boolean;
    iframeHidden: boolean;
}

type WindowWithStates = Window & { __loadingStatesSeen: LoadingStatesSeen };

/**
 * A reload can complete faster than an assertion poll interval, so record whether the transient
 * states were ever entered rather than trying to catch them.
 */
async function recordLoadingStates(page: Page, iframeId: string) {
    await page.evaluate((id) => {
        const iframe = document.getElementById(id) as HTMLIFrameElement;
        const exampleOuter = iframe.closest('.example-runner-outer')!;
        const seen: LoadingStatesSeen = { loadingLogo: false, iframeHidden: false };
        (window as unknown as WindowWithStates).__loadingStatesSeen = seen;

        new MutationObserver(() => {
            seen.loadingLogo ||= exampleOuter.querySelector('.logomark') != null;
            seen.iframeHidden ||= iframe.style.visibility === 'hidden';
        }).observe(exampleOuter, { attributes: true, childList: true, subtree: true });
    }, iframeId);
}

function getLoadingStates(page: Page) {
    return page.evaluate(() => (window as unknown as WindowWithStates).__loadingStatesSeen);
}

test('example runner shows the loading logo when reloading an example in another language', async ({ page }) => {
    await gotoUrl(page, toPageUrl(`javascript/${PAGE_NAME}`));

    const exampleOuter = page.locator(`div#example-${EXAMPLE_NAME}`);
    const iframe = page.locator(`#${IFRAME_ID}`);
    const loadingLogo = exampleOuter.locator('.logomark');

    await exampleOuter.scrollIntoViewIfNeeded();
    await expect(iframe).toHaveCSS('visibility', 'visible', { timeout: 30_000 });
    await expect(loadingLogo).toHaveCount(0);

    await recordLoadingStates(page, IFRAME_ID);

    await exampleOuter.getByRole('button', { name: 'Code', exact: true }).click();
    const languageSelect = page.locator(`#example-${EXAMPLE_NAME}-typescript-style-selector`);
    const otherLanguage = (await languageSelect.inputValue()) === 'typescript' ? 'vanilla' : 'typescript';
    await languageSelect.selectOption(otherLanguage);
    await exampleOuter.getByRole('button', { name: 'Preview', exact: true }).click();

    await expect(iframe).toHaveAttribute('src', new RegExp(`/${otherLanguage}/`), { timeout: 30_000 });
    await expect(iframe).toHaveCSS('visibility', 'visible', { timeout: 30_000 });
    await expect(loadingLogo).toHaveCount(0);

    expect(await getLoadingStates(page)).toEqual({ loadingLogo: true, iframeHidden: true });
});
