import {
    type OptionsDefs,
    boolean,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    multiSeriesHighlightOptionsDef,
    number,
    required,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
} from 'ag-charts-core';
import type { AgAreaSeriesOptions, AgAreaSeriesThemeableOptions } from 'ag-charts-types';

import {
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    interpolationOptionsDefs,
    markerOptionsDefs,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    tooltipOptionsDefs,
} from '../../commonOptionsDefs';

const highlight = multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef);

export const areaSeriesThemeableOptionsDef: OptionsDefs<AgAreaSeriesThemeableOptions> = {
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationOptionsDefs,
    label: seriesLabelOptionsDefs,
    marker: markerOptionsDefs,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight,
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
