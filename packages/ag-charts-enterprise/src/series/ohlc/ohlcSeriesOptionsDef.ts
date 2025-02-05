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

const { commonSeriesOptionsDef, tooltipOptionsDef } = _ModuleSupport;

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
    itemStyler: callback,
    item: {
        up: ohlcSeriesItemOptionsDef,
        down: ohlcSeriesItemOptionsDef,
    },
    tooltip: tooltipOptionsDef,
    ...commonSeriesOptionsDef,

    // @ts-expect-error undocumented option
    pickOutsideVisibleMinorAxis: boolean,
    focusPriority: number,
};
