import type {
    AgRadialGaugePreset,
    AgRadialGaugeTarget,
    AgRadialGaugeThemeOverrides,
    AgRadialGaugeThemeableOptions,
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
    fillOptionsDef,
    fontOptionsDef,
    greaterThan,
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
    without,
} from 'ag-charts-core';

import { fillsOptionsDef, gaugeTargetLabelOptionsDef, gaugeTooltipOptionsDef } from '../gauge-util/gaugeOptionsDefs';

export const radialGaugeTargetOptionsDef: OptionsDefs<AgRadialGaugeTarget> = {
    value: required(numericValue),
    text: string,
    shape: or(
        union('circle', 'cross', 'diamond', 'heart', 'plus', 'pin', 'square', 'star', 'triangle', 'line'),
        callback
    ),
    placement: union('inside', 'outside', 'middle'),
    spacing: positiveNumber,
    size: positiveNumber,
    rotation: number,
    label: gaugeTargetLabelOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

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
        min: and(numericValue, lessThan('max')),
        max: and(numericValue, greaterThan('min')),
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
            values: arrayOf(numericValue),
            step: numericValue,
            ...undocumentedDefs({
                minSpacing: positiveNumber,
                maxSpacing: positiveNumber,
            }),
        },
        ...fillsOptionsDef,
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
        ...undocumentedDefs({ defaultFill: color }),
    },
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
        maxWidth: positiveNumber,
        maxHeight: positiveNumber,
        ...autoSizedLabelOptionsDefs,
    },
    secondaryLabel: {
        text: string,
        ...autoSizedLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
    ...undocumentedDefs({
        defaultColorRange: arrayOf(color),
        defaultTarget: {
            ...radialGaugeTargetOptionsDef,
            value: number,
            label: gaugeTargetLabelOptionsDef,
        },
    }),
};

export const radialGaugeSeriesOptionsDef: OptionsDefs<AgRadialGaugePreset> = {
    ...without(commonSeriesOptionsDefs, ['listeners', 'focusIndex']),
    ...radialGaugeSeriesThemeableOptionsDef,
    type: required(constant('radial-gauge')),
    value: required(numericValue),
    targets: arrayOfDefs(radialGaugeTargetOptionsDef, 'target options array'),
};

export const radialGaugeThemeOptionsDef: Partial<OptionsDefs<AgRadialGaugeThemeOverrides>> = {
    ...radialGaugeSeriesThemeableOptionsDef,
    targets: without(radialGaugeTargetOptionsDef, ['value']),
    tooltip: gaugeTooltipOptionsDef,
};
