import type {
    AgWaterfallSeriesItemOptions,
    AgWaterfallSeriesOptions,
    AgWaterfallSeriesStyle,
    AgWaterfallSeriesThemeableOptions,
    WaterfallSeriesTotalMeta,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOfDefs,
    boolean,
    callbackDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    labelAutoFontSizeOptionsDefs,
    labelCollisionFitOptionsDefs,
    labelOrientationDef,
    labelPlacementStyleDefs,
    lineDashOptionsDef,
    positiveNumber,
    positiveNumberNonZero,
    ratio,
    required,
    seriesLabelOptionsDefs,
    shadowHighlightOptionsDef,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    union,
    unionOrArray,
    without,
} from 'ag-charts-core';

const waterfallPlacementDef = unionOrArray(
    'inside-start',
    'inside-center',
    'inside-end',
    'outside-start',
    'outside-end'
);

const waterfallSeriesLabelOptionsDef = {
    ...seriesLabelOptionsDefs,
    ...labelCollisionFitOptionsDefs,
    ...labelAutoFontSizeOptionsDefs,
    ...labelPlacementStyleDefs,
    placement: waterfallPlacementDef,
    orientation: labelOrientationDef,
    spacing: positiveNumber,
};

const waterfallSeriesItemOptionsDef: OptionsDefs<AgWaterfallSeriesItemOptions<any>> = {
    name: string,
    cornerRadius: positiveNumber,
    itemStyler: callbackDefs<AgWaterfallSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cornerRadius: positiveNumber,
    }),
    label: waterfallSeriesLabelOptionsDef,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const waterfallSeriesThemeableOptionsDef: OptionsDefs<AgWaterfallSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    showInMiniChart: boolean,
    item: {
        positive: waterfallSeriesItemOptionsDef,
        negative: waterfallSeriesItemOptionsDef,
        total: waterfallSeriesItemOptionsDef,
    },
    label: waterfallSeriesLabelOptionsDef,
    line: {
        enabled: boolean,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    width: positiveNumberNonZero,
    widthRatio: ratio,
    ...commonSeriesThemeableOptionsDefs,
    highlight: shadowHighlightOptionsDef(shapeHighlightOptionsDef),
};

export const waterfallSeriesOptionsDef: OptionsDefs<AgWaterfallSeriesOptions> = {
    ...waterfallSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlight']),
    type: required(constant('waterfall')),
    xKey: required(string),
    yKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    yName: string,
    totals: arrayOfDefs<WaterfallSeriesTotalMeta>(
        {
            totalType: required(union('total', 'subtotal')),
            index: required(positiveNumber),
            axisLabel: required(string),
            itemId: string,
        },
        'a total definition options array'
    ),
    width: positiveNumberNonZero,
};
