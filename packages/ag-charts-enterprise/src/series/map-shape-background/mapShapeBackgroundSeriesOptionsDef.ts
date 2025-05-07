import { type AgMapShapeBackgroundOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, constant, geoJson, required } from 'ag-charts-core';

const { commonSeriesOptionsDefs, mapShapeBackgroundSeriesThemeableOptionsDef } = _ModuleSupport;

export const mapShapeBackgroundSeriesOptionsDef: OptionsDefs<AgMapShapeBackgroundOptions> = {
    ...mapShapeBackgroundSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('map-shape-background')),
    topology: geoJson,
};
