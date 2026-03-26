import { type AgMapShapeBackgroundOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, commonSeriesOptionsDefs, constant, geoJson, required } from 'ag-charts-core';

const { mapShapeBackgroundSeriesThemeableOptionsDef } = _ModuleSupport;

export const mapShapeBackgroundSeriesOptionsDef: OptionsDefs<AgMapShapeBackgroundOptions> = {
    ...mapShapeBackgroundSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('map-shape-background')),
    topology: geoJson,
};
