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
    // - ctx.direction reads during offscreen rendering (fixed via RenderContext caching)
    //
    // IMPORTANT: Data in the test examples uses 150 points (> RENDER_TO_OFFSCREEN_CANVAS_THRESHOLD
    // of 100) to ensure the offscreen rendering path in group.ts is exercised. Without this,
    // regressions in the offscreen path (e.g. expensive ctx.direction reads) would go undetected.
    const sparklineAllowlist = ['applyPendingResize', 'updateBaseFont', 'drawImage'];
    const SPARKLINE_COUNT = 30; // must match the count in the test example

    // Duration budget per allowlisted reflow event (microseconds). If any single
    // allowlisted event exceeds this, a fixable performance bug is hiding behind the
    // allowlist (e.g. the ctx.direction regression that was 1,942ms under renderOffscreen).
    const MAX_ALLOWLISTED_EVENT_DURATION_US = 5_000; // 5ms — font resolution can take ~1.5ms; ctx.direction regression was 1,942ms

    function assertAllowlistBounds(filtered: ReturnType<typeof filterAgChartsReflows>, bounds: Record<string, number>) {
        for (const [fn, maxCount] of Object.entries(bounds)) {
            const entry = filtered.allowlisted[fn];
            expect(entry?.count ?? 0, `allowlisted ${fn} count`).toBeLessThanOrEqual(maxCount);
        }

        // Assert no single allowlisted event is suspiciously expensive — catches
        // regressions like ctx.direction reads hiding behind function-name allowlisting.
        for (const [fn, entry] of Object.entries(filtered.allowlisted)) {
            if (entry.count === 0) continue;
            const avgDuration = entry.totalDuration / entry.count;
            expect(
                avgDuration,
                `allowlisted ${fn}: avg duration ${(avgDuration / 1000).toFixed(2)}ms exceeds budget`
            ).toBeLessThan(MAX_ALLOWLISTED_EVENT_DURATION_US);
        }
    }

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

        assertAllowlistBounds(filtered, {
            applyPendingResize: SPARKLINE_COUNT,
            updateBaseFont: 1,
            drawImage: 0,
        });
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

        assertAllowlistBounds(filtered, {
            applyPendingResize: 0,
            updateBaseFont: 0,
            drawImage: SPARKLINE_COUNT, // offscreen compositing during update
        });
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

        assertAllowlistBounds(filtered, {
            applyPendingResize: 0,
            updateBaseFont: 0,
            drawImage: SPARKLINE_COUNT, // offscreen compositing during pool recycling
        });
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
        const visibleRows = Math.ceil(400 / 36) + 2 * 5; // viewport/rowHeight + 2*overscan
        assertAllowlistBounds(filtered, {
            applyPendingResize: visibleRows,
            updateBaseFont: 1,
        });
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
