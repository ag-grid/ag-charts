import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    color,
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

// Undocumented `colorRange` — see BubbleSeriesProperties.colorRange for the rationale. Exposed
// on both the themeable and full options def so theme template injection survives user-level
// option merging. Wrapped in `enterprise()` because `colorScale` / `colorKey` are themselves
// enterprise-gated, keeping the community validator surface consistent.
// @ts-expect-error undocumented option
bubbleSeriesThemeableOptionsDef.colorRange = enterprise(undocumented(arrayOf(color)));
// @ts-expect-error undocumented option
bubbleSeriesOptionsDef.colorRange = enterprise(undocumented(arrayOf(color)));
