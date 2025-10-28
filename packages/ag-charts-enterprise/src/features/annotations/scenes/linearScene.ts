import { type Bounds4, type Point, Vec2, Vec4 } from 'ag-charts-core';

import type { PointProperties } from '../annotationProperties';
import type { AnnotationContext } from '../annotationTypes';
import { getDragStartState, translate } from '../utils/coords';
import { boundsIntersections } from '../utils/line';
import { convertLine, convertPoint } from '../utils/values';
import { AnnotationScene } from './annotationScene';

export abstract class LinearScene<
    Datum extends {
        start: Pick<PointProperties, 'x' | 'y'>;
        end: Pick<PointProperties, 'x' | 'y'>;
        extendStart?: boolean;
        extendEnd?: boolean;
        isWriteable: () => boolean;
    },
> extends AnnotationScene {
    protected dragState?: {
        offset: Point;
        start: Point;
        end: Point;
    };

    protected overflowContinuous = 0;

    protected extendLine({ x1, y1, x2, y2 }: Bounds4, datum: Datum, context: AnnotationContext) {
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

    public dragStart(datum: Datum, target: Point, context: AnnotationContext) {
        this.dragState = {
            offset: target,
            ...getDragStartState({ start: datum.start, end: datum.end }, context),
        };
    }

    public drag(datum: Datum, target: Point, context: AnnotationContext, snapping: boolean) {
        if (!datum.isWriteable()) return;

        if (this.activeHandle) {
            this.dragHandle(datum, target, context, snapping);
        } else {
            this.dragAll(datum, target, context);
        }
    }

    protected abstract dragHandle(datum: Datum, target: Point, context: AnnotationContext, snapping: boolean): void;

    protected dragAll(datum: Datum, target: Point, context: AnnotationContext) {
        const { dragState } = this;

        if (!dragState) return;

        this.translatePoints(datum, dragState.start, dragState.end, Vec2.sub(target, dragState.offset), context);
    }

    public translate(datum: Datum, translation: Point, context: AnnotationContext) {
        if (!datum.isWriteable()) return;

        this.translatePoints(
            datum,
            convertPoint(datum.start, context),
            convertPoint(datum.end, context),
            translation,
            context
        );
    }

    public copy(datum: Datum, copiedDatum: Datum, context: AnnotationContext) {
        const coords = convertLine(datum, context);

        if (!coords) {
            return;
        }

        const bbox = this.computeBBoxWithoutHandles();
        const translation = { x: -bbox.width / 2, y: -bbox.height / 2 };
        this.translatePoints(copiedDatum, Vec4.start(coords), Vec4.end(coords), translation, context);

        return copiedDatum;
    }

    protected translatePoints(datum: Datum, start: Point, end: Point, translation: Point, context: AnnotationContext) {
        const vectors = this.getTranslatePointsVectors(start, end);
        const points = translate(vectors, translation, context, {
            overflowContinuous: this.overflowContinuous,
        });

        datum.start.x = points.start.x;
        datum.end.x = points.end.x;

        datum.start.y = points.start.y;
        datum.end.y = points.end.y;
    }

    protected getTranslatePointsVectors(start: Point, end: Point) {
        return { start, end };
    }
}
