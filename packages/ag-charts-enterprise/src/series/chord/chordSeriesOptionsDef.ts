import { type AgChordSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    callback,
    color,
    constant,
    fillOptionsDef,
    gradient,
    lineDashOptionsDef,
    or,
    pattern,
    positiveNumber,
    ratio,
    required,
    string,
    strokeOptionsDef,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

export const chordSeriesOptionsDef: OptionsDefs<AgChordSeriesOptions> = {
    type: required(constant('chord')),
    fromKey: required(string),
    toKey: required(string),
    sizeKey: string,
    sizeName: string,
    fills: arrayOf(or(color, gradient, pattern)),
    strokes: arrayOf(color),
    label: {
        spacing: positiveNumber,
        maxWidth: positiveNumber,
        ...seriesLabelOptionsDefs,
    },
    link: {
        tension: ratio,
        itemStyler: callback,
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    node: {
        width: positiveNumber,
        spacing: positiveNumber,
        itemStyler: callback,
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
};
