import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    colorScaleOptionsDef,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    enterprise,
    errorBarOptionsDefs,
    errorBarThemeableOptionsDefs,
    markerHighlightOptionsDef,
    markerOptionsDefs,
    multiSeriesGlowHighlightOptionsDef,
    number,
    placedSeriesLabelOptionsDefs,
    required,
    string,
    tooltipOptionsDefs,
    undocumentedDefs,
    without,
} from 'ag-charts-core';
import type {
    AgScatterSeriesOptions,
    AgScatterSeriesStylerResult,
    AgScatterSeriesThemeableOptions,
} from 'ag-charts-types';

export const scatterSeriesThemeableOptionsDef: OptionsDefs<AgScatterSeriesThemeableOptions> = {
    title: string,
    showInMiniChart: boolean,
    label: placedSeriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    errorBar: errorBarThemeableOptionsDefs,
    styler: callbackDefs<AgScatterSeriesStylerResult>(without(markerOptionsDefs, ['shadow', 'glow'])),
    maxRenderedItems: number,
    ...commonSeriesThemeableOptionsDefs,
    ...without(markerOptionsDefs, ['enabled']),
    highlight: multiSeriesGlowHighlightOptionsDef(markerHighlightOptionsDef, markerHighlightOptionsDef),
    colorScale: enterprise(colorScaleOptionsDef),
};

export const scatterSeriesOptionsDef: OptionsDefs<AgScatterSeriesOptions> = {
    ...scatterSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('scatter')),
    xKey: required(string),
    yKey: required(string),
    labelKey: string,
    colorKey: enterprise(string),
    xName: string,
    yName: string,
    labelName: string,
    colorName: enterprise(string),
    legendItemName: string,
    xKeyAxis: string,
    yKeyAxis: string,
    errorBar: errorBarOptionsDefs,
    highlight: multiSeriesGlowHighlightOptionsDef(markerHighlightOptionsDef, markerHighlightOptionsDef),
    ...undocumentedDefs({
        // WARNING: internal cross-filtering option, unrelated to the public data-selection API. Do not use.
        selectedKey: string,
    }),
};
