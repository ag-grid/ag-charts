import {
    AreaSeriesModule,
    BarSeriesModule,
    BubbleSeriesModule,
    HistogramSeriesModule,
    LineSeriesModule,
    ScatterSeriesModule,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    array,
    arrayOfDefs,
    boolean,
    callbackOf,
    color,
    fontOptionsDef,
    number,
    positiveNumber,
    ratio,
    typeUnion,
    without,
} from 'ag-charts-core';
import type {
    AgMiniChartSeriesOptions,
    AgNavigatorHandleOptions,
    AgNavigatorOptions,
    BarIgnoredProperties,
    BoxPlotIgnoredProperties,
    BubbleIgnoredProperties,
    CommonIgnoredProperties,
    HeatmapIgnoredProperties,
    HistogramIgnoredProperties,
    LineIgnoredProperties,
    RangeAreaIgnoredProperties,
    RangeBarIgnoredProperties,
    ScatterIgnoredProperties,
    WaterfallIgnoredProperties,
} from 'ag-charts-types';

import { BoxPlotSeriesModule } from '../../series/box-plot';
import { CandlestickSeriesModule } from '../../series/candlestick';
import { HeatmapSeriesModule } from '../../series/heatmap';
import { OhlcSeriesModule } from '../../series/ohlc';
import { RangeAreaSeriesModule } from '../../series/range-area';
import { RangeBarSeriesModule } from '../../series/range-bar';
import { WaterfallSeriesModule } from '../../series/waterfall';

const { numberFormatValidator, textOrSegments } = _ModuleSupport;

export const navigatorHandleOptionsDef: OptionsDefs<AgNavigatorHandleOptions> = {
    width: positiveNumber,
    height: positiveNumber,
    grip: boolean,
    fill: color,
    stroke: color,
    strokeWidth: positiveNumber,
    cornerRadius: positiveNumber,
};

export const commonIgnoredMiniChartProperties: CommonIgnoredProperties[] = [
    'cursor',
    'highlightStyle',
    'listeners',
    'nodeClickRange',
    'showInLegend',
    'showInMiniChart',
    'tooltip',
    'visible',
    'xName',
    'yName',
];

export const barIgnoredMiniChartProperties: BarIgnoredProperties[] = [
    ...commonIgnoredMiniChartProperties,
    'errorBar',
    'label',
    'legendItemName',
    'direction',
];
export const boxPlotIngnoredMiniChartProperties: BoxPlotIgnoredProperties[] = [
    ...commonIgnoredMiniChartProperties,
    'direction',
    'legendItemName',
    'minName',
    'q1Name',
    'medianName',
    'q3Name',
    'maxName',
];
export const bubbleIgnoredMiniChartProperties: BubbleIgnoredProperties[] = [
    ...commonIgnoredMiniChartProperties,
    'title',
    'label',
    'labelKey',
    'labelName',
    'sizeName',
];
export const heatmapIgnoredMiniChartProperties: HeatmapIgnoredProperties[] = [
    ...commonIgnoredMiniChartProperties,
    'title',
    'label',
    'colorName',
    'textAlign',
    'verticalAlign',
    'itemPadding',
    'colorRange',
];
export const histogramIgnoredMiniChartProperties: HistogramIgnoredProperties[] = [
    ...commonIgnoredMiniChartProperties,
    'label',
];
export const lineIgnoredMiniChartProperties: LineIgnoredProperties[] = [
    ...commonIgnoredMiniChartProperties,
    'errorBar',
    'title',
    'label',
];
export const rangeAreaIgnoredMiniChartProperties: RangeAreaIgnoredProperties[] = [
    ...commonIgnoredMiniChartProperties,
    'label',
    'yLowName',
    'yHighName',
];
export const rangeBarIgnoredMiniChartProperties: RangeBarIgnoredProperties[] = [
    ...commonIgnoredMiniChartProperties,
    'direction',
    'label',
    'yLowName',
    'yHighName',
];
export const scatterIgnoredMiniChartProperties: ScatterIgnoredProperties[] = [
    ...commonIgnoredMiniChartProperties,
    'errorBar',
    'title',
    'label',
    'labelKey',
    'labelName',
];
export const waterfallIgnoredMiniChartProperties: WaterfallIgnoredProperties[] = [
    ...commonIgnoredMiniChartProperties,
    'direction',
];

export const navigatorOptionsDef: OptionsDefs<AgNavigatorOptions> = {
    enabled: boolean,
    height: positiveNumber,
    spacing: positiveNumber,
    cornerRadius: number,
    mask: {
        fill: color,
        fillOpacity: ratio,
        stroke: color,
        strokeWidth: positiveNumber,
    },
    minHandle: navigatorHandleOptionsDef,
    maxHandle: navigatorHandleOptionsDef,
    miniChart: {
        enabled: boolean,
        padding: {
            top: positiveNumber,
            bottom: positiveNumber,
        },
        label: {
            enabled: boolean,
            avoidCollisions: boolean,
            spacing: positiveNumber,
            format: numberFormatValidator,
            formatter: callbackOf(textOrSegments),
            interval: {
                minSpacing: positiveNumber,
                maxSpacing: positiveNumber,
                values: array,
                step: number,
            },
            ...fontOptionsDef,
        },
        series: arrayOfDefs(
            typeUnion<Required<AgMiniChartSeriesOptions>>(
                {
                    area: without(AreaSeriesModule.options, [...commonIgnoredMiniChartProperties, 'type']),
                    bar: without(BarSeriesModule.options, [...barIgnoredMiniChartProperties, 'type']),
                    'box-plot': without(BoxPlotSeriesModule.options, [...boxPlotIngnoredMiniChartProperties, 'type']),
                    bubble: without(BubbleSeriesModule.options, [...bubbleIgnoredMiniChartProperties, 'type']),
                    candlestick: without(CandlestickSeriesModule.options, [
                        ...commonIgnoredMiniChartProperties,
                        'type',
                    ]),
                    heatmap: without(HeatmapSeriesModule.options, [...heatmapIgnoredMiniChartProperties, 'type']),
                    histogram: without(HistogramSeriesModule.options, [...histogramIgnoredMiniChartProperties, 'type']),
                    line: without(LineSeriesModule.options, [...lineIgnoredMiniChartProperties, 'type']),
                    ohlc: without(OhlcSeriesModule.options, [...commonIgnoredMiniChartProperties, 'type']),
                    'range-area': without(RangeAreaSeriesModule.options, [
                        ...rangeAreaIgnoredMiniChartProperties,
                        'type',
                    ]),
                    'range-bar': without(RangeBarSeriesModule.options, [...rangeBarIgnoredMiniChartProperties, 'type']),
                    scatter: without(ScatterSeriesModule.options, [...scatterIgnoredMiniChartProperties, 'type']),
                    waterfall: without(WaterfallSeriesModule.options, [...waterfallIgnoredMiniChartProperties, 'type']),
                },
                'miniChart series options'
            )
        ),
    },
};
