import {
    type AgMapLineSeriesOptions,
    type AgMapLineSeriesStyle,
    type AgSeriesHighlightStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    and,
    arrayLength,
    arrayOf,
    callbackDefs,
    color,
    constant,
    geoJson,
    lineDashOptionsDef,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    undocumented,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

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
    topology: geoJson,
    topologyIdKey: string,
    legendItemName: string,
    maxStrokeWidth: positiveNumber,
    title: string,
    itemStyler: callbackDefs<AgMapLineSeriesStyle>({
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
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
mapLineSeriesOptionsDef.colorRange = undocumented(and(arrayOf(color), arrayLength(1)));
