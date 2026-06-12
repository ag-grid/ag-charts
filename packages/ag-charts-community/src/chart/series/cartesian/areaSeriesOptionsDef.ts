import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    interpolationOptionsDefs,
    lineDashOptionsDef,
    markerOptionsDefs,
    markerStyleOptionsDefs,
    multiSeriesHighlightOptionsDef,
    number,
    required,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    shapeSegmentation,
    string,
    strokeOptionsDef,
    tooltipOptionsDefsWithArea,
    undocumented,
} from 'ag-charts-core';
import type { AgAreaSeriesOptions, AgAreaSeriesStylerResult, AgAreaSeriesThemeableOptions } from 'ag-charts-types';

const highlight = multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef);

const areaStyler = callbackDefs<AgAreaSeriesStylerResult>({
    ...strokeOptionsDef,
    ...fillOptionsDef,
    ...lineDashOptionsDef,
    marker: markerStyleOptionsDefs,
});

export const areaSeriesThemeableOptionsDef: OptionsDefs<AgAreaSeriesThemeableOptions> = {
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationOptionsDefs,
    label: seriesLabelOptionsDefs,
    styler: areaStyler,
    marker: markerOptionsDefs,
    tooltip: tooltipOptionsDefsWithArea,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight,
    segmentation: shapeSegmentation,
};

export const areaSeriesOptionsDef: OptionsDefs<AgAreaSeriesOptions> = {
    ...areaSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    highlight,
    type: required(constant('area')),
    xKey: required(string),
    yKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    yName: string,
    legendItemName: string,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
};

// WARNING! This selectedKey is related to cross-filtering which is not an officially documented or supported
// feature. It has nothing to do with the official data selection API in the options contract. Do not use, or use with
// extreme caution.
// @ts-expect-error undocumented option
areaSeriesOptionsDef.selectedKey = undocumented(string);
