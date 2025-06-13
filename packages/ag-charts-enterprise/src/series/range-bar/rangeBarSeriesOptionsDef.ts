import { type AgRangeBarSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, boolean, constant, number, required, string, undocumented } from 'ag-charts-core';

const { commonSeriesOptionsDefs, rangeBarSeriesThemeableOptionsDef } = _ModuleSupport;

export const rangeBarSeriesOptionsDef: OptionsDefs<AgRangeBarSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...rangeBarSeriesThemeableOptionsDef,
    type: required(constant('range-bar')),
    xKey: required(string),
    yLowKey: required(string),
    yHighKey: required(string),
    xName: string,
    yName: string,
    yLowName: string,
    yHighName: string,
};

// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.fastDataProcessing = undocumented(boolean);
// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.focusPriority = undocumented(number);
