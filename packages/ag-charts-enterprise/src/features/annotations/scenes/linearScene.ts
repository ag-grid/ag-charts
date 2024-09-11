import { _Util } from 'ag-charts-community';

import type { PointProperties } from '../annotationProperties';
import type { AnnotationContext, Coords, LineCoords } from '../annotationTypes';
import { boundsIntersections } from '../utils/line';
import { convertLine, convertPoint, invertCoords } from '../utils/values';
import { AnnotationScene } from './annotationScene';

const { Vec2 } = _Util;

export abstract class LinearScene<
    Datum extends {
        start: Pick<PointProperties, 'x' | 'y'>;
        end: Pick<PointProperties, 'x' | 'y'>;
        extendStart?: boolean;
        extendEnd?: boolean;
        locked?: boolean;
    },
> extends AnnotationScene {
    protected dragState?: {
        offset: Coords;
        start: Coords;
        end: Coords;
    };

    protected extendLine({ x1, y1, x2, y2 }: LineCoords, datum: Datum, context: AnnotationContext) {
        // Clone the points to prevent mutating the original
        const linePoints = { x1, y1, x2, y2 };

        if (!datum.extendStart && !datum.extendEnd) {
            return linePoints;
        }

        const [left, right] = boundsIntersections(linePoints, context.yAxis.bounds);

        const isFlippedX = linePoints.x2 < linePoints.x1;
        const isFlippedY = linePoints.y1 >= linePoints.y2;
        const isVertical = linePoints.x2 === linePoints.x1;

        if (datum.extendEnd) {
            if (isVertical) {
                linePoints.y2 = isFlippedY ? right.y : left.y;
            } else {
                linePoints.x2 = isFlippedX ? left.x : right.x;
                linePoints.y2 = isFlippedX ? left.y : right.y;
            }
        }

        if (datum.extendStart) {
            if (isVertical) {
                linePoints.y1 = isFlippedY ? left.y : right.y;
            } else {
                linePoints.x1 = isFlippedX ? right.x : left.x;
                linePoints.y1 = isFlippedX ? right.y : left.y;
            }
        }

        return linePoints;
    }

    public dragStart(datum: Datum, target: Coords, context: AnnotationContext) {
        this.dragState = {
            offset: target,
            start: convertPoint(datum.start, context),
            end: convertPoint(datum.end, context),
        };
    }

    public drag(datum: Datum, target: Coords, context: AnnotationContext) {
        if (datum.locked) return;

        if (this.activeHandle) {
            this.dragHandle(datum, target, context);
        } else {
            this.dragAll(datum, target, context);
        }
    }

    protected abstract dragHandle(datum: Datum, target: Coords, context: AnnotationContext): void;

    protected dragAll(datum: Datum, target: Coords, context: AnnotationContext) {
        const { dragState } = this;

        if (!dragState) return;

        this.translatePoints({
            datum,
            start: dragState.start,
            end: dragState.end,
            translation: Vec2.sub(target, dragState.offset),
            context,
        });
    }

    public translatePoints({
        datum,
        start,
        end,
        translation,
        context,
    }: {
        datum: Datum;
        start: Coords;
        end: Coords;
        translation: _Util.Vec2;
        context: AnnotationContext;
    }) {
        const a = Vec2.add(start, translation);
        const b = Vec2.add(end, translation);

        const startPoint = invertCoords(a, context);
        const endPoint = invertCoords(b, context);

        const { xAxis, yAxis } = context;

        // Only move the points along each axis if all the corners are within the axis, allowing the annotation to
        // slide along the perpendicular axis.
        const within = (min: number, value: number, max: number) => value >= min && value <= max;
        const coords = [a, b].concat(...this.getOtherCoords(datum, a, b, context));

        if (coords.every((coord) => within(xAxis.bounds.x, coord.x, xAxis.bounds.x + xAxis.bounds.width))) {
            datum.start.x = startPoint.x;
            datum.end.x = endPoint.x;
        }

        if (coords.every((coord) => within(yAxis.bounds.y, coord.y, yAxis.bounds.y + yAxis.bounds.height))) {
            datum.start.y = startPoint.y;
            datum.end.y = endPoint.y;
        }
    }

    public copy(datum: Datum, copiedDatum: Datum, context: AnnotationContext, _offset: Coords) {
        const coords = convertLine(datum, context);

        if (!coords) {
            return;
        }

        const bbox = this.computeBBoxWithoutHandles();

        this.translatePoints({
            datum: copiedDatum,
            start: { x: coords.x1, y: coords.y1 },
            end: { x: coords.x2, y: coords.y2 },
            translation: { x: -bbox.width / 2, y: -bbox.height / 2 },
            context,
        });

        return copiedDatum;
    }

    protected getOtherCoords(
        _datum: Datum,
        _topLeft: Coords,
        _topRight: Coords,
        _context: AnnotationContext
    ): Array<Coords> {
        return [];
    }
}
