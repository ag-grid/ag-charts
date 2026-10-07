import type {
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
    lineDashOptionsDef,
    multiSeriesShadowHighlightOptionsDef,
    number,
    positiveNumber,
    ratio,
    required,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumented,
} from 'ag-charts-core';

export const radialSeriesStylerDef = callbackDefs<AgRadialSeriesStyle>({
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
});

export const radialColumnSeriesThemeableOptionsDef: OptionsDefs<AgRadialColumnSeriesThemeableOptions> = {
    cornerRadius: positiveNumber,
    columnWidthRatio: ratio,
    maxColumnWidthRatio: ratio,
    styler: radialSeriesStylerDef,
    itemStyler: radialSeriesStylerDef,
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesShadowHighlightOptionsDef(barHighlightOptionsDef, barHighlightOptionsDef),
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
};

// @ts-expect-error undocumented option
radialColumnSeriesOptionsDef.angleKeyAxis = undocumented(string);
// @ts-expect-error undocumented option
radialColumnSeriesOptionsDef.radiusKeyAxis = undocumented(string);
