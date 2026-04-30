import { afterEach, describe, expect, it } from '@jest/globals';

import {
    type AgBubbleSeriesOptions,
    type AgChartOptions,
    AgCharts,
    type AgScatterSeriesOptions,
} from 'ag-charts-community';
import {
    assertTooltipSuppressedForMissing,
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

interface SuppressionCase {
    name: string;
    seriesType: 'bubble' | 'scatter';
    missingDataFill: string | undefined;
    expectsSuppression: boolean;
}

// Suppression mirrors the rendering condition: only when `missingDataFill` is configured does the
// missing-colorValue datum get a distinct fill, and only then is its tooltip suppressed. Without
// `missingDataFill`, the marker keeps its default fill and is visibly normal — its tooltip stays.
const cases: SuppressionCase[] = [
    {
        name: 'BubbleSeries with missingDataFill',
        seriesType: 'bubble',
        missingDataFill: '#cccccc',
        expectsSuppression: true,
    },
    {
        name: 'ScatterSeries with missingDataFill',
        seriesType: 'scatter',
        missingDataFill: '#cccccc',
        expectsSuppression: true,
    },
    {
        name: 'BubbleSeries without missingDataFill',
        seriesType: 'bubble',
        missingDataFill: undefined,
        expectsSuppression: false,
    },
    {
        name: 'ScatterSeries without missingDataFill',
        seriesType: 'scatter',
        missingDataFill: undefined,
        expectsSuppression: false,
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
            chart = undefined;
        }
    });

    it.each(cases)('$name', async ({ seriesType, missingDataFill, expectsSuppression }) => {
        const series: AgBubbleSeriesOptions | AgScatterSeriesOptions = {
            ...seriesBaseByType[seriesType],
            colorScale: { fills, ...(missingDataFill != null && { missingDataFill }) },
        };
        const options: AgChartOptions = prepareEnterpriseTestOptions({ data, series: [series] });

        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);

        const seriesImpl = chart.series[0] as ColorScaleSeriesLike;
        if (expectsSuppression) {
            assertTooltipSuppressedForMissing(
                seriesImpl,
                data,
                (d) => d.intensity == null,
                (i) => i
            );
        } else {
            // Default-styled markers must remain tooltip-bearing even when colorValue is null.
            const missingIndex = data.findIndex((d) => d.intensity == null);
            const presentIndex = data.findIndex((d) => d.intensity != null);
            expect(seriesImpl.getTooltipContent(missingIndex)).toBeDefined();
            expect(seriesImpl.getTooltipContent(presentIndex)).toBeDefined();
        }
    });
});
