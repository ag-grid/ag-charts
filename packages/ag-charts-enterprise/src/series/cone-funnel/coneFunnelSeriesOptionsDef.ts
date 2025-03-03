import { type AgConeFunnelSeriesOptions, _ModuleSupport } from 'ag-charts-community';
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
    number,
    or,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDef, seriesLabelOptionsDef, tooltipOptionsDef, without } = _ModuleSupport;

export const coneFunnelSeriesOptionsDef: OptionsDefs<AgConeFunnelSeriesOptions> = {
    type: required(constant('cone-funnel')),
    stageKey: required(string),
    valueKey: required(string),
    direction: union('horizontal', 'vertical'),
    fills: arrayOf(or(color, gradient)),
    strokes: arrayOf(color),
    showInMiniChart: boolean,
    label: {
        spacing: positiveNumber,
        placement: union('before', 'middle', 'after'),
        ...seriesLabelOptionsDef,
    },
    stageLabel: {
        rotation: number,
        spacing: positiveNumber,
        minSpacing: positiveNumber,
        placement: union('before', 'after'),
        avoidCollisions: boolean,
        itemStyler: callback,
        format: string,
        ...seriesLabelOptionsDef,
    },
    tooltip: tooltipOptionsDef,
    ...commonSeriesOptionsDef,
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    ...lineDashOptionsDef,
};
