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
    deprecatedValue,
    fillOptionsDef,
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
    'end-after',
    deprecatedValue('before', 'Use `start-center` instead.'),
    deprecatedValue('middle', 'Use `middle-center` instead.'),
    deprecatedValue('after', 'Use `end-center` instead.')
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
    ...without(commonSeriesThemeableOptionsDefs, ['showInLegend']),
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    ...lineDashOptionsDef,
    highlight: highlightOptionsDef(lineHighlightOptionsDef),
};

export const coneFunnelSeriesOptionsDef: OptionsDefs<AgConeFunnelSeriesOptions> = {
    ...without(commonSeriesOptionsDefs, ['showInLegend']),
    ...coneFunnelSeriesThemeableOptionsDef,
    type: required(constant('cone-funnel')),
    stageKey: required(string),
    valueKey: required(string),
};
