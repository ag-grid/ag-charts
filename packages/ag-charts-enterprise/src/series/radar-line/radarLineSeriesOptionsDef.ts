import type { AgRadarLineSeriesOptions, AgRadarSeriesStyle, AgRadarSeriesThemeableOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    lineDashOptionsDef,
    lineHighlightOptionsDef,
    markerOptionsDefs,
    markerStyleOptionsDefs,
    multiSeriesShadowHighlightOptionsDef,
    required,
    seriesLabelOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumented,
    undocumentedLabelFitOptionsDefs,
} from 'ag-charts-core';

export const radarLineSeriesThemeableOptionsDef: OptionsDefs<AgRadarSeriesThemeableOptions> = {
    connectMissingData: boolean,
    marker: markerOptionsDefs,
    styler: callbackDefs<AgRadarSeriesStyle>({
        marker: markerStyleOptionsDefs,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    label: {
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesShadowHighlightOptionsDef(shapeHighlightOptionsDef, lineHighlightOptionsDef),
};

Object.assign(radarLineSeriesThemeableOptionsDef.label, undocumentedLabelFitOptionsDefs);

export const radarLineSeriesOptionsDef: OptionsDefs<AgRadarLineSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...radarLineSeriesThemeableOptionsDef,
    type: required(constant('radar-line')),
    angleKey: required(string),
    radiusKey: required(string),
    angleName: string,
    radiusName: string,
    legendItemName: string,
};

// @ts-expect-error undocumented option
radarLineSeriesOptionsDef.angleKeyAxis = undocumented(string);
// @ts-expect-error undocumented option
radarLineSeriesOptionsDef.radiusKeyAxis = undocumented(string);
