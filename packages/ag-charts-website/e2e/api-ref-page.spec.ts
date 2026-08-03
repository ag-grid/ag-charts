import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixture';
import { createConsoleLogs, gotoUrl, setupIntrinsicAssertions, toPageUrl } from './util';

test.use({ viewport: { width: 1400, height: 900 } });

const NAV_TREE_SELECTOR = 'pre code';
const PROPERTY_NAME_SELECTOR = '[class*="propertyName"]';
const PROPERTY_EXPANDER_SELECTOR = '[class*="propertyExpander"]';
const SEARCH_OPTION_SELECTOR = '[class*="searchOption"]';
const SEARCH_DROPDOWN_SELECTOR = '[class*="searchDropdown"]';

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

async function expandNavNode(page: Page, matcher: string | RegExp) {
    const node = getNavigationProperty(page, matcher);
    await expect(node).toBeVisible();
    await node.locator(PROPERTY_EXPANDER_SELECTOR).click();
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

    // `fill` is the `AgColorType` union of named interfaces. setupIntrinsicAssertions fails on any
    // pageerror, guarding the variant recursion through NodeFactory.
    test('expands the fill union into discrete variant types and their properties', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/series/bar/#reference-AgBarSeriesOptions-fill'));
        await expect(getNavigationProperty(page, /^fill/)).toBeVisible();

        // TC1: the "See available interfaces" action expands the union into discrete variant rows.
        await page.getByRole('button', { name: 'See available interfaces of fill', exact: true }).click();

        // TC2: each named interface member of the union renders as its own variant row.
        const gradientVariant = page.locator('#reference-AgBarSeriesOptions-fill-gradient');
        await expect(gradientVariant).toBeVisible();

        // TC3: a variant expands into its own properties as standard rows. The signature code block
        // (`-details`) belongs to the separate "See more details" affordance and stays absent here.
        await page.getByRole('button', { name: 'See child properties of gradient', exact: true }).click();
        await expect(page.locator('#reference-AgBarSeriesOptions-fill-gradient-rotation')).toBeVisible();
        await expect(page.locator('#reference-AgBarSeriesOptions-fill-details')).toHaveCount(0);
    });

    test('deep links into a fill union variant property and auto-expands the chain', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/series/bar/#reference-AgBarSeriesOptions-fill-gradient-rotation'));

        // Landing on the deep hash expands fill -> gradient and scrolls to the variant sub-property.
        const rotation = page.locator('#reference-AgBarSeriesOptions-fill-gradient-rotation');
        await expect(rotation).toBeVisible();
    });

    // The themes API page roots its search index at AgChartTheme, whose tree is far larger than the
    // options page. Regression: building that index overflowed V8's argument limit and the page
    // failed to load with "Maximum call stack size exceeded". setupIntrinsicAssertions captures any
    // such pageerror and fails the test; the visible nav tree guards against a silently blank page.
    test('themes API page loads without overflowing', async ({ page }) => {
        await gotoUrl(page, toPageUrl('themes-api/'));
        await expect(getNavigationTree(page).locator(PROPERTY_NAME_SELECTOR).first()).toBeVisible();
    });

    // The themes tree nests everything under `overrides`. Drilling overrides -> common -> axes
    // renders every axis-type variant through the themeable types, mirroring the options-page axis
    // surface. setupIntrinsicAssertions fails on the "type-literals" pageerror.
    test('themes API page expands the common axes node into its axis-type variants', async ({ page }) => {
        await gotoUrl(page, toPageUrl('themes-api/'));
        await expect(getNavigationTree(page).locator(PROPERTY_NAME_SELECTOR).first()).toBeVisible();

        await expandNavNode(page, /^overrides/);
        await expandNavNode(page, /^common/);
        await expandNavNode(page, /^axes/);

        await expect(getNavigationProperty(page, /^number\b/)).toBeVisible();
    });

    // A per-series override (here `bar`) exposes a themeable `series` node; expanding it renders the
    // series themeable options. `\b` keeps the matcher off the sibling `seriesArea` node. Guarded by
    // setupIntrinsicAssertions against the type-literals pageerror.
    test('themes API page expands a series override into its themeable series properties', async ({ page }) => {
        await gotoUrl(page, toPageUrl('themes-api/'));
        await expect(getNavigationTree(page).locator(PROPERTY_NAME_SELECTOR).first()).toBeVisible();

        await expandNavNode(page, /^overrides/);
        await expandNavNode(page, /^bar/);
        await expandNavNode(page, /^series\b/);

        await expect(getNavigationProperty(page, /^direction\b/)).toBeVisible();
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

    // Property paths are wider than the search box, so the dropdown scrolls on both axes. Wheeling
    // vertically moves the pointer onto a new option, selecting it, and that selection must leave
    // the horizontal scroll position alone.
    test('keeps the horizontal scroll position when scrolling the results vertically', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        const searchInput = getSearchInput(page);
        await searchInput.click();
        await searchInput.fill('label');

        const dropdown = page.locator(SEARCH_DROPDOWN_SELECTOR);
        await expect(dropdown).toBeVisible();
        await expect(page.locator(SEARCH_OPTION_SELECTOR)).not.toHaveCount(0);

        // The results have to overflow on both axes for the interaction to mean anything.
        const overflow = await dropdown.evaluate((element) => ({
            horizontal: element.scrollWidth - element.clientWidth,
            vertical: element.scrollHeight - element.clientHeight,
        }));
        expect(overflow.horizontal).toBeGreaterThan(0);
        expect(overflow.vertical).toBeGreaterThan(0);

        await dropdown.hover();
        await page.mouse.wheel(60, 0);
        await expect.poll(() => dropdown.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
        const scrollLeft = await dropdown.evaluate((element) => element.scrollLeft);

        await page.mouse.wheel(0, 60);
        await expect.poll(() => dropdown.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
        expect(await dropdown.evaluate((element) => element.scrollLeft)).toBe(scrollLeft);
    });

    // Keyboard navigation, unlike the pointer, must still bring the selection into view.
    test('scrolls the keyboard-selected option into view', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        const searchInput = getSearchInput(page);
        await searchInput.click();
        await searchInput.fill('label');
        await expect(page.locator(SEARCH_OPTION_SELECTOR)).not.toHaveCount(0);

        const dropdown = page.locator(SEARCH_DROPDOWN_SELECTOR);
        for (let i = 0; i < 10; i++) {
            await page.keyboard.press('ArrowDown');
        }

        await expect.poll(() => dropdown.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);

        const selectedIsVisible = await page
            .locator(`${SEARCH_OPTION_SELECTOR}[class*="selected"]`)
            .evaluate((element, dropdownSelector) => {
                const container = element.closest(dropdownSelector)!;
                const optionRect = element.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                // The visible area excludes the container's borders and scrollbar gutter. A pixel of
                // slack absorbs the sub-pixel rounding of a fractional scroll offset.
                const visibleTop = containerRect.top + container.clientTop;
                const visibleBottom = visibleTop + container.clientHeight;
                return optionRect.top >= visibleTop - 1 && optionRect.bottom <= visibleBottom + 1;
            }, SEARCH_DROPDOWN_SELECTOR);
        expect(selectedIsVisible).toBe(true);
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

    // The top-level `axes` node is the union of every axis type; expanding it renders all axis
    // variants at once. setupIntrinsicAssertions fails on the "type-literals" pageerror, so this
    // guards the whole axis surface against a nameless type-literal regression — the companion to
    // the `series` expansion tests above.
    test('expands the axes node into its axis-type variants', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        await expandNavNode(page, /^axes/);

        await expect(getNavigationProperty(page, /type\s*= 'number'/)).toBeVisible();
        await expect(getNavigationProperty(page, /type\s*= 'category'/)).toBeVisible();
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

    // `padding` is the `PixelSize | PaddingOptions` union: the primitive `PixelSize` stays in the
    // signature text, and the `PaddingOptions` interface variant expands into its own property rows.
    test('expands the padding union into its interface variant properties', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        await page.getByRole('button', { name: 'See available interfaces of padding', exact: true }).click();
        const paddingOptions = page.locator('#reference-AgChartOptions-padding-PaddingOptions');
        await expect(paddingOptions).toBeVisible();

        await page.getByRole('button', { name: 'See child properties of PaddingOptions', exact: true }).click();
        await expect(page.locator('#reference-AgChartOptions-padding-PaddingOptions-top')).toBeVisible();
    });

    // A mixed union keeps its non-interface members (here the primitive `PixelSize`) in a signature
    // code block reached through "See more details", distinct from the "See available interfaces" variant
    // rows. This guards the regression where expanding the union dropped the primitive members.
    test('preserves the primitive members of a mixed union in its signature block', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        await page.getByRole('button', { name: 'See more details about padding', exact: true }).click();
        const details = page.locator('#reference-AgChartOptions-padding-details');
        await expect(details).toBeVisible();
        await expect(details.locator('pre')).not.toHaveCount(0);
    });

    // `theme` has its own dedicated page (themes-api), so it renders as a plain, non-expandable row:
    // no "See available interfaces" action and no expander chevron on its name.
    test('renders theme as a plain non-expandable row', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        const themeRow = page.locator('#reference-AgChartOptions-theme');
        await expect(themeRow).toBeVisible();
        await expect(page.getByRole('button', { name: 'See available interfaces of theme', exact: true })).toHaveCount(
            0
        );
        await expect(themeRow.locator('[class*="propNameExpander"]')).toHaveCount(0);
    });

    // A special type (`series` -> AgChartSeriesOptions) has its own navigable per-type pages, so its
    // "See more details" code block lists the union alias only: the variant `Ag…SeriesOptions` names
    // appear, but their interface bodies are not inlined (which would be redundant noise here).
    test('special-type code block lists the union alias without inlining sub-interfaces', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        await page.getByRole('button', { name: 'See more details about series', exact: true }).click();

        const details = page.locator('#reference-AgChartOptions-series-details pre');
        await expect(details).toContainText('type AgChartSeriesOptions =');
        await expect(details).toContainText('AgBarSeriesOptions');
        await expect(details).not.toContainText('interface AgBarSeriesOptions');
    });

    // The type text toggles the inline code block, but only for members that have one. A `code` member
    // (`series`) is clickable and toggles its details; a plain primitive (`width`) has no code block,
    // so its type text is inert and keeps the default cursor.
    test('type text toggles the code block only for members that have one', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        const seriesType = page.locator('#reference-AgChartOptions-series [class*="metaValue"]').first();
        await expect(seriesType).toHaveClass(/isClickable/);

        const details = page.locator('#reference-AgChartOptions-series-details');
        await expect(details).toHaveCount(0);
        await seriesType.click();
        await expect(details).toBeVisible();
        await seriesType.click();
        await expect(details).toHaveCount(0);

        const widthType = page.locator('#reference-AgChartOptions-width [class*="metaValue"]').first();
        await expect(widthType).not.toHaveClass(/isClickable/);
    });

    // Below the table breakpoint the row stacks and the right column drops onto its own line beneath
    // the vertical side-line that marks an expanded union (drawn at left: 8px). The right column must
    // be indented past that line so its description and toggle button don't collide with it.
    test('indents the stacked right column clear of the expansion side-line', async ({ page }) => {
        await page.setViewportSize({ width: 900, height: 900 });
        await gotoUrl(page, toPageUrl('options/'));
        await waitForApiReady(page);

        await page.getByRole('button', { name: 'See available interfaces of padding', exact: true }).click();

        const row = page.locator('#reference-AgChartOptions-padding');
        await expect(row).toHaveCSS('display', 'block');

        const offsets = await row.locator('[class*="rightColumn"]').evaluate((rightColumn) => {
            const propertyRow = rightColumn.closest('.property-row')!;
            const style = getComputedStyle(rightColumn);
            const contentLeft = rightColumn.getBoundingClientRect().left + parseFloat(style.paddingLeft);
            return { contentLeft, rowLeft: propertyRow.getBoundingClientRect().left };
        });
        expect(offsets.contentLeft - offsets.rowLeft).toBeGreaterThanOrEqual(16);
    });

    // The nav's primitive-union entry deep-links to the signature block via the `-details` hash; the
    // reference panel resolves that hash by auto-expanding the signature rather than the variant list.
    test('deep links to a union signature block via the details hash', async ({ page }) => {
        await gotoUrl(page, toPageUrl('options/series/bar/#reference-AgBarSeriesOptions-fill-details'));

        const details = page.locator('#reference-AgBarSeriesOptions-fill-details');
        await expect(details).toBeVisible();
        await expect(details.locator('pre')).not.toHaveCount(0);
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
