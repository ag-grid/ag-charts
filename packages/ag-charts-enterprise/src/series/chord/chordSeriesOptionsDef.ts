import type {
    AgChordSeriesLinkStyle,
    AgChordSeriesNodeStyle,
    AgChordSeriesOptions,
    AgChordSeriesThemeableOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    callbackDefs,
    callbackOf,
    colorOrRef,
    colorUnion,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    fillGradientDefaults,
    fillImageDefaults,
    fillOptionsDef,
    fillPatternDefaults,
    lineDashOptionsDef,
    positiveNumber,
    ratio,
    required,
    seriesLabelOptionsDefs,
    shadowHighlightOptionsDef,
    shadowOptionsDefs,
    shapeHighlightOptionsDef,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumented,
    undocumentedLabelFitOptionsDefs,
    without,
} from 'ag-charts-core';

export const chordSeriesThemeableOptionsDef: OptionsDefs<AgChordSeriesThemeableOptions> = {
    fills: arrayOf(colorUnion),
    strokes: arrayOf(colorOrRef),
    label: {
        spacing: positiveNumber,
        maxWidth: positiveNumber,
        ...seriesLabelOptionsDefs,
    },
    link: {
        shadow: shadowOptionsDefs,
        tension: ratio,
        itemStyler: callbackDefs<AgChordSeriesLinkStyle>({
            ...fillOptionsDef,
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
            tension: ratio,
        }),
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    node: {
        shadow: shadowOptionsDefs,
        width: positiveNumber,
        spacing: positiveNumber,
        cornerRadius: positiveNumber,
        itemStyler: callbackDefs<AgChordSeriesNodeStyle>({
            ...fillOptionsDef,
            ...strokeOptionsDef,
            ...lineDashOptionsDef,
            cornerRadius: positiveNumber,
        }),
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesThemeableOptionsDefs,
    highlight: shadowHighlightOptionsDef(shapeHighlightOptionsDef),
};

Object.assign(chordSeriesThemeableOptionsDef.label, without(undocumentedLabelFitOptionsDefs, ['maxWidth']));

// @ts-expect-error undocumented option
chordSeriesThemeableOptionsDef.fillGradientDefaults = undocumented(fillGradientDefaults);
// @ts-expect-error undocumented option
chordSeriesThemeableOptionsDef.fillPatternDefaults = undocumented(fillPatternDefaults);
// @ts-expect-error undocumented option
chordSeriesThemeableOptionsDef.fillImageDefaults = undocumented(fillImageDefaults);

export const chordSeriesOptionsDef: OptionsDefs<AgChordSeriesOptions> = {
    ...chordSeriesThemeableOptionsDef,
    ...without(commonSeriesOptionsDefs, ['highlight']),
    type: required(constant('chord')),
    fromKey: required(string),
    toKey: required(string),
    sizeKey: string,
    sizeName: string,
    getItemId: callbackOf(string),
};
