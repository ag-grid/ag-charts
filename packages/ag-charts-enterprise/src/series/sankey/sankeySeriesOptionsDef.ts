import { type AgSankeySeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    callback,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDef, seriesLabelOptionsDef, tooltipOptionsDef } = _ModuleSupport;

export const sankeySeriesOptionsDef: OptionsDefs<AgSankeySeriesOptions> = {
    type: required(constant('sankey')),
    fromKey: required(string),
    toKey: required(string),
    sizeKey: string,
    sizeName: string,
    fills: arrayOf(string),
    strokes: arrayOf(string),
    label: {
        ...seriesLabelOptionsDef,
        spacing: positiveNumber,
    },
    link: {
        itemStyler: callback,
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    node: {
        width: positiveNumber,
        spacing: positiveNumber,
        alignment: union('left', 'center', 'right', 'justify'),
        itemStyler: callback,
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    tooltip: tooltipOptionsDef,
    ...commonSeriesOptionsDef,
};
