import { describe, expect, it } from '@jest/globals';

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
});
