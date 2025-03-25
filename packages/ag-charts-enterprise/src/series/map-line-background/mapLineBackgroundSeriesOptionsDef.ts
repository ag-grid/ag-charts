import { type AgMapLineBackgroundOptions } from 'ag-charts-community';
import { type OptionsDefs, constant, geoJson, lineDashOptionsDef, required, strokeOptionsDef } from 'ag-charts-core';

export const mapLineBackgroundSeriesOptionsDef: OptionsDefs<AgMapLineBackgroundOptions> = {
    type: required(constant('map-line-background')),
    topology: geoJson,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};
