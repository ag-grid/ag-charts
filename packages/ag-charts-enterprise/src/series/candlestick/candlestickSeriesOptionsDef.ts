import type {
    AgCandlestickHighlightStyleOptions,
    AgCandlestickSeriesItemOptions,
    AgCandlestickSeriesOptions,
    AgCandlestickSeriesThemeableOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    multiSeriesShadowHighlightOptionsDef,
    number,
    positiveNumber,
    ratio,
    required,
    shadowOptionsDefs,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumentedDefs,
} from 'ag-charts-core';

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

const candlestickHighlightStyleOptionsDef: OptionsDefs<AgCandlestickHighlightStyleOptions> = {
    ...candlestickSeriesItemOptionsDef,
    opacity: ratio,
};

export const candlestickSeriesThemeableOptionsDef: OptionsDefs<AgCandlestickSeriesThemeableOptions> = {
    item: {
        up: candlestickSeriesItemOptionsDef,
        down: candlestickSeriesItemOptionsDef,
    },
    itemStyler: callbackDefs<AgCandlestickSeriesItemOptions>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        cornerRadius: positiveNumber,
        wick: {
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
        },
    }),
    showInMiniChart: boolean,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    highlight: multiSeriesShadowHighlightOptionsDef(
        candlestickHighlightStyleOptionsDef,
        candlestickHighlightStyleOptionsDef
    ),
};

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
    ...undocumentedDefs({
        pickOutsideVisibleMinorAxis: boolean,
        focusPriority: number,
    }),
};
