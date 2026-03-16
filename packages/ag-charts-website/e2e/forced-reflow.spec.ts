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

    // Canvas rendering operations inherently trigger UpdateLayoutTree (style recalculation)
    // when setting canvas dimensions or font properties. These are unavoidable for the initial
    // render of each sparkline. The key reflow sources we're guarding against are:
    // - Concentrated deferred DOM flushes between sparkline updates (fixed via setDeferring no-op)
    // - SizeMonitor's synchronous getBoundingClientRect interleaved with DOM writes (fixed via skipInitialRead)
    // - getComputedStyle in isDirectionRtl during container setup (fixed via minimal mode skip)
    // - Tooltip's addResizeListener calling getBoundingClientRect (fixed via skipInitialRead on proxy)
    const sparklineAllowlist = ['applyPendingResize', 'updateBaseFont', 'renderOffscreen', 'drawImage'];
    const SPARKLINE_COUNT = 30; // must match the count in the test example

    test('sparkline creation should not cause forced reflows', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('sparklines-test', 'e2e-sparkline-reflow', 'vanilla').url);
        await waitForAllChartUpdates(page);

        const events = await traceAction(page, async () => {
            await page.getByText('Create Sparklines').click();
            await page.waitForTimeout(500);
        });
        const analysis = analyseForcedReflows(events);
        const filtered = filterAgChartsReflows(analysis, { additionalAllowlist: sparklineAllowlist });
        expect(filtered.count, formatReflowDiagnostics(filtered)).toBe(0);

        // Canvas resize fires once per new sparkline; font resolution fires once globally.
        // Assert upper bounds so regressions that add new reflow sources are caught.
        expect(filtered.allowlisted.applyPendingResize ?? 0).toBeLessThanOrEqual(SPARKLINE_COUNT);
        expect(filtered.allowlisted.updateBaseFont ?? 0).toBeLessThanOrEqual(1);
        expect(filtered.allowlisted.renderOffscreen ?? 0).toBe(0);
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
        const filtered = filterAgChartsReflows(analysis, { additionalAllowlist: sparklineAllowlist });
        expect(filtered.count, formatReflowDiagnostics(filtered)).toBe(0);

        // Data updates should not resize canvases; at most one offscreen render recalc.
        expect(filtered.allowlisted.applyPendingResize ?? 0).toBe(0);
        expect(filtered.allowlisted.updateBaseFont ?? 0).toBe(0);
        expect(filtered.allowlisted.renderOffscreen ?? 0).toBeLessThanOrEqual(1);
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
        const filtered = filterAgChartsReflows(analysis, { additionalAllowlist: sparklineAllowlist });
        expect(filtered.count, formatReflowDiagnostics(filtered)).toBe(0);

        // Pool recycling reuses existing canvases at the same size — no resize expected.
        // At most one offscreen render recalc.
        expect(filtered.allowlisted.applyPendingResize ?? 0).toBe(0);
        expect(filtered.allowlisted.updateBaseFont ?? 0).toBe(0);
        expect(filtered.allowlisted.renderOffscreen ?? 0).toBeLessThanOrEqual(1);
    });

    // Realistic virtual-scroll scenario: 1000-row list with a 400px viewport,
    // sparklines created/destroyed as rows enter/leave the visible area.
    test('sparkline virtual scroll should not cause forced reflows', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('sparklines-test', 'e2e-sparkline-virtual-scroll', 'vanilla').url);
        await waitForAllChartUpdates(page);

        const viewport = page.locator('#viewport');
        const statsEl = page.locator('#stats');
        await expect(statsEl).toContainText('active');

        // Scroll down a large distance to trigger destroy/create cycles.
        const events = await traceAction(page, async () => {
            // Scroll incrementally to simulate realistic user scrolling.
            for (let i = 0; i < 5; i++) {
                await viewport.evaluate((el) => (el.scrollTop += 800));
                await page.waitForTimeout(150);
            }
            // Let final batch of sparklines render.
            await page.waitForTimeout(300);
        });
        const analysis = analyseForcedReflows(events);
        const filtered = filterAgChartsReflows(analysis, { additionalAllowlist: sparklineAllowlist });
        expect(filtered.count, formatReflowDiagnostics(filtered)).toBe(0);

        // After scrolling ~4000px through 36px rows, expect pool-recycled sparklines.
        // Canvas resize should only fire for genuinely new sparklines (not pooled reuse
        // at the same dimensions). Upper bound is generous to account for timing variance.
        const visibleRows = Math.ceil(400 / 36) + 2 * 5; // viewport/rowHeight + 2*overscan
        expect(filtered.allowlisted.applyPendingResize ?? 0).toBeLessThanOrEqual(visibleRows);
        expect(filtered.allowlisted.updateBaseFont ?? 0).toBeLessThanOrEqual(1);
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
