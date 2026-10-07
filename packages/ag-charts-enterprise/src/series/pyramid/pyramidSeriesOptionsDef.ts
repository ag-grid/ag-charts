import type {
    AgPyramidSeriesOptions,
    AgPyramidSeriesStyle,
    AgPyramidSeriesThemeableOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    colorOrRef,
    colorUnion,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    labelAutoFontSizeOptionsDefs,
    labelCollisionFitOptionsDefs,
    labelPlacementStyleDefs,
    lineDashOptionsDef,
    positiveNumber,
    required,
    seriesLabelOptionsDefs,
    shadowHighlightOptionsDef,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    union,
    without,
} from 'ag-charts-core';

import { funnelPlacementDef } from '../funnel/funnelSeriesOptionsDef';

export const pyramidSeriesThemeableOptionsDef: OptionsDefs<AgPyramidSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    aspectRatio: positiveNumber,
    spacing: positiveNumber,
    reverse: boolean,
    itemStyler: callbackDefs<AgPyramidSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    label: {
        ...seriesLabelOptionsDefs,
        ...labelCollisionFitOptionsDefs,
        ...labelAutoFontSizeOptionsDefs,
        ...labelPlacementStyleDefs,
        placement: funnelPlacementDef,
        spacing: positiveNumber,
    },
    stageLabel: {
        spacing: positiveNumber,
        placement: union('before', 'after'),
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    highlight: shadowHighlightOptionsDef(shapeHighlightOptionsDef),
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    ...lineDashOptionsDef,
};

export const pyramidSeriesOptionsDef: OptionsDefs<AgPyramidSeriesOptions> = {
    ...pyramidSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlight']),
    type: required(constant('pyramid')),
    stageKey: required(string),
    valueKey: required(string),
};
