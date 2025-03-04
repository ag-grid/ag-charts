import { type AgMapShapeSeriesOptions, type AgSeriesHighlightStyle, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    callback,
    color,
    constant,
    fillOptionsDef,
    lineDashOptionsDef,
    object,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDef, seriesLabelOptionsDef, tooltipOptionsDef } = _ModuleSupport;

export const mapShapeSeriesOptionsDef: OptionsDefs<AgMapShapeSeriesOptions> = {
    type: required(constant('map-shape')),
    idKey: required(string),
    colorKey: string,
    labelKey: string,
    idName: string,
    colorName: string,
    labelName: string,
    topology: object,
    topologyIdKey: string,
    legendItemName: string,
    colorRange: arrayOf(color),
    padding: positiveNumber,
    itemStyler: callback,
    title: string,
    label: {
        lineHeight: positiveNumber,
        minimumFontSize: positiveNumber,
        wrapping: union('never', 'always', 'hyphenate', 'on-space'),
        overflowStrategy: union('ellipsis', 'hide'),
        ...seriesLabelOptionsDef,
    },
    tooltip: tooltipOptionsDef,
    ...commonSeriesOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlightStyle: {
        ...(commonSeriesOptionsDef.highlightStyle as OptionsDefs<AgSeriesHighlightStyle>),
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
};
