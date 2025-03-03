import { type AgSunburstSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    callback,
    color,
    constant,
    fillOptionsDef,
    gradient,
    or,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDef, seriesLabelOptionsDef, tooltipOptionsDef, without } = _ModuleSupport;

export const sunburstSeriesOptionsDef: OptionsDefs<AgSunburstSeriesOptions> = {
    type: required(constant('sunburst')),
    labelKey: string,
    secondaryLabelKey: string,
    childrenKey: string,
    sizeKey: string,
    colorKey: string,
    sizeName: string,
    colorName: string,
    fills: arrayOf(or(color, gradient)),
    strokes: arrayOf(color),
    colorRange: arrayOf(color),
    sectorSpacing: positiveNumber,
    cornerRadius: positiveNumber,
    padding: positiveNumber,
    itemStyler: callback,
    label: {
        ...seriesLabelOptionsDef,
        spacing: positiveNumber,
        lineHeight: positiveNumber,
        minimumFontSize: positiveNumber,
        wrapping: union('never', 'always', 'hyphenate', 'on-space'),
        overflowStrategy: union('ellipsis', 'hide'),
    },
    secondaryLabel: {
        ...seriesLabelOptionsDef,
        lineHeight: positiveNumber,
        minimumFontSize: positiveNumber,
        wrapping: union('never', 'always', 'hyphenate', 'on-space'),
        overflowStrategy: union('ellipsis', 'hide'),
    },
    tooltip: tooltipOptionsDef,
    ...commonSeriesOptionsDef,
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    highlightStyle: {
        label: {
            color: color,
        },
        secondaryLabel: {
            color: color,
        },
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
};
