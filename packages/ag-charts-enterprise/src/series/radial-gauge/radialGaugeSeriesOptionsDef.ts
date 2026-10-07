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
    seriesLabelOptionsDefs,
    string,
    strokeOptionsDef,
    tooltipOptionsDefs,
    undocumented,
    union,
    without,
} from 'ag-charts-core';

import { fillsOptionsDef, gaugeTooltipOptionsDef } from '../gauge-util/gaugeOptionsDefs';

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
    label: {
        ...seriesLabelOptionsDefs,
        spacing: positiveNumber,
    },
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
        ...autoSizedLabelOptionsDefs,
    },
    secondaryLabel: {
        text: string,
        ...autoSizedLabelOptionsDefs,
    },
    tooltip: tooltipOptionsDefs,
};

// @ts-expect-error undocumented option
radialGaugeSeriesThemeableOptionsDef.defaultColorRange = undocumented(arrayOf(color));
// @ts-expect-error undocumented option
radialGaugeSeriesThemeableOptionsDef.defaultTarget = undocumented({
    ...radialGaugeTargetOptionsDef,
    value: number,
    label: {
        ...seriesLabelOptionsDefs,
        spacing: number,
    },
});
(radialGaugeSeriesThemeableOptionsDef.scale as any).defaultFill = undocumented(color);
// @ts-expect-error undocumented option
radialGaugeSeriesThemeableOptionsDef.scale.interval.minSpacing = undocumented(positiveNumber);
// @ts-expect-error undocumented option
radialGaugeSeriesThemeableOptionsDef.scale.interval.maxSpacing = undocumented(positiveNumber);

export const radialGaugeSeriesOptionsDef: OptionsDefs<AgRadialGaugePreset> = {
    ...without(commonSeriesOptionsDefs, ['listeners']),
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
