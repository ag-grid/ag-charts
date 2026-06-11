import { describe, expect, it } from 'vitest';

import { type AgCartesianChartOptions, type AgChartInstance, AgCharts } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import { ChartAxisDirection } from 'ag-charts-core';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import { BAR_SHARED_Y_AXIS } from './test/examples';

describe('ChartSync', () => {
    setupMockConsole();

    let charts: AgChartInstance<AgCartesianChartOptions>[];
    setupMockCanvas();

    afterEach(() => {
        if (charts) {
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

            const yDomain = (c: AgChartInstance<AgCartesianChartOptions>) =>
                deproxy(c).axes.find((axis) => axis.direction === ChartAxisDirection.Y)!.dataDomain.domain;
            expect(yDomain(charts[0])).toEqual(yDomain(charts[1]));
        });
    });
});
