import { type AgPyramidSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, constant, required, string } from 'ag-charts-core';

const { commonSeriesOptionsDefs, pyramidSeriesThemeableOptionsDef } = _ModuleSupport;

export const pyramidSeriesOptionsDef: OptionsDefs<AgPyramidSeriesOptions> = {
    ...pyramidSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('pyramid')),
    stageKey: required(string),
    valueKey: required(string),
};
