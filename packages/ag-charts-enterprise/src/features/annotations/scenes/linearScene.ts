import { _Util } from 'ag-charts-community';

import type { AnnotationPoint } from '../annotationProperties';
import type { AnnotationContext, Coords } from '../annotationTypes';
import { convertPoint, invertCoords } from '../annotationUtils';
import { Annotation } from './annotation';

const { Vec2 } = _Util;

export abstract class LinearScene<
    Datum extends { start: Pick<AnnotationPoint, 'x' | 'y'>; end: Pick<AnnotationPoint, 'x' | 'y'>; locked?: boolean },
> extends Annotation {
    protected dragState?: {
        offset: Coords;
        start: Coords;
        end: Coords;
    };

    public dragStart(datum: Datum, target: Coords, context: AnnotationContext) {
        this.dragState = {
            offset: target,
            start: convertPoint(datum.start, context),
            end: convertPoint(datum.end, context),
        };
    }

    public drag(datum: Datum, target: Coords, context: AnnotationContext, onInvalid: () => void) {
        if (datum.locked) return;

        if (this.activeHandle) {
            this.dragHandle(datum, target, context, onInvalid);
        } else {
            this.dragAll(datum, target, context);
        }
    }

    protected abstract dragHandle(
        datum: Datum,
        target: Coords,
        context: AnnotationContext,
        onInvalid: () => void
    ): void;

    protected dragAll(datum: Datum, target: Coords, context: AnnotationContext) {
        const { dragState } = this;

        if (!dragState) return;

        const { xAxis, yAxis } = context;

        const topLeft = Vec2.add(dragState.start, Vec2.sub(target, dragState.offset));
        const topRight = Vec2.add(dragState.end, Vec2.sub(target, dragState.offset));

        const startPoint = invertCoords(topLeft, context);
        const endPoint = invertCoords(topRight, context);

        // Only move the points along each axis if all the corners are within the axis, allowing the annotation to
        // slide along the perpendicular axis.
        const within = (min: number, value: number, max: number) => value >= min && value <= max;
        const coords = [topLeft, topRight].concat(...this.getOtherCoords(datum, topLeft, topRight, context));

        if (coords.every((coord) => within(xAxis.bounds.x, coord.x, xAxis.bounds.x + xAxis.bounds.width))) {
            datum.start.x = startPoint.x;
            datum.end.x = endPoint.x;
        }

        if (coords.every((coord) => within(yAxis.bounds.y, coord.y, yAxis.bounds.y + yAxis.bounds.height))) {
            datum.start.y = startPoint.y;
            datum.end.y = endPoint.y;
        }
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
