import { afterEach, describe, expect, it } from 'vitest';

import { ChartUpdateType } from 'ag-charts-core';
import type { AgCartesianChartOptions, AgChartInstance } from 'ag-charts-types';

import {
    createChart,
    deproxy,
    emitFontLoad,
    setupMockCanvas,
    setupMockConsole,
    spyOnAxisTickLayout,
    waitForChartStability,
} from '../test/utils';

const OPTIONS: AgCartesianChartOptions = {
    data: [
        { month: 'Jan', value: 162 },
        { month: 'Mar', value: 302 },
        { month: 'May', value: 800 },
    ],
    series: [{ type: 'line', xKey: 'month', yKey: 'value' }],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
};

describe('Axis font loading', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: AgChartInstance | undefined;

    afterEach(() => {
        chart?.destroy();
        chart = undefined;
    });

    it('re-measures tick layouts when fonts load', async () => {
        chart = await createChart(OPTIONS);
        const calculateTickLayout = spyOnAxisTickLayout(chart, 'bottom');

        // A layout with no domain/range change must hit the cache, or the second assertion is vacuous.
        deproxy(chart).update(ChartUpdateType.PERFORM_LAYOUT);
        await waitForChartStability(chart);
        expect(calculateTickLayout).not.toHaveBeenCalled();

        await emitFontLoad(chart);
        expect(calculateTickLayout).toHaveBeenCalled();
    });
});
