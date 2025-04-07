import {
    type AgSankeySeriesLinkStyle,
    type AgSankeySeriesNodeStyle,
    type AgSankeySeriesOptions,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    callbackDefs,
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
    undocumented,
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
        itemStyler: callbackDefs<AgSankeySeriesLinkStyle>({
            ...fillOptionsDef,
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
        }),
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    node: {
        width: positiveNumber,
        spacing: positiveNumber,
        alignment: union('left', 'center', 'right', 'justify'),
        itemStyler: callbackDefs<AgSankeySeriesNodeStyle>({
            ...fillOptionsDef,
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
        }),
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
};

// @ts-expect-error undocumented option
sankeySeriesOptionsDef.fillGradientDefaults = undocumented(fillGradientDefaults);
// @ts-expect-error undocumented option
sankeySeriesOptionsDef.fillPatternDefaults = undocumented(fillPatternDefaults);
// @ts-expect-error undocumented option
sankeySeriesOptionsDef.defaultColorRange = undocumented(arrayOf(arrayOf(color)));
// @ts-expect-error undocumented option
sankeySeriesOptionsDef.defaultPatternFills = undocumented(arrayOf(color));
