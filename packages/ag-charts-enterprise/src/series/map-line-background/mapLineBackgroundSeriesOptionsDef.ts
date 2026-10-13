import type { AgMapLineBackgroundOptions, AgMapLineBackgroundThemeableOptions } from 'ag-charts-community';
import { type OptionsDefs, constant, geoJson, lineDashOptionsDef, required, strokeOptionsDef } from 'ag-charts-core';

export const mapLineBackgroundSeriesThemeableOptionsDef: OptionsDefs<AgMapLineBackgroundThemeableOptions> = {
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const mapLineBackgroundSeriesOptionsDef: OptionsDefs<AgMapLineBackgroundOptions> = {
    ...mapLineBackgroundSeriesThemeableOptionsDef,
    type: required(constant('map-line-background')),
    topology: geoJson,
};
