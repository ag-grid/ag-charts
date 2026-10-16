import { afterEach, describe, expect, it } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import { prepareTestOptions, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';
import type { AgChartInstance, AgSparklineOptions } from 'ag-charts-types';

import { setupEnterpriseModules } from '../../setup';

setupEnterpriseModules();

const DATA = [
    { x: 0, y: 0.56 },
    { x: 1, y: -0.81 },
    { x: 2, y: -0.18 },
];

describe('sparkline preset selection', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance<AgSparklineOptions>;

    afterEach(() => {
        chart?.destroy();
        (chart as unknown) = undefined;
    });

    // `selection` is not part of the sparkline option types, but the enterprise selection feature applies to its series.
    const create = async (options: AgSparklineOptions) => {
        const prepared = prepareTestOptions({ ...options, selection: { enabled: true } } as any) as AgSparklineOptions;
        chart = AgCharts.__createSparkline(prepared);
        await waitForChartStability(chart);
    };

    const selected = () => Array.from(chart.getSelection(), ({ seriesId, itemId }) => ({ seriesId, itemId }));

    it.each(['line', 'bar', 'area'] as const)(
        'round-trips a selection by the default series id for a %s sparkline',
        async (type) => {
            await create({ type, xKey: 'x', yKey: 'y', data: DATA });
            chart.setSelection([{ seriesId: 'sparkline', itemId: 1 }]);

            expect(selected()).toEqual([{ seriesId: 'sparkline', itemId: 1 }]);
        }
    );

    it('round-trips a selection by a custom series id', async () => {
        await create({ type: 'line', xKey: 'x', yKey: 'y', data: DATA, id: 'my-spark' });
        chart.setSelection([{ seriesId: 'my-spark', itemId: 1 }]);

        expect(selected()).toEqual([{ seriesId: 'my-spark', itemId: 1 }]);
    });
});
