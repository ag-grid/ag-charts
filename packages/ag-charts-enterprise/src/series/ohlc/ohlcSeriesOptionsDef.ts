import { type AgOhlcSeriesItemOptions, type AgOhlcSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    constant,
    lineDashOptionsDef,
    number,
    required,
    string,
    strokeOptionsDef,
    undocumented,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

const ohlcSeriesItemOptionsDef: OptionsDefs<AgOhlcSeriesItemOptions> = {
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const ohlcSeriesOptionsDef: OptionsDefs<AgOhlcSeriesOptions> = {
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
    itemStyler: callbackDefs<AgOhlcSeriesItemOptions>({
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    item: {
        up: ohlcSeriesItemOptionsDef,
        down: ohlcSeriesItemOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
};

// @ts-expect-error undocumented option
ohlcSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
ohlcSeriesOptionsDef.focusPriority = undocumented(number);
