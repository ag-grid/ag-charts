import type {
    AgRangeAreaSeriesItemLineThemeableOptions,
    AgRangeAreaSeriesLineStyle,
    AgRangeAreaSeriesLineThemeableOptions,
    AgRangeAreaSeriesOptions,
    AgRangeAreaSeriesStyle,
    AgRangeAreaSeriesThemeableOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    callbackDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    interpolationOptionsDefs,
    labelAutoFontSizeOptionsDefs,
    labelCollisionFitOptionsDefs,
    labelPlacementStyleDefs,
    lineDashOptionsDef,
    markerOptionsDefs,
    markerStyleOptionsDefs,
    multiSeriesShadowHighlightOptionsDef,
    number,
    positiveNumber,
    required,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    shapeSegmentation,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumentedDefs,
} from 'ag-charts-core';

import { rangeInsideOutsidePlacementDef } from '../range-bar/rangeBarSeriesOptionsDef';

export const rangeAreaSeriesLineThemeableOptionsDef: OptionsDefs<
    AgRangeAreaSeriesLineThemeableOptions<unknown, unknown>
> = {
    marker: markerOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const rangeAreaSeriesItemLineThemeableOptionsDef: OptionsDefs<
    AgRangeAreaSeriesItemLineThemeableOptions<unknown, unknown>
> = {
    marker: {
        enabled: boolean,
        shadow: shadowOptionsDefs,
        ...markerStyleOptionsDefs,
    },
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

const rangeAreaSeriesLineStyleDef: OptionsDefs<AgRangeAreaSeriesLineStyle> = {
    marker: markerStyleOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const rangeAreaSeriesThemeableOptionsDef: OptionsDefs<AgRangeAreaSeriesThemeableOptions> = {
    showInMiniChart: boolean,
    connectMissingData: boolean,
    interpolation: interpolationOptionsDefs,
    label: {
        ...seriesLabelOptionsDefs,
        ...labelCollisionFitOptionsDefs,
        ...labelAutoFontSizeOptionsDefs,
        ...labelPlacementStyleDefs,
        placement: rangeInsideOutsidePlacementDef,
        spacing: positiveNumber,
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    ...fillOptionsDef,
    ...rangeAreaSeriesLineThemeableOptionsDef,
    item: {
        low: { ...rangeAreaSeriesItemLineThemeableOptionsDef },
        high: { ...rangeAreaSeriesItemLineThemeableOptionsDef },
    },
    styler: callbackDefs<AgRangeAreaSeriesStyle>({
        ...fillOptionsDef,
        item: {
            low: { ...rangeAreaSeriesLineStyleDef },
            high: { ...rangeAreaSeriesLineStyleDef },
        },
    }),
    highlight: multiSeriesShadowHighlightOptionsDef(shapeHighlightOptionsDef, shapeHighlightOptionsDef),
    segmentation: shapeSegmentation,
    invertedStyle: {
        enabled: boolean,
        ...fillOptionsDef,
    },
};

export const rangeAreaSeriesOptionsDef: OptionsDefs<AgRangeAreaSeriesOptions> = {
    ...commonSeriesOptionsDefs,
    ...rangeAreaSeriesThemeableOptionsDef,
    type: required(constant('range-area')),
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
    invertedStyle: {
        enabled: boolean,
        ...fillOptionsDef,
    },
    ...undocumentedDefs({
        pickOutsideVisibleMinorAxis: boolean,
        focusPriority: number,
    }),
};
