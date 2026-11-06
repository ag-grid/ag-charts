import type { Page } from '@playwright/test';

import type { AgCharts } from 'ag-charts-community';

import { expect, test } from './fixture';
import { gotoUrl, setupIntrinsicAssertions, toPageUrl } from './util';

declare const agCharts: { AgCharts: typeof AgCharts };

const EXAMPLE = 'stacked-bar';

const getExampleTheme = (page: Page) => {
    const frame = page.frames().find((candidate) => candidate.url().includes(`/${EXAMPLE}/example-runner/`));
    return frame
        ?.evaluate(() => {
            const container = document.getElementById('myChart');
            const theme = container == null ? undefined : agCharts.AgCharts.getInstance(container)?.getOptions().theme;
            return typeof theme === 'string' ? theme : theme?.baseTheme;
        })
        .catch(() => undefined);
};

test.describe('gallery-theme', () => {
    setupIntrinsicAssertions(test, { ignoreConsolePatterns: ['ag-charts-thumbnails'] });

    for (const { picked, darkMode, expected } of [
        { picked: undefined, darkMode: false, expected: 'ag-default' },
        // The default theme goes dark through CSS variables rather than its `-dark` variant.
        { picked: undefined, darkMode: true, expected: 'ag-default' },
        { picked: 'ag-vivid', darkMode: false, expected: 'ag-vivid' },
        { picked: 'ag-polychroma', darkMode: true, expected: 'ag-polychroma-dark' },
    ]) {
        test(`renders the example in ${expected} when ${picked ?? 'no theme'} is picked in ${darkMode ? 'dark' : 'light'} mode`, async ({
            page,
        }) => {
            await gotoUrl(page, toPageUrl('gallery/'));
            await page.evaluate((dark) => localStorage.setItem('documentation:darkmode', String(dark)), darkMode);
            if (picked != null) {
                await page.locator('#theme-select').selectOption(picked);
            }

            await gotoUrl(page, toPageUrl(`gallery/${EXAMPLE}/`));
            // The example iframe only loads once it is scrolled into view.
            await page.locator('iframe').first().scrollIntoViewIfNeeded();

            await expect.poll(() => getExampleTheme(page)).toBe(expected);
        });
    }
});
