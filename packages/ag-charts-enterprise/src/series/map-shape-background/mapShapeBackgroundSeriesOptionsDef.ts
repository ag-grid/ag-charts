import type { AgMapShapeBackgroundOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    commonSeriesOptionsDefs,
    constant,
    geoJson,
    mapShapeBackgroundSeriesThemeableOptionsDef,
    required,
} from 'ag-charts-core';

export const mapShapeBackgroundSeriesOptionsDef: OptionsDefs<AgMapShapeBackgroundOptions> = {
    ...mapShapeBackgroundSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('map-shape-background')),
    topology: geoJson,
};
