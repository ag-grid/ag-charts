import { type AgCandlestickSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import { type OptionsDefs, boolean, constant, number, required, string, undocumented } from 'ag-charts-core';

const { commonSeriesOptionsDefs, candlestickSeriesThemeableOptionsDef } = _ModuleSupport;

export const candlestickSeriesOptionsDef: OptionsDefs<AgCandlestickSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...candlestickSeriesThemeableOptionsDef,
    type: required(constant('candlestick')),
    xKey: required(string),
    openKey: required(string),
    highKey: required(string),
    lowKey: required(string),
    closeKey: required(string),
    xName: string,
    yName: string,
    openName: string,
    highName: string,
    lowName: string,
    closeName: string,
    xKeyAxis: string,
    yKeyAxis: string,
};

// @ts-expect-error undocumented option
candlestickSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
candlestickSeriesOptionsDef.focusPriority = undocumented(number);
