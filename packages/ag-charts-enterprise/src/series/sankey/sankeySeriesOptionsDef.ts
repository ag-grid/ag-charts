import type {
    AgSankeySeriesLinkStyle,
    AgSankeySeriesNodeStyle,
    AgSankeySeriesOptions,
    AgSankeySeriesThemeableOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    and,
    arrayOf,
    callbackDefs,
    callbackOf,
    color,
    colorOrRef,
    colorUnion,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillGradientDefaults,
    fillImageDefaults,
    fillOptionsDef,
    fillPatternDefaults,
    labelAutoFontSizeOptionsDefs,
    labelFitOptionsDefs,
    lessThanOrEqual,
    lineDashOptionsDef,
    positiveNumber,
    required,
    seriesLabelOptionsDefs,
    shadowHighlightOptionsDef,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumented,
    union,
    without,
} from 'ag-charts-core';

export const sankeySeriesThemeableOptionsDef: OptionsDefs<AgSankeySeriesThemeableOptions> = {
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    label: {
        ...seriesLabelOptionsDefs,
        ...labelFitOptionsDefs,
        ...labelAutoFontSizeOptionsDefs,
        spacing: positiveNumber,
        placement: union('left', 'right', 'center'),
        edgePlacement: union('inside', 'outside'),
    },
    link: {
        shadow: shadowOptionsDefs,
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
        shadow: shadowOptionsDefs,
        width: positiveNumber,
        spacing: positiveNumber,
        minSpacing: and(positiveNumber, lessThanOrEqual('spacing')),
        cornerRadius: positiveNumber,
        alignment: union('left', 'center', 'right', 'justify'),
        verticalAlignment: union('top', 'bottom', 'center'),
        sort: union('data', 'ascending', 'descending', 'auto'),
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
    ...commonSeriesThemeableOptionsDefs,
    highlight: shadowHighlightOptionsDef(shapeHighlightOptionsDef),
};

// @ts-expect-error undocumented option
sankeySeriesThemeableOptionsDef.fillGradientDefaults = undocumented(fillGradientDefaults);
// @ts-expect-error undocumented option
sankeySeriesThemeableOptionsDef.fillPatternDefaults = undocumented(fillPatternDefaults);
// @ts-expect-error undocumented option
sankeySeriesThemeableOptionsDef.fillImageDefaults = undocumented(fillImageDefaults);
// @ts-expect-error undocumented option
sankeySeriesThemeableOptionsDef.defaultColorRange = undocumented(arrayOf(arrayOf(color)));
// @ts-expect-error undocumented option
sankeySeriesThemeableOptionsDef.defaultPatternFills = undocumented(arrayOf(color));

export const sankeySeriesOptionsDef: OptionsDefs<AgSankeySeriesOptions> = {
    ...sankeySeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlight']),
    type: required(constant('sankey')),
    fromKey: required(string),
    toKey: required(string),
    sizeKey: string,
    sizeName: string,
    getItemId: callbackOf(string),
};
