import { afterEach, describe, it } from 'vitest';

import {
    type AgBubbleSeriesOptions,
    type AgChartOptions,
    AgCharts,
    type AgScatterSeriesOptions,
} from 'ag-charts-community';
import {
    assertTooltipPresentForAll,
    deproxy,
    hoverAction,
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

    let capturedFill: unknown;

    const swatchFillCases: Array<
        | { seriesType: 'bubble'; build: (missingDataFill: string) => AgBubbleSeriesOptions }
        | { seriesType: 'scatter'; build: (missingDataFill: string) => AgScatterSeriesOptions }
    > = [
        {
            seriesType: 'bubble',
            build: (missingDataFill) => ({
                ...seriesBaseByType.bubble,
                colorScale: { fills, missingDataFill },
                tooltip: {
                    renderer: (params) => {
                        capturedFill = params.fill;
                        return '';
                    },
                },
            }),
        },
        {
            seriesType: 'scatter',
            build: (missingDataFill) => ({
                ...seriesBaseByType.scatter,
                colorScale: { fills, missingDataFill },
                tooltip: {
                    renderer: (params) => {
                        capturedFill = params.fill;
                        return '';
                    },
                },
            }),
        },
    ];

    it.each(swatchFillCases)(
        '$seriesType tooltip swatch uses missingDataFill for missing-colour datum',
        async ({ build }) => {
            const missingDataFill = 'tomato';
            const options: AgChartOptions = prepareEnterpriseTestOptions({
                data,
                series: [build(missingDataFill)],
            });

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const markerAt = (predicate: (d: (typeof data)[number]) => boolean) => {
                const datumIndex = data.findIndex(predicate);
                const node = chart.series[0].contextNodeData?.nodeData?.[datumIndex];
                if (node?.midPoint == null) throw new Error(`No rendered marker at index ${datumIndex}`);
                return node.midPoint as { x: number; y: number };
            };

            const missingMarker = markerAt((d) => d.intensity == null);
            await hoverAction(missingMarker.x, missingMarker.y)(chart);
            await waitForChartStability(chart);
            expect(capturedFill).toBe(missingDataFill);
        }
    );
});
