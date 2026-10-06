import type {
    AgAxisBaseIntervalOptions,
    AgAxisCaptionOptions,
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
    AgCartesianAxisCaptionOptions,
    AgCartesianAxisLabelOptions,
    AgCartesianCrossLineLabelOptions,
    AgCartesianCrossLineLabelPlacement,
    AgCategoryAxisOptions,
    AgCommonCrossLineOptions,
    AgContinuousAxisOptions,
    AgCrossLineListeners,
    AgCrosshairLabel,
    AgCrosshairLabelRendererResult,
    AgCrosshairOptions,
    AgGroupedCategoryAxisOptions,
    AgGroupedCategoryDepthOptions,
    AgLogAxisOptions,
    AgNumberAxisOptions,
    AgRadiusCrossLineLabelOptions,
    AgRangeCrossLineThemeOptions,
    AgTimeAxisFormattableLabelFormat,
    AgTimeAxisFormattableLabelUnitFormat,
    AgTimeAxisOptions,
    AgTimeAxisParentLevel,
    AgUnitTimeAxisOptions,
    AxisValue,
} from 'ag-charts-types';

import { without } from '../data/object';
import {
    collisionOptionsDef,
    labelAutoFontSizeOptionsDefs,
    labelFitOptionsDefs,
    numberFormatValidator,
    textOrSegments,
    timeInterval,
    timeIntervalUnit,
} from './chartDefaults';
import {
    borderOptionsDef,
    colorOrRef,
    fillOptionsDef,
    fontOptionsDef,
    labelBoxOptionsDef,
    lineDashOptionsDef,
    signedPadding,
    strokeOptionsDef,
    textAlign,
    textWrap,
    themeOperator,
    verticalAlign,
} from './optionsDefaults';
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
    constant,
    date,
    defined,
    deprecated,
    greaterThan,
    lessThan,
    number,
    numericValue,
    object,
    optionsDefs,
    or,
    positiveNumber,
    positiveNumberNonZero,
    positiveNumericValueNonZero,
    ratio,
    required,
    string,
    typeUnion,
    undocumented,
    union,
    unionOrArray,
} from './validation';

export const commonCrossLineLabelOptionsDefs: OptionsDefs<AgBaseCrossLineLabelOptions> = {
    enabled: boolean,
    text: string,
    // Signed: label padding positions the label relative to the line, so negative values are meaningful.
    padding: signedPadding,
    border: borderOptionsDef,
    cornerRadius: number,
    ...fontOptionsDef,
    ...fillOptionsDef,
};

// Assigned before the defs below spread this object, so every cross-line variant picks it up.
// @ts-expect-error undocumented option
commonCrossLineLabelOptionsDefs.overflow = undocumented(union('pad-chart', 'realign-text', 'clip-text'));

// `fill`/`fillOpacity` belong to the `range` variant only, and `id` identifies rather than styles a cross line.
export const crossLineCommonStyleOptionsDefs: OptionsDefs<
    Omit<AgCommonCrossLineOptions<AgBaseCrossLineLabelOptions, unknown>, 'label' | 'id' | 'listeners'>
> = {
    enabled: boolean,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

const crossLineListenersOptionsDefs: OptionsDefs<AgCrossLineListeners<unknown>> = {
    click: callback,
    doubleClick: callback,
};

// Theme overrides apply to both variants, so `fill`/`fillOpacity` are valid here.
export const crossLineStyleOptionsDefs: OptionsDefs<Omit<AgRangeCrossLineThemeOptions, 'label'>> = {
    ...crossLineCommonStyleOptionsDefs,
    fill: colorOrRef,
    fillOpacity: ratio,
};

export const radiusCrossLineLabelOptionsDefs: OptionsDefs<AgRadiusCrossLineLabelOptions> = {
    ...commonCrossLineLabelOptionsDefs,
    positionAngle: number,
};

// Discriminated on `type` so each variant's value is checked with the supplied per-axis `value` validator.
export function crossLineOptionsDefs(
    value: Validator,
    labelDefs: OptionsDefs<AgBaseCrossLineLabelOptions>
): OptionsDefs<AgBaseCrossLineOptions<AxisValue, AgBaseCrossLineLabelOptions, unknown>> {
    // `id` and `listeners` are per-cross-line rather than stylistic, so they are not themeable.
    const commonStyle = {
        id: string,
        listeners: crossLineListenersOptionsDefs,
        ...crossLineCommonStyleOptionsDefs,
        label: labelDefs,
    };
    return typeUnion<AgBaseCrossLineOptions<AxisValue, AgBaseCrossLineLabelOptions, unknown>>(
        {
            line: { value: required(value), ...commonStyle },
            range: {
                range: required(and(arrayOf(value), arrayLength(2, 2))),
                fill: colorOrRef,
                fillOpacity: ratio,
                ...commonStyle,
            },
        },
        'cross-line options'
    );
}

const crossLineLabelPlacements: Record<AgCartesianCrossLineLabelPlacement, AgCartesianCrossLineLabelPlacement> = {
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right',
    start: 'start',
    end: 'end',
    'top-left': 'top-left',
    'top-right': 'top-right',
    'top-start': 'top-start',
    'top-end': 'top-end',
    'bottom-left': 'bottom-left',
    'bottom-right': 'bottom-right',
    'bottom-start': 'bottom-start',
    'bottom-end': 'bottom-end',
    'left-top': 'left-top',
    'left-bottom': 'left-bottom',
    'right-top': 'right-top',
    'right-bottom': 'right-bottom',
    'start-top': 'start-top',
    'start-bottom': 'start-bottom',
    'end-top': 'end-top',
    'end-bottom': 'end-bottom',
    inside: 'inside',
    'inside-top': 'inside-top',
    'inside-bottom': 'inside-bottom',
    'inside-left': 'inside-left',
    'inside-right': 'inside-right',
    'inside-start': 'inside-start',
    'inside-end': 'inside-end',
    'inside-top-left': 'inside-top-left',
    'inside-top-right': 'inside-top-right',
    'inside-top-start': 'inside-top-start',
    'inside-top-end': 'inside-top-end',
    'inside-bottom-left': 'inside-bottom-left',
    'inside-bottom-right': 'inside-bottom-right',
    'inside-bottom-start': 'inside-bottom-start',
    'inside-bottom-end': 'inside-bottom-end',
};

export const cartesianCrossLineLabelOptionsDefs: OptionsDefs<AgCartesianCrossLineLabelOptions> = {
    ...commonCrossLineLabelOptionsDefs,
    position: deprecated(
        union(
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
        'Use `placement` instead.'
    ),
    // Which values apply depends on the cross line's type and axis, so they are checked when it is laid out.
    placement: unionOrArray(crossLineLabelPlacements),
    rotation: number,
    collision: collisionOptionsDef,
    ...labelFitOptionsDefs,
    ...labelAutoFontSizeOptionsDefs,
};

// @ts-expect-error undocumented option
cartesianCrossLineLabelOptionsDefs.reserveSpace = undocumented(boolean);

export const cartesianCrossLineOptionsDefs = crossLineOptionsDefs(defined, cartesianCrossLineLabelOptionsDefs);

export const commonAxisLabelOptionsDefs: OptionsDefs<AgBaseAxisLabelOptions> = {
    enabled: boolean,
    rotation: number,
    textAlign,
    verticalAlign,
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
    wrapping: textWrap,
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
    stroke: colorOrRef,
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
                fill: colorOrRef,
                fillOpacity: positiveNumber,
                stroke: or(colorOrRef, themeOperator), // TODO: is `themeOperator` still needed?
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
        width: deprecated(positiveNumber, 'Use `strokeWidth` instead.'),
        stroke: colorOrRef,
        strokeWidth: positiveNumber,
        strokeOpacity: ratio,
        lineDash: arrayOf(positiveNumber),
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

// @ts-expect-error undocumented option
commonAxisOptionsDefs.ignoreZoom = undocumented(boolean);

// @ts-expect-error undocumented option
commonAxisOptionsDefs.linkZoom = undocumented(string);

export const commonAxisCaptionOptionsDefs: OptionsDefs<AgAxisCaptionOptions> = {
    enabled: boolean,
    text: textOrSegments,
    spacing: positiveNumber,
    maxWidth: positiveNumber,
    maxHeight: positiveNumber,
    wrapping: union('never', 'always', 'hyphenate', 'on-space'),
    truncate: boolean,
    formatter: callbackOf(textOrSegments),
    ...fontOptionsDef,
};

export const cartesianAxisCaptionOptionsDefs: OptionsDefs<AgCartesianAxisCaptionOptions> = {
    ...commonAxisCaptionOptionsDefs,
    orientation: union('horizontal', 'vertical', 'vertical-reversed'),
};

export const cartesianAxisOptionsDefs: OptionsDefs<
    Omit<AgBaseCartesianAxisOptions<any>, 'type' | 'label' | 'primaryLabel' | 'crosshair'>
> = {
    ...commonAxisOptionsDefs,
    title: cartesianAxisCaptionOptionsDefs,
    crossAt: {
        value: required(or(numericValue, date, string, arrayOf(string))),
        sticky: boolean,
        titlePlacement: union('crossing', 'edge'),
        labelPlacement: union('crossing', 'edge'),
        crosshairLabelPlacement: union('crossing', 'edge'),
    },
    crossLines: arrayOfDefs(cartesianCrossLineOptionsDefs, 'a cross-line options array'),
    position: union('top', 'right', 'bottom', 'left'),
    thickness: positiveNumber,
    maxThicknessRatio: ratio,
    listeners: {
        click: callback,
        doubleClick: callback,
        crossLineClick: callback,
        crossLineDoubleClick: callback,
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
                number,
                date,
                optionsDefs<AgCrosshairLabelRendererResult>(
                    {
                        text: string,
                        color: colorOrRef,
                        backgroundColor: colorOrRef,
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
                : positiveNumericValueNonZero,
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
                stroke: colorOrRef,
                width: positiveNumber,
            },
        },
        'depth options objects array'
    ),
};

export const numberAxisOptionsDefs: OptionsDefs<AgNumberAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(numericValue),
    type: constant('number'),
    label: cartesianNumericAxisLabel,
    crosshair: cartesianAxisCrosshairOptions(true),
    crossLines: arrayOfDefs(
        crossLineOptionsDefs(numericValue, cartesianCrossLineLabelOptionsDefs),
        'a cross-line options array'
    ),
};

export const logAxisOptionsDefs: OptionsDefs<AgLogAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(numericValue),
    type: constant('log'),
    base: and(
        positiveNumberNonZero,
        attachDescription((value) => value !== 1, 'not equal to 1')
    ),
    label: cartesianNumericAxisLabel,
    crosshair: cartesianAxisCrosshairOptions(true),
    crossLines: arrayOfDefs(
        crossLineOptionsDefs(numericValue, cartesianCrossLineLabelOptionsDefs),
        'a cross-line options array'
    ),
};

export const timeAxisOptionsDefs: OptionsDefs<AgTimeAxisOptions> = {
    ...cartesianAxisOptionsDefs,
    ...continuousAxisOptions(or(number, date), true),
    type: constant('time'),
    label: cartesianTimeAxisLabel,
    parentLevel: cartesianTimeAxisParentLevel,
    crosshair: cartesianAxisCrosshairOptions(true, true),
    crossLines: arrayOfDefs(
        crossLineOptionsDefs(or(numericValue, date), cartesianCrossLineLabelOptionsDefs),
        'a cross-line options array'
    ),
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
    crossLines: arrayOfDefs(
        crossLineOptionsDefs(or(numericValue, date), cartesianCrossLineLabelOptionsDefs),
        'a cross-line options array'
    ),
};

function crossLineThemeOptionsDefs<LabelDefs>(label: LabelDefs) {
    const range = { ...crossLineStyleOptionsDefs, label };
    return { ...range, line: { ...crossLineCommonStyleOptionsDefs, label }, range };
}

/** Theme overrides for a cartesian axis type: its options plus per-position overrides, cross-lines styled by kind. */
export function cartesianAxisThemeOptionsDefs(axisDefs: OptionsDefs<any>): OptionsDefs<any> {
    const positioned = without(axisDefs, ['type', 'crossLines', 'position']);
    return {
        ...without(axisDefs, ['type', 'crossLines']),
        top: positioned,
        right: positioned,
        bottom: positioned,
        left: positioned,
        crossLines: crossLineThemeOptionsDefs(cartesianCrossLineLabelOptionsDefs),
    };
}

/** Theme overrides for a polar axis type, cross-lines styled by kind. */
export function polarAxisThemeOptionsDefs(
    axisDefs: OptionsDefs<any>,
    crossLineLabel: OptionsDefs<any>
): OptionsDefs<any> {
    return { ...without(axisDefs, ['type', 'crossLines']), crossLines: crossLineThemeOptionsDefs(crossLineLabel) };
}
