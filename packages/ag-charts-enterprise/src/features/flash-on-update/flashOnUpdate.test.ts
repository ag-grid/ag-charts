import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    clickAction,
    computeLegendBBox,
    deproxy,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';
import { expectWarningsCalls } from 'ag-charts-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import type { BandFlashDatum } from './flashOnUpdate';
import { mergeBands, shouldMergeBands } from './flashOnUpdate';

// --- Test Data ---

const INITIAL_DATA = [
    { category: 'A', value: 10, value2: 20 },
    { category: 'B', value: 20, value2: 30 },
    { category: 'C', value: 30, value2: 40 },
    { category: 'D', value: 40, value2: 50 },
];

const UPDATED_VALUES_DATA = [
    { category: 'A', value: 15, value2: 25 },
    { category: 'B', value: 25, value2: 35 },
    { category: 'C', value: 35, value2: 45 },
    { category: 'D', value: 45, value2: 55 },
];

const ADDED_CATEGORY_DATA = [
    { category: 'A', value: 10, value2: 20 },
    { category: 'B', value: 20, value2: 30 },
    { category: 'C', value: 30, value2: 40 },
    { category: 'D', value: 40, value2: 50 },
    { category: 'E', value: 50, value2: 60 },
];

const REMOVED_CATEGORY_DATA = [
    { category: 'A', value: 10, value2: 20 },
    { category: 'B', value: 20, value2: 30 },
    { category: 'C', value: 30, value2: 40 },
];

// A updated, D removed, E added
const MIXED_CHANGES_DATA = [
    { category: 'A', value: 99, value2: 99 },
    { category: 'B', value: 20, value2: 30 },
    { category: 'C', value: 30, value2: 40 },
    { category: 'E', value: 50, value2: 60 },
];

// --- Base Options ---

const VERTICAL_BAR_OPTIONS: AgCartesianChartOptions = {
    data: INITIAL_DATA,
    series: [
        { type: 'bar', xKey: 'category', yKey: 'value', yName: 'Value 1', stacked: true },
        { type: 'bar', xKey: 'category', yKey: 'value2', yName: 'Value 2', stacked: true },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
};

const HORIZONTAL_BAR_OPTIONS: AgCartesianChartOptions = {
    data: INITIAL_DATA,
    series: [
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'value',
            yName: 'Value 1',
            direction: 'horizontal',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'category',
            yKey: 'value2',
            yName: 'Value 2',
            direction: 'horizontal',
            stacked: true,
        },
    ],
    axes: {
        y: { type: 'category', position: 'left' },
        x: { type: 'number', position: 'bottom' },
    },
};

const LINE_CHART_NO_CATEGORY_AXIS: AgCartesianChartOptions = {
    data: [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 },
    ],
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: {
        x: { type: 'number' },
        y: { type: 'number' },
    },
};

const PHASE_RATIOS = [0.05, 0.31, 0.68];

// --- Scene-graph assertion helpers ---
//
// The mock animation system (spyOnAnimationManager + forceTimeJump) advances flash animations
// inline during animationManager.animate(). Because flash uses the 'update' phase
// (animationDelay=0.25, animationDuration=0.5), fillOpacity is only non-zero between ~25%-75%
// of the total animation timeline. At other ratios the animation hasn't started or has completed.
//
// These helpers therefore assert structural properties (fill, area, band count) that persist
// regardless of animation timing. fillOpacity is only checked for suppression tests (always 0)
// and at a known mid-animation ratio where we can guarantee the flash is visible.

function getFlashModule(chartInstance: AgChartInstance) {
    return deproxy(chartInstance).modulesManager.getModule('flashOnUpdate') as any;
}

/** Assert the chart flash rect was configured: correct fill colour and non-zero area. */
function assertChartFlashActive(chartInstance: AgChartInstance, opts?: { fill?: string }) {
    const mod = getFlashModule(chartInstance);
    const rect = mod.chartFlashRect;
    expect(rect.fill).toBe(opts?.fill ?? '#cfeeff');
    expect(rect.width).toBeGreaterThan(0);
    expect(rect.height).toBeGreaterThan(0);
}

/** Assert band flash rects were created with correct fill and non-zero area. */
function assertBandFlashActive(chartInstance: AgChartInstance, opts?: { fill?: string; minBands?: number }) {
    const mod = getFlashModule(chartInstance);
    const rects: any[] = mod.bandSelection.nodes();
    expect(rects.length).toBeGreaterThan(0);
    if (opts?.minBands != null) {
        expect(rects.length).toBeGreaterThanOrEqual(opts.minBands);
    }
    for (const rect of rects) {
        expect(rect.fill).toBe(opts?.fill ?? '#cfeeff');
        expect(rect.width * rect.height).toBeGreaterThan(0);
    }
}

/** Assert no flash is visible — fillOpacity must be 0 on all flash rects. */
function assertFlashInactive(chartInstance: AgChartInstance) {
    const mod = getFlashModule(chartInstance);
    expect(mod.chartFlashRect.fillOpacity).toBe(0);
    const bandRects: any[] = mod.bandSelection.nodes();
    for (const rect of bandRects) {
        expect(rect.fillOpacity).toBe(0);
    }
}

// --- Helpers ---

function generateData(count: number, seed = 1) {
    return Array.from({ length: count }, (_, i) => ({
        category: `Cat-${i}`,
        value: ((seed * (i + 1) * 7) % 100) + 1,
        value2: ((seed * (i + 1) * 13) % 100) + 1,
    }));
}

function withFlash(
    options: AgCartesianChartOptions,
    flashOptions: {
        enabled?: boolean;
        item?: 'chart' | 'category';
        fill?: string;
        fillOpacity?: number;
        flashDuration?: number;
        fadeOutDuration?: number;
    }
): AgCartesianChartOptions {
    return { ...options, flashOnUpdate: flashOptions } as any;
}

// --- Tests ---

describe('FlashOnUpdate', () => {
    setupMockConsole();

    let chart: AgChartInstance;
    const ctx = setupMockCanvas();
    const animate = spyOnAnimationManager();

    afterEach(() => {
        chart?.destroy();
        (chart as any) = undefined;
    });

    const compareSnapshot = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('chart flash mode', () => {
        for (const ratio of PHASE_RATIOS) {
            it(`should flash on value update [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'chart' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });

            it(`should flash on category add [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'chart' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: ADDED_CATEGORY_DATA });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });

            it(`should flash on category remove [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'chart' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: REMOVED_CATEGORY_DATA });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });

            it(`should flash on mixed changes [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'chart' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: MIXED_CHANGES_DATA });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });

            it(`should apply custom color [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'chart', fill: '#ff0000' }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
                assertChartFlashActive(chart, { fill: '#ff0000' });
            });

            it(`should apply custom opacity [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'chart', fillOpacity: 0.5 }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });

            it(`should apply custom flash and fade duration [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'chart', flashDuration: 500, fadeOutDuration: 500 }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });
        }
    });

    describe('category band flash mode', () => {
        describe('vertical bars', () => {
            for (const ratio of PHASE_RATIOS) {
                it(`should flash updated category bands [ratio ${ratio}]`, async () => {
                    const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'category' });
                    prepareEnterpriseTestOptions(options);

                    animate(1200, 1);
                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1200, ratio);
                    await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                    await compareSnapshot();
                    assertBandFlashActive(chart);
                });

                it(`should flash added category band [ratio ${ratio}]`, async () => {
                    const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'category' });
                    prepareEnterpriseTestOptions(options);

                    animate(1200, 1);
                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1200, ratio);
                    await chart.updateDelta({ data: ADDED_CATEGORY_DATA });
                    await compareSnapshot();
                    assertBandFlashActive(chart);
                });

                it(`should flash removed category band [ratio ${ratio}]`, async () => {
                    const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'category' });
                    prepareEnterpriseTestOptions(options);

                    animate(1200, 1);
                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1200, ratio);
                    await chart.updateDelta({ data: REMOVED_CATEGORY_DATA });
                    await compareSnapshot();
                    assertBandFlashActive(chart);
                });

                it(`should flash mixed add, update, and remove bands [ratio ${ratio}]`, async () => {
                    const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'category' });
                    prepareEnterpriseTestOptions(options);

                    animate(1200, 1);
                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1200, ratio);
                    await chart.updateDelta({ data: MIXED_CHANGES_DATA });
                    await compareSnapshot();
                    assertBandFlashActive(chart);
                });
            }
        });

        describe('horizontal bars', () => {
            for (const ratio of PHASE_RATIOS) {
                it(`should flash horizontal category bands on value change [ratio ${ratio}]`, async () => {
                    const options = withFlash({ ...HORIZONTAL_BAR_OPTIONS }, { enabled: true, item: 'category' });
                    prepareEnterpriseTestOptions(options);

                    animate(1200, 1);
                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1200, ratio);
                    await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                    await compareSnapshot();
                    assertBandFlashActive(chart);
                });

                it(`should flash horizontal removed band [ratio ${ratio}]`, async () => {
                    const options = withFlash({ ...HORIZONTAL_BAR_OPTIONS }, { enabled: true, item: 'category' });
                    prepareEnterpriseTestOptions(options);

                    animate(1200, 1);
                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    animate(1200, ratio);
                    await chart.updateDelta({ data: REMOVED_CATEGORY_DATA });
                    await compareSnapshot();
                    assertBandFlashActive(chart);
                });
            }
        });

        describe('bounds tracking', () => {
            for (const ratio of PHASE_RATIOS) {
                it(`should track previous bounds when removing a recently added category [ratio ${ratio}]`, async () => {
                    const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'category' });
                    prepareEnterpriseTestOptions(options);

                    animate(1200, 1);
                    chart = AgCharts.create(options);
                    await waitForChartStability(chart);

                    // First: add category E
                    await chart.updateDelta({ data: ADDED_CATEGORY_DATA });
                    await waitForChartStability(chart);

                    // Then: remove E — should flash at E's previous position using previousBandBounds
                    animate(1200, ratio);
                    await chart.updateDelta({ data: INITIAL_DATA });
                    await compareSnapshot();
                    assertBandFlashActive(chart);
                });
            }
        });

        it('should warn when no category axis is present', async () => {
            const options = withFlash({ ...LINE_CHART_NO_CATEGORY_AXIS }, { enabled: true, item: 'category' });
            prepareEnterpriseTestOptions(options);

            animate(1200, 1);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            animate(1200, 0.3);
            await chart.updateDelta({
                data: [
                    { x: 1, y: 99 },
                    { x: 2, y: 99 },
                    { x: 3, y: 99 },
                ],
            });
            await waitForChartStability(chart);

            expectWarningsCalls().toEqual([
                [expect.stringContaining("flashOnUpdate item 'category' requires a category axis")],
            ]);
        });
    });

    describe('update API paths', () => {
        for (const ratio of PHASE_RATIOS) {
            it(`should flash on chart.update() with new data [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'chart' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                // Use full options update (apiUpdate: true via applyOptions)
                animate(1200, ratio);
                await chart.update({ ...options, data: UPDATED_VALUES_DATA });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });
        }
    });

    describe('suppression conditions', () => {
        for (const ratio of PHASE_RATIOS) {
            it(`should not flash when enabled is false [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: false, item: 'chart' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
                assertFlashInactive(chart);
            });

            it(`should not flash when data has not changed [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'chart' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: [...INITIAL_DATA] });
                await compareSnapshot();
                assertFlashInactive(chart);
            });

            it(`should not flash on legend click [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'chart' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                // Click legend to toggle series visibility — this calls
                // updateService.update() without apiUpdate: true
                animate(1200, ratio);
                const { x, y } = computeLegendBBox(deproxy(chart));
                await clickAction(x, y)(chart);
                await compareSnapshot();
                assertFlashInactive(chart);
            });

            it(`should flash on API update after a legend click [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'chart' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                // Legend click (no flash)
                const { x, y } = computeLegendBBox(deproxy(chart));
                await clickAction(x, y)(chart);
                await waitForChartStability(chart);

                // Subsequent API update should still flash
                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });
        }
    });

    describe('configuration options', () => {
        for (const ratio of PHASE_RATIOS) {
            it(`should render category bands with custom color [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'category', fill: '#ff6600' }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
                assertBandFlashActive(chart, { fill: '#ff6600' });
            });

            it(`should render category bands with custom opacity [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'category', fillOpacity: 0.3 }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
                assertBandFlashActive(chart);
            });

            it(`should render category bands with custom timing [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'category', flashDuration: 500, fadeOutDuration: 500 }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
                assertBandFlashActive(chart);
            });
        }
    });

    describe('duration semantics', () => {
        for (const ratio of PHASE_RATIOS) {
            it(`should hold flash with flashDuration only [ratio ${ratio}]`, async () => {
                // flashProportion = 1.0, ease = () => 0 (constant hold at full opacity)
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'chart', flashDuration: 1000, fadeOutDuration: 0 }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });

            it(`should fade linearly with fadeOutDuration only [ratio ${ratio}]`, async () => {
                // flashProportion = 0, ease = (t) => t (pure linear fade, no hold period)
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'chart', flashDuration: 0, fadeOutDuration: 1000 }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });

            it(`should cap duration at MAX_ANIMATION_DURATION_RATIO [ratio ${ratio}]`, async () => {
                // total = 50000ms, duration ratio = min(50000/1000, 2) = 2 (capped)
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'chart', flashDuration: 25000, fadeOutDuration: 25000 }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });
        }
    });

    describe('large dataset', () => {
        const LARGE_COUNT = 500;
        const LARGE_DATA = generateData(LARGE_COUNT, 1);
        const LARGE_DATA_UPDATED = generateData(LARGE_COUNT, 2);

        for (const ratio of PHASE_RATIOS) {
            it(`should handle large dataset with chart flash mode [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    {
                        ...VERTICAL_BAR_OPTIONS,
                        data: LARGE_DATA,
                    },
                    { enabled: true, item: 'chart' }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: LARGE_DATA_UPDATED });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });

            it(`should handle large dataset with category flash mode [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    {
                        ...VERTICAL_BAR_OPTIONS,
                        data: LARGE_DATA,
                    },
                    { enabled: true, item: 'category' }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: LARGE_DATA_UPDATED });
                await compareSnapshot();
                assertBandFlashActive(chart);
            });

            it(`should handle multiple rapid updates with large dataset [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    {
                        ...VERTICAL_BAR_OPTIONS,
                        data: LARGE_DATA,
                    },
                    { enabled: true, item: 'chart' }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                void chart.updateDelta({ data: LARGE_DATA_UPDATED });
                void chart.updateDelta({ data: generateData(LARGE_COUNT, 3) });
                void chart.updateDelta({ data: generateData(LARGE_COUNT, 4) });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });

            it(`should handle large dataset with added and removed categories [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    {
                        ...VERTICAL_BAR_OPTIONS,
                        data: LARGE_DATA,
                    },
                    { enabled: true, item: 'category' }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                // Remove half, add new ones
                const mixedData = [
                    ...generateData(LARGE_COUNT / 2, 1).slice(0, LARGE_COUNT / 4),
                    ...Array.from({ length: LARGE_COUNT / 4 }, (_, i) => ({
                        category: `New-${i}`,
                        value: ((i + 1) * 11) % 100,
                        value2: ((i + 1) * 17) % 100,
                    })),
                ];

                animate(1200, ratio);
                await chart.updateDelta({ data: mixedData });
                await compareSnapshot();
                assertBandFlashActive(chart);
            });
        }
    });

    describe('above animation threshold (>1000 items)', () => {
        const THRESHOLD_COUNT = 1001;
        const THRESHOLD_DATA = generateData(THRESHOLD_COUNT, 1);
        const THRESHOLD_DATA_UPDATED = generateData(THRESHOLD_COUNT, 2);

        for (const ratio of PHASE_RATIOS) {
            it(`should chart flash on value update [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS, data: THRESHOLD_DATA },
                    { enabled: true, item: 'chart' }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: THRESHOLD_DATA_UPDATED });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });

            it(`should chart flash with category mode when diff has no category detail [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS, data: THRESHOLD_DATA },
                    { enabled: true, item: 'category' }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                // With >1000 items the diff has empty category sets, so category mode
                // falls back to chart flash.
                animate(1200, ratio);
                await chart.updateDelta({ data: THRESHOLD_DATA_UPDATED });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });

            it(`should chart flash on rapid updates [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS, data: THRESHOLD_DATA },
                    { enabled: true, item: 'chart' }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                void chart.updateDelta({ data: THRESHOLD_DATA_UPDATED });
                void chart.updateDelta({ data: generateData(THRESHOLD_COUNT, 3) });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });
        }
    });

    describe('applyTransaction', () => {
        // Keep object references so applyTransaction can match by referential equality.
        const txData = [
            { category: 'A', value: 10, value2: 20 },
            { category: 'B', value: 20, value2: 30 },
            { category: 'C', value: 30, value2: 40 },
            { category: 'D', value: 40, value2: 50 },
        ];

        for (const ratio of PHASE_RATIOS) {
            it(`should chart flash on transaction add [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS, data: txData }, { enabled: true, item: 'chart' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.applyTransaction({
                    add: [{ category: 'E', value: 50, value2: 60 }],
                });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });

            it(`should chart flash on transaction remove [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS, data: txData }, { enabled: true, item: 'chart' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.applyTransaction({
                    remove: [txData[3]],
                });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });

            it(`should band flash on transaction with category changes [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS, data: txData },
                    { enabled: true, item: 'category' }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.applyTransaction({
                    add: [{ category: 'E', value: 50, value2: 60 }],
                });
                await compareSnapshot();
                assertBandFlashActive(chart);
            });

            it(`should chart flash on rapid transactions [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS, data: txData }, { enabled: true, item: 'chart' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                void chart.applyTransaction({
                    add: [{ category: 'E', value: 50, value2: 60 }],
                });
                await chart.applyTransaction({
                    add: [{ category: 'F', value: 60, value2: 70 }],
                });
                await compareSnapshot();
                assertChartFlashActive(chart);
            });
        }
    });

    describe('band merging', () => {
        function band(key: string, phase: 'update' | 'add' | 'remove', x: number, width: number): BandFlashDatum {
            return { firstKey: key, lastKey: key, bounds: { x, y: 0, width, height: 100 }, phase };
        }

        describe('shouldMergeBands', () => {
            it('should return true when bands are below threshold', () => {
                // 800px / 600 bands = 1.33px per band (< 2px threshold)
                expect(shouldMergeBands(600, 800)).toBe(true);
            });

            it('should return false when bands are above threshold', () => {
                // 800px / 4 bands = 200px per band (>> 2px threshold)
                expect(shouldMergeBands(4, 800)).toBe(false);
            });

            it('should return false for zero-length data', () => {
                expect(shouldMergeBands(0, 800)).toBe(false);
            });

            it('should return false for zero axis span', () => {
                expect(shouldMergeBands(600, 0)).toBe(false);
            });

            it('should return true at exactly the threshold boundary', () => {
                // 800px / 401 bands = 1.995px per band (< 2px threshold)
                expect(shouldMergeBands(401, 800)).toBe(true);
            });

            it('should return false just above the threshold', () => {
                // 800px / 400 bands = 2px per band (not < 2px)
                expect(shouldMergeBands(400, 800)).toBe(false);
            });
        });

        describe('mergeBands', () => {
            it('should skip merging when below threshold', () => {
                const data = [band('A', 'update', 0, 200), band('B', 'update', 200, 200)];
                const result = mergeBands(data, true, 800);
                expect(result).toBe(data); // same reference, untouched
            });

            it('should merge contiguous same-phase bands', () => {
                const data = [band('A', 'update', 0, 1), band('B', 'update', 1, 1), band('C', 'update', 2, 1)];
                const result = mergeBands(data, true, 3);
                expect(result).toHaveLength(1);
                expect(result[0].firstKey).toBe('A');
                expect(result[0].lastKey).toBe('C');
                expect(result[0].bounds.x).toBe(0);
                expect(result[0].bounds.width).toBe(3);
            });

            it('should not merge bands of different phases', () => {
                const data = [band('A', 'remove', 0, 1), band('B', 'update', 1, 1), band('C', 'add', 2, 1)];
                const result = mergeBands(data, true, 3);
                expect(result).toHaveLength(3);
                expect(result[0].phase).toBe('remove');
                expect(result[1].phase).toBe('update');
                expect(result[2].phase).toBe('add');
            });

            it('should sort by phase then position before merging', () => {
                // Unsorted input: add at 0, remove at 2, update at 1
                const data = [band('B', 'add', 2, 1), band('A', 'remove', 0, 1), band('C', 'update', 1, 1)];
                const result = mergeBands(data, true, 3);
                expect(result).toHaveLength(3);
                expect(result[0].phase).toBe('remove');
                expect(result[1].phase).toBe('update');
                expect(result[2].phase).toBe('add');
            });

            it('should merge non-contiguous bands within epsilon', () => {
                const data = [
                    band('A', 'update', 0, 1),
                    band('B', 'update', 1 + 1e-8, 1), // within epsilon of 1e-6
                ];
                const result = mergeBands(data, true, 2);
                expect(result).toHaveLength(1);
                expect(result[0].firstKey).toBe('A');
                expect(result[0].lastKey).toBe('B');
            });

            it('should not merge bands separated by a gap', () => {
                const data = [
                    band('A', 'update', 0, 1),
                    band('B', 'update', 5, 1), // gap of 4px
                ];
                const result = mergeBands(data, true, 6);
                expect(result).toHaveLength(2);
            });

            it('should merge overlapping same-phase bands', () => {
                const data = [
                    band('A', 'update', 0, 2),
                    band('B', 'update', 1, 2), // overlaps A
                ];
                const result = mergeBands(data, true, 3);
                expect(result).toHaveLength(1);
                expect(result[0].bounds.width).toBe(3);
            });

            it('should produce separate groups per phase with contiguous input', () => {
                // 6 contiguous bands: 3 remove, 3 update
                const data = [
                    band('A', 'remove', 0, 1),
                    band('B', 'remove', 1, 1),
                    band('C', 'remove', 2, 1),
                    band('D', 'update', 3, 1),
                    band('E', 'update', 4, 1),
                    band('F', 'update', 5, 1),
                ];
                const result = mergeBands(data, true, 6);
                expect(result).toHaveLength(2);
                expect(result[0]).toEqual(expect.objectContaining({ firstKey: 'A', lastKey: 'C', phase: 'remove' }));
                expect(result[1]).toEqual(expect.objectContaining({ firstKey: 'D', lastKey: 'F', phase: 'update' }));
            });

            it('should use y/height for vertical direction', () => {
                const data = [
                    {
                        firstKey: 'A',
                        lastKey: 'A',
                        bounds: { x: 0, y: 0, width: 100, height: 1 },
                        phase: 'update' as const,
                    },
                    {
                        firstKey: 'B',
                        lastKey: 'B',
                        bounds: { x: 0, y: 1, width: 100, height: 1 },
                        phase: 'update' as const,
                    },
                ];
                const result = mergeBands(data, false, 2);
                expect(result).toHaveLength(1);
                expect(result[0].bounds.y).toBe(0);
                expect(result[0].bounds.height).toBe(2);
            });
        });
    });

    describe('scene-graph state', () => {
        // These tests assert against the scene-graph node properties at a known mid-animation ratio
        // (0.31) where the 'update' phase is active, guaranteeing fillOpacity > 0.

        it('should have non-zero fillOpacity on chart flash rect mid-animation', async () => {
            const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'chart' });
            prepareEnterpriseTestOptions(options);

            animate(1200, 1);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            animate(1200, 0.31);
            await chart.updateDelta({ data: UPDATED_VALUES_DATA });
            await waitForChartStability(chart);

            const mod = getFlashModule(chart);
            const rect = mod.chartFlashRect;
            expect(rect.fillOpacity).toBeGreaterThan(0);
            expect(rect.fill).toBe('#cfeeff');
            expect(rect.width).toBeGreaterThan(0);
            expect(rect.height).toBeGreaterThan(0);
        });

        it('should have non-zero fillOpacity on category band rects mid-animation', async () => {
            const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'category' });
            prepareEnterpriseTestOptions(options);

            animate(1200, 1);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            animate(1200, 0.31);
            await chart.updateDelta({ data: UPDATED_VALUES_DATA });
            await waitForChartStability(chart);

            const mod = getFlashModule(chart);
            const rects: any[] = mod.bandSelection.nodes();
            const activeRects = rects.filter((r: any) => r.fillOpacity > 0);
            expect(activeRects.length).toBeGreaterThan(0);
            for (const rect of activeRects) {
                expect(rect.fill).toBe('#cfeeff');
                expect(rect.width * rect.height).toBeGreaterThan(0);
            }
        });

        it('should have zero fillOpacity when flash is suppressed', async () => {
            const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: false, item: 'chart' });
            prepareEnterpriseTestOptions(options);

            animate(1200, 1);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            animate(1200, 0.31);
            await chart.updateDelta({ data: UPDATED_VALUES_DATA });
            await waitForChartStability(chart);

            const mod = getFlashModule(chart);
            expect(mod.chartFlashRect.fillOpacity).toBe(0);
        });
    });

    describe('sequential updates', () => {
        for (const ratio of PHASE_RATIOS) {
            it(`should stop previous flash and start new one on rapid update [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'category' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                // First update (fire-and-forget)
                void chart.updateDelta({ data: UPDATED_VALUES_DATA });
                // Second rapid update replaces previous flash
                void chart.updateDelta({
                    data: [
                        { category: 'A', value: 99, value2: 99 },
                        { category: 'B', value: 99, value2: 99 },
                        { category: 'C', value: 99, value2: 99 },
                        { category: 'D', value: 99, value2: 99 },
                    ],
                });
                await compareSnapshot();
                assertBandFlashActive(chart);
            });

            it(`should handle multiple rapid updates with interleaved diff types [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'category' });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                // Fire three updates without waiting — only the last should produce a visible flash
                animate(1200, ratio);
                void chart.updateDelta({ data: UPDATED_VALUES_DATA });
                void chart.updateDelta({ data: ADDED_CATEGORY_DATA });
                void chart.updateDelta({
                    data: [
                        { category: 'A', value: 10, value2: 20 },
                        { category: 'B', value: 20, value2: 30 },
                    ],
                });
                await compareSnapshot();
                assertBandFlashActive(chart);
            });
        }
    });
});
