import {
    type AgMapShapeSeriesOptions,
    type AgMapShapeSeriesStyle,
    type AgSeriesHighlightStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    callbackDefs,
    color,
    constant,
    fillOptionsDef,
    geoJson,
    lineDashOptionsDef,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, autoSizedLabelOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

export const mapShapeSeriesOptionsDef: OptionsDefs<AgMapShapeSeriesOptions> = {
    type: required(constant('map-shape')),
    idKey: required(string),
    colorKey: string,
    labelKey: string,
    idName: string,
    colorName: string,
    labelName: string,
    topology: geoJson,
    topologyIdKey: string,
    legendItemName: string,
    colorRange: arrayOf(color),
    padding: positiveNumber,
    itemStyler: callbackDefs<AgMapShapeSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    title: string,
    label: autoSizedLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    highlightStyle: {
        ...(commonSeriesOptionsDefs.highlightStyle as OptionsDefs<AgSeriesHighlightStyle>),
        ...fillOptionsDef,
        ...strokeOptionsDef,
    },
};
