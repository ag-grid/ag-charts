import { _Util } from 'ag-charts-community';

import type { AnnotationPoint } from '../annotationProperties';
import type { AnnotationContext, Coords } from '../annotationTypes';
import { convertPoint, invertCoords, validateDatumPoint } from '../annotationUtils';
import { Annotation } from './annotation';

const { Vec2 } = _Util;

export abstract class LinearScene<
    Datum extends { start: Pick<AnnotationPoint, 'x' | 'y'>; end: Pick<AnnotationPoint, 'x' | 'y'> },
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
        if (this.activeHandle) {
            this.dragHandle(datum, target, context, onInvalid);
        } else {
            this.dragAll(datum, target, context, onInvalid);
        }
    }

    protected abstract dragHandle(
        datum: Datum,
        target: Coords,
        context: AnnotationContext,
        onInvalid: () => void
    ): void;

    protected dragAll(datum: Datum, target: Coords, context: AnnotationContext, onInvalid: () => void) {
        const { dragState } = this;

        if (!dragState) return;

        const startPoint = invertCoords(Vec2.add(dragState.start, Vec2.sub(target, dragState.offset)), context);
        const endPoint = invertCoords(Vec2.add(dragState.end, Vec2.sub(target, dragState.offset)), context);

        if (!validateDatumPoint(context, startPoint) || !validateDatumPoint(context, endPoint)) {
            onInvalid();
            return;
        }

        datum.start.x = startPoint.x;
        datum.start.y = startPoint.y;

        datum.end.x = endPoint.x;
        datum.end.y = endPoint.y;
    }
}
