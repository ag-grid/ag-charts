import { selectA11yExamples } from './a11y/axe-examples';
import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

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
            await expect(captions.filter({ hasText: text })).toHaveCount(1);
        }
    });

    test('renders a clickable cross line button on each axis', async ({ page }) => {
        const crossLines = page.getByRole('list', { name: 'Cross Lines' }).locator('button');
        await expect(crossLines).toHaveCount(2);
        await expect(crossLines.filter({ hasText: 'Mid-year' })).toHaveCount(1);
        await expect(crossLines.filter({ hasText: 'Target' })).toHaveCount(1);
    });

    test('renders titles for the primary and secondary number axes', async ({ page }) => {
        await expect(page.getByRole('region', { name: 'Units Sold' })).toHaveCount(1);
        await expect(page.getByRole('region', { name: 'Financial Indicators' })).toHaveCount(1);
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
