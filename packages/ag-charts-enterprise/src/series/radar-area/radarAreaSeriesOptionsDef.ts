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
    undocumentedDefs,
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
        ...undocumentedLabelFitOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesShadowHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

export const radarAreaSeriesOptionsDef: OptionsDefs<AgRadarAreaSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...radarAreaSeriesThemeableOptionsDef,
    type: required(constant('radar-area')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    legendItemName: string,
    ...undocumentedDefs({
        angleKeyAxis: string,
        radiusKeyAxis: string,
    }),
};
