import type {
    AgItemShadowStyle,
    AgRadialColumnSeriesOptions,
    AgRadialColumnSeriesThemeableOptions,
    AgRadialSeriesStyle,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    barHighlightOptionsDef,
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
    number,
    positiveNumber,
    ratio,
    required,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumentedDefs,
} from 'ag-charts-core';

const radialSeriesStyleDefs = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
};
export const radialSeriesStylerDef = callbackDefs<AgRadialSeriesStyle>(radialSeriesStyleDefs);
export const radialSeriesItemStylerDef = callbackDefs<AgRadialSeriesStyle & AgItemShadowStyle>({
    ...radialSeriesStyleDefs,
    ...itemStylerCastDefs,
});

export const radialColumnSeriesThemeableOptionsDef: OptionsDefs<AgRadialColumnSeriesThemeableOptions> = {
    cornerRadius: positiveNumber,
    columnWidthRatio: ratio,
    maxColumnWidthRatio: ratio,
    styler: radialSeriesStylerDef,
    itemStyler: radialSeriesItemStylerDef,
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    glow: glowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesGlowHighlightOptionsDef(barHighlightOptionsDef, barHighlightOptionsDef),
};

export const radialColumnSeriesOptionsDef: OptionsDefs<AgRadialColumnSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...radialColumnSeriesThemeableOptionsDef,
    type: required(constant('radial-column')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    legendItemName: string,
    grouped: boolean,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
    ...undocumentedDefs({
        angleKeyAxis: string,
        radiusKeyAxis: string,
    }),
};
