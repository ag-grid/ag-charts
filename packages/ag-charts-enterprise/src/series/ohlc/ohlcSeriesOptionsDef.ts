import type { AgOhlcSeriesItemOptions, AgOhlcSeriesOptions, AgOhlcSeriesThemeableOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    lineDashOptionsDef,
    lineHighlightOptionsDef,
    multiSeriesShadowHighlightOptionsDef,
    number,
    required,
    shadowOptionsDefs,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumented,
} from 'ag-charts-core';

export const ohlcSeriesThemeableOptionsDef: OptionsDefs<AgOhlcSeriesThemeableOptions> = {
    showInMiniChart: boolean,
    itemStyler: callbackDefs<AgOhlcSeriesItemOptions>({
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    item: {
        up: {
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
        },
        down: {
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
        },
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    highlight: multiSeriesShadowHighlightOptionsDef(lineHighlightOptionsDef, lineHighlightOptionsDef),
};

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
