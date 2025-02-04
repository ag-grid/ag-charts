import { type AgMapShapeBackgroundOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    object,
    required,
    strokeOptionsDef,
} from 'ag-charts-core';

const { commonSeriesOptionsDef } = _ModuleSupport;

export const mapShapeBackgroundSeriesOptionsDef: OptionsDefs<AgMapShapeBackgroundOptions> = {
    type: required(constant('map-shape-background')),
    topology: arrayOf(object),
    ...commonSeriesOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};
