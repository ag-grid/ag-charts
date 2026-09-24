import {
    AreaSeriesModule,
    BarSeriesModule,
    BubbleSeriesModule,
    HistogramSeriesModule,
    LineSeriesModule,
    ScatterSeriesModule,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    array,
    arrayOf,
    attachDescription,
    boolean,
    callbackOf,
    color,
    fontOptionsDef,
    isObject,
    number,
    numberFormatValidator,
    optionsDefs,
    or,
    padding,
    partial,
    positiveNumber,
    ratio,
    textOrSegments,
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

import { BoxPlotSeriesModule } from '../../series/box-plot/boxPlotModule';
import { CandlestickSeriesModule } from '../../series/candlestick/candlestickModule';
import { HeatmapSeriesModule } from '../../series/heatmap/heatmapModule';
import { OhlcSeriesModule } from '../../series/ohlc/ohlcModule';
import { RangeAreaSeriesModule } from '../../series/range-area/rangeAreaModule';
import { RangeBarSeriesModule } from '../../series/range-bar/rangeBarModule';
import { WaterfallSeriesModule } from '../../series/waterfall/waterfallModule';

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

// A function body keeps the series module references out of the top-level scope, so they tree-shake.
function miniChartSeriesDefs() {
    return typeUnion<Required<AgMiniChartSeriesOptions>>(
        {
            area: partial(without(AreaSeriesModule.options, [...commonIgnoredMiniChartProperties, 'type'])),
            bar: partial(without(BarSeriesModule.options, [...barIgnoredMiniChartProperties, 'type'])),
            'box-plot': partial(without(BoxPlotSeriesModule.options, [...boxPlotIngnoredMiniChartProperties, 'type'])),
            bubble: partial(without(BubbleSeriesModule.options, [...bubbleIgnoredMiniChartProperties, 'type'])),
            candlestick: partial(
                without(CandlestickSeriesModule.options, [...commonIgnoredMiniChartProperties, 'type'])
            ),
            heatmap: partial(without(HeatmapSeriesModule.options, [...heatmapIgnoredMiniChartProperties, 'type'])),
            histogram: partial(
                without(HistogramSeriesModule.options, [...histogramIgnoredMiniChartProperties, 'type'])
            ),
            line: partial(without(LineSeriesModule.options, [...lineIgnoredMiniChartProperties, 'type'])),
            ohlc: partial(without(OhlcSeriesModule.options, [...commonIgnoredMiniChartProperties, 'type'])),
            'range-area': partial(
                without(RangeAreaSeriesModule.options, [...rangeAreaIgnoredMiniChartProperties, 'type'])
            ),
            'range-bar': partial(
                without(RangeBarSeriesModule.options, [...rangeBarIgnoredMiniChartProperties, 'type'])
            ),
            scatter: partial(without(ScatterSeriesModule.options, [...scatterIgnoredMiniChartProperties, 'type'])),
            waterfall: partial(
                without(WaterfallSeriesModule.options, [...waterfallIgnoredMiniChartProperties, 'type'])
            ),
        },
        'miniChart series options'
    );
}

// Validation runs before and after theming. An item without `type` can only be matched to a series def
// once the theme has filled it in, so the pre-theme pass accepts it as a bare object.
const untypedMiniChartSeries = attachDescription((value) => isObject(value) && value.type == null, 'an object');

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
        padding: padding,
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
        series: arrayOf(or(untypedMiniChartSeries, optionsDefs(miniChartSeriesDefs())), 'miniChart series options'),
    },
};
