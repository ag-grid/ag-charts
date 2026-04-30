import { afterEach, describe, expect, it } from '@jest/globals';

import {
    type AgBubbleSeriesOptions,
    type AgChartOptions,
    AgCharts,
    type AgScatterSeriesOptions,
} from 'ag-charts-community';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from './utils';

interface ColorScaleSeriesLike {
    getTooltipContent(datumIndex: number): unknown;
}

const colorScale = {
    fills: [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }],
    missingDataFill: '#cccccc',
};

const cases: Array<{ name: string; series: AgBubbleSeriesOptions | AgScatterSeriesOptions }> = [
    {
        name: 'BubbleSeries',
        series: { type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'size', colorKey: 'intensity', colorScale },
    },
    {
        name: 'ScatterSeries',
        series: { type: 'scatter', xKey: 'x', yKey: 'y', colorKey: 'intensity', colorScale },
    },
];

// AG-16046 pt2: BubbleSeries and ScatterSeries are defined in community but their `colorKey`
// option is enterprise-gated by `enterprise(string)` in their option defs. Tests that exercise
// missing-colorValue behaviour must therefore run under the enterprise registry mode set up by
// `prepareEnterpriseTestOptions`; otherwise the option is cleared and the code path is never hit.
describe('colorScale.missingDataFill - bubble/scatter', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    it.each(cases)('$name should suppress tooltips for datums with a missing colorValue', async ({ series }) => {
        const data: Array<{ x: number; y: number; size: number; intensity?: number | null }> = [
            { x: 1, y: 1, size: 5, intensity: 10 },
            { x: 2, y: 2, size: 5, intensity: null },
            { x: 3, y: 3, size: 5 },
            { x: 4, y: 4, size: 5, intensity: 20 },
        ];
        const options: AgChartOptions = prepareEnterpriseTestOptions({ data, series: [series] });

        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);

        const seriesImpl = chart.series[0] as ColorScaleSeriesLike;
        const missingIndices = data.map((d, i) => (d.intensity == null ? i : -1)).filter((i) => i >= 0);
        const presentIndex = data.findIndex((d) => d.intensity != null);
        for (const i of missingIndices) {
            expect(seriesImpl.getTooltipContent(i)).toBeUndefined();
        }
        expect(seriesImpl.getTooltipContent(presentIndex)).toBeDefined();
    });
});
