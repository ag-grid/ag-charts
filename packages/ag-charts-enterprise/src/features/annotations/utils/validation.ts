import { type Direction, _ModuleSupport } from 'ag-charts-community';
import { Logger } from 'ag-charts-core';

import type { AnnotationAxisContext, AnnotationContext, Point } from '../annotationTypes';
import { getGroupingValue } from './scale';

export function validateDatumLine(
    context: AnnotationContext,
    datum: { start: Point; end: Point },
    directions?: Partial<Record<_ModuleSupport.ChartAxisDirection, boolean>>,
    warningPrefix?: string
) {
    let valid = true;

    valid &&= validateDatumPoint(context, datum.start, directions, warningPrefix && `${warningPrefix}[start] `);
    valid &&= validateDatumPoint(context, datum.end, directions, warningPrefix && `${warningPrefix}[end] `);

    return valid;
}

export function validateDatumValue(
    context: AnnotationContext,
    datum: { value?: Point['x' | 'y']; direction?: Direction },
    warningPrefix: string
) {
    const axis = datum.direction === 'horizontal' ? context.yAxis : context.xAxis;
    const valid = validateDatumPointDirection(datum.value, axis);

    if (!valid && warningPrefix) {
        const { value } = getGroupingValue(datum.value);
        Logger.warnOnce(`${warningPrefix}is outside the axis domain, ignoring. - value: [${value}]]`);
    }

    return valid;
}

export function validateDatumPoint(
    context: AnnotationContext,
    point: Point,
    directions?: Partial<Record<_ModuleSupport.ChartAxisDirection, boolean>>,
    warningPrefix?: string
) {
    if (point.x == null || point.y == null) {
        if (warningPrefix) {
            Logger.warnOnce(`${warningPrefix}requires both an [x] and [y] property, ignoring.`);
        }
        return false;
    }

    const validX = directions?.x === false ? true : validateDatumPointDirection(point.x, context.xAxis);
    const validY = directions?.y === false ? true : validateDatumPointDirection(point.y, context.yAxis);

    if (!validX || !validY) {
        let text = 'x & y domains';
        if (validX) text = 'y domain';
        if (validY) text = 'x domain';
        if (warningPrefix) {
            const { value: xValue } = getGroupingValue(point.x);
            const { value: yValue } = getGroupingValue(point.y);
            Logger.warnOnce(`${warningPrefix}is outside the ${text}, ignoring. - x: [${xValue}], y: ${yValue}]`);
        }
        return false;
    }

    return true;
}

function validateDatumPointDirection(d: any, context: AnnotationAxisContext) {
    const { domain } = context.scale;
    const { value } = getGroupingValue(d);
    if (domain && value != null && context.continuous) {
        return value >= domain[0] && value <= domain.at(-1);
    }
    return true; // domain.includes(value); // TODO: does not work with dates
}

export function isPoint(point: Point | undefined): point is Point {
    return point?.x != null && point?.y != null;
}
