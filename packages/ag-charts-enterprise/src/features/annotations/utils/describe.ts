import { toPlainText } from 'ag-charts-core';

import { type AnnotationAxisContext, type AnnotationContext, AnnotationType, type DataPoint } from '../annotationTypes';
import { getAnnotationLabel } from '../annotationsMenuOptions';
import type { AnnotationDatum } from '../annotationsSuperTypes';
import { getGroupingValue } from './scale';
import type { PointType } from './scale';
import { isCrossLineType, isTextType } from './types';

function formatValue(point: PointType | undefined, axis: AnnotationAxisContext) {
    const value = getGroupingValue(point);
    return value == null ? '' : toPlainText(axis.formatScaleValue(value, 'annotation-label'));
}

function formatPoint(point: Partial<DataPoint>, context: AnnotationContext) {
    return `${formatValue(point.x, context.xAxis)}, ${formatValue(point.y, context.yAxis)}`;
}

/** Where an annotation is, as its axes format its values. */
export function describeAnnotationPosition(datum: AnnotationDatum, context: AnnotationContext) {
    const { localeManager } = context;
    if (isCrossLineType(datum)) {
        const axis = datum.type === AnnotationType.HorizontalLine ? context.yAxis : context.xAxis;
        return formatValue(datum.value, axis);
    }
    if ('start' in datum) {
        const start = formatPoint(datum.start, context);
        const end = formatPoint(datum.end, context);
        return localeManager.t('ariaLabelAnnotationRange', { start, end });
    }
    return formatPoint(datum, context);
}

/** The accessible name of an annotation in the keyboard list: its text, if any, where it is and its type. */
export function describeAnnotation(datum: AnnotationDatum, context: AnnotationContext) {
    const { localeManager } = context;
    const label = getAnnotationLabel(datum.type);
    const type = label == null ? datum.type : localeManager.t(label);
    const position = describeAnnotationPosition(datum, context);
    const text = isTextType(datum) ? datum.text.replaceAll(/\s*\n\s*/g, ' ') : '';
    const description = text === '' ? position : `${text}, ${position}`;
    return localeManager.t('ariaLabelAnnotation', { description, type });
}
