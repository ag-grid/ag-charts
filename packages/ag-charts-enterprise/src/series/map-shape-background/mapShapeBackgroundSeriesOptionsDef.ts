import { type AgMapShapeBackgroundOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    object,
    required,
    strokeOptionsDef,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs } = _ModuleSupport;

export const mapShapeBackgroundSeriesOptionsDef: OptionsDefs<AgMapShapeBackgroundOptions> = {
    type: required(constant('map-shape-background')),
    topology: object,
    ...commonSeriesOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};
