import {
    type AgChordSeriesLinkStyle,
    type AgChordSeriesNodeStyle,
    type AgChordSeriesOptions,
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
    ratio,
    required,
    string,
    strokeOptionsDef,
    undocumented,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, tooltipOptionsDefs } = _ModuleSupport;

export const chordSeriesOptionsDef: OptionsDefs<AgChordSeriesOptions> = {
    type: required(constant('chord')),
    fromKey: required(string),
    toKey: required(string),
    sizeKey: string,
    sizeName: string,
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
    label: {
        spacing: positiveNumber,
        maxWidth: positiveNumber,
        ...seriesLabelOptionsDefs,
    },
    link: {
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
        width: positiveNumber,
        spacing: positiveNumber,
        itemStyler: callbackDefs<AgChordSeriesNodeStyle>({
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
chordSeriesOptionsDef.fillGradientDefaults = undocumented(fillGradientDefaults);
// @ts-expect-error undocumented option
chordSeriesOptionsDef.fillPatternDefaults = undocumented(fillPatternDefaults);
