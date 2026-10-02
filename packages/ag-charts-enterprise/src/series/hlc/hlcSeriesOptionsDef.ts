import { type AgHlcSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    commonSeriesOptionsDefs,
    constant,
    number,
    required,
    string,
    undocumented,
} from 'ag-charts-core';

const { hlcSeriesThemeableOptionsDef } = _ModuleSupport;

export const hlcSeriesOptionsDef: OptionsDefs<AgHlcSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...hlcSeriesThemeableOptionsDef,
    type: required(constant('hlc')),
    xKey: required(string),
    highKey: required(string),
    lowKey: required(string),
    closeKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    highName: string,
    lowName: string,
    closeName: string,
    yName: string,
    legendItemName: string,
};

// @ts-expect-error undocumented option
hlcSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
hlcSeriesOptionsDef.focusPriority = undocumented(number);
