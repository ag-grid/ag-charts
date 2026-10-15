import type {
    AgLinearGaugePreset,
    AgLinearGaugeTarget,
    AgLinearGaugeThemeOverrides,
    AgLinearGaugeThemeableOptions,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    and,
    arrayOf,
    arrayOfDefs,
    autoSizedLabelOptionsDefs,
    boolean,
    callback,
    color,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    constant,
    deprecated,
    fillOptionsDef,
    fontOptionsDef,
    greaterThan,
    labelPlacementStyleDefs,
    lessThan,
    lineDashOptionsDef,
    number,
    numberFormatValidator,
    numericValue,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumentedDefs,
    union,
    unionOrArray,
    without,
} from 'ag-charts-core';

import { fillsOptionsDef, gaugeTargetLabelOptionsDef, gaugeTooltipOptionsDef } from '../gauge-util/gaugeOptionsDefs';

export const linearGaugeTargetOptionsDef: OptionsDefs<AgLinearGaugeTarget> = {
    value: required(numericValue),
    text: string,
    shape: or(
        union('circle', 'cross', 'diamond', 'heart', 'plus', 'pin', 'square', 'star', 'triangle', 'line'),
        callback
    ),
    placement: union('before', 'after', 'middle'),
    spacing: positiveNumber,
    size: positiveNumber,
    rotation: number,
    label: gaugeTargetLabelOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

const linearGaugeScaleOptionsDef: OptionsDefs<NonNullable<AgLinearGaugeThemeableOptions['scale']>> = {
    min: and(numericValue, lessThan('max')),
    max: and(numericValue, greaterThan('min')),
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
        values: arrayOf(numericValue),
        step: numericValue,
    },
    ...fillsOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
    ...undocumentedDefs({ defaultFill: color }),
};

export const linearGaugeSeriesThemeableOptionsDef: OptionsDefs<AgLinearGaugeThemeableOptions> = {
    ...without(commonSeriesThemeableOptionsDefs, ['listeners']),
    direction: union('horizontal', 'vertical'),
    cornerMode: union('container', 'item'),
    cornerRadius: positiveNumber,
    thickness: positiveNumber,
    scale: linearGaugeScaleOptionsDef,
    segmentation: {
        enabled: boolean,
        spacing: positiveNumber,
        interval: {
            values: arrayOf(numericValue),
            step: numericValue,
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
        ...labelPlacementStyleDefs,
        text: string,
        spacing: positiveNumber,
        maxWidth: positiveNumber,
        maxHeight: positiveNumber,
        avoidCollisions: deprecated(boolean, 'Use `collision.alwaysShow` instead.'),
        placement: unionOrArray(
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
    ...undocumentedDefs({
        defaultScale: linearGaugeScaleOptionsDef,
        margin: number,
        defaultColorRange: arrayOf(color),
        defaultTarget: {
            ...linearGaugeTargetOptionsDef,
            value: number,
            label: gaugeTargetLabelOptionsDef,
        },
    }),
};

export const linearGaugeSeriesOptionsDef: OptionsDefs<AgLinearGaugePreset> = {
    ...without(commonSeriesOptionsDefs, ['listeners']),
    ...linearGaugeSeriesThemeableOptionsDef,
    type: required(constant('linear-gauge')),
    value: required(numericValue),
    targets: arrayOfDefs(linearGaugeTargetOptionsDef, 'target options array'),
};

export const linearGaugeThemeOptionsDef: Partial<OptionsDefs<AgLinearGaugeThemeOverrides>> = {
    ...linearGaugeSeriesThemeableOptionsDef,
    targets: without(linearGaugeTargetOptionsDef, ['value']),
    tooltip: gaugeTooltipOptionsDef,
};
