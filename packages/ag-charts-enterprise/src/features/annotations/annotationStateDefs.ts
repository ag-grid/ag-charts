import { type AgAnnotation, _ModuleSupport } from 'ag-charts-community';
import {
    type OptionsDefs,
    boolean,
    date,
    number,
    numericValue,
    optionsDefs,
    or,
    positiveNumber,
    string,
    textAlign,
    typeUnion,
} from 'ag-charts-core';

/** Defs for restored annotation state: the option types plus the datum fields `getState()` also emits. */
export function createAnnotationStateDefs(): OptionsDefs<AgAnnotation> {
    const {
        annotationAxisLabelOptionsDef,
        annotationCalloutStylesDefs,
        annotationChannelTextDefs,
        annotationCommentStylesDefs,
        annotationCrossLineStyleDefs,
        annotationDisjointChannelStyleDefs,
        annotationFibonacciStylesDefs,
        annotationLineStyleDefs,
        annotationLineTextDefs,
        annotationMeasurerStylesDefs,
        annotationNoteStylesDefs,
        annotationParallelChannelStyleDefs,
        annotationQuickMeasurerStylesDefs,
        annotationShapeStylesDefs,
        annotationTextStylesDef,
    } = _ModuleSupport;

    const scalar = or(numericValue, string, date);
    const value = or(
        scalar,
        optionsDefs<{ value: unknown; groupPercentage: number }>({ value: scalar, groupPercentage: number })
    );
    const point = { x: value, y: numericValue };
    const startEnd = { start: point, end: point };

    const lineText = { ...annotationLineTextDefs, label: string };
    const channelText = { ...annotationChannelTextDefs, label: string };
    const textual = { ...point, text: string, padding: positiveNumber };

    const line = { ...annotationLineStyleDefs, ...startEnd, text: lineText };
    const crossLine = {
        ...annotationCrossLineStyleDefs,
        value,
        axisLabel: { ...annotationAxisLabelOptionsDef, textAlign },
        text: lineText,
    };
    const fibonacci = { ...annotationFibonacciStylesDefs, ...startEnd, text: lineText, reverse: boolean };
    const measurer = { ...annotationMeasurerStylesDefs, ...startEnd, text: lineText };
    const quickMeasurerDirection = annotationQuickMeasurerStylesDefs.up;
    const callout = { ...annotationCalloutStylesDefs, ...startEnd, text: string, padding: positiveNumber };

    return typeUnion<AgAnnotation>(
        {
            line,
            arrow: line,
            'horizontal-line': crossLine,
            'vertical-line': crossLine,
            'parallel-channel': {
                ...annotationParallelChannelStyleDefs,
                ...startEnd,
                height: numericValue,
                text: channelText,
            },
            'disjoint-channel': {
                ...annotationDisjointChannelStyleDefs,
                ...startEnd,
                startHeight: numericValue,
                endHeight: numericValue,
                text: channelText,
            },
            'fibonacci-retracement': fibonacci,
            'fibonacci-retracement-trend-based': { ...fibonacci, endRetracement: point },
            text: { ...annotationTextStylesDef, ...textual },
            comment: { ...annotationCommentStylesDefs, ...textual },
            note: { ...annotationNoteStylesDefs, ...textual },
            callout,
            'arrow-up': { ...annotationShapeStylesDefs, ...point },
            'arrow-down': { ...annotationShapeStylesDefs, ...point },
            'date-range': { ...measurer, extendAbove: boolean, extendBelow: boolean },
            'price-range': { ...measurer, extendLeft: boolean, extendRight: boolean },
            'date-price-range': measurer,
            'quick-date-price-range': {
                ...measurer,
                up: quickMeasurerDirection,
                down: quickMeasurerDirection,
            },
        },
        'an annotation'
    );
}
