import { type AgPyramidSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callback,
    color,
    colorUnion,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, shadowOptionsDefs, tooltipOptionsDefs, without } =
    _ModuleSupport;

export const pyramidSeriesOptionsDef: OptionsDefs<AgPyramidSeriesOptions<never>> = {
    type: required(constant('pyramid')),
    stageKey: required(string),
    valueKey: required(string),
    direction: union('horizontal', 'vertical'),
    aspectRatio: positiveNumber,
    spacing: positiveNumber,
    reverse: boolean,
    itemStyler: callback,
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
    label: seriesLabelOptionsDefs,
    stageLabel: {
        spacing: positiveNumber,
        placement: union('before', 'after'),
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    ...lineDashOptionsDef,
};
