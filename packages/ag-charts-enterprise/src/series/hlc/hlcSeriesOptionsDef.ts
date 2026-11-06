import type {
    AgHlcSeriesBandStyle,
    AgHlcSeriesItemBandThemeableOptions,
    AgHlcSeriesItemLineThemeableOptions,
    AgHlcSeriesLineStyle,
    AgHlcSeriesOptions,
    AgHlcSeriesStyle,
    AgHlcSeriesThemeableOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    crosshairSnapToValidator,
    fillOptionsDef,
    glowOptionsDefs,
    interpolationOptionsDefs,
    lineDashOptionsDef,
    markerOptionsDefs,
    markerStyleOptionsDefs,
    multiSeriesHighlightOptionsDef,
    required,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumentedDefs,
    union,
} from 'ag-charts-core';

const hlcSeriesItemLineThemeableOptionsDef: OptionsDefs<AgHlcSeriesItemLineThemeableOptions<unknown, unknown>> = {
    marker: {
        enabled: boolean,
        shadow: shadowOptionsDefs,
        glow: glowOptionsDefs,
        ...markerStyleOptionsDefs,
    },
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

const hlcSeriesItemBandThemeableOptionsDef: OptionsDefs<AgHlcSeriesItemBandThemeableOptions<unknown, unknown>> = {
    ...hlcSeriesItemLineThemeableOptionsDef,
    ...fillOptionsDef,
};

const hlcSeriesLineStyleDef: OptionsDefs<AgHlcSeriesLineStyle> = {
    marker: markerStyleOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

const hlcSeriesBandStyleDef: OptionsDefs<AgHlcSeriesBandStyle> = {
    ...hlcSeriesLineStyleDef,
    ...fillOptionsDef,
};

export const hlcSeriesThemeableOptionsDef: OptionsDefs<AgHlcSeriesThemeableOptions> = {
    crosshairSnapTo: crosshairSnapToValidator(['high', 'low', 'close']),
    crosshairSnapMode: union('all', 'nearest'),
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    marker: markerOptionsDefs,
    item: {
        high: { ...hlcSeriesItemBandThemeableOptionsDef },
        low: { ...hlcSeriesItemBandThemeableOptionsDef },
        close: { ...hlcSeriesItemLineThemeableOptionsDef },
    },
    styler: callbackDefs<AgHlcSeriesStyle>({
        item: {
            high: { ...hlcSeriesBandStyleDef },
            low: { ...hlcSeriesBandStyleDef },
            close: { ...hlcSeriesLineStyleDef },
        },
    }),
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

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
    ...undocumentedDefs({
        pickOutsideVisibleMinorAxis: boolean,
    }),
};
