import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    colorScaleOptionsDef,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    enterprise,
    markerOptionsDefs,
    multiSeriesHighlightOptionsDef,
    number,
    positiveNumber,
    required,
    seriesLabelOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    tooltipOptionsDefs,
    undocumented,
    union,
    without,
} from 'ag-charts-core';
import type {
    AgBubbleSeriesOptions,
    AgBubbleSeriesStylerResult,
    AgBubbleSeriesThemeableOptions,
} from 'ag-charts-types';

export const bubbleSeriesThemeableOptionsDef: OptionsDefs<AgBubbleSeriesThemeableOptions> = {
    title: string,
    sizeDomain: arrayOf(number),
    minSize: positiveNumber,
    maxSize: positiveNumber,
    showInMiniChart: boolean,
    label: {
        placement: union('top', 'right', 'bottom', 'left'),
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    styler: callbackDefs<AgBubbleSeriesStylerResult>({
        ...without(markerOptionsDefs, ['size']),
        minSize: positiveNumber,
        maxSize: positiveNumber,
    }),
    maxRenderedItems: number,
    ...commonSeriesThemeableOptionsDefs,
    ...without(markerOptionsDefs, ['enabled', 'size']),
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
    colorScale: enterprise(colorScaleOptionsDef),
};

export const bubbleSeriesOptionsDef: OptionsDefs<AgBubbleSeriesOptions> = {
    ...bubbleSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('bubble')),
    xKey: required(string),
    yKey: required(string),
    sizeKey: required(string),
    labelKey: string,
    colorKey: enterprise(string),
    xName: string,
    yName: string,
    sizeName: string,
    labelName: string,
    colorName: enterprise(string),
    legendItemName: string,
    xKeyAxis: string,
    yKeyAxis: string,
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

// @ts-expect-error undocumented option
bubbleSeriesOptionsDef.selectedKey = undocumented(string);
