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
    callbackDefs,
    callbackOf,
    color,
    defined,
    fontOptionsDef,
    greaterThan,
    instanceOf,
    isValidNumberFormat,
    lessThan,
    lineDashOptionsDef,
    number,
    object,
    optionsDefs,
    or,
    positiveNumber,
    positiveNumberNonZero,
    ratio,
    required,
    string,
    strokeOptionsDef,
    themeOperator,
    undocumented,
    union,
} from 'ag-charts-core';
import type {
    AgAxisGridStyle,
    AgBaseAxisLabelOptions,
    AgBaseAxisLabelStyleOptions,
    AgBaseAxisOptions,
    AgBaseCartesianAxisLabelOptions,
    AgBaseCartesianAxisOptions,
    AgBaseCrossLineLabelOptions,
    AgBaseCrossLineOptions,
    AgBaseCrosshairLabel,
    AgCartesianAxisLabelOptions,
    AgCartesianCrossLineOptions,
    AgContinuousAxisOptions,
    AgCrosshairLabel,
    AgCrosshairLabelRendererResult,
    AgCrosshairOptions,
    AgTimeAxisParentLevel,
} from 'ag-charts-types';

import { TimeInterval } from '../util/time';

export const numberFormatValidator = attachDescription(isValidNumberFormat, 'a valid number format string');

export const commonCrossLineLabelOptionsDefs: OptionsDefs<AgBaseCrossLineLabelOptions> = {
    enabled: boolean,
    text: string,
    padding: number,
    ...fontOptionsDef,
};

export const commonCrossLineOptionsDefs = attachDescription<AgBaseCrossLineOptions>(
    {
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
    },
    'cross-line options'
);

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
    itemStyler: callbackDefs<AgBaseAxisLabelStyleOptions>({
        ...fontOptionsDef,
        spacing: number,
    }),
    ...fontOptionsDef,
};

export const cartesianAxisLabelOptionsDefs: OptionsDefs<AgBaseCartesianAxisLabelOptions> = {
    autoRotate: boolean,
    autoRotateAngle: number,
    ...commonAxisLabelOptionsDefs,
};

export const cartesianNumericAxisLabel: OptionsDefs<AgCartesianAxisLabelOptions> = {
    format: numberFormatValidator,
    ...cartesianAxisLabelOptionsDefs,
};

export const cartesianTimeAxisLabel: OptionsDefs<AgCartesianAxisLabelOptions> = {
    format: or(string, object),
    ...cartesianAxisLabelOptionsDefs,
};

const cartesianAxisTick = {
    enabled: boolean,
    width: positiveNumber,
    size: positiveNumber,
    stroke: color,
};

export const cartesianTimeAxisParentLevel: OptionsDefs<AgTimeAxisParentLevel> = {
    enabled: boolean,
    label: cartesianTimeAxisLabel,
    tick: cartesianAxisTick,
};

export const commonAxisOptionsDefs: OptionsDefs<Omit<AgBaseAxisOptions, 'type'>> = {
    reverse: boolean,
    gridLine: {
        enabled: boolean,
        width: positiveNumber,
        style: arrayOfDefs<AgAxisGridStyle>(
            {
                stroke: or(color, themeOperator),
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
    tick: cartesianAxisTick,
};

// @ts-expect-error undocumented option
commonAxisOptionsDefs.context = undocumented(() => true);

// @ts-expect-error undocumented option
commonAxisOptionsDefs.layoutConstraints = undocumented({
    stacked: required(boolean),
    align: required(union('start', 'end')),
    unit: required(union('percent', 'px')),
    width: required(positiveNumber),
});

export const cartesianAxisOptionsDefs: OptionsDefs<
    Omit<AgBaseCartesianAxisOptions<any>, 'type' | 'label' | 'primaryLabel' | 'crosshair'>
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

// @ts-expect-error undocumented option
cartesianAxisOptionsDefs.title._enabledFromTheme = undocumented(boolean);

export function cartesianAxisCrosshairOptions<T extends boolean>(canFormat?: T) {
    const crosshairLabel = {
        enabled: boolean,
        xOffset: number,
        yOffset: number,
        renderer: callbackOf(
            or(
                string,
                optionsDefs<AgCrosshairLabelRendererResult>(
                    {
                        text: string,
                        color: color,
                        backgroundColor: color,
                        opacity: ratio,
                    },
                    'crosshair label renderer result object'
                )
            )
        ),
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
            step: supportTimeInterval ? or(positiveNumberNonZero, instanceOf(TimeInterval)) : positiveNumberNonZero,
            values: arrayOf(validDatum),
            minSpacing: and(positiveNumber, lessThan('maxSpacing')),
            maxSpacing: and(positiveNumber, greaterThan('minSpacing')),
        },
    };
}
