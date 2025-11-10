import { type AgOhlcSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, boolean, constant, number, required, string, undocumented } from 'ag-charts-core';

const { commonSeriesOptionsDefs, ohlcSeriesThemeableOptionsDef } = _ModuleSupport;

export const ohlcSeriesOptionsDef: OptionsDefs<AgOhlcSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...ohlcSeriesThemeableOptionsDef,
    type: required(constant('ohlc')),
    xKey: required(string),
    openKey: required(string),
    highKey: required(string),
    lowKey: required(string),
    closeKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    yName: string,
    openName: string,
    highName: string,
    lowName: string,
    closeName: string,
};

// @ts-expect-error undocumented option
ohlcSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
ohlcSeriesOptionsDef.focusPriority = undocumented(number);
