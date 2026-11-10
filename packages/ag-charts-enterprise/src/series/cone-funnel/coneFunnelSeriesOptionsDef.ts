import type { AgConeFunnelSeriesOptions, AgConeFunnelSeriesThemeableOptions } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    colorOrRef,
    colorUnion,
    commonAxisLabelOptionsDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillOptionsDef,
    glowOptionsDefs,
    highlightOptionsDef,
    labelAutoFontSizeOptionsDefs,
    labelCollisionFitOptionsDefs,
    lineDashOptionsDef,
    lineHighlightOptionsDef,
    numberFormatValidator,
    positiveNumber,
    required,
    seriesLabelOptionsDefs,
    shadowOptionsDefs,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    union,
    unionOrArray,
    without,
} from 'ag-charts-core';

const coneFunnelPlacementDef = unionOrArray(
    'start-before',
    'start-center',
    'start-after',
    'middle-before',
    'middle-center',
    'middle-after',
    'end-before',
    'end-center',
    'end-after'
);

export const coneFunnelSeriesThemeableOptionsDef: OptionsDefs<AgConeFunnelSeriesThemeableOptions> = {
    direction: union('horizontal', 'vertical'),
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    label: {
        ...seriesLabelOptionsDefs,
        ...labelCollisionFitOptionsDefs,
        ...labelAutoFontSizeOptionsDefs,
        placement: coneFunnelPlacementDef,
        spacing: positiveNumber,
    },
    stageLabel: {
        placement: union('before', 'after'),
        format: numberFormatValidator,
        ...commonAxisLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    glow: glowOptionsDefs,
    ...without(commonSeriesThemeableOptionsDefs, ['showInLegend']),
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    ...lineDashOptionsDef,
    highlight: highlightOptionsDef(lineHighlightOptionsDef),
};

export const coneFunnelSeriesOptionsDef: OptionsDefs<AgConeFunnelSeriesOptions> = {
    ...without(commonSeriesOptionsDefs, ['showInLegend', 'focusIndex']),
    ...coneFunnelSeriesThemeableOptionsDef,
    type: required(constant('cone-funnel')),
    stageKey: required(string),
    valueKey: required(string),
};
