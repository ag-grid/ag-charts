import { type AgPyramidSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, commonSeriesOptionsDefs, constant, required, string, without } from 'ag-charts-core';

const { pyramidSeriesThemeableOptionsDef } = _ModuleSupport;

export const pyramidSeriesOptionsDef: OptionsDefs<AgPyramidSeriesOptions> = {
    ...pyramidSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlight']),
    type: required(constant('pyramid')),
    stageKey: required(string),
    valueKey: required(string),
};
