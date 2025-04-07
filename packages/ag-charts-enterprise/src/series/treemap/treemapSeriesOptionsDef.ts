import { type AgTreemapSeriesOptions, type AgTreemapSeriesStyle, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    color,
    colorUnion,
    constant,
    fillGradientDefaults,
    fillOptionsDef,
    fillPatternDefaults,
    positiveNumber,
    required,
    string,
    strokeOptionsDef,
    undocumented,
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
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
    colorRange: arrayOf(color),
    itemStyler: callbackDefs<AgTreemapSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
    }),
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

// @ts-expect-error undocumented option
treemapSeriesOptionsDef.fillGradientDefaults = undocumented(fillGradientDefaults);
// @ts-expect-error undocumented option
treemapSeriesOptionsDef.fillPatternDefaults = undocumented(fillPatternDefaults);
// @ts-expect-error undocumented option
treemapSeriesOptionsDef.undocumentedGroupFills = undocumented(arrayOf(color));
// @ts-expect-error undocumented option
treemapSeriesOptionsDef.undocumentedGroupStrokes = undocumented(arrayOf(color));
