import {
    type OptionsDefs,
    arrayOfDefs,
    boolean,
    callbackDefs,
    constant,
    defined,
    fillOptionsDef,
    lineDashOptionsDef,
    multiSeriesHighlightOptionsDef,
    number,
    required,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';
import type {
    AgAreaSeriesOptions,
    AgAreaSeriesStylerResult,
    AgAreaSeriesThemeableOptions,
    AgSeriesSegment,
    AgSeriesSegmentOptions,
} from 'ag-charts-types';

import {
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    interpolationOptionsDefs,
    markerOptionsDefs,
    markerStyleOptionsDefs,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    tooltipOptionsDefs,
} from '../../commonOptionsDefs';

const highlight = multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef);
const segmentOptions: OptionsDefs<AgSeriesSegmentOptions> = {
    start: defined,
    stop: defined,
    ...strokeOptionsDef,
    ...fillOptionsDef,
    ...lineDashOptionsDef,
};

const segmentation: OptionsDefs<AgSeriesSegment> = {
    key: required(union('x', 'y')),
    segments: arrayOfDefs<AgSeriesSegmentOptions>(segmentOptions, 'path segments array'),
};

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
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight,
    segmentation,
};

export const areaSeriesOptionsDef: OptionsDefs<AgAreaSeriesOptions> = {
    ...areaSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    highlight,
    type: required(constant('area')),
    xKey: required(string),
    yKey: required(string),
    xName: string,
    yName: string,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
};
