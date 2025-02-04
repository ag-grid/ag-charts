import { type AgMapLineBackgroundOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    constant,
    lineDashOptionsDef,
    object,
    required,
    strokeOptionsDef,
} from 'ag-charts-core';

export const mapLineBackgroundSeriesOptionsDef: OptionsDefs<AgMapLineBackgroundOptions> = {
    type: required(constant('map-line-background')),
    topology: arrayOf(object),
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};
