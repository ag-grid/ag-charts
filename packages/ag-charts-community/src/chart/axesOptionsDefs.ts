import {
    type OptionsDefs,
    type Validator,
    and,
    arrayLength,
    arrayOf,
    arrayOfDefs,
    attachDescription,
    boolean,
    callback,
    color,
    defined,
    fontOptionsDef,
    greaterThan,
    instanceOf,
    isValidNumberFormat,
    lessThan,
    lineDashOptionsDef,
    number,
    or,
    positiveNumber,
    positiveNumberNonZero,
    ratio,
    required,
    string,
    strokeOptionsDef,
    union,
} from 'ag-charts-core';
import type {
    AgAxisGridStyle,
    AgBaseAxisLabelOptions,
    AgBaseAxisOptions,
    AgBaseCartesianAxisLabelOptions,
    AgBaseCartesianAxisOptions,
    AgBaseCrossLineLabelOptions,
    AgBaseCrossLineOptions,
    AgBaseCrosshairLabel,
    AgCartesianCrossLineOptions,
    AgContinuousAxisOptions,
    AgCrosshairLabel,
    AgCrosshairOptions,
} from 'ag-charts-types';

import { TimeInterval } from '../util/time';

export const numberFormatValidator = attachDescription(isValidNumberFormat, 'a valid number format string');

export const commonCrossLineLabelOptionsDefs: OptionsDefs<AgBaseCrossLineLabelOptions> = {
    enabled: boolean,
    text: string,
    padding: number,
    ...fontOptionsDef,
};

export const commonCrossLineOptionsDefs: OptionsDefs<AgBaseCrossLineOptions> = {
    enabled: boolean,
    type: required(union('line', 'range')),
    range: and(
        attachDescription((_, { options }) => options.type === 'range', "crossLine type to be 'range'"),
        arrayOf(defined),
        arrayLength(2, 2)
    ),
    value: and(
        attachDescription((_, { options }) => options.type === 'line', "crossLine type to be 'line'"),
        defined
    ),
    label: commonCrossLineLabelOptionsDefs,
    fill: string,
    fillOpacity: ratio,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export const cartesianCrossLineOptionsDefs: OptionsDefs<AgCartesianCrossLineOptions> = {
    ...commonCrossLineOptionsDefs,
    label: {
        ...commonCrossLineLabelOptionsDefs,
        position: union(
            'top',
            'left',
            'right',
            'bottom',
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
            'inside',
            'inside-left',
            'inside-right',
            'inside-top',
            'inside-bottom',
            'inside-top-left',
            'inside-bottom-left',
            'inside-top-right',
            'inside-bottom-right'
        ),
        rotation: number,
    },
};

export const commonAxisLabelOptionsDefs: OptionsDefs<AgBaseAxisLabelOptions> = {
    enabled: boolean,
    rotation: number,
    avoidCollisions: boolean,
    minSpacing: positiveNumber,
    spacing: positiveNumber,
    formatter: callback,
    itemStyler: callback,
    ...fontOptionsDef,
};

export const cartesianAxisLabelOptionsDefs: OptionsDefs<AgBaseCartesianAxisLabelOptions> = {
    autoRotate: boolean,
    autoRotateAngle: number,
    ...commonAxisLabelOptionsDefs,
};

export const commonAxisOptionsDefs: OptionsDefs<Omit<AgBaseAxisOptions, 'type'>> = {
    reverse: boolean,
    gridLine: {
        enabled: boolean,
        width: positiveNumber,
        style: arrayOfDefs<AgAxisGridStyle>(
            {
                stroke: color,
                lineDash: arrayOf(positiveNumber),
            },
            'a grid-line style object array'
        ),
    },
    interval: {
        values: arrayOf(defined),
        minSpacing: positiveNumber,
    },
    label: commonAxisLabelOptionsDefs,
    line: {
        enabled: boolean,
        width: positiveNumber,
        stroke: color,
    },
    tick: {
        enabled: boolean,
        width: positiveNumber,
        size: positiveNumber,
        stroke: color,
    },
};

// @ts-expect-error undocumented option
commonAxisOptionsDefs.context = defined;

// @ts-expect-error undocumented option
commonAxisOptionsDefs.layoutConstraints = {
    stacked: required(boolean),
    align: required(union('start', 'end')),
    unit: required(union('percent', 'px')),
    width: required(positiveNumber),
};

export const cartesianAxisOptionsDefs: OptionsDefs<
    Omit<AgBaseCartesianAxisOptions<any>, 'type' | 'label' | 'crosshair'>
> = {
    ...commonAxisOptionsDefs,
    keys: arrayOf(string),
    crossLines: arrayOfDefs(cartesianCrossLineOptionsDefs, 'a cross-line options array'),
    position: union('top', 'right', 'bottom', 'left'),
    thickness: positiveNumber,
    title: {
        enabled: boolean,
        text: string,
        spacing: positiveNumber,
        formatter: callback,
        ...fontOptionsDef,
    },
};

export function cartesianAxisCrosshairOptions<T extends boolean>(canFormat?: T) {
    const crosshairLabel = {
        enabled: boolean,
        xOffset: number,
        yOffset: number,
        renderer: callback,
    };
    if (canFormat) {
        (crosshairLabel as OptionsDefs<AgCrosshairLabel>).format = string;
    }
    return {
        enabled: boolean,
        snap: boolean,
        label: crosshairLabel,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    } as OptionsDefs<AgCrosshairOptions<T extends true ? AgCrosshairLabel : AgBaseCrosshairLabel>>;
}

export function continuousAxisOptions(
    validDatum: Validator,
    supportTimeInterval?: boolean
): OptionsDefs<AgContinuousAxisOptions> {
    return {
        min: and(validDatum, lessThan('max')),
        max: and(validDatum, greaterThan('min')),
        nice: boolean,
        interval: {
            step: supportTimeInterval
                ? or(positiveNumberNonZero, or(positiveNumberNonZero, instanceOf(TimeInterval)))
                : positiveNumberNonZero,
            values: arrayOf(validDatum),
            minSpacing: and(positiveNumber, lessThan('maxSpacing')),
            maxSpacing: and(positiveNumber, greaterThan('minSpacing')),
        },
    };
}
