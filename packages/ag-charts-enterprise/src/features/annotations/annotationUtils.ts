import { type Direction, _ModuleSupport, _Scene, _Util } from 'ag-charts-community';

import type { AnnotationPoint } from './annotationProperties';
import type { AnnotationAxisContext, AnnotationContext, Coords, Point } from './annotationTypes';

export function validateDatumLine(
    context: AnnotationContext,
    datum: { start: Point; end: Point },
    warningPrefix?: string
) {
    let valid = true;

    valid &&= validateDatumPoint(context, datum.start, warningPrefix && `${warningPrefix}[start] `);
    valid &&= validateDatumPoint(context, datum.end, warningPrefix && `${warningPrefix}[end] `);

    return valid;
}

export function validateDatumValue(
    context: AnnotationContext,
    datum: { value?: string | number | Date; direction?: Direction },
    warningPrefix: string
) {
    const { continuous, scaleDomain } = datum.direction === 'vertical' ? context.xAxis : context.yAxis;

    const valid = validateDatumPointDirection(scaleDomain(), datum.value, continuous);

    if (!valid && warningPrefix) {
        _Util.Logger.warnOnce(`${warningPrefix}is outside the axis domain, ignoring. - value: [${datum.value}]]`);
    }

    return valid;
}

export function validateDatumPoint(context: AnnotationContext, point: Point, warningPrefix?: string) {
    if (point.x == null || point.y == null) {
        if (warningPrefix) {
            _Util.Logger.warnOnce(`${warningPrefix}requires both an [x] and [y] property, ignoring.`);
        }
        return false;
    }

    const {
        xAxis: { continuous: continuousX, scaleDomain: scaleXDomain },
        yAxis: { continuous: continuousY, scaleDomain: scaleYDomain },
    } = context;

    const validX = validateDatumPointDirection(scaleXDomain(), point.x, continuousX);
    const validY = validateDatumPointDirection(scaleYDomain(), point.y, continuousY);

    if (!validX || !validY) {
        let text = 'x & y domains';
        if (validX) text = 'y domain';
        if (validY) text = 'x domain';
        if (warningPrefix) {
            _Util.Logger.warnOnce(
                `${warningPrefix}is outside the ${text}, ignoring. - x: [${point.x}], y: ${point.y}]`
            );
        }
        return false;
    }

    return true;
}

export function validateDatumPointDirection(domain: any[] = [], value: any, continuous: boolean) {
    if (continuous) {
        return value >= domain[0] && value <= domain.at(-1);
    }
    return true; // domain.includes(value); // TODO: does not work with dates
}

export function convertLine(
    datum: { start: Pick<AnnotationPoint, 'x' | 'y'>; end: Pick<AnnotationPoint, 'x' | 'y'> },
    context: AnnotationContext
) {
    if (datum.start == null || datum.end == null) return;

    const start = convertPoint(datum.start, context);
    const end = convertPoint(datum.end, context);

    if (start == null || end == null) return;

    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

export function convertPoint(point: Point, context: AnnotationContext) {
    const x = convert(point.x, context.xAxis);
    const y = convert(point.y, context.yAxis);

    return { x, y };
}

export function convert(p: Point['x' | 'y'], context: AnnotationAxisContext) {
    if (p == null) return 0;

    const halfBandwidth = (context.scaleBandwidth() ?? 0) / 2;
    return context.scaleConvert(p) + halfBandwidth;
}

export function invertCoords(coords: Coords, context: AnnotationContext) {
    const x = invert(coords.x, context.xAxis);
    const y = invert(coords.y, context.yAxis);

    return { x, y };
}

export function invert(n: Coords['x' | 'y'], context: AnnotationAxisContext) {
    if (context.continuous) {
        return context.scaleInvert?.(n);
    }
    return context.scaleInvertNearest?.(n);
}

export function calculateAxisLabelPadding(axisLayout: _ModuleSupport.AxisLayout) {
    return axisLayout.seriesAreaPadding + axisLayout.tickSize + axisLayout.label.padding;
}
