import type {
    AgRadarAreaSeriesOptions,
    AgRadarAreaSeriesStyle,
    AgRadarAreaSeriesThemeableOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    markerOptionsDefs,
    markerStyleOptionsDefs,
    multiSeriesShadowHighlightOptionsDef,
    required,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumented,
    undocumentedLabelFitOptionsDefs,
} from 'ag-charts-core';

export const radarAreaSeriesThemeableOptionsDef: OptionsDefs<AgRadarAreaSeriesThemeableOptions> = {
    connectMissingData: boolean,
    marker: markerOptionsDefs,
    styler: callbackDefs<AgRadarAreaSeriesStyle>({
        marker: markerStyleOptionsDefs,
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    label: {
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesShadowHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

Object.assign(radarAreaSeriesThemeableOptionsDef.label, undocumentedLabelFitOptionsDefs);

export const radarAreaSeriesOptionsDef: OptionsDefs<AgRadarAreaSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...radarAreaSeriesThemeableOptionsDef,
    type: required(constant('radar-area')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    legendItemName: string,
};

// @ts-expect-error undocumented option
radarAreaSeriesOptionsDef.angleKeyAxis = undocumented(string);
// @ts-expect-error undocumented option
radarAreaSeriesOptionsDef.radiusKeyAxis = undocumented(string);
