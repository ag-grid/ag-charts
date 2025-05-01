import { _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    array,
    arrayOfDefs,
    boolean,
    callback,
    color,
    fontOptionsDef,
    number,
    positiveNumber,
    ratio,
    typeUnion,
} from 'ag-charts-core';
import type {
    AgMiniChartSeriesOptions,
    AgNavigatorHandleOptions,
    AgNavigatorOptions,
    CommonIgnoredProperties,
} from 'ag-charts-types';

import { BoxPlotSeriesModule } from '../../series/box-plot';
import { CandlestickSeriesModule } from '../../series/candlestick';
import { HeatmapSeriesModule } from '../../series/heatmap';
import { OhlcSeriesModule } from '../../series/ohlc';
import { RangeAreaSeriesModule } from '../../series/range-area';
import { RangeBarSeriesModule } from '../../series/range-bar';
import { WaterfallSeriesModule } from '../../series/waterfall';

const {
    NewAreaSeriesModule,
    NewBarSeriesModule,
    NewBubbleSeriesModule,
    NewHistogramSeriesModule,
    NewLineSeriesModule,
    NewScatterSeriesModule,
    numberFormatValidator,
    without,
} = _ModuleSupport;

export const navigatorHandleOptionsDef: OptionsDefs<AgNavigatorHandleOptions> = {
    width: positiveNumber,
    height: positiveNumber,
    grip: boolean,
    fill: color,
    stroke: color,
    strokeWidth: positiveNumber,
    cornerRadius: positiveNumber,
};

const commonIgnoredMiniChartProperties: CommonIgnoredProperties[] = [
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
            formatter: callback,
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
                    area: without(NewAreaSeriesModule.options, commonIgnoredMiniChartProperties),
                    bar: without(NewBarSeriesModule.options, [
                        ...commonIgnoredMiniChartProperties,
                        'errorBar',
                        'label',
                        'legendItemName',
                        'direction',
                    ]),
                    'box-plot': without(BoxPlotSeriesModule.options, [
                        ...commonIgnoredMiniChartProperties,
                        'direction',
                        'legendItemName',
                        'minName',
                        'q1Name',
                        'medianName',
                        'q3Name',
                        'maxName',
                    ]),
                    bubble: without(NewBubbleSeriesModule.options, [
                        ...commonIgnoredMiniChartProperties,
                        'title',
                        'label',
                        'labelKey',
                        'labelName',
                        'sizeName',
                    ]),
                    candlestick: without(CandlestickSeriesModule.options, commonIgnoredMiniChartProperties),
                    heatmap: without(HeatmapSeriesModule.options, [
                        ...commonIgnoredMiniChartProperties,
                        'title',
                        'label',
                        'colorName',
                        'textAlign',
                        'verticalAlign',
                        'itemPadding',
                        'colorRange',
                    ]),
                    histogram: without(NewHistogramSeriesModule.options, [
                        ...commonIgnoredMiniChartProperties,
                        'label',
                    ]),
                    line: without(NewLineSeriesModule.options, [
                        ...commonIgnoredMiniChartProperties,
                        'errorBar',
                        'title',
                        'label',
                    ]),
                    ohlc: without(OhlcSeriesModule.options, commonIgnoredMiniChartProperties),
                    'range-area': without(RangeAreaSeriesModule.options, [
                        ...commonIgnoredMiniChartProperties,
                        'label',
                        'yLowName',
                        'yHighName',
                    ]),
                    'range-bar': without(RangeBarSeriesModule.options, [
                        ...commonIgnoredMiniChartProperties,
                        'direction',
                        'label',
                        'yLowName',
                        'yHighName',
                    ]),
                    scatter: without(NewScatterSeriesModule.options, [
                        ...commonIgnoredMiniChartProperties,
                        'errorBar',
                        'title',
                        'label',
                        'labelKey',
                        'labelName',
                    ]),
                    waterfall: without(WaterfallSeriesModule.options, [
                        ...commonIgnoredMiniChartProperties,
                        'direction',
                    ]),
                },
                undefined,
                'miniChart series options'
            )
        ),
    },
};
