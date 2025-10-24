import { _ModuleSupport } from 'ag-charts-community';
import { Logger } from 'ag-charts-core';

import type { AnnotationAxisContext, AnnotationContext, Point } from '../annotationTypes';
import { getGroupingValue } from './scale';

const { ContinuousScale } = _ModuleSupport;

export function validateDatumPoint(
    context: AnnotationContext,
    point: Point,
    options: { overflowContinuous: boolean } = { overflowContinuous: false },
    warningPrefix?: string
) {
    if (point.x == null || point.y == null) {
        if (warningPrefix) {
            Logger.warnOnce(`${warningPrefix}requires both an [x] and [y] property, ignoring.`);
        }
        return false;
    }

    const { xAxis, yAxis } = context;

    // Explicitly test the scales because ordinal time axes report as continuous
    const continuousX = options.overflowContinuous && ContinuousScale.is(xAxis.scale);
    const continuousY = options.overflowContinuous && ContinuousScale.is(yAxis.scale);
    const validX = continuousX || validateDatumPointDirection(point.x, xAxis);
    const validY = continuousY || validateDatumPointDirection(point.y, yAxis);

    if (validX && validY) return true;

    if (warningPrefix) {
        let text = 'x & y domains';
        if (validX) text = 'y domain';
        if (validY) text = 'x domain';
        const xValue = getGroupingValue(point.x);
        const yValue = getGroupingValue(point.y);
        Logger.warnOnce(`${warningPrefix}is outside the ${text}, ignoring. - x: [${xValue}], y: ${yValue}]`);
    }

    return false;
}

function validateDatumPointDirection(d: any, context: AnnotationAxisContext) {
    const { domain } = context.scale;
    const value = getGroupingValue(d);
    if (domain && value != null && context.continuous) {
        return value >= domain[0] && value <= domain.at(-1);
    }
    return true; // domain.includes(value); // TODO: does not work with dates
}
