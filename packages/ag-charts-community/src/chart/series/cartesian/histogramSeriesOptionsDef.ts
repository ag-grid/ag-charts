import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    callbackOf,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    glowOptionsDefs,
    itemStylerCastDefs,
    labelAutoFontSizeOptionsDefs,
    labelCollisionFitOptionsDefs,
    labelOrientationDef,
    labelPlacementStyleDefs,
    lineDashOptionsDef,
    multiSeriesGlowHighlightOptionsDef,
    number,
    positiveNumber,
    required,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    union,
    unionOrArray,
} from 'ag-charts-core';
import type {
    AgHistogramSeriesOptions,
    AgHistogramSeriesStyle,
    AgHistogramSeriesThemeableOptions,
    AgItemShadowStyle,
} from 'ag-charts-types';

const histogramStylerDefs = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
};
const histogramStyler = callbackDefs<AgHistogramSeriesStyle>(histogramStylerDefs);
const histogramItemStyler = callbackDefs<AgHistogramSeriesStyle & AgItemShadowStyle>({
    ...histogramStylerDefs,
    ...itemStylerCastDefs,
});

export const histogramSeriesThemeableOptionsDef: OptionsDefs<AgHistogramSeriesThemeableOptions> = {
    showInMiniChart: boolean,
    cornerRadius: positiveNumber,
    styler: histogramStyler,
    itemStyler: histogramItemStyler,
    label: {
        ...seriesLabelOptionsDefs,
        ...labelCollisionFitOptionsDefs,
        ...labelAutoFontSizeOptionsDefs,
        ...labelPlacementStyleDefs,
        placement: unionOrArray('inside-center', 'inside-start', 'inside-end', 'outside-start', 'outside-end'),
        spacing: positiveNumber,
        orientation: labelOrientationDef,
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    glow: glowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesGlowHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
    areaPlot: boolean,
    aggregation: union('count', 'sum', 'mean'),
    bins: arrayOf(arrayOf(number)),
    binCount: positiveNumber,
};

export const histogramSeriesOptionsDef: OptionsDefs<AgHistogramSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...histogramSeriesThemeableOptionsDef,
    type: required(constant('histogram')),
    xKey: required(string),
    yKey: string,
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    yName: string,
    getItemId: callbackOf(string),
};
