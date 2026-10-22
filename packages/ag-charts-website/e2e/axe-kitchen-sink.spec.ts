import { selectA11yExamples } from './a11y/axe-examples';
import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

// The axe scan (e2e/a11y-axe.spec.ts) only earns its coverage if this example keeps rendering every DOM feature
// it exists for, on load and without any interaction.
test.describe('axe-kitchen-sink', () => {
    setupIntrinsicAssertions(test);

    const { url } = toExamplePageUrl('accessibility-e2e', 'axe-kitchen-sink', 'vanilla');

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, url);
    });

    test('renders title, subtitle and footnote as clickable buttons', async ({ page }) => {
        const captions = page.locator('div[role="button"].ag-charts-proxy-elem');
        await expect(captions).toHaveCount(3);
        for (const text of ['Regional Sales and Performance', '(units sold and financial indicators', 'Source:']) {
            const caption = captions.filter({ hasText: text });
            await expect(caption).toHaveCount(1);
            // The context menu alone also makes a caption a button, but only a click listener makes it focusable
            // (tabindex 0, not -1) with a pointer cursor.
            await expect(caption).toHaveAttribute('tabindex', '0');
            await expect(caption).toHaveCSS('cursor', 'pointer');
        }
    });

    test('renders a clickable cross line button on each axis', async ({ page }) => {
        const crossLines = page.getByRole('list', { name: 'Cross Lines' }).locator('button');
        await expect(crossLines).toHaveCount(2);
        await expect(crossLines.filter({ hasText: 'Mid-year' })).toHaveCount(1);
        await expect(crossLines.filter({ hasText: 'Target' })).toHaveCount(1);
    });

    test('renders an axis element for the category axis and both number axes', async ({ page }) => {
        // Axis titles are drawn on the canvas and the axis elements carry no role or label, so the three axes
        // (x, y and ySecondary) are guarded by their pointer-target elements.
        await expect(page.locator(SELECTORS.axisProxy)).toHaveCount(3);
    });

    test('renders horizontal and vertical scrollbar sliders', async ({ page }) => {
        const horizontal = page.getByRole('slider', { name: 'X-axis scrollbar' });
        const vertical = page.getByRole('slider', { name: 'Y-axis scrollbar' });
        await expect(horizontal).toHaveCount(1);
        await expect(horizontal).toHaveAttribute('aria-orientation', 'horizontal');
        await expect(vertical).toHaveCount(1);
        await expect(vertical).toHaveAttribute('aria-orientation', 'vertical');
    });

    test('shows the zoom buttons without hovering', async ({ page }) => {
        const zoomToolbar = page.getByRole('toolbar', { name: 'Zoom' });
        await expect(zoomToolbar).toBeVisible();
        // A hover-only toolbar is still in the DOM, but faded out.
        await expect(zoomToolbar).toHaveCSS('opacity', '1');
        for (const title of ['Zoom out', 'Zoom in', 'Pan left', 'Pan right', 'Reset the zoom']) {
            await expect(zoomToolbar.locator(`button[title="${title}"]`)).toBeVisible();
        }
    });

    test('renders the navigator range controls', async ({ page }) => {
        const navigator = page.getByRole('toolbar', { name: 'Navigator' });
        await expect(navigator).toHaveCount(1);
        for (const name of ['Range', 'Minimum', 'Maximum']) {
            await expect(navigator.getByRole('slider', { name })).toHaveCount(1);
        }
    });

    test('paginates the legend', async ({ page }) => {
        const legend = page.getByRole('list', { name: 'Legend' });
        await expect(legend.getByRole('switch')).toHaveCount(8);

        const pagination = page.getByRole('group', { name: 'Legend Pagination' });
        await expect(pagination).toHaveCount(1);
        await expect(pagination.getByRole('button', { name: 'Previous Legend Page' })).toBeDisabled();
        await expect(pagination.getByRole('button', { name: 'Next Legend Page' })).toBeEnabled();
    });

    test('renders the annotations toolbar', async ({ page }) => {
        // The toolbar is shared with the zoom module, which relabels it, so it is found by class rather than by name.
        const toolbar = page.locator('.ag-charts-shared-toolbar[role="toolbar"]');
        await expect(toolbar).toBeVisible();
        for (const title of ['Text Annotations', 'Trend Lines', 'Arrows', 'Clear All']) {
            await expect(toolbar.locator(`button[title="${title}"]`)).toBeVisible();
        }
    });

    test('attaches an annotation axis button to each axis direction', async ({ page }) => {
        // display:none until the pointer enters the series area, so a load-only axe scan does not evaluate them.
        const axisButtons = page.locator('button.ag-charts-annotations__axis-button');
        await expect(axisButtons).toHaveCount(2);
        for (const button of await axisButtons.all()) {
            await expect(button).toHaveAttribute('aria-label', 'Add Horizontal Line');
        }
    });

    test('registers the context menu', async ({ page }) => {
        await expect(page.locator('.ag-charts-context-menu')).toHaveCount(1);
    });
});

test.describe('axe scan example selection', () => {
    test('the default set includes the financial, kitchen-sink and multi-chart examples', () => {
        test.skip((process.env.AG_A11Y_ALL_EXAMPLES ?? '') !== '', 'AG_A11Y_ALL_EXAMPLES replaces the default set');

        const selected = selectA11yExamples().map(({ pageName, example }) => `${pageName}/${example}`);
        expect(selected).toEqual(
            expect.arrayContaining([
                'financial-charts/financial-charts-showcase',
                'accessibility-e2e/axe-kitchen-sink',
                'sync/basic-sync',
            ])
        );
    });
});
