import {
    type OptionsDefs,
    type Validator,
    and,
    arrayLength,
    arrayOf,
    arrayOfDefs,
    attachDescription,
    boolean,
    borderOptionsDef,
    callback,
    callbackDefs,
    callbackOf,
    color,
    constant,
    date,
    defined,
    fillOptionsDef,
    fontOptionsDef,
    greaterThan,
    labelBoxOptionsDef,
    lessThan,
    lineDashOptionsDef,
    number,
    numberFormatValidator,
    object,
    optionsDefs,
    or,
    padding,
    positiveNumber,
    positiveNumberNonZero,
    ratio,
    required,
    string,
    strokeOptionsDef,
    textOrSegments,
    themeOperator,
    undocumented,
    union,
} from 'ag-charts-core';
import type {
    AgAxisBaseIntervalOptions,
    AgAxisDiscreteTimeIntervalOptions,
    AgAxisGridStyle,
    AgBandHighlightOptions,
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
    AgCategoryAxisOptions,
    AgContinuousAxisOptions,
    AgCrosshairLabel,
    AgCrosshairLabelRendererResult,
    AgCrosshairOptions,
    AgGroupedCategoryAxisOptions,
    AgGroupedCategoryDepthOptions,
    AgLogAxisOptions,
    AgNumberAxisOptions,
    AgTimeAxisFormattableLabelFormat,
    AgTimeAxisFormattableLabelUnitFormat,
    AgTimeAxisOptions,
    AgTimeAxisParentLevel,
    AgTimeInterval,
    AgUnitTimeAxisOptions,
} from 'ag-charts-types';

export const timeIntervalUnit = union('millisecond', 'second', 'minute', 'hour', 'day', 'month', 'year');

const timeIntervalDefs: OptionsDefs<AgTimeInterval> = {
    unit: required(timeIntervalUnit),
    step: positiveNumberNonZero,
    epoch: date,
    utc: boolean,
};

// @ts-expect-error undocumented option - required for interop
timeIntervalDefs.every = callback;

export const timeInterval = optionsDefs<AgTimeInterval>(timeIntervalDefs, 'a time interval object');

export const commonCrossLineLabelOptionsDefs: OptionsDefs<AgBaseCrossLineLabelOptions> = {
    enabled: boolean,
    text: string,
    padding: padding,
    border: borderOptionsDef,
    cornerRadius: number,
    ...fontOptionsDef,
    ...fillOptionsDef,
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
        fill: color,
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
    formatter: callbackOf(textOrSegments),
    itemStyler: callbackDefs<AgBaseAxisLabelStyleOptions>({
        ...fontOptionsDef,
        ...labelBoxOptionsDef,
        spacing: number,
    }),
    ...fontOptionsDef,
    ...labelBoxOptionsDef,
};

export const cartesianAxisLabelOptionsDefs: OptionsDefs<AgBaseCartesianAxisLabelOptions> = {
    autoRotate: boolean,
    autoRotateAngle: number,
    wrapping: union('never', 'always', 'hyphenate', 'on-space'),
    truncate: boolean,
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

export const commonAxisIntervalOptionsDefs: OptionsDefs<AgAxisBaseIntervalOptions> = {
    values: arrayOf(defined),
    minSpacing: positiveNumber,
};

export const commonAxisOptionsDefs: OptionsDefs<Omit<AgBaseAxisOptions, 'type'>> = {
    reverse: boolean,
    gridLine: {
        enabled: boolean,
        width: positiveNumber,
        style: arrayOfDefs<AgAxisGridStyle>(
            {
                fill: color,
                fillOpacity: positiveNumber,
                stroke: or(color, themeOperator),
                strokeWidth: positiveNumber,
                lineDash: arrayOf(positiveNumber),
            },
            'a grid-line style object array'
        ),
    },
    interval: commonAxisIntervalOptionsDefs,
    label: commonAxisLabelOptionsDefs,
    line: {
        enabled: boolean,
        width: positiveNumber,
        stroke: color,
    },
    tick: cartesianAxisTick,
    context: () => true,
};

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
    crossAt: {
        value: required(or(number, date, string, arrayOf(string))),
        sticky: boolean,
    },
    crossLines: arrayOfDefs(cartesianCrossLineOptionsDefs, 'a cross-line options array'),
    position: union('top', 'right', 'bottom', 'left'),
    thickness: positiveNumber,
    maxThicknessRatio: ratio,
    title: {
        enabled: boolean,
        text: textOrSegments,
        spacing: positiveNumber,
        formatter: callbackOf(textOrSegments),
        ...fontOptionsDef,
    },
};

// @ts-expect-error undocumented option
cartesianAxisOptionsDefs.title._enabledFromTheme = undocumented(boolean);

export const cartesianAxisBandHighlightOptions: OptionsDefs<AgBandHighlightOptions> = {
    enabled: boolean,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

export function cartesianAxisCrosshairOptions(): OptionsDefs<AgCrosshairOptions<AgBaseCrosshairLabel>>;
export function cartesianAxisCrosshairOptions(
    canFormat: true
): OptionsDefs<AgCrosshairOptions<AgCrosshairLabel<string>>>;
export function cartesianAxisCrosshairOptions(
    canFormat: true,
    timeFormat: true
): OptionsDefs<AgCrosshairOptions<AgCrosshairLabel<AgTimeAxisFormattableLabelFormat>>>;
export function cartesianAxisCrosshairOptions(
    canFormat?: boolean,
    timeFormat?: boolean
): OptionsDefs<AgCrosshairOptions<AgCrosshairLabel<any> | AgBaseCrosshairLabel>> {
    const baseCrosshairLabel: OptionsDefs<AgBaseCrosshairLabel> = {
        enabled: boolean,
        xOffset: number,
        yOffset: number,
        formatter: callbackOf(string),
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
    let crosshairLabel: OptionsDefs<AgCrosshairLabel<any>> | undefined;
    if (canFormat) {
        crosshairLabel = {
            ...baseCrosshairLabel,
            format: timeFormat
                ? or(
                      string,
                      optionsDefs<AgTimeAxisFormattableLabelUnitFormat>({
                          millisecond: string,
                          second: string,
                          hour: string,
                          day: string,
                          month: string,
                          year: string,
                      })
                  )
                : string,
        };
    }
    return {
        enabled: boolean,
        snap: boolean,
        label: crosshairLabel ?? baseCrosshairLabel,
        ...strokeOptionsDef,
        ...lineDashOptionsDef,
    };
}

export function continuousAxisOptions(
    validDatum: Validator,
    supportTimeInterval?: boolean
): OptionsDefs<AgContinuousAxisOptions> {
    return {
        min: and(validDatum, lessThan('max')),
        max: and(validDatum, greaterThan('min')),
        preferredMin: and(validDatum, lessThan('preferredMax'), lessThan('max')),
        preferredMax: and(validDatum, greaterThan('preferredMin'), greaterThan('min')),
        nice: boolean,
        interval: {
            step: supportTimeInterval
                ? or(positiveNumberNonZero, timeIntervalUnit, timeInterval)
                : positiveNumberNonZero,
            values: arrayOf(validDatum),
            minSpacing: and(positiveNumber, lessThan('maxSpacing')),
            maxSpacing: and(positiveNumber, greaterThan('minSpacing')),
        },
    };
}

export const discreteTimeAxisIntervalOptionsDefs: OptionsDefs<AgAxisDiscreteTimeIntervalOptions> = {
    step: or(positiveNumberNonZero, timeIntervalUnit, timeInterval),
    values: arrayOf(or(number, date)),
    minSpacing: and(positiveNumber, lessThan('maxSpacing')),
    maxSpacing: and(positiveNumber, greaterThan('minSpacing')),
    placement: union('on', 'between'),
};

export const categoryAxisOptionsDefs: OptionsDefs<AgCategoryAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: constant('category'),
    label: cartesianAxisLabelOptionsDefs,
    paddingInner: ratio,
    paddingOuter: ratio,
    groupPaddingInner: ratio,
    crosshair: cartesianAxisCrosshairOptions(),
    bandAlignment: union('justify', 'start', 'center', 'end'),
    bandHighlight: cartesianAxisBandHighlightOptions,
    interval: {
        ...commonAxisIntervalOptionsDefs,
        placement: union('on', 'between'),
    },
    skipNullBars: boolean,
};

export const groupedCategoryAxisOptionsDefs: OptionsDefs<AgGroupedCategoryAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: constant('grouped-category'),
    label: cartesianAxisLabelOptionsDefs,
    crosshair: cartesianAxisCrosshairOptions(),
    bandHighlight: cartesianAxisBandHighlightOptions,
    paddingInner: ratio,
    groupPaddingInner: ratio,
    depthOptions: arrayOfDefs<AgGroupedCategoryDepthOptions>(
        {
            label: {
                enabled: boolean,
                avoidCollisions: boolean,
                wrapping: union('never', 'always', 'hyphenate', 'on-space'),
                truncate: boolean,
                rotation: number,
                spacing: number,
                ...fontOptionsDef,
                ...labelBoxOptionsDef,
            },
            tick: {
                enabled: boolean,
                stroke: color,
                width: positiveNumber,
            },
        },
        'depth options objects array'
    ),
};

export const numberAxisOptionsDefs: OptionsDefs<AgNumberAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(number),
    type: constant('number'),
    label: cartesianNumericAxisLabel,
    crosshair: cartesianAxisCrosshairOptions(true),
};

export const logAxisOptionsDefs: OptionsDefs<AgLogAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(number),
    type: constant('log'),
    base: and(
        positiveNumberNonZero,
        attachDescription((value) => value !== 1, 'not equal to 1')
    ),
    label: cartesianNumericAxisLabel,
    crosshair: cartesianAxisCrosshairOptions(true),
};

export const timeAxisOptionsDefs: OptionsDefs<AgTimeAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(or(number, date), true),
    type: constant('time'),
    label: cartesianTimeAxisLabel,
    parentLevel: cartesianTimeAxisParentLevel,
    crosshair: cartesianAxisCrosshairOptions(true, true),
};

export const unitTimeAxisOptionsDefs: OptionsDefs<AgUnitTimeAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    type: constant('unit-time'),
    unit: or(timeInterval, timeIntervalUnit),
    label: cartesianTimeAxisLabel,
    parentLevel: cartesianTimeAxisParentLevel,
    paddingInner: ratio,
    paddingOuter: ratio,
    groupPaddingInner: ratio,
    crosshair: cartesianAxisCrosshairOptions(true, true),
    bandAlignment: union('justify', 'start', 'center', 'end'),
    bandHighlight: cartesianAxisBandHighlightOptions,
    skipNullBars: boolean,
    min: and(or(number, date), lessThan('max')),
    max: and(or(number, date), greaterThan('min')),
    preferredMin: and(or(number, date), lessThan('preferredMax'), lessThan('max')),
    preferredMax: and(or(number, date), greaterThan('preferredMin'), greaterThan('min')),
    interval: discreteTimeAxisIntervalOptionsDefs,
};
