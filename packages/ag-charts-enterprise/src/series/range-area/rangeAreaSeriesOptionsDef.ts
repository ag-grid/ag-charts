import { type AgRangeAreaSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, boolean, constant, number, required, string, undocumented } from 'ag-charts-core';

const { commonSeriesOptionsDefs, rangeAreaSeriesThemeableOptionsDef } = _ModuleSupport;

export const rangeAreaSeriesOptionsDef: OptionsDefs<AgRangeAreaSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...rangeAreaSeriesThemeableOptionsDef,
    type: required(constant('range-area')),
    xKey: required(string),
    yLowKey: required(string),
    yHighKey: required(string),
    xName: string,
    yName: string,
    yLowName: string,
    yHighName: string,
};

// @ts-expect-error undocumented option
rangeAreaSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
rangeAreaSeriesOptionsDef.focusPriority = undocumented(number);
