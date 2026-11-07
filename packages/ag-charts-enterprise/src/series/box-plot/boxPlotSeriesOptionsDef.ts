import type {
    AgBoxPlotHighlightStyleOptions,
    AgBoxPlotSeriesOptions,
    AgBoxPlotSeriesStyle,
    AgBoxPlotSeriesThemeableOptions,
    AgItemShadowStyle,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    glowOptionsDefs,
    itemStylerCastDefs,
    lineDashOptionsDef,
    multiSeriesGlowHighlightOptionsDef,
    positiveNumber,
    positiveNumberNonZero,
    ratio,
    required,
    shadowOptionsDefs,
    shapeSegmentation,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    union,
} from 'ag-charts-core';

const boxPlotStyleOptionsDef: OptionsDefs<AgBoxPlotSeriesStyle> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
    whisker: {
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    cap: {
        lengthRatio: ratio,
    },
};

const boxPlotHighlightStyleOptionsDef: OptionsDefs<AgBoxPlotHighlightStyleOptions> = {
    ...boxPlotStyleOptionsDef,
    opacity: ratio,
};

const boxPlotStylerDefs = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
    whisker: {
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    cap: {
        lengthRatio: ratio,
    },
};
const boxPlotStyler = callbackDefs<AgBoxPlotSeriesStyle>(boxPlotStylerDefs);
const boxPlotItemStyler = callbackDefs<AgBoxPlotSeriesStyle & AgItemShadowStyle>({
    ...boxPlotStylerDefs,
    ...itemStylerCastDefs,
});

export const boxPlotSeriesThemeableOptionsDef: OptionsDefs<AgBoxPlotSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    showInMiniChart: boolean,
    styler: boxPlotStyler,
    itemStyler: boxPlotItemStyler,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    glow: glowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...boxPlotStyleOptionsDef,
    highlight: multiSeriesGlowHighlightOptionsDef(boxPlotHighlightStyleOptionsDef, boxPlotHighlightStyleOptionsDef),
    segmentation: shapeSegmentation,
    width: positiveNumberNonZero,
    widthRatio: ratio,
};

export const boxPlotSeriesOptionsDef: OptionsDefs<AgBoxPlotSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...boxPlotSeriesThemeableOptionsDef,
    type: required(constant('box-plot')),
    xKey: required(string),
    minKey: required(string),
    q1Key: required(string),
    medianKey: required(string),
    q3Key: required(string),
    maxKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    yName: string,
    minName: string,
    q1Name: string,
    medianName: string,
    q3Name: string,
    maxName: string,
    grouped: boolean,
    legendItemName: string,
    segmentation: shapeSegmentation,
    width: positiveNumberNonZero,
    widthRatio: ratio,
};
