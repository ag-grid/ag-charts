import { type AgRadialGaugePreset, type AgRadialGaugeTarget, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    and,
    arrayOf,
    arrayOfDefs,
    boolean,
    callback,
    constant,
    fillOptionsDef,
    fontOptionsDef,
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

import { fillsOptionsDef } from '../linear-gauge/linearGaugeSeriesOptionsDef';

const {
    commonSeriesOptionsDefs,
    autoSizedLabelOptionsDefs,
    seriesLabelOptionsDefs,
    tooltipOptionsDefs,
    numberFormatValidator,
} = _ModuleSupport;

export const radialGaugeSeriesOptionsDef: OptionsDefs<AgRadialGaugePreset> = {
    type: required(constant('radial-gauge')),
    value: required(number),
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
    targets: arrayOfDefs<AgRadialGaugeTarget>({
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
            spacing: positiveNumber,
            ...seriesLabelOptionsDefs,
        },
        ...fillOptionsDef,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    }),
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
    ...commonSeriesOptionsDefs,
};
