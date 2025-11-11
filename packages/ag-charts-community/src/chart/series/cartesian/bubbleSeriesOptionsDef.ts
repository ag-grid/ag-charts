import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    constant,
    multiSeriesHighlightOptionsDef,
    number,
    positiveNumber,
    required,
    shapeHighlightOptionsDef,
    string,
    undocumented,
    union,
    without,
} from 'ag-charts-core';
import type {
    AgBubbleSeriesOptions,
    AgBubbleSeriesStylerResult,
    AgBubbleSeriesThemeableOptions,
} from 'ag-charts-types';

import {
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    markerOptionsDefs,
    seriesLabelOptionsDefs,
    tooltipOptionsDefs,
} from '../../commonOptionsDefs';

export const bubbleSeriesThemeableOptionsDef: OptionsDefs<AgBubbleSeriesThemeableOptions> = {
    title: string,
    domain: arrayOf(number),
    maxSize: positiveNumber,
    showInMiniChart: boolean,
    label: {
        placement: union('top', 'right', 'bottom', 'left'),
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    styler: callbackDefs<AgBubbleSeriesStylerResult>({
        ...markerOptionsDefs,
        maxSize: positiveNumber,
    }),
    maxRenderedItems: number,
    ...commonSeriesThemeableOptionsDefs,
    ...without(markerOptionsDefs, ['enabled']),
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

export const bubbleSeriesOptionsDef: OptionsDefs<AgBubbleSeriesOptions> = {
    ...bubbleSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('bubble')),
    xKey: required(string),
    yKey: required(string),
    sizeKey: required(string),
    labelKey: string,
    xName: string,
    yName: string,
    sizeName: string,
    labelName: string,
    legendItemName: string,
    xKeyAxis: string,
    yKeyAxis: string,
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

// @ts-expect-error undocumented option
bubbleSeriesOptionsDef.xFilterKey = undocumented(string);
// @ts-expect-error undocumented option
bubbleSeriesOptionsDef.yFilterKey = undocumented(string);
// @ts-expect-error undocumented option
bubbleSeriesOptionsDef.sizeFilterKey = undocumented(string);
