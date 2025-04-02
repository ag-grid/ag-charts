import {
    type AgBaseAxisLabelStyleOptions,
    type AgFunnelSeriesOptions,
    type AgFunnelSeriesStyle,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    boolean,
    callbackDefs,
    color,
    colorUnion,
    constant,
    fillOptionsDef,
    fontOptionsDef,
    lineDashOptionsDef,
    number,
    positiveNumber,
    ratio,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const { commonSeriesOptionsDefs, seriesLabelOptionsDefs, shadowOptionsDefs, tooltipOptionsDefs, without } =
    _ModuleSupport;

export const funnelSeriesOptionsDef: OptionsDefs<AgFunnelSeriesOptions> = {
    type: required(constant('funnel')),
    stageKey: required(string),
    valueKey: required(string),
    direction: union('horizontal', 'vertical'),
    fills: arrayOf(colorUnion),
    strokes: arrayOf(color),
    showInMiniChart: boolean,
    itemStyler: callbackDefs<AgFunnelSeriesStyle>({
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
    spacingRatio: ratio,
    crisp: boolean,
    dropOff: {
        enabled: boolean,
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    stageLabel: {
        rotation: number,
        spacing: positiveNumber,
        minSpacing: positiveNumber,
        placement: union('before', 'after'),
        avoidCollisions: boolean,
        itemStyler: callbackDefs<AgBaseAxisLabelStyleOptions>({
            ...fontOptionsDef,
            spacing: number,
        }),
        format: string,
        ...seriesLabelOptionsDefs,
    },
    label: seriesLabelOptionsDefs,
    tooltip: tooltipOptionsDefs,
    shadow: shadowOptionsDefs,
    ...commonSeriesOptionsDefs,
    ...without(fillOptionsDef, ['fill']),
    ...without(strokeOptionsDef, ['stroke']),
    ...lineDashOptionsDef,
};
