import { describe, expect, it } from '@jest/globals';

import { type AgCartesianChartOptions, type AgChartInstance, AgCharts } from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('BarSeries', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe('with data-per-series', () => {
        const options: AgCartesianChartOptions = {
            series: [
                {
                    type: 'bar',
                    xKey: 'product',
                    yKey: 'value',
                    yName: 'iPhone',
                    data: [{ product: 'iPhone', value: 140 }],
                },
                {
                    type: 'bar',
                    xKey: 'product',
                    yKey: 'value',
                    yName: 'Mac',
                    data: [{ product: 'Mac', value: 20 }],
                },
            ],
        };

        beforeEach(async () => {
            chart = AgCharts.create(
                prepareEnterpriseTestOptions({ ...options, animation: { enabled: true, duration: 10_000 } })
            );

            await waitForChartStability(chart);
        });

        it('should initially animate', () => {
            const {
                ctx: { animationManager },
            } = deproxy(chart);

            const remainingAnimationTime = animationManager.getRemainingTime('initial');
            expect(remainingAnimationTime).toBeGreaterThan(6000);
        });
    });
});
