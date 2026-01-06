import {
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
    and,
    arrayOf,
    arrayOfDefs,
    boolean,
    constant,
    greaterThan,
    lessThan,
    number,
    numberRange,
    optionsDefs,
    or,
    ratio,
    required,
    string,
    typeUnion,
    union,
} from 'ag-charts-core';
import type { AgAnnotation, AgStateSerializableDate } from 'ag-charts-types';

const {
    annotationCalloutStylesDefs,
    annotationNoteStylesDefs,
    annotationTextStylesDef,
    annotationCommentStylesDefs,
    annotationMeasurerStylesDefs,
    annotationQuickMeasurerStylesDefs,
    annotationShapeStylesDefs,
    annotationChannelTextDefs,
    annotationCrossLineStyleDefs,
    annotationFibonacciStylesDefs,
    annotationLineStyleDefs,
    annotationLineTextDefs,
    annotationDisjointChannelStyleDefs,
    annotationParallelChannelStyleDefs,
    initialStatePickedOptionsDef,
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
        groupPercentage: numberRange(-1, 2),
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

const annotationPointOptionsDef: OptionsDefs<AgAnnotationPoint> = {
    x: annotationValue,
    y: number,
};

export const annotationInitialStateOptionsDef = typeUnion<AgAnnotation>(
    {
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
            startHeight: number,
            endHeight: number,
            start: annotationPointOptionsDef,
            end: annotationPointOptionsDef,
            text: channelAnnotationTextOptionsDef,
        },
        'parallel-channel': {
            ...annotationParallelChannelStyleDefs,
            height: number,
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
            ...annotationCalloutStylesDefs,
            start: annotationPointOptionsDef,
            end: annotationPointOptionsDef,
            text: string,
        },
        comment: {
            ...annotationCommentStylesDefs,
            ...annotationPointOptionsDef,
            text: string,
        },
        note: {
            ...annotationNoteStylesDefs,
            ...annotationPointOptionsDef,
            text: string,
        },
        text: {
            ...annotationTextStylesDef,
            ...annotationPointOptionsDef,
            text: string,
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
        'quick-date-price-range': {
            ...annotationMeasurerStylesDefs,
            ...annotationQuickMeasurerStylesDefs,
            text: lineAnnotationTextOptionsDef,
            start: annotationPointOptionsDef,
            end: annotationPointOptionsDef,
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
    picked: initialStatePickedOptionsDef,
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
            start: and(ratio, lessThan('end')),
            end: and(ratio, greaterThan('start')),
        },
        ratioY: {
            start: and(ratio, lessThan('end')),
            end: and(ratio, greaterThan('start')),
        },
        autoScaledAxes: arrayOf(constant('y')),
    },
};
