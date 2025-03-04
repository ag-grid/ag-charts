import { type AgPyramidSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callback,
    color,
    constant,
    fillOptionsDef,
    gradient,
    lineDashOptionsDef,
    or,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDef, seriesLabelOptionsDef, shadowOptionsDef, tooltipOptionsDef, without } = _ModuleSupport;

export const pyramidSeriesOptionsDef: OptionsDefs<AgPyramidSeriesOptions> = {
    type: required(constant('pyramid')),
    stageKey: required(string),
    valueKey: required(string),
    direction: union('horizontal', 'vertical'),
    aspectRatio: positiveNumber,
    spacing: positiveNumber,
    reverse: boolean,
    itemStyler: callback,
    fills: arrayOf(or(color, gradient)),
    strokes: arrayOf(color),
    label: seriesLabelOptionsDef,
    stageLabel: {
        spacing: positiveNumber,
        placement: union('before', 'after'),
        ...seriesLabelOptionsDef,
    },
    tooltip: tooltipOptionsDef,
    shadow: shadowOptionsDef,
    ...commonSeriesOptionsDef,
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    ...lineDashOptionsDef,
};
