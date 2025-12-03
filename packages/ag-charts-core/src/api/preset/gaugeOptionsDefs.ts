import type {
    AgGaugeColorStop,
    AgLinearGaugePreset,
    AgLinearGaugeTarget,
    AgLinearGaugeThemeableOptions,
    AgRadialGaugePreset,
    AgRadialGaugeTarget,
    AgRadialGaugeThemeableOptions,
    FillsOptions,
} from 'ag-charts-types';

import {
    autoSizedLabelOptionsDefs,
    commonSeriesOptionsDefs,
    commonSeriesThemeableOptionsDefs,
    numberFormatValidator,
    seriesLabelOptionsDefs,
    tooltipOptionsDefs,
} from '../../chart/commonOptionsDefs';
import {
    colorStopsOrderValidator,
    fillOptionsDef,
    fontOptionsDef,
    lineDashOptionsDef,
    strokeOptionsDef,
} from '../../options/commonOptionsDefs';
import { without } from '../../utils/object';
import {
    type OptionsDefs,
    and,
    arrayLength,
    arrayOf,
    arrayOfDefs,
    boolean,
    callback,
    color,
    constant,
    greaterThan,
    lessThan,
    number,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    undocumented,
    union,
} from '../../utils/validation';

const fillsOptionsDef: OptionsDefs<FillsOptions> = {
    fills: and(
        arrayLength(2),
        arrayOf(optionsDefs<AgGaugeColorStop>({ color: color, stop: number }, '')),
        colorStopsOrderValidator
    ),
    fillMode: union('continuous', 'discrete'),
};

export const linearGaugeTargetOptionsDef: OptionsDefs<AgLinearGaugeTarget> = {
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

export const radialGaugeTargetOptionsDef: OptionsDefs<AgRadialGaugeTarget> = {
    value: required(number),
    text: string,
    shape: or(
        union('circle', 'cross', 'diamond', 'heart', 'plus', 'pin', 'square', 'star', 'triangle', 'line'),
        callback
    ),
    placement: union('inside', 'outside', 'middle'),
    spacing: positiveNumber,
    size: positiveNumber,
    rotation: number,
    label: {
        ...seriesLabelOptionsDefs,
        spacing: positiveNumber,
    },
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const linearGaugeSeriesThemeableOptionsDef: OptionsDefs<AgLinearGaugeThemeableOptions> = {
    ...without(commonSeriesThemeableOptionsDefs, ['listeners']),
    direction: union('horizontal', 'vertical'),
    cornerMode: union('container', 'item'),
    cornerRadius: positiveNumber,
    thickness: positiveNumber,
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
};

export const linearGaugeSeriesOptionsDef: OptionsDefs<AgLinearGaugePreset> = {
    ...without(commonSeriesOptionsDefs, ['listeners']),
    ...linearGaugeSeriesThemeableOptionsDef,
    type: required(constant('linear-gauge')),
    value: required(number),
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
};

// @ts-expect-error undocumented option
linearGaugeSeriesOptionsDef.margin = undocumented(number);
// @ts-expect-error undocumented option
linearGaugeSeriesOptionsDef.defaultColorRange = undocumented(arrayOf(color));
// @ts-expect-error undocumented option
linearGaugeSeriesOptionsDef.defaultTarget = undocumented({
    ...linearGaugeTargetOptionsDef,
    value: number,
    label: {
        ...seriesLabelOptionsDefs,
        spacing: number,
    },
});

// @ts-expect-error undocumented option
linearGaugeSeriesOptionsDef.defaultScale = undocumented(linearGaugeSeriesOptionsDef.scale);
// @ts-expect-error undocumented option
linearGaugeSeriesOptionsDef.scale.defaultFill = undocumented(color);

export const radialGaugeSeriesThemeableOptionsDef: OptionsDefs<AgRadialGaugeThemeableOptions> = {
    ...without(commonSeriesThemeableOptionsDefs, ['listeners']),
    outerRadius: positiveNumber,
    innerRadius: positiveNumber,
    outerRadiusRatio: ratio,
    innerRadiusRatio: ratio,
    startAngle: number,
    endAngle: number,
    spacing: positiveNumber,
    cornerMode: union('container', 'item'),
    cornerRadius: positiveNumber,
    scale: {
        min: and(number, lessThan('max')),
        max: and(number, greaterThan('min')),
        label: {
            enabled: boolean,
            formatter: callback,
            rotation: number,
            spacing: positiveNumber,
            minSpacing: positiveNumber,
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
        ...fillsOptionsDef,
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    needle: {
        enabled: boolean,
        spacing: positiveNumber,
        radiusRatio: ratio,
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    },
    label: {
        text: string,
        spacing: positiveNumber,
        ...autoSizedLabelOptionsDefs,
    },
    secondaryLabel: {
        text: string,
        ...autoSizedLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
};

export const radialGaugeSeriesOptionsDef: OptionsDefs<AgRadialGaugePreset> = {
    ...without(commonSeriesOptionsDefs, ['listeners']),
    ...radialGaugeSeriesThemeableOptionsDef,
    type: required(constant('radial-gauge')),
    value: required(number),
    targets: arrayOfDefs(radialGaugeTargetOptionsDef, 'target options array'),
};

// @ts-expect-error undocumented option
radialGaugeSeriesOptionsDef.defaultColorRange = undocumented(arrayOf(color));
// @ts-expect-error undocumented option
radialGaugeSeriesOptionsDef.defaultTarget = undocumented({
    ...radialGaugeTargetOptionsDef,
    value: number,
    label: {
        ...seriesLabelOptionsDefs,
        spacing: number,
    },
});
// @ts-expect-error undocumented option
radialGaugeSeriesOptionsDef.scale.defaultFill = undocumented(color);
