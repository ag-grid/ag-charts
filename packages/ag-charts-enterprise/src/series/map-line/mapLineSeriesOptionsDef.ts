import { type AgMapLineSeriesOptions, type AgSeriesHighlightStyle, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    callback,
    constant,
    lineDashOptionsDef,
    object,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
} from 'ag-charts-core';

const { commonSeriesOptionsDef, seriesLabelOptionsDef, tooltipOptionsDef } = _ModuleSupport;

export const mapLineSeriesOptionsDef: OptionsDefs<AgMapLineSeriesOptions> = {
    type: required(constant('map-line')),
    idKey: required(string),
    sizeKey: string,
    colorKey: string,
    labelKey: string,
    idName: string,
    sizeName: string,
    colorName: string,
    labelName: string,
    topology: object,
    topologyIdKey: string,
    legendItemName: string,
    maxStrokeWidth: positiveNumber,
    title: string,
    itemStyler: callback,
    sizeDomain: arrayOf(positiveNumber),
    label: seriesLabelOptionsDef,
    tooltip: tooltipOptionsDef,
    ...commonSeriesOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlightStyle: {
        ...(commonSeriesOptionsDef.highlightStyle as OptionsDefs<AgSeriesHighlightStyle>),
        ...strokeOptionsDef,
    },
};
