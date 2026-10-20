import { describe, expect, it } from 'vitest';

import { type AgCartesianChartOptions, type AgChartInstance, AgCharts } from 'ag-charts-community';
import {
    deproxy,
    expectWarningsCalls,
    setupMockCanvas,
    setupMockConsole,
    syncGroupSize,
    syncedPeakChartOptions,
    syncedYDomain,
    waitForChartStability,
} from 'ag-charts-community-test';
import { ChartAxisDirection } from 'ag-charts-core';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import { BAR_SHARED_Y_AXIS } from './test/examples';

describe('ChartSync', () => {
    setupMockConsole();

    let charts: AgChartInstance<AgCartesianChartOptions>[];
    setupMockCanvas();

    afterEach(() => {
        if (charts != null) {
            for (const c of charts) {
                c.destroy();
            }
            (charts as unknown) = undefined;
        }
    });

    const waitForAllChartStability = async () => {
        for (const chart of charts) {
            await waitForChartStability(chart);
        }
    };

    // Bespoke: the synced charts are all created before any is awaited for stability, which the factory cannot do.
    describe('domain synchronization between charts', () => {
        beforeEach(async () => {
            charts = BAR_SHARED_Y_AXIS.map((o) => prepareEnterpriseTestOptions({ ...o })).map((o) =>
                AgCharts.create(o)
            );

            await waitForAllChartStability();
        });

        it('should render the same Y-axis domain', () => {
            for (const chart of charts) {
                const { axes } = deproxy(chart);

                const yAxes = axes.filter((a) => a.direction === ChartAxisDirection.Y);

                expect(yAxes).toHaveLength(1);
                expect(yAxes[0].dataDomain.domain).toEqual([0, 5990]);
            }
        });

        it('should adjust the Y-axis domain on legend toggle', async () => {
            const options = charts[1].getOptions();
            await charts[1].update({
                ...options,
                series: [
                    ...options.series!.map((s, i) => {
                        if (i === 2) {
                            return { ...s, visible: false };
                        }
                        return s;
                    }),
                ],
            });

            for (const chart of charts) {
                const { axes } = deproxy(chart);

                const yAxes = axes.filter((a) => a.direction === ChartAxisDirection.Y);

                expect(yAxes).toHaveLength(1);
                expect(yAxes[0].dataDomain.domain).toEqual([0, 4898]);
            }
        });
    });

    describe('animation on initial load', () => {
        beforeEach(async () => {
            charts = [...BAR_SHARED_Y_AXIS, ...BAR_SHARED_Y_AXIS]
                .map((o) => prepareEnterpriseTestOptions({ ...o, animation: { enabled: true, duration: 10_000 } }))
                .map((o) => AgCharts.create(o));

            await waitForAllChartStability();
        });

        it('should allow all charts to initially animate', () => {
            const remainingAnimationTime = charts.map((c) => {
                const {
                    ctx: { animationManager },
                } = deproxy(c);

                return animationManager.getRemainingTime('initial');
            });

            expect(remainingAnimationTime[0]).toBeGreaterThan(6000);
            expect(remainingAnimationTime[1]).toBeGreaterThan(6000);
            expect(remainingAnimationTime[2]).toBeGreaterThan(6000);
            expect(remainingAnimationTime[3]).toBeGreaterThan(6000);
        });
    });

    describe('axes without series of their own', () => {
        const sharedAxesChart = (yKeyAxis: string, axes: 'x' | 'xy'): AgCartesianChartOptions =>
            prepareEnterpriseTestOptions({
                data: [
                    { x: 'a', y: 1 },
                    { x: 'b', y: 2 },
                ],
                series: [{ type: 'bar', xKey: 'x', yKey: 'y', yKeyAxis }],
                axes: {
                    x: { type: 'category' },
                    y: { type: 'number', position: 'left' },
                    ySecondary: { type: 'number', position: 'right' },
                },
                sync: { axes },
            } as AgCartesianChartOptions);

        it('should only warn about an unused axis that sync does not cover', async () => {
            charts = [
                AgCharts.create(sharedAxesChart('y', 'xy')),
                AgCharts.create(sharedAxesChart('ySecondary', 'xy')),
                AgCharts.create(sharedAxesChart('ySecondary', 'x')),
            ];
            await waitForAllChartStability();

            expectWarningsCalls().toEqual([['AG Charts - `axes.y` is not used by any series.']]);
        });
    });

    describe('bigint domain synchronization (AG-16608)', () => {
        const BIG = 9_007_199_254_740_993n; // Number.MAX_SAFE_INTEGER + 2
        const bigintLineChart = (data: object[]): AgCartesianChartOptions =>
            prepareEnterpriseTestOptions({
                data,
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                sync: { axes: 'y' },
            } as AgCartesianChartOptions);

        it('should converge both charts onto the union bigint Y-domain', async () => {
            const bigintData = [
                { x: 0, y: BIG },
                { x: 1, y: BIG * 3n },
                { x: 2, y: BIG * 2n },
                { x: 3, y: BIG * 4n },
            ];
            // The second chart carries a larger maximum, so a working sync must widen the first chart's
            // domain to match.
            charts = [
                AgCharts.create(bigintLineChart(bigintData)),
                AgCharts.create(bigintLineChart([...bigintData, { x: 4, y: BIG * 8n }])),
            ];
            await waitForAllChartStability();

            expect(syncedYDomain(charts[0])).toEqual([BIG, BIG * 8n]);
            expect(syncedYDomain(charts[1])).toEqual([BIG, BIG * 8n]);
        });
    });

    describe('group membership changes', () => {
        let groupCount = 0;
        let groupId: string;

        beforeEach(() => {
            groupId = `membership-${groupCount++}`;
        });

        const peakChartOptions = (peak: number, xTitle?: string) =>
            prepareEnterpriseTestOptions(syncedPeakChartOptions(peak, groupId, xTitle));

        const createPeakCharts = async (peaks: number[]) => {
            charts = peaks.map((peak) => AgCharts.create(peakChartOptions(peak)));
            await waitForAllChartStability();
        };

        const yDomains = () => charts.map(syncedYDomain);

        const groupSize = (chart: AgChartInstance<AgCartesianChartOptions>) => syncGroupSize(chart, groupId);

        // Framework wrappers re-pass a fresh but equal options object to every mounted chart on each render.
        const repassOptions = (peaks: number[]) =>
            Promise.all(peaks.map((peak, i) => charts[i].update(peakChartOptions(peak))));

        it('should widen every chart to the domain of a chart that joins the group', async () => {
            await createPeakCharts([10, 20, 50]);
            expect(yDomains()).toEqual([
                [0, 50],
                [0, 50],
                [0, 50],
            ]);

            charts.push(AgCharts.create(peakChartOptions(100)));
            await waitForAllChartStability();

            expect(yDomains()).toEqual([
                [0, 100],
                [0, 100],
                [0, 100],
                [0, 100],
            ]);
            expect(charts.map(groupSize)).toEqual([4, 4, 4, 4]);
        });

        it('should widen every chart when a chart joins while the others are re-passed their options', async () => {
            await createPeakCharts([10, 20, 50]);

            charts.push(AgCharts.create(peakChartOptions(100)));
            await repassOptions([10, 20, 50, 100]);
            await waitForAllChartStability();

            expect(yDomains()).toEqual([
                [0, 100],
                [0, 100],
                [0, 100],
                [0, 100],
            ]);
            expect(charts.map(groupSize)).toEqual([4, 4, 4, 4]);
        });

        it('should widen every chart when a chart joins after the others had their axis options changed', async () => {
            await createPeakCharts([10, 20, 50]);
            await Promise.all(charts.map((chart, i) => chart.update(peakChartOptions([10, 20, 50][i], 'Years'))));
            await waitForAllChartStability();

            charts.push(AgCharts.create(peakChartOptions(100, 'Years')));
            await waitForAllChartStability();

            expect(yDomains()).toEqual([
                [0, 100],
                [0, 100],
                [0, 100],
                [0, 100],
            ]);
            expect(charts.map(groupSize)).toEqual([4, 4, 4, 4]);
        });

        it('should shrink the remaining charts to their own domain when a chart leaves the group', async () => {
            await createPeakCharts([10, 20, 50]);

            charts.pop()!.destroy();
            await waitForAllChartStability();

            expect(yDomains()).toEqual([
                [0, 20],
                [0, 20],
            ]);
            expect(charts.map(groupSize)).toEqual([2, 2]);
        });

        it('should shrink the remaining charts when a chart leaves while the others are re-passed their options', async () => {
            await createPeakCharts([10, 20, 50]);

            charts.pop()!.destroy();
            await repassOptions([10, 20]);
            await waitForAllChartStability();

            expect(yDomains()).toEqual([
                [0, 20],
                [0, 20],
            ]);
            expect(charts.map(groupSize)).toEqual([2, 2]);
        });
    });

    describe('axis compatibility validation', () => {
        const SINGLE_SERIES_WARNING =
            'AG Charts - To allow synchronization, ensure that all charts have matching min, max, nice, and reverse properties on the synchronized axes.';
        const MULTI_SERIES_WARNING =
            'AG Charts - To allow synchronization, ensure that all synchronized axes with matching keys have matching min, max, nice, and reverse properties.';

        let groupCount = 0;
        let groupId: string;

        beforeEach(() => {
            groupId = `validation-${groupCount++}`;
        });

        const yAxisChart = (y: object, seriesCount: number): AgCartesianChartOptions =>
            prepareEnterpriseTestOptions({
                width: 250,
                height: 300,
                data: [
                    { year: '2020', a: 5, b: 3 },
                    { year: '2021', a: 10, b: 6 },
                ],
                series: ['a', 'b'].slice(0, seriesCount).map((yKey) => ({ type: 'bar', xKey: 'year', yKey }) as const),
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', ...y },
                },
                sync: { groupId, axes: 'y' },
            });

        const timeAxisChart = (seriesCount: number): AgCartesianChartOptions =>
            prepareEnterpriseTestOptions({
                width: 250,
                height: 300,
                data: [
                    { date: new Date(2020, 0, 1), a: 5, b: 3 },
                    { date: new Date(2021, 0, 1), a: 10, b: 6 },
                ],
                series: ['a', 'b'].slice(0, seriesCount).map((yKey) => ({ type: 'line', xKey: 'date', yKey }) as const),
                axes: {
                    x: { type: 'time', position: 'bottom', min: new Date(2019, 0, 1), max: new Date(2022, 0, 1) },
                    y: { type: 'number', position: 'left' },
                },
                sync: { groupId, axes: 'x' },
            });

        const groupSizes = () => charts.map((chart) => syncGroupSize(chart, groupId));

        describe.each([
            ['single-series', 1, SINGLE_SERIES_WARNING],
            ['multi-series', 2, MULTI_SERIES_WARNING],
        ])('for %s charts', (_name, seriesCount, warning) => {
            it.each([
                ['min', { min: -10 }, { min: -20 }],
                ['max', { max: 100 }, { max: 200 }],
                ['reverse', { reverse: false }, { reverse: true }],
            ])('should disable synchronisation when the axes have a mismatched %s', async (_option, first, second) => {
                charts = [
                    AgCharts.create(yAxisChart(first, seriesCount)),
                    AgCharts.create(yAxisChart(second, seriesCount)),
                ];
                await waitForAllChartStability();

                expectWarningsCalls().toEqual([[warning]]);
                expect(groupSizes()).toEqual([1, 1]);
            });

            it('should keep synchronisation when the axes have equal bounds', async () => {
                charts = [
                    AgCharts.create(yAxisChart({ min: -10, max: 100, reverse: true }, seriesCount)),
                    AgCharts.create(yAxisChart({ min: -10, max: 100, reverse: true }, seriesCount)),
                ];
                await waitForAllChartStability();

                expect(groupSizes()).toEqual([2, 2]);
            });

            it('should keep synchronisation when time axes have equal date bounds', async () => {
                charts = [AgCharts.create(timeAxisChart(seriesCount)), AgCharts.create(timeAxisChart(seriesCount))];
                await waitForAllChartStability();

                expect(groupSizes()).toEqual([2, 2]);
            });

            it('should resume synchronisation when the mismatched chart is updated to match', async () => {
                charts = [
                    AgCharts.create(yAxisChart({ max: 100 }, seriesCount)),
                    AgCharts.create(yAxisChart({ max: 200 }, seriesCount)),
                ];
                await waitForAllChartStability();
                expect(groupSizes()).toEqual([1, 1]);

                await charts[1].update(yAxisChart({ max: 100 }, seriesCount));
                await waitForAllChartStability();

                expectWarningsCalls().toEqual([[warning]]);
                expect(groupSizes()).toEqual([2, 2]);
            });

            it('should resume synchronisation when charts are updated to new bounds one at a time', async () => {
                charts = [
                    AgCharts.create(yAxisChart({ max: 100 }, seriesCount)),
                    AgCharts.create(yAxisChart({ max: 100 }, seriesCount)),
                ];
                await waitForAllChartStability();

                await charts[1].update(yAxisChart({ max: 200 }, seriesCount));
                await waitForAllChartStability();
                await charts[0].update(yAxisChart({ max: 200 }, seriesCount));
                await waitForAllChartStability();

                expectWarningsCalls().toEqual([[warning]]);
                expect(groupSizes()).toEqual([2, 2]);
            });
        });

        it('should keep synchronisation when identical charts have a differently bounded secondary axis', async () => {
            const options = yAxisChart({}, 1);
            options.axes = { ...options.axes, ySecondary: { type: 'number', position: 'right', min: 0, max: 1 } };
            charts = [AgCharts.create(options), AgCharts.create(options)];
            await waitForAllChartStability();

            expect(groupSizes()).toEqual([2, 2]);
        });
    });
});
