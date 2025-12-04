import { type AgPyramidSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, commonSeriesOptionsDefs, constant, required, string } from 'ag-charts-core';

const { pyramidSeriesThemeableOptionsDef } = _ModuleSupport;

export const pyramidSeriesOptionsDef: OptionsDefs<AgPyramidSeriesOptions> = {
    ...pyramidSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('pyramid')),
    stageKey: required(string),
    valueKey: required(string),
};
