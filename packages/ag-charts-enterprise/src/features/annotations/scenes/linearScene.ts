import { _ModuleSupport } from 'ag-charts-community';

import type { PointProperties } from '../annotationProperties';
import type { AnnotationContext, LineCoords } from '../annotationTypes';
import { boundsIntersections } from '../utils/line';
import { convertLine, convertPoint, invertCoords } from '../utils/values';
import { AnnotationScene } from './annotationScene';

const { Vec2 } = _ModuleSupport;

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
        offset: _ModuleSupport.Vec2;
        start: _ModuleSupport.Vec2;
        end: _ModuleSupport.Vec2;
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

    public dragStart(datum: Datum, target: _ModuleSupport.Vec2, context: AnnotationContext) {
        this.dragState = {
            offset: target,
            start: convertPoint(datum.start, context),
            end: convertPoint(datum.end, context),
        };
    }

    public drag(datum: Datum, target: _ModuleSupport.Vec2, context: AnnotationContext, snapping: boolean) {
        if (datum.locked) return;

        if (this.activeHandle) {
            this.dragHandle(datum, target, context, snapping);
        } else {
            this.dragAll(datum, target, context);
        }
    }

    protected abstract dragHandle(
        datum: Datum,
        target: _ModuleSupport.Vec2,
        context: AnnotationContext,
        snapping: boolean
    ): void;

    protected dragAll(datum: Datum, target: _ModuleSupport.Vec2, context: AnnotationContext) {
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
        start: _ModuleSupport.Vec2;
        end: _ModuleSupport.Vec2;
        translation: _ModuleSupport.Vec2;
        context: AnnotationContext;
    }) {
        const translatedStart = Vec2.add(start, translation);
        const translatedEnd = Vec2.add(end, translation);

        const startPoint = invertCoords(translatedStart, context);
        const endPoint = invertCoords(translatedEnd, context);

        const { xAxis, yAxis } = context;

        // Only move the points along each axis if all the corners are within the axis, allowing the annotation to
        // slide along the perpendicular axis.
        const within = (min: number, value: number, max: number) => value >= min && value <= max;
        const coords = [translatedStart, translatedEnd].concat(
            ...this.getOtherCoords(datum, translatedStart, translatedEnd, context)
        );

        if (coords.every((coord) => within(xAxis.bounds.x, coord.x, xAxis.bounds.x + xAxis.bounds.width))) {
            datum.start.x = startPoint.x;
            datum.end.x = endPoint.x;
        }

        if (coords.every((coord) => within(yAxis.bounds.y, coord.y, yAxis.bounds.y + yAxis.bounds.height))) {
            datum.start.y = startPoint.y;
            datum.end.y = endPoint.y;
        }
    }

    public translate(datum: Datum, translation: _ModuleSupport.Vec2, context: AnnotationContext) {
        this.translatePoints({
            datum,
            start: convertPoint(datum.start, context),
            end: convertPoint(datum.end, context),
            translation,
            context,
        });
    }

    public copy(datum: Datum, copiedDatum: Datum, context: AnnotationContext) {
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
        _topLeft: _ModuleSupport.Vec2,
        _topRight: _ModuleSupport.Vec2,
        _context: AnnotationContext
    ): Array<_ModuleSupport.Vec2> {
        return [];
    }
}
