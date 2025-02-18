import {
    type AgCandlestickSeriesItemOptions,
    type AgCandlestickSeriesOptions,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    callback,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    number,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
} from 'ag-charts-core';

const { commonSeriesOptionsDef, tooltipOptionsDef } = _ModuleSupport;

const candlestickSeriesItemOptionsDef: OptionsDefs<AgCandlestickSeriesItemOptions> = {
    cornerRadius: positiveNumber,
    wick: {
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const candlestickSeriesOptionsDef: OptionsDefs<AgCandlestickSeriesOptions> = {
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
    item: {
        up: candlestickSeriesItemOptionsDef,
        down: candlestickSeriesItemOptionsDef,
    },
    itemStyler: callback,
    showInMiniChart: boolean,
    tooltip: tooltipOptionsDef,
    ...commonSeriesOptionsDef,
};

// @ts-expect-error undocumented option
candlestickSeriesOptionsDef.pickOutsideVisibleMinorAxis = boolean;
// @ts-expect-error undocumented option
candlestickSeriesOptionsDef.focusPriority = number;
