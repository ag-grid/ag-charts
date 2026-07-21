import {
    type OptionsDefs,
    and,
    arrayLength,
    arrayOf,
    boolean,
    callbackDefs,
    colorScaleOptionsDef,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    enterprise,
    labelCollisionFitOptionsDefs,
    labelCollisionPlacementDef,
    labelPlacementStyleDefs,
    markerOptionsDefs,
    multiSeriesHighlightOptionsDef,
    number,
    numericValue,
    positiveNumber,
    required,
    seriesLabelOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    tooltipOptionsDefs,
    undocumented,
    without,
} from 'ag-charts-core';
import type {
    AgBubbleSeriesOptions,
    AgBubbleSeriesStylerResult,
    AgBubbleSeriesThemeableOptions,
} from 'ag-charts-types';

export const bubbleSeriesThemeableOptionsDef: OptionsDefs<AgBubbleSeriesThemeableOptions> = {
    title: string,
    sizeDomain: and(arrayOf(numericValue), arrayLength(2, 2)),
    minSize: positiveNumber,
    maxSize: positiveNumber,
    showInMiniChart: boolean,
    label: {
        placement: labelCollisionPlacementDef,
        spacing: positiveNumber,
        ...seriesLabelOptionsDefs,
        ...labelCollisionFitOptionsDefs,
        ...labelPlacementStyleDefs,
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

// WARNING! This selectedKey is related to cross-filtering which is not an officially documented or supported
// feature. It has nothing to do with the official data selection API in the options contract. Do not use, or use with
// extreme caution.
// @ts-expect-error undocumented option
bubbleSeriesOptionsDef.selectedKey = undocumented(string);
