import { type AgConeFunnelSeriesOptions, _ModuleSupport } from 'ag-charts-community';
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
    number,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, tooltipOptionsDefs, without } = _ModuleSupport;

export const coneFunnelSeriesOptionsDef: OptionsDefs<AgConeFunnelSeriesOptions> = {
    type: required(constant('cone-funnel')),
    stageKey: required(string),
    valueKey: required(string),
    direction: union('horizontal', 'vertical'),
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
    showInMiniChart: boolean,
    label: {
        spacing: positiveNumber,
        placement: union('before', 'middle', 'after'),
        ...seriesLabelOptionsDefs,
    },
    stageLabel: {
        rotation: number,
        spacing: positiveNumber,
        minSpacing: positiveNumber,
        placement: union('before', 'after'),
        avoidCollisions: boolean,
        itemStyler: callback,
        format: string,
        ...seriesLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    ...lineDashOptionsDef,
};
