import { type AgSankeySeriesOptions, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    callback,
    color,
    colorUnion,
    constant,
    fillGradientDefaults,
    fillOptionsDef,
    fillPatternDefaults,
    lineDashOptionsDef,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

export const sankeySeriesOptionsDef: OptionsDefs<AgSankeySeriesOptions> = {
    type: required(constant('sankey')),
    fromKey: required(string),
    toKey: required(string),
    sizeKey: string,
    sizeName: string,
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
    label: {
        ...seriesLabelOptionsDefs,
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
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
};

// @ts-expect-error undocumented option
sankeySeriesOptionsDef.fillGradientDefaults = fillGradientDefaults;
// @ts-expect-error undocumented option
sankeySeriesOptionsDef.fillPatternDefaults = fillPatternDefaults;
