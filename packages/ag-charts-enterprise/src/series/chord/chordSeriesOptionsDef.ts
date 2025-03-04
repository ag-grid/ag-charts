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
    positiveNumber,
    ratio,
    required,
    string,
    strokeOptionsDef,
} from 'ag-charts-core';

const { commonSeriesOptionsDef, seriesLabelOptionsDef, tooltipOptionsDef } = _ModuleSupport;

export const chordSeriesOptionsDef: OptionsDefs<AgChordSeriesOptions> = {
    type: required(constant('chord')),
    fromKey: required(string),
    toKey: required(string),
    sizeKey: string,
    sizeName: string,
    fills: arrayOf(or(color, gradient)),
    strokes: arrayOf(color),
    label: {
        spacing: positiveNumber,
        maxWidth: positiveNumber,
        ...seriesLabelOptionsDef,
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
    tooltip: tooltipOptionsDef,
    ...commonSeriesOptionsDef,
};
