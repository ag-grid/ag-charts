import { toPlainText } from 'ag-charts-core';

import { type AnnotationAxisContext, type AnnotationContext, AnnotationType } from '../annotationTypes';
import { getAnnotationLabel } from '../annotationsMenuOptions';
import type { AnnotationDatum } from '../annotationsSuperTypes';
import { getGroupingValue } from './scale';
import type { PointType } from './scale';
import { isChannelType, isCrossLineType, isFibonacciType, isLineType, isMeasurerType, isTextType } from './types';

type Axis = 'x' | 'y';

function formatValue(point: PointType | undefined, axis: AnnotationAxisContext) {
    const value = getGroupingValue(point);
    return value == null ? '' : toPlainText(axis.formatScaleValue(value, 'annotation-label'));
}

/** Where an annotation is along one axis, or `undefined` for a cross line that the axis does not position. */
export function describeAnnotationAxis(datum: AnnotationDatum, context: AnnotationContext, axis: Axis) {
    const axisContext = axis === 'x' ? context.xAxis : context.yAxis;
    if (isCrossLineType(datum)) {
        const isHorizontal = datum.type === AnnotationType.HorizontalLine;
        if (isHorizontal !== (axis === 'y')) return;
        return formatValue(datum.value, axisContext);
    }
    if ('start' in datum) {
        const start = formatValue(datum.start[axis], axisContext);
        const end = formatValue(datum.end[axis], axisContext);
        return context.localeManager.t('ariaLabelAnnotationRange', { start, end });
    }
    return formatValue(datum[axis], axisContext);
}

function describePosition(datum: AnnotationDatum, context: AnnotationContext) {
    if (isCrossLineType(datum)) {
        return describeAnnotationAxis(datum, context, datum.type === AnnotationType.HorizontalLine ? 'y' : 'x') ?? '';
    }
    if ('start' in datum) {
        const start = `${formatValue(datum.start.x, context.xAxis)}, ${formatValue(datum.start.y, context.yAxis)}`;
        const end = `${formatValue(datum.end.x, context.xAxis)}, ${formatValue(datum.end.y, context.yAxis)}`;
        return context.localeManager.t('ariaLabelAnnotationRange', { start, end });
    }
    return `${describeAnnotationAxis(datum, context, 'x')}, ${describeAnnotationAxis(datum, context, 'y')}`;
}

function getText(datum: AnnotationDatum) {
    if (isTextType(datum)) return datum.text;
    if (isLineType(datum) || isChannelType(datum) || isMeasurerType(datum) || isFibonacciType(datum)) {
        return datum.text.label;
    }
    return '';
}

/** The accessible name of an annotation in the keyboard list: its text, if any, where it is and its type. */
export function describeAnnotation(datum: AnnotationDatum, context: AnnotationContext) {
    const { localeManager } = context;
    const label = getAnnotationLabel(datum.type);
    const type = label == null ? datum.type : localeManager.t(label);
    const position = describePosition(datum, context);
    const text = getText(datum)
        .trim()
        .replaceAll(/\s*\n\s*/g, ' ');
    const description = text === '' ? position : `${text}, ${position}`;
    return localeManager.t('ariaLabelAnnotation', { description, type });
}
