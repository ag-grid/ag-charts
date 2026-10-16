import type { AgMapShapeBackgroundOptions, AgMapShapeBackgroundThemeableOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    geoJson,
    lineDashOptionsDef,
    required,
    strokeOptionsDef,
    without,
} from 'ag-charts-core';

export const mapShapeBackgroundSeriesThemeableOptionsDef: OptionsDefs<AgMapShapeBackgroundThemeableOptions> = {
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const mapShapeBackgroundSeriesOptionsDef: OptionsDefs<AgMapShapeBackgroundOptions> = {
    ...mapShapeBackgroundSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['focusIndex']),
    type: required(constant('map-shape-background')),
    topology: geoJson,
};
