import {
    type OptionsDefs,
    barHighlightOptionsDef,
    boolean,
    callback,
    callbackDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    errorBarOptionsDefs,
    errorBarThemeableOptionsDefs,
    fillOptionsDef,
    lineDashOptionsDef,
    multiSeriesHighlightOptionsDef,
    number,
    positiveNumber,
    ratio,
    required,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    shapeSegmentation,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumented,
    union,
} from 'ag-charts-core';
import type { AgBarSeriesOptions, AgBarSeriesStyle, AgBarSeriesThemeableOptions } from 'ag-charts-types';

const highlight = multiSeriesHighlightOptionsDef(barHighlightOptionsDef, barHighlightOptionsDef);

const barStyler = callbackDefs<AgBarSeriesStyle>({
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
});

export const barSeriesThemeableOptionsDef: OptionsDefs<AgBarSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    showInMiniChart: boolean,
    cornerRadius: positiveNumber,
    styler: barStyler,
    itemStyler: barStyler,
    crisp: boolean,
    label: {
        ...seriesLabelOptionsDefs,
        placement: union('inside-center', 'inside-start', 'inside-end', 'outside-start', 'outside-end'),
        spacing: positiveNumber,
    },
    errorBar: errorBarThemeableOptionsDefs,
    shadow: shadowOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    highlight,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    segmentation: shapeSegmentation,
    width: number,
    widthRatio: ratio,
};

// @ts-expect-error undocumented option
barSeriesThemeableOptionsDef.sparklineMode = undocumented(boolean);

export const barSeriesOptionsDef: OptionsDefs<AgBarSeriesOptions> = {
    ...barSeriesThemeableOptionsDef,
    ...commonSeriesOptionsDefs,
    highlight,
    type: required(constant('bar')),
    xKey: required(string),
    yKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    yName: string,
    direction: union('horizontal', 'vertical'),
    grouped: boolean,
    stacked: boolean,
    stackGroup: string,
    normalizedTo: number,
    legendItemName: string,
    errorBar: errorBarOptionsDefs,
};

// @ts-expect-error undocumented option
barSeriesOptionsDef.yFilterKey = undocumented(string);
// @ts-expect-error undocumented option
barSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
barSeriesOptionsDef.focusPriority = undocumented(number);
// @ts-expect-error undocumented option
barSeriesOptionsDef.simpleItemStyler = undocumented(callback);
