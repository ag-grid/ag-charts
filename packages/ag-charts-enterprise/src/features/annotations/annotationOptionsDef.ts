import {
    type AgAnnotationHandle,
    type AgAnnotationPoint,
    type AgChannelAnnotationText,
    type AgGroupingValueType,
    type AgInitialStateLegendOptions,
    type AgInitialStateOptions,
    type AgLineAnnotationText,
    _ModuleSupport,
} from 'ag-charts-community';
import {
    type OptionsDefs,
    arrayOf,
    arrayOfDefs,
    boolean,
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
    union,
} from 'ag-charts-core';
import type { AgAnnotation, AgStateSerializableDate } from 'ag-charts-types';

const {
    annotationCommentStylesDefs,
    annotationMeasurerStylesDefs,
    annotationShapeStylesDefs,
    annotationChannelTextDefs,
    annotationCrossLineStyleDefs,
    annotationFibonacciStylesDefs,
    annotationLineStyleDefs,
    annotationLineTextDefs,
    annotationDisjointChannelStyleDefs,
    annotationParallelChannelStyleDefs,
} = _ModuleSupport;

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

const channelAnnotationTextOptionsDef: OptionsDefs<AgChannelAnnotationText> = {
    ...annotationChannelTextDefs,
    label: string,
};

const lineAnnotationTextOptionsDef: OptionsDefs<AgLineAnnotationText> = {
    ...annotationLineTextDefs,
    label: string,
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

export const annotationInitialStateOptionsDef = typeUnion<AgAnnotation>({
    line: {
        ...annotationLineStyleDefs,
        start: annotationPointOptionsDef,
        end: annotationPointOptionsDef,
        text: lineAnnotationTextOptionsDef,
    },
    'horizontal-line': {
        ...annotationCrossLineStyleDefs,
        value: annotationValue,
        text: lineAnnotationTextOptionsDef,
    },
    'vertical-line': {
        ...annotationCrossLineStyleDefs,
        value: annotationValue,
        text: lineAnnotationTextOptionsDef,
    },
    'disjoint-channel': {
        ...annotationDisjointChannelStyleDefs,
        startHeight: positiveNumber,
        endHeight: positiveNumber,
        start: annotationPointOptionsDef,
        end: annotationPointOptionsDef,
        text: channelAnnotationTextOptionsDef,
    },
    'parallel-channel': {
        ...annotationParallelChannelStyleDefs,
        height: positiveNumber,
        start: annotationPointOptionsDef,
        end: annotationPointOptionsDef,
        text: channelAnnotationTextOptionsDef,
    },
    'fibonacci-retracement': {
        ...annotationFibonacciStylesDefs,
        start: annotationPointOptionsDef,
        end: annotationPointOptionsDef,
        text: lineAnnotationTextOptionsDef,
        reverse: boolean,
    },
    'fibonacci-retracement-trend-based': {
        ...annotationFibonacciStylesDefs,
        start: annotationPointOptionsDef,
        end: annotationPointOptionsDef,
        endRetracement: annotationPointOptionsDef,
        text: lineAnnotationTextOptionsDef,
        reverse: boolean,
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
        ...annotationCommentStylesDefs,
        ...annotationPointOptionsDef,
        text: string,
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
        ...annotationLineStyleDefs,
        text: lineAnnotationTextOptionsDef,
        start: annotationPointOptionsDef,
        end: annotationPointOptionsDef,
    },
    'arrow-up': {
        ...annotationShapeStylesDefs,
        ...annotationPointOptionsDef,
    },
    'arrow-down': {
        ...annotationShapeStylesDefs,
        ...annotationPointOptionsDef,
    },
    'date-range': {
        ...annotationMeasurerStylesDefs,
        extendAbove: boolean,
        extendBelow: boolean,
        text: lineAnnotationTextOptionsDef,
        start: annotationPointOptionsDef,
        end: annotationPointOptionsDef,
    },
    'price-range': {
        ...annotationMeasurerStylesDefs,
        extendLeft: boolean,
        extendRight: boolean,
        text: lineAnnotationTextOptionsDef,
        start: annotationPointOptionsDef,
        end: annotationPointOptionsDef,
    },
    'date-price-range': {
        ...annotationMeasurerStylesDefs,
        text: lineAnnotationTextOptionsDef,
        start: annotationPointOptionsDef,
        end: annotationPointOptionsDef,
    },
});

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
