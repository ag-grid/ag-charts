import { afterEach, describe, it } from '@jest/globals';

import {
    type AgBubbleSeriesOptions,
    type AgChartOptions,
    AgCharts,
    type AgScatterSeriesOptions,
} from 'ag-charts-community';
import {
    assertTooltipPresentForAll,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from './utils';

interface ColorScaleSeriesLike {
    getTooltipContent(datumIndex: number): unknown;
}

const fills = [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }];

const data: Array<{ x: number; y: number; size: number; intensity?: number | null }> = [
    { x: 1, y: 1, size: 5, intensity: 10 },
    { x: 2, y: 2, size: 5, intensity: null },
    { x: 3, y: 3, size: 5 },
    { x: 4, y: 4, size: 5, intensity: 20 },
];

const seriesBaseByType = {
    bubble: { type: 'bubble' as const, xKey: 'x', yKey: 'y', sizeKey: 'size', colorKey: 'intensity' },
    scatter: { type: 'scatter' as const, xKey: 'x', yKey: 'y', colorKey: 'intensity' },
};

interface PresenceCase {
    name: string;
    seriesType: 'bubble' | 'scatter';
    missingDataFill: string | undefined;
}

// Tier-2 colour-scale series (bubble, scatter) keep the tooltip on missing-colour datums:
// the marker, label and geometry exist independently of colour, so the mark stays queryable.
// `missingDataFill` is a cosmetic override — it does not change tooltip behaviour.
const cases: PresenceCase[] = [
    { name: 'BubbleSeries with missingDataFill', seriesType: 'bubble', missingDataFill: '#cccccc' },
    { name: 'ScatterSeries with missingDataFill', seriesType: 'scatter', missingDataFill: '#cccccc' },
    { name: 'BubbleSeries without missingDataFill', seriesType: 'bubble', missingDataFill: undefined },
    { name: 'ScatterSeries without missingDataFill', seriesType: 'scatter', missingDataFill: undefined },
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
            chart = undefined;
        }
    });

    it.each(cases)('$name', async ({ seriesType, missingDataFill }) => {
        const series: AgBubbleSeriesOptions | AgScatterSeriesOptions = {
            ...seriesBaseByType[seriesType],
            colorScale: { fills, ...(missingDataFill != null && { missingDataFill }) },
        };
        const options: AgChartOptions = prepareEnterpriseTestOptions({ data, series: [series] });

        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);

        const seriesImpl = chart.series[0] as ColorScaleSeriesLike;
        assertTooltipPresentForAll(
            seriesImpl,
            data,
            (d) => d.intensity == null,
            (i) => i
        );
    });
});
