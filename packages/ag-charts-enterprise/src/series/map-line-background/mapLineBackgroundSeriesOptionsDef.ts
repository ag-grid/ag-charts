import { type AgMapLineBackgroundOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, constant, geoJson, required } from 'ag-charts-core';

const { mapLineBackgroundSeriesThemeableOptionsDef } = _ModuleSupport;

export const mapLineBackgroundSeriesOptionsDef: OptionsDefs<AgMapLineBackgroundOptions> = {
    ...mapLineBackgroundSeriesThemeableOptionsDef,
    type: required(constant('map-line-background')),
    topology: geoJson,
};
