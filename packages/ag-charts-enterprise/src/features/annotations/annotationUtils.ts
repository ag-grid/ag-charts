import { type Direction, _Scene, _Util } from 'ag-charts-community';

import type { AnnotationPoint } from './annotationProperties';
import type { Coords, Point, Scale, ValidationContext } from './annotationTypes';

export function validateDatumLine(
    context: ValidationContext,
    datum: { start: AnnotationPoint; end: AnnotationPoint },
    warningPrefix: string
) {
    let valid = true;

    valid &&= validateDatumPoint(context, datum.start, `${warningPrefix}[start]`);
    valid &&= validateDatumPoint(context, datum.end, `${warningPrefix}[end]`);

    return valid;
}

export function validateDatumValue(
    context: ValidationContext,
    datum: { value?: string | number | Date; direction?: Direction },
    warningPrefix: string
) {
    const { scaleX, scaleY } = context;

    const scale = datum.direction === 'vertical' ? scaleX : scaleY;
    const domain = scale?.getDomain?.();

    if (!scale || !domain) return true;

    const valid = validateDatumPointDirection(domain, scale, datum.value);

    if (!valid && warningPrefix) {
        _Util.Logger.warnOnce(`${warningPrefix} is outside the axis domain, ignoring. - value: [${datum.value}]]`);
    }

    return valid;
}

export function validateDatumPoint(context: ValidationContext, point: Point, warningPrefix?: string) {
    const { domainX, domainY, scaleX, scaleY } = context;

    if (point.x == null || point.y == null) {
        if (warningPrefix) {
            _Util.Logger.warnOnce(`${warningPrefix}requires both an [x] and [y] property, ignoring.`);
        }
        return false;
    }

    if (!domainX || !domainY || !scaleX || !scaleY) return true;

    const validX = validateDatumPointDirection(domainX, scaleX, point.x);
    const validY = validateDatumPointDirection(domainY, scaleY, point.y);

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

export function validateDatumPointDirection(
    domain: any[],
    scale: _Scene.Scale<any, any, number | _Util.TimeInterval>,
    value: any
) {
    if (_Scene.ContinuousScale.is(scale)) {
        return value >= domain[0] && value <= domain[1];
    }
    return true; // domain.includes(value); // TODO: does not work with dates
}

export function convertLine(
    datum: { start: Pick<AnnotationPoint, 'x' | 'y'>; end: Pick<AnnotationPoint, 'x' | 'y'> },
    scaleX?: Scale,
    scaleY?: Scale
) {
    if (datum.start == null || datum.end == null) return;

    const start = convertPoint(datum.start, scaleX, scaleY);
    const end = convertPoint(datum.end, scaleX, scaleY);

    if (start == null || end == null) return;

    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
}

export function convertPoint(point: Point, scaleX?: Scale, scaleY?: Scale) {
    const x = convert(point.x, scaleX);
    const y = convert(point.y, scaleY);

    return { x, y };
}

export function convert(p: Point['x' | 'y'], scale?: Scale) {
    if (!scale || p == null) return 0;

    let n = scale.convert(p);

    if (_Scene.BandScale.is(scale)) {
        n += scale.bandwidth / 2;
    }

    return n;
}

export function invertCoords(coords: Coords, scaleX?: Scale, scaleY?: Scale) {
    const x = invert(coords.x, scaleX);
    const y = invert(coords.y, scaleY);

    return { x, y };
}

export function invert(n: Coords['x' | 'y'], scale?: Scale) {
    if (_Scene.ContinuousScale.is(scale)) {
        n = scale.invert(n);
    } else if (_Scene.BandScale.is(scale)) {
        n = scale.invertNearest(n - scale.bandwidth / 2);
    }

    return n;
}
