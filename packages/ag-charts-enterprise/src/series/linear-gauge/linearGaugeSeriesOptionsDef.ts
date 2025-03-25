import {
    type AgLinearGaugePreset,
    type AgLinearGaugeTarget,
    type FillsOptions,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    and,
    arrayOf,
    arrayOfDefs,
    boolean,
    callback,
    color,
    constant,
    fillOptionsDef,
    fontOptionsDef,
    gradientColorStops,
    greaterThan,
    lessThan,
    lineDashOptionsDef,
    number,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';

const {
    commonSeriesOptionsDefs,
    autoSizedLabelOptionsDefs,
    seriesLabelOptionsDefs,
    tooltipOptionsDefs,
    numberFormatValidator,
} = _ModuleSupport;

export const fillsOptionsDef: OptionsDefs<FillsOptions> = {
    fills: gradientColorStops,
    fillMode: union('continuous', 'discrete'),
};

const linearGaugeTargetOptionsDef: OptionsDefs<AgLinearGaugeTarget> = {
    value: required(number),
    text: string,
    shape: or(
        union('circle', 'cross', 'diamond', 'heart', 'plus', 'pin', 'square', 'star', 'triangle', 'line'),
        callback
    ),
    placement: union('before', 'after', 'middle'),
    spacing: positiveNumber,
    size: positiveNumber,
    rotation: number,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const linearGaugeSeriesOptionsDef: OptionsDefs<AgLinearGaugePreset> = {
    type: required(constant('linear-gauge')),
    value: required(number),
    direction: union('horizontal', 'vertical'),
    cornerMode: union('container', 'item'),
    cornerRadius: positiveNumber,
    thickness: positiveNumber,
    scale: {
        min: and(number, lessThan('max')),
        max: and(number, greaterThan('min')),
        label: {
            enabled: boolean,
            formatter: callback,
            rotation: number,
            spacing: positiveNumber,
            minSpacing: positiveNumber,
            placement: union('before', 'after'),
            avoidCollisions: boolean,
            format: numberFormatValidator,
            ...fontOptionsDef,
        },
        interval: {
            values: arrayOf(number),
            step: number,
        },
        ...fillsOptionsDef,
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    targets: arrayOfDefs(linearGaugeTargetOptionsDef, 'target options array'),
    segmentation: {
        enabled: boolean,
        spacing: positiveNumber,
        interval: {
            values: arrayOf(number),
            step: number,
            count: number,
        },
    },
    bar: {
        enabled: boolean,
        thickness: positiveNumber,
        thicknessRatio: ratio,
        ...fillsOptionsDef,
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    label: {
        ...autoSizedLabelOptionsDefs,
        text: string,
        spacing: positiveNumber,
        avoidCollisions: boolean,
        placement: union(
            'inside-start',
            'outside-start',
            'inside-end',
            'outside-end',
            'inside-center',
            'bar-inside',
            'bar-inside-end',
            'bar-outside-end',
            'bar-end'
        ),
    },
    tooltip: tooltipOptionsDefs,
    ...commonSeriesOptionsDefs,
};

// @ts-expect-error undocumented option
linearGaugeSeriesOptionsDef.margin = number;
// @ts-expect-error undocumented option
linearGaugeSeriesOptionsDef.defaultColorRange = arrayOf(color);
// @ts-expect-error undocumented option
linearGaugeSeriesOptionsDef.defaultTarget = {
    ...linearGaugeTargetOptionsDef,
    value: number,
    label: {
        ...seriesLabelOptionsDefs,
        spacing: number,
    },
};
// @ts-expect-error undocumented option
linearGaugeSeriesOptionsDef.defaultScale = linearGaugeSeriesOptionsDef.scale;
// @ts-expect-error undocumented option
linearGaugeSeriesOptionsDef.scale.defaultFill = color;
