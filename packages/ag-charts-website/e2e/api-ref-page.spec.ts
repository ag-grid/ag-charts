import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixture';
import { createConsoleLogs, gotoUrl, setupIntrinsicAssertions, toPageUrl } from './util';

test.use({ viewport: { width: 1400, height: 900 } });

const NAV_TREE_SELECTOR = 'pre code';
const PROPERTY_NAME_SELECTOR = '[class*="propertyName"]';
const PROPERTY_EXPANDER_SELECTOR = '[class*="propertyExpander"]';
const SEARCH_OPTION_SELECTOR = '[class*="searchOption"]';

function getSearchInput(page: Page) {
    return page.getByPlaceholder('Search properties...');
}

function getNavigationTree(page: Page) {
    return page.locator(NAV_TREE_SELECTOR);
}

function getNavigationProperty(page: Page, matcher: string | RegExp): Locator {
    return getNavigationTree(page).locator(PROPERTY_NAME_SELECTOR, { hasText: matcher }).first();
}

function getNavigationClickable(page: Page, matcher: string | RegExp): Locator {
    return getNavigationProperty(page, matcher).locator('span').first();
}

function getNavigationHighlight(page: Page, matcher: string | RegExp): Locator {
    return getNavigationTree(page).locator('.highlight', { hasText: matcher });
}

function getNavigationText(page: Page, text: string): Locator {
    return getNavigationTree(page).getByText(text, { exact: false });
}

async function waitForApiReady(page: Page) {
    await expect(page.locator('header h1')).toContainText('AgChartOptions');
    await expect(getNavigationTree(page).locator(PROPERTY_NAME_SELECTOR).first()).toBeVisible();
}

function normaliseLabel(value: string) {
    return value.replace(/[^a-z0-9]+/gi, '').toLowerCase();
}

async function selectSearchOption(page: Page, text: string) {
    const options = page.locator(SEARCH_OPTION_SELECTOR);
    await expect(options).not.toHaveCount(0, { timeout: 10_000 });

    const target = normaliseLabel(text);
    const count = await options.count();
    let matchIndex = -1;
    for (let i = 0; i < count; i++) {
        const optionText = await options.nth(i).innerText();
        if (normaliseLabel(optionText).includes(target)) {
            matchIndex = i;
            break;
        }
    }

    expect(matchIndex).not.toBe(-1);

    for (let i = 0; i < matchIndex; i++) {
        await page.keyboard.press('ArrowDown');
    }
}

test.describe('api-ref-page', () => {
    const consoleLogs = createConsoleLogs();

    setupIntrinsicAssertions(test);

    test('can expand axis label nav', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/axes/number/#reference-AgNumberAxisOptions-label'));

        const highlight = page.locator('.highlight').first();
        const siblingsBefore = await highlight.evaluate(countSiblings);

        await highlight.locator('svg').first().click();

        const siblingsAfter = await highlight.evaluate(countSiblings);
        expect(siblingsAfter).toBe(siblingsBefore + 2);

        // Assert no warnings in console
        await consoleLogs.expectLogs([
            '%cDownload the React DevTools for a better development experience: https://reactjs.org/link/react-devtools font-weight:bold',
        ]);
    });

    // Series colour options type as the `AgCssColorOrRef` union; the reference renderer throws on the
    // union unless every member is a named interface. setupIntrinsicAssertions fails on the resulting
    // console error, and the visible `fill` row proves the section rendered through the union.
    test('renders the bar series options page through the colour-ref union', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/series/bar/#reference-AgBarSeriesOptions-fill'));
        await expect(getNavigationProperty(page, /^fill/)).toBeVisible();

        // Expanding the `fill` code block is the only path that renders TypeCodeBlock -> CodeShiki.
        // `fill` types as the `AgColorType` union, so its members resolve to a `string[]` code sample;
        // this guards the regression where CodeShiki dropped its array handling and threw
        // "code.trimEnd is not a function" on expansion. setupIntrinsicAssertions fails the test on the
        // resulting pageerror, and the rendered `<pre>` proves the union block highlighted successfully.
        await page.getByRole('button', { name: 'See more details about fill', exact: true }).click();
        await expect(page.locator('#reference-AgBarSeriesOptions-fill-details pre').first()).toBeVisible();
    });

    // The themes API page roots its search index at AgChartTheme, whose tree is far larger than the
    // options page. Regression: building that index overflowed V8's argument limit and the page
    // failed to load with "Maximum call stack size exceeded". setupIntrinsicAssertions captures any
    // such pageerror and fails the test; the visible nav tree guards against a silently blank page.
    test('themes API page loads without overflowing', async ({ page }) => {
        await gotoUrl(page, toPageUrl('themes-api/'));
        await expect(getNavigationTree(page).locator(PROPERTY_NAME_SELECTOR).first()).toBeVisible();
    });

    test('shows fallback when search returns no matches', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        const searchInput = getSearchInput(page);
        await searchInput.click();
        await searchInput.fill('definitely-no-match');

        await expect(
            page.getByText(`We couldn't find any matches for "definitely-no-match"`, { exact: false })
        ).toBeVisible();
    });

    test('navigates to bar series via search keyboard flow', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        const searchInput = getSearchInput(page);
        await searchInput.click();
        await searchInput.fill('bar');

        await selectSearchOption(page, 'series type bar');
        await page.keyboard.press('Enter');

        const url = page.url();
        expect(url).toContain('/options/series/bar/');
        expect(url).toContain('#reference-AgBarSeriesOptions-type');
        await expect(page.locator('header h1')).toContainText("type = 'bar'");
    });

    test('clears search query after navigating to a result', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        const searchInput = getSearchInput(page);
        await searchInput.click();
        await searchInput.fill('bar');
        await selectSearchOption(page, 'series type bar');
        await page.keyboard.press('Enter');

        await expect(getSearchInput(page)).toHaveValue('');
    });

    test('direct bar series hash loads and highlights typed union entry', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/series/bar/#reference-AgBarSeriesOptions-type'));

        await expect(getNavigationHighlight(page, /type\s*= 'bar'/)).toBeVisible();
        await expect(page.locator('header h1')).toContainText("type = 'bar'");
    });

    // TODO: AG-16140 disable this test temporarily while converting axis docs to use dictionary
    test.skip('deep link to number axis property auto expands navigation', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/axes/number/#reference-AgNumberAxisOptions-gridLine'));

        await expect(getNavigationHighlight(page, /gridLine/)).toBeVisible();
        await expect(getNavigationProperty(page, /^axes/).locator(PROPERTY_EXPANDER_SELECTOR)).toHaveClass(/active/);
    });

    test('series navigation expander toggles typed union list', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        const seriesProperty = getNavigationProperty(page, /^series/);
        await expect(seriesProperty).toBeVisible();
        await seriesProperty.locator(PROPERTY_EXPANDER_SELECTOR).click();

        const barEntry = getNavigationText(page, "type = 'bar'");
        await expect(barEntry).toBeVisible();

        await seriesProperty.locator(PROPERTY_EXPANDER_SELECTOR).click();
        await expect(barEntry).toHaveCount(0);
    });

    test('expands typed union entry to reveal nested properties', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        const seriesProperty = getNavigationProperty(page, /^series/);
        await expect(seriesProperty).toBeVisible();
        await seriesProperty.locator(PROPERTY_EXPANDER_SELECTOR).click();

        const barEntry = getNavigationProperty(page, /type\s*= 'bar'/);
        await barEntry.locator(PROPERTY_EXPANDER_SELECTOR).click();

        await expect(getNavigationProperty(page, /^xKey$/)).toBeVisible();
    });

    // On the number-axis page the `crossLines` member sits under the `{ type = 'number' ... }`
    // nav node, which is collapsed by default. Deep-linking to a sibling axis property auto-expands
    // that node (the path to the selection) so `crossLines` is reachable in the navigation tree,
    // while leaving `crossLines` itself collapsed.
    const NUMBER_AXIS_URL = 'options/axes/number/#reference-AgNumberAxisOptions-nice';

    test('expands an axis cross-line member into its discriminated variants', async ({ page }) => {
        await gotoUrl(page, toPageUrl(NUMBER_AXIS_URL));

        const crossLines = getNavigationProperty(page, /^crossLines/);
        await expect(crossLines).toBeVisible();
        await crossLines.locator(PROPERTY_EXPANDER_SELECTOR).click();

        await expect(getNavigationProperty(page, /type\s*= 'line'/)).toBeVisible();
        await expect(getNavigationProperty(page, /type\s*= 'range'/)).toBeVisible();
    });

    test('expands a cross-line variant to its own properties, not the axis properties', async ({ page }) => {
        await gotoUrl(page, toPageUrl(NUMBER_AXIS_URL));

        const crossLines = getNavigationProperty(page, /^crossLines/);
        await expect(crossLines).toBeVisible();
        await crossLines.locator(PROPERTY_EXPANDER_SELECTOR).click();

        const lineVariant = getNavigationProperty(page, /type\s*= 'line'/);
        await lineVariant.locator(PROPERTY_EXPANDER_SELECTOR).click();

        // `value` is a cross-line line-variant property; it is absent from the axis interface, so
        // its presence proves the variant resolved to the cross-line type rather than the axis type.
        await expect(getNavigationProperty(page, /^value$/)).toBeVisible();
    });

    test('keeps cross-line variants collapsed after refreshing on another axis property', async ({ page }) => {
        await gotoUrl(page, toPageUrl(NUMBER_AXIS_URL));

        const crossLines = getNavigationProperty(page, /^crossLines/);
        await expect(crossLines).toBeVisible();
        await crossLines.locator(PROPERTY_EXPANDER_SELECTOR).click();

        // The variant branches show, but selecting an unrelated axis property must not auto-expand
        // them, even though they share the axis page.
        await expect(getNavigationProperty(page, /type\s*= 'line'/)).toBeVisible();
        await expect(getNavigationTree(page).locator(PROPERTY_NAME_SELECTOR, { hasText: /^value$/ })).toHaveCount(0);
    });

    test('renders a cross-line member as a plain array, like series', async ({ page }) => {
        await gotoUrl(page, toPageUrl(NUMBER_AXIS_URL));

        const crossLines = getNavigationProperty(page, /^crossLines/);
        await expect(crossLines).toBeVisible();
        // A discriminated-union array reads as a plain array, not an array wrapping an object (`[{ }]`).
        await expect(crossLines).toContainText('[ ... ]');
        await expect(crossLines).not.toContainText('[{');
    });

    test('child properties toggle reveals nested rows for padding', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        const toggle = page.getByLabel('See more details about padding');
        await toggle.click();

        await expect(page.locator('#reference-AgChartOptions-padding-details')).toBeVisible();
    });

    test('property link icon updates the URL hash', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));

        await expect(page.getByLabel('Link to width property')).toHaveAttribute(
            'href',
            '#reference-AgChartOptions-width'
        );
    });

    test('reselecting nav entry keeps a single highlighted node', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        const seriesLink = getNavigationClickable(page, /^series/);
        await expect(seriesLink).toBeVisible();
        await seriesLink.click();
        await expect(getNavigationHighlight(page, /^series/)).toHaveCount(1);

        await seriesLink.click();
        await expect(getNavigationHighlight(page, /^series/)).toHaveCount(1);
    });
});

function countSiblings(node: Element) {
    let count = 0;
    while (node.nextElementSibling) {
        node = node.nextElementSibling;
        count++;
    }
    return count;
}
