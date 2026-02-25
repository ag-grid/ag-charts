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

// --- Helpers ---

function withFlash(
    options: AgCartesianChartOptions,
    flashOptions: {
        enabled?: boolean;
        item?: 'chart' | 'category';
        color?: string;
        opacity?: number;
        flashDuration?: number;
        fadeDuration?: number;
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
            });

            it(`should apply custom color [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'chart', color: '#ff0000' }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
            });

            it(`should apply custom opacity [ratio ${ratio}]`, async () => {
                const options = withFlash({ ...VERTICAL_BAR_OPTIONS }, { enabled: true, item: 'chart', opacity: 0.5 });
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
            });

            it(`should apply custom flash and fade duration [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'chart', flashDuration: 500, fadeDuration: 500 }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
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
            });
        }
    });

    describe('configuration options', () => {
        for (const ratio of PHASE_RATIOS) {
            it(`should render category bands with custom color [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'category', color: '#ff6600' }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
            });

            it(`should render category bands with custom opacity [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'category', opacity: 0.3 }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
            });

            it(`should render category bands with custom timing [ratio ${ratio}]`, async () => {
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'category', flashDuration: 500, fadeDuration: 500 }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
            });
        }
    });

    describe('duration semantics', () => {
        for (const ratio of PHASE_RATIOS) {
            it(`should hold flash with flashDuration only [ratio ${ratio}]`, async () => {
                // flashProportion = 1.0, ease = () => 0 (constant hold at full opacity)
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'chart', flashDuration: 1000, fadeDuration: 0 }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
            });

            it(`should fade linearly with fadeDuration only [ratio ${ratio}]`, async () => {
                // flashProportion = 0, ease = (t) => t (pure linear fade, no hold period)
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'chart', flashDuration: 0, fadeDuration: 1000 }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
            });

            it(`should cap duration at MAX_ANIMATION_DURATION_RATIO [ratio ${ratio}]`, async () => {
                // total = 50000ms, duration ratio = min(50000/1000, 2) = 2 (capped)
                const options = withFlash(
                    { ...VERTICAL_BAR_OPTIONS },
                    { enabled: true, item: 'chart', flashDuration: 25000, fadeDuration: 25000 }
                );
                prepareEnterpriseTestOptions(options);

                animate(1200, 1);
                chart = AgCharts.create(options);
                await waitForChartStability(chart);

                animate(1200, ratio);
                await chart.updateDelta({ data: UPDATED_VALUES_DATA });
                await compareSnapshot();
            });
        }
    });

    describe('large dataset', () => {
        function generateData(count: number, seed = 1) {
            return Array.from({ length: count }, (_, i) => ({
                category: `Cat-${i}`,
                value: ((seed * (i + 1) * 7) % 100) + 1,
                value2: ((seed * (i + 1) * 13) % 100) + 1,
            }));
        }

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
            });
        }
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
            });
        }
    });
});
