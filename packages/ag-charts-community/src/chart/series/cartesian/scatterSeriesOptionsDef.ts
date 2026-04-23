import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    color,
    colorScaleOptionsDef,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    enterprise,
    errorBarOptionsDefs,
    errorBarThemeableOptionsDefs,
    markerOptionsDefs,
    multiSeriesHighlightOptionsDef,
    number,
    required,
    seriesLabelOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    tooltipOptionsDefs,
    undocumented,
    union,
    without,
} from 'ag-charts-core';
import type {
    AgScatterSeriesOptions,
    AgScatterSeriesStylerResult,
    AgScatterSeriesThemeableOptions,
} from 'ag-charts-types';

export const scatterSeriesThemeableOptionsDef: OptionsDefs<AgScatterSeriesThemeableOptions> = {
    title: string,
    showInMiniChart: boolean,
    label: {
        placement: union('top', 'right', 'bottom', 'left'),
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    errorBar: errorBarThemeableOptionsDefs,
    styler: callbackDefs<AgScatterSeriesStylerResult>(markerOptionsDefs),
    maxRenderedItems: number,
    ...commonSeriesThemeableOptionsDefs,
    ...without(markerOptionsDefs, ['enabled']),
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
    colorScale: enterprise(colorScaleOptionsDef),
};

export const scatterSeriesOptionsDef: OptionsDefs<AgScatterSeriesOptions> = {
    ...scatterSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    type: required(constant('scatter')),
    xKey: required(string),
    yKey: required(string),
    labelKey: string,
    colorKey: enterprise(string),
    xName: string,
    yName: string,
    labelName: string,
    colorName: enterprise(string),
    legendItemName: string,
    xKeyAxis: string,
    yKeyAxis: string,
    errorBar: errorBarOptionsDefs,
    highlight: multiSeriesHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
};

// @ts-expect-error undocumented option
scatterSeriesOptionsDef.selectedKey = undocumented(string);

// Undocumented `colorRange` — mirrors BubbleSeries (ScatterSeries extends BubbleSeries and
// shares its colour-scale code path). See BubbleSeriesProperties.colorRange for the rationale.
// @ts-expect-error undocumented option
scatterSeriesThemeableOptionsDef.colorRange = enterprise(undocumented(arrayOf(color)));
// @ts-expect-error undocumented option
scatterSeriesOptionsDef.colorRange = enterprise(undocumented(arrayOf(color)));
