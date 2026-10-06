import type {
    AgRangeBarSeriesOptions,
    AgRangeBarSeriesStyle,
    AgRangeBarSeriesThemeableOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    barHighlightOptionsDef,
    boolean,
    callbackDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    labelAutoFontSizeOptionsDefs,
    labelCollisionFitOptionsDefs,
    labelOrientationDef,
    labelPlacementStyleDefs,
    lineDashOptionsDef,
    multiSeriesShadowHighlightOptionsDef,
    number,
    positiveNumber,
    positiveNumberNonZero,
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
    unionOrArray,
} from 'ag-charts-core';

const rangeInsideOutsidePlacementDef = unionOrArray('inside', 'outside');

const rangeBarStyleCallback = callbackDefs<AgRangeBarSeriesStyle>({
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    cornerRadius: positiveNumber,
});

export const rangeBarSeriesThemeableOptionsDef: OptionsDefs<AgRangeBarSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    grouped: boolean,
    showInMiniChart: boolean,
    cornerRadius: positiveNumber,
    styler: rangeBarStyleCallback,
    itemStyler: rangeBarStyleCallback,
    label: {
        ...seriesLabelOptionsDefs,
        ...labelCollisionFitOptionsDefs,
        ...labelAutoFontSizeOptionsDefs,
        ...labelPlacementStyleDefs,
        placement: rangeInsideOutsidePlacementDef,
        orientation: labelOrientationDef,
        spacing: positiveNumber,
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlight: multiSeriesShadowHighlightOptionsDef(barHighlightOptionsDef, barHighlightOptionsDef),
    segmentation: shapeSegmentation,
    width: positiveNumberNonZero,
    widthRatio: ratio,
};

export const rangeBarSeriesOptionsDef: OptionsDefs<AgRangeBarSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...rangeBarSeriesThemeableOptionsDef,
    type: required(constant('range-bar')),
    xKey: required(string),
    yLowKey: required(string),
    yHighKey: required(string),
    xKeyAxis: string,
    yKeyAxis: string,
    xName: string,
    yName: string,
    yLowName: string,
    yHighName: string,
    legendItemName: string,
    segmentation: shapeSegmentation,
    width: positiveNumberNonZero,
    widthRatio: ratio,
};

// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.pickOutsideVisibleMinorAxis = undocumented(boolean);
// @ts-expect-error undocumented option
rangeBarSeriesOptionsDef.focusPriority = undocumented(number);
