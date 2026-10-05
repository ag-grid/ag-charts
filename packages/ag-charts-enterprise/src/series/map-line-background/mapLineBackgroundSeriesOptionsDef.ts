import type { AgMapLineBackgroundOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    constant,
    geoJson,
    mapLineBackgroundSeriesThemeableOptionsDef,
    required,
} from 'ag-charts-core';

export const mapLineBackgroundSeriesOptionsDef: OptionsDefs<AgMapLineBackgroundOptions> = {
    ...mapLineBackgroundSeriesThemeableOptionsDef,
    type: required(constant('map-line-background')),
    topology: geoJson,
};
