import { type Page, expect } from '@playwright/test';

// Shared depth assertions for the demo apps: every chart mounted, settled, and showing real data,
// with no console noise.

export const WRAPPER = '.ag-charts-wrapper';

// The library's own "nothing to draw" markers: a chart mounted with no data behind it.
const EMPTY_OVERLAYS = [
    '.ag-charts-no-data-overlay',
    '.ag-charts-no-visible-series',
    '.ag-charts-loading-overlay',
] as const;

/**
 * Expected chart population for a demo.
 *
 * The split matters: charts rendered as grid cells live in virtualised rows, so how
 * many exist depends on the container's pixel height and would turn any exact count
 * into a viewport tripwire. Charts outside a grid are architecturally fixed, so those
 * get the exact count that actually catches a silently-dropped chart.
 */
export interface ChartPopulation {
    /** Exact number of charts not rendered inside a grid cell. */
    structural: number;
    /** Lower bound on charts rendered as grid cells. Omit when the demo has none. */
    minInGrid?: number;
}

/** Collect console errors/warnings and uncaught exceptions, as a pull accessor. */
export function watchConsole(page: Page): () => string[] {
    const issues: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() !== 'error' && msg.type() !== 'warning') return;
        // Licence banners are padded with '*' on both sides; this also hides "License Key Not Found".
        if (msg.text().startsWith('*')) return;
        issues.push(msg.text());
    });
    page.on('pageerror', (err) => issues.push(err.message));
    return () => issues.splice(0);
}

/** Wait until every mounted chart has finished updating and animating. */
export async function waitForAllChartUpdates(page: Page) {
    for (const wrapper of await page.locator(WRAPPER).all()) {
        await expect(wrapper).toHaveAttribute('data-scene-renders', /\d+/, { timeout: 10_000 });
        await expect(wrapper).toHaveAttribute('data-update-pending', 'false', { timeout: 10_000 });
        await expect(wrapper).toHaveAttribute('data-animating', 'false', { timeout: 10_000 });
    }
}

/** Assert the demo mounted the charts it is supposed to. */
export async function expectChartPopulation(page: Page, { structural, minInGrid }: ChartPopulation, label: string) {
    await expect
        .poll(
            () =>
                page.evaluate(() => {
                    const all = [...document.querySelectorAll('.ag-charts-wrapper')];
                    const inGrid = all.filter((el) => el.closest('.ag-cell')).length;
                    return { structural: all.length - inGrid, inGrid };
                }),
            { message: `${label}: chart population`, timeout: 15_000 }
        )
        .toEqual(expect.objectContaining({ structural }));

    if (minInGrid != null) {
        const { inGrid } = await page.evaluate(() => {
            const all = [...document.querySelectorAll('.ag-charts-wrapper')];
            return { inGrid: all.filter((el) => el.closest('.ag-cell')).length };
        });
        expect(inGrid, `${label}: charts rendered as grid cells`).toBeGreaterThanOrEqual(minInGrid);
    }
}

interface ChartVerdict {
    label: string;
    renders: number;
    painted: boolean;
    overlay: string | null;
}

/**
 * Inspect every mounted chart in a single round trip. Per-chart:
 * - `renders`  — value of `data-scene-renders`; 0 means it never drew a scene.
 * - `painted`  — at least one canvas has a pixel differing from its top-left one.
 *                A chart with no data still lays out, so existence proves nothing.
 * - `overlay`  — the library's own empty-state marker, if it is showing.
 */
async function inspectCharts(page: Page, emptyOverlays: readonly string[]): Promise<ChartVerdict[]> {
    return page.evaluate((overlaySelectors) => {
        const describe = (el: Element): string => {
            const heading = el.closest('section, .fin-section, .wa-card')?.querySelector('h2, h3')?.textContent;
            return heading?.trim() || (el.parentElement?.className ?? 'chart');
        };
        const isPainted = (wrapper: Element): boolean =>
            [...wrapper.querySelectorAll('canvas')].some((canvas) => {
                if (canvas.width === 0 || canvas.height === 0) return false;
                const ctx = canvas.getContext('2d');
                if (!ctx) return false;
                const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
                // Bail on the first pixel differing from the top-left one.
                for (let i = 4; i < data.length; i += 4) {
                    if (
                        data[i] !== data[0] ||
                        data[i + 1] !== data[1] ||
                        data[i + 2] !== data[2] ||
                        data[i + 3] !== data[3]
                    ) {
                        return true;
                    }
                }
                return false;
            });

        return [...document.querySelectorAll('.ag-charts-wrapper')].map((wrapper) => ({
            label: describe(wrapper),
            renders: Number(wrapper.getAttribute('data-scene-renders') ?? 0),
            painted: isPainted(wrapper),
            overlay: overlaySelectors.find((selector) => wrapper.querySelector(selector) != null) ?? null,
        }));
    }, emptyOverlays as string[]);
}

/** Assert every mounted chart rendered real data. */
export async function expectEveryChartHasData(page: Page, label: string) {
    for (const selector of EMPTY_OVERLAYS) {
        await expect(page.locator(selector), `${label}: ${selector} should not be shown`).toHaveCount(0);
    }

    const charts = await inspectCharts(page, EMPTY_OVERLAYS);
    expect(charts.length, `${label}: expected at least one chart to inspect`).toBeGreaterThan(0);

    const blank = charts.filter((chart) => !chart.painted).map((chart) => chart.label);
    expect(blank, `${label}: charts that painted a blank canvas`).toEqual([]);

    const undrawn = charts.filter((chart) => chart.renders < 1).map((chart) => chart.label);
    expect(undrawn, `${label}: charts that never rendered a scene`).toEqual([]);
}
