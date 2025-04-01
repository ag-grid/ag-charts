import { type AgOhlcSeriesItemOptions, type AgOhlcSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    callback,
    constant,
    lineDashOptionsDef,
    number,
    required,
    string,
    strokeOptionsDef,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

const ohlcSeriesItemOptionsDef: OptionsDefs<AgOhlcSeriesItemOptions> = {
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const ohlcSeriesOptionsDef: OptionsDefs<AgOhlcSeriesOptions<never>> = {
    type: required(constant('ohlc')),
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
    showInMiniChart: boolean,
    itemStyler: callback,
    item: {
        up: ohlcSeriesItemOptionsDef,
        down: ohlcSeriesItemOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
};

// @ts-expect-error undocumented option
ohlcSeriesOptionsDef.pickOutsideVisibleMinorAxis = boolean;
// @ts-expect-error undocumented option
ohlcSeriesOptionsDef.focusPriority = number;
