import {
    type AgAnnotationAxisLabel,
    type AgAnnotationHandle,
    type AgAnnotationOptionsToolbarButton,
    type AgAnnotationOptionsToolbarSwitch,
    type AgAnnotationPoint,
    type AgChannelAnnotationText,
    type AgFibonacciAnnotationStyles,
    type AgGroupingValueType,
    type AgInitialStateLegendOptions,
    type AgInitialStateOptions,
    type AgLineAnnotationText,
    type LineOptions,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    array,
    arrayOf,
    arrayOfDefs,
    boolean,
    callback,
    color,
    constant,
    fillOptionsDef,
    fontOptionsDef,
    lineDashOptionsDef,
    number,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    strokeOptionsDef,
    typeUnion,
    undocumented,
    union,
} from 'ag-charts-core';
import type {
    AgAnnotation,
    AgAnnotationsOptions,
    AgAnnotationsToolbarButton,
    AgStateSerializableDate,
} from 'ag-charts-types';

const { toolbarButtonOptionsDefs } = _ModuleSupport;

export const annotationOptionsDef: OptionsDefs<AgAnnotationsOptions> = {
    enabled: boolean,
    axesButtons: {
        enabled: boolean,
        axes: union('x', 'y', 'xy'),
    },
    toolbar: {
        enabled: boolean,
        padding: positiveNumber,
        buttons: arrayOfDefs<AgAnnotationsToolbarButton>(
            {
                ...toolbarButtonOptionsDefs,
                value: union(
                    'line-menu',
                    'fibonacci-menu',
                    'text-menu',
                    'shape-menu',
                    'measurer-menu',
                    'line',
                    'horizontal-line',
                    'vertical-line',
                    'parallel-channel',
                    'disjoint-channel',
                    'fibonacci-retracement',
                    'fibonacci-retracement-trend-based',
                    'text',
                    'comment',
                    'callout',
                    'note',
                    'clear'
                ),
            },
            'annotation toolbar buttons array'
        ),
    },
    optionsToolbar: {
        enabled: boolean,
        buttons: arrayOf(
            or(
                optionsDefs<AgAnnotationOptionsToolbarButton>({
                    ...toolbarButtonOptionsDefs,
                    value: required(
                        union(
                            'line-stroke-width',
                            'line-style-type',
                            'line-color',
                            'fill-color',
                            'text-color',
                            'text-size',
                            'delete',
                            'settings'
                        )
                    ),
                }),
                optionsDefs<AgAnnotationOptionsToolbarSwitch>({
                    ...toolbarButtonOptionsDefs,
                    value: required(union('lock')),
                    checkedOverrides: toolbarButtonOptionsDefs,
                })
            )
        ),
    },
};

// @ts-expect-error undocumented option
annotationOptionsDef.data = undocumented(array);
// @ts-expect-error undocumented option
annotationOptionsDef.xKey = undocumented(string);
// @ts-expect-error undocumented option
annotationOptionsDef.volumeKey = undocumented(string);
// @ts-expect-error undocumented option
annotationOptionsDef.snap = undocumented(boolean);

const serializableDate = optionsDefs<AgStateSerializableDate>(
    {
        __type: required(constant('date')),
        value: or(string, number),
    },
    'a serializable date object'
);
const xValue = or(string, number, serializableDate);
const annotationValue = or(
    xValue,
    optionsDefs<AgGroupingValueType>({
        value: xValue,
        groupPercentage: number,
    })
);

const annotationAxisLabelOptionsDef: OptionsDefs<AgAnnotationAxisLabel> = {
    enabled: boolean,
    cornerRadius: positiveNumber,
    formatter: callback,
    ...fontOptionsDef,
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

const lineAnnotationTextOptionsDef: OptionsDefs<AgLineAnnotationText> = {
    label: string,
    position: union('top', 'center', 'bottom'),
    alignment: union('left', 'center', 'right'),
    ...fontOptionsDef,
};

const channelAnnotationTextOptionsDef: OptionsDefs<AgChannelAnnotationText> = {
    label: string,
    position: union('top', 'inside', 'bottom'),
    alignment: union('left', 'center', 'right'),
    ...fontOptionsDef,
};

const annotationHandleOptionsDef: OptionsDefs<AgAnnotationHandle> = {
    ...fillOptionsDef,
    ...strokeOptionsDef,
    ...lineDashOptionsDef,
};

const annotationPointOptionsDef: OptionsDefs<AgAnnotationPoint> = {
    x: annotationValue,
    y: number,
};

const annotationLineOptionsDef: OptionsDefs<LineOptions> = {
    lineStyle: union('solid', 'dashed', 'dotted'),
    ...lineDashOptionsDef,
};

const fibonacciAnnotationStylesOptionsDef: OptionsDefs<AgFibonacciAnnotationStyles> = {
    visible: boolean,
    extendStart: boolean,
    extendEnd: boolean,
    locked: boolean,
    text: lineAnnotationTextOptionsDef,
    handle: annotationHandleOptionsDef,
    label: fontOptionsDef,
    showFill: boolean,
    isMultiColor: boolean,
    strokes: arrayOf(color),
    rangeStroke: color,
    bands: union(4, 6, 10),
    ...strokeOptionsDef,
    ...annotationLineOptionsDef,
};

export const annotationInitialStateOptionsDef = typeUnion<AgAnnotation>(
    {
        line: {
            visible: boolean,
            extendStart: boolean,
            extendEnd: boolean,
            locked: boolean,
            text: lineAnnotationTextOptionsDef,
            handle: annotationHandleOptionsDef,
            start: annotationPointOptionsDef,
            end: annotationPointOptionsDef,
            ...strokeOptionsDef,
            ...annotationLineOptionsDef,
        },
        'horizontal-line': {
            visible: boolean,
            locked: boolean,
            value: annotationValue,
            axisLabel: annotationAxisLabelOptionsDef,
            text: lineAnnotationTextOptionsDef,
            handle: annotationHandleOptionsDef,
            ...strokeOptionsDef,
            ...annotationLineOptionsDef,
        },
        'vertical-line': {
            visible: boolean,
            locked: boolean,
            value: annotationValue,
            axisLabel: annotationAxisLabelOptionsDef,
            text: lineAnnotationTextOptionsDef,
            handle: annotationHandleOptionsDef,
            ...strokeOptionsDef,
            ...annotationLineOptionsDef,
        },
        'disjoint-channel': {
            visible: boolean,
            extendStart: boolean,
            extendEnd: boolean,
            locked: boolean,
            startHeight: positiveNumber,
            endHeight: positiveNumber,
            text: channelAnnotationTextOptionsDef,
            handle: annotationHandleOptionsDef,
            start: annotationPointOptionsDef,
            end: annotationPointOptionsDef,
            background: fillOptionsDef,
            ...strokeOptionsDef,
            ...annotationLineOptionsDef,
        },
        'parallel-channel': {
            visible: boolean,
            extendStart: boolean,
            extendEnd: boolean,
            locked: boolean,
            height: positiveNumber,
            text: channelAnnotationTextOptionsDef,
            handle: annotationHandleOptionsDef,
            start: annotationPointOptionsDef,
            end: annotationPointOptionsDef,
            background: fillOptionsDef,
            middle: {
                visible: boolean,
                ...strokeOptionsDef,
                ...annotationLineOptionsDef,
            },
            ...strokeOptionsDef,
            ...annotationLineOptionsDef,
        },
        'fibonacci-retracement': {
            reverse: boolean,
            start: annotationPointOptionsDef,
            end: annotationPointOptionsDef,
            ...fibonacciAnnotationStylesOptionsDef,
        },
        'fibonacci-retracement-trend-based': {
            reverse: boolean,
            start: annotationPointOptionsDef,
            end: annotationPointOptionsDef,
            endRetracement: annotationPointOptionsDef,
            ...fibonacciAnnotationStylesOptionsDef,
        },
        callout: {
            visible: boolean,
            locked: boolean,
            text: string,
            handle: annotationHandleOptionsDef,
            start: annotationPointOptionsDef,
            end: annotationPointOptionsDef,
            ...fontOptionsDef,
            ...fillOptionsDef,
            ...strokeOptionsDef,
        },
        comment: {
            visible: boolean,
            locked: boolean,
            text: string,
            handle: annotationHandleOptionsDef,
            ...annotationPointOptionsDef,
            ...fontOptionsDef,
            ...fillOptionsDef,
        },
        note: {
            visible: boolean,
            locked: boolean,
            text: string,
            handle: annotationHandleOptionsDef,
            background: {
                ...fillOptionsDef,
                ...strokeOptionsDef,
            },
            ...annotationPointOptionsDef,
            ...fontOptionsDef,
            ...fillOptionsDef,
            ...strokeOptionsDef,
        },
        text: {
            visible: boolean,
            locked: boolean,
            text: string,
            handle: annotationHandleOptionsDef,
            ...annotationPointOptionsDef,
            ...fontOptionsDef,
            ...fillOptionsDef,
        },
        arrow: {
            visible: boolean,
            extendStart: boolean,
            extendEnd: boolean,
            locked: boolean,
            text: lineAnnotationTextOptionsDef,
            handle: annotationHandleOptionsDef,
            start: annotationPointOptionsDef,
            end: annotationPointOptionsDef,
            ...strokeOptionsDef,
            ...annotationLineOptionsDef,
        },
        'arrow-up': {
            visible: boolean,
            locked: boolean,
            handle: annotationHandleOptionsDef,
            ...annotationPointOptionsDef,
            ...fillOptionsDef,
        },
        'arrow-down': {
            visible: boolean,
            locked: boolean,
            handle: annotationHandleOptionsDef,
            ...annotationPointOptionsDef,
            ...fillOptionsDef,
        },
        'date-range': {
            visible: boolean,
            extendAbove: boolean,
            extendBelow: boolean,
            locked: boolean,
            text: lineAnnotationTextOptionsDef,
            handle: annotationHandleOptionsDef,
            start: annotationPointOptionsDef,
            end: annotationPointOptionsDef,
            statistics: {
                divider: strokeOptionsDef,
                ...fontOptionsDef,
                ...fillOptionsDef,
                ...strokeOptionsDef,
            },
            ...strokeOptionsDef,
            ...annotationLineOptionsDef,
        },
        'price-range': {
            visible: boolean,
            extendLeft: boolean,
            extendRight: boolean,
            locked: boolean,
            text: lineAnnotationTextOptionsDef,
            handle: annotationHandleOptionsDef,
            start: annotationPointOptionsDef,
            end: annotationPointOptionsDef,
            statistics: {
                divider: strokeOptionsDef,
                ...fontOptionsDef,
                ...fillOptionsDef,
                ...strokeOptionsDef,
            },
            ...strokeOptionsDef,
            ...annotationLineOptionsDef,
        },
        'date-price-range': {
            visible: boolean,
            locked: boolean,
            text: lineAnnotationTextOptionsDef,
            handle: annotationHandleOptionsDef,
            start: annotationPointOptionsDef,
            end: annotationPointOptionsDef,
            statistics: {
                divider: strokeOptionsDef,
                ...fontOptionsDef,
                ...fillOptionsDef,
                ...strokeOptionsDef,
            },
            ...strokeOptionsDef,
            ...annotationLineOptionsDef,
        },
    },
    'an annotation initial state object'
);

export const initialStateOptionsDef: OptionsDefs<AgInitialStateOptions> = {
    chartType: union('candlestick', 'hollow-candlestick', 'ohlc', 'line', 'step-line', 'hlc', 'high-low'),
    annotations: arrayOfDefs(annotationInitialStateOptionsDef),
    legend: arrayOfDefs<AgInitialStateLegendOptions>(
        {
            visible: boolean,
            seriesId: string,
            itemId: string,
            legendItemName: string,
        },
        'legend state array'
    ),
    zoom: {
        rangeX: {
            start: or(number, serializableDate),
            end: or(number, serializableDate),
        },
        rangeY: {
            start: or(number, serializableDate),
            end: or(number, serializableDate),
        },
        ratioX: {
            start: ratio,
            end: ratio,
        },
        ratioY: {
            start: ratio,
            end: ratio,
        },
        autoScaledAxes: arrayOf(constant('y')),
    },
};
