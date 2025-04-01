import { type AgMapLineSeriesOptions, type AgSeriesHighlightStyle, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    and,
    arrayLength,
    arrayOf,
    callback,
    color,
    constant,
    geoJson,
    lineDashOptionsDef,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

export const mapLineSeriesOptionsDef: OptionsDefs<AgMapLineSeriesOptions<never>> = {
    type: required(constant('map-line')),
    idKey: required(string),
    sizeKey: string,
    colorKey: string,
    labelKey: string,
    idName: string,
    sizeName: string,
    colorName: string,
    labelName: string,
    topology: geoJson,
    topologyIdKey: string,
    legendItemName: string,
    maxStrokeWidth: positiveNumber,
    title: string,
    itemStyler: callback,
    sizeDomain: arrayOf(positiveNumber),
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlightStyle: {
        ...(commonSeriesOptionsDefs.highlightStyle as OptionsDefs<AgSeriesHighlightStyle>),
        ...strokeOptionsDef,
    },
};

// @ts-expect-error undocumented option
mapLineSeriesOptionsDef.colorRange = and(arrayOf(color), arrayLength(1));
