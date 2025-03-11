import { type AgTreemapSeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    boolean,
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

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

export const treemapSeriesOptionsDef: OptionsDefs<AgTreemapSeriesOptions> = {
    type: required(constant('treemap')),
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
    itemStyler: callback,
    group: {
        gap: positiveNumber,
        padding: positiveNumber,
        cornerRadius: positiveNumber,
        textAlign: union('left', 'center', 'right'),
        interactive: boolean,
        label: {
            ...seriesLabelOptionsDefs,
            spacing: positiveNumber,
        },
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
    tile: {
        gap: positiveNumber,
        padding: positiveNumber,
        cornerRadius: positiveNumber,
        textAlign: union('left', 'center', 'right'),
        verticalAlign: union('top', 'middle', 'bottom'),
        label: {
            ...seriesLabelOptionsDefs,
            spacing: positiveNumber,
            lineHeight: positiveNumber,
            minimumFontSize: positiveNumber,
            wrapping: union('never', 'always', 'hyphenate', 'on-space'),
            overflowStrategy: union('ellipsis', 'hide'),
        },
        secondaryLabel: {
            ...seriesLabelOptionsDefs,
            lineHeight: positiveNumber,
            minimumFontSize: positiveNumber,
            wrapping: union('never', 'always', 'hyphenate', 'on-space'),
            overflowStrategy: union('ellipsis', 'hide'),
        },
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
    highlightStyle: {
        group: {
            label: {
                color: color,
            },
            ...fillOptionsDef,
            ...strokeOptionsDef,
        },
        tile: {
            label: {
                color: color,
            },
            secondaryLabel: {
                color: color,
            },
            ...fillOptionsDef,
            ...strokeOptionsDef,
        },
    },
};
