import { expect, test } from './fixture';
import {
    analyseForcedReflows,
    filterAgChartsReflows,
    formatReflowDiagnostics,
    traceAction,
} from './forcedReflowDetection';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl, waitForAllChartUpdates } from './util';

// CDP tracing is Chrome-specific; skip on other browsers.
test.describe('forced reflow detection', () => {
    test.skip(({ browserName }) => browserName !== 'chromium', 'CDP tracing requires Chromium');

    setupIntrinsicAssertions(test);

    // Run serially to avoid tracing interference between tests.
    test.describe.configure({ mode: 'serial' });

    test('tooltip hover should not cause forced reflows', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('tooltips-test', 'e2e-tooltip-modes', 'vanilla').url);
        await waitForAllChartUpdates(page);

        const initialEvents = await traceAction(page, async () => {
            // Move to chart area to trigger initial tooltip.
            await page.mouse.move(50, 150);
        });
        const initialAnalysis = analyseForcedReflows(initialEvents);
        const initialFiltered = filterAgChartsReflows(initialAnalysis, {
            // These functions are unavoidable initially due to the tooltip being shown.
            additionalAllowlist: ['getBoundingClientRect', 'flush'],
        });
        expect(initialFiltered.count, formatReflowDiagnostics(initialFiltered)).toBe(0);

        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        const initialTooltipBox = await tooltip.boundingBox();

        const events = await traceAction(page, async () => {
            // Move to chart area to trigger tooltip
            await page.mouse.move(400, 150, { steps: 3 });
            // Small pause to let tooltip render cycle complete
            await page.waitForTimeout(200);
            // Move to a different point to trigger tooltip update
            await page.mouse.move(350, 200, { steps: 3 });
            await page.waitForTimeout(200);
        });

        const analysis = analyseForcedReflows(events);
        const filtered = filterAgChartsReflows(analysis);
        expect(filtered.count, formatReflowDiagnostics(filtered)).toBe(0);

        await expect(tooltip).toBeVisible();
        const finalTooltipBox = await tooltip.boundingBox();
        expect(finalTooltipBox?.x).not.toBe(initialTooltipBox?.x);
    });

    test('sparkline creation should not cause forced reflows', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('sparklines-test', 'e2e-sparkline-reflow', 'vanilla').url);
        await waitForAllChartUpdates(page);

        const events = await traceAction(page, async () => {
            await page.getByText('Create Sparklines').click();
            await page.waitForTimeout(500);
        });
        const analysis = analyseForcedReflows(events);
        const filtered = filterAgChartsReflows(analysis);
        expect(filtered.count, formatReflowDiagnostics(filtered)).toBe(0);
    });

    test('sparkline data update should not cause forced reflows', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('sparklines-test', 'e2e-sparkline-reflow', 'vanilla').url);
        await waitForAllChartUpdates(page);

        // Create sparklines first, then wait for them to settle.
        await page.getByText('Create Sparklines').click();
        await page.waitForTimeout(500);
        await waitForAllChartUpdates(page);

        const events = await traceAction(page, async () => {
            await page.getByText('Update Sparklines').click();
            await page.waitForTimeout(500);
        });
        const analysis = analyseForcedReflows(events);
        const filtered = filterAgChartsReflows(analysis);
        expect(filtered.count, formatReflowDiagnostics(filtered)).toBe(0);
    });

    // Simulates grid scroll: destroy visible sparklines (returning them to pool)
    // then create new ones from pool — the lifecycle that occurs as rows scroll
    // in and out of the viewport.
    test('sparkline scroll recycling should not cause forced reflows', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('sparklines-test', 'e2e-sparkline-reflow', 'vanilla').url);
        await waitForAllChartUpdates(page);

        // Create initial sparklines, then wait for them to settle.
        await page.getByText('Create Sparklines').click();
        await page.waitForTimeout(500);
        await waitForAllChartUpdates(page);

        const events = await traceAction(page, async () => {
            // Destroy and recreate from pool (simulates scroll).
            await page.getByText('Scroll Sparklines').click();
            await page.waitForTimeout(500);
        });
        const analysis = analyseForcedReflows(events);
        const filtered = filterAgChartsReflows(analysis);
        expect(filtered.count, formatReflowDiagnostics(filtered)).toBe(0);
    });

    test('crosshair label hover should not cause forced reflows', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('axes-crosshairs', 'crosshair-snap', 'vanilla').url);
        await waitForAllChartUpdates(page);

        const initialEvents = await traceAction(page, async () => {
            await page.mouse.move(100, 300);
        });
        const initialAnalysis = analyseForcedReflows(initialEvents);
        const initialFiltered = filterAgChartsReflows(initialAnalysis, {
            additionalAllowlist: ['renderInContext'],
        });
        expect(initialFiltered.count, formatReflowDiagnostics(initialFiltered)).toBe(0);

        const crosshairLabel = page.locator(SELECTORS.crosshairLabel).nth(2);
        await expect(crosshairLabel).toBeVisible();
        const initialLabelBox = await crosshairLabel.boundingBox();

        const events = await traceAction(page, async () => {
            await page.mouse.move(500, 250, { steps: 3 });
            await page.waitForTimeout(200);
            await page.mouse.move(200, 350, { steps: 3 });
            await page.waitForTimeout(200);
        });
        const analysis = analyseForcedReflows(events);
        const filtered = filterAgChartsReflows(analysis);
        expect(filtered.count, formatReflowDiagnostics(filtered)).toBe(0);

        await expect(crosshairLabel).toBeVisible();
        const finalLabelBox = await crosshairLabel.boundingBox();
        expect({ x: finalLabelBox?.x, y: finalLabelBox?.y }).not.toEqual({
            x: initialLabelBox?.x,
            y: initialLabelBox?.y,
        });
    });
});
