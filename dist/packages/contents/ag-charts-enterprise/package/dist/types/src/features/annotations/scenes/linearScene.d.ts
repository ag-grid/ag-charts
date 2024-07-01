import type { AnnotationPoint } from '../annotationProperties';
import type { AnnotationContext, Coords } from '../annotationTypes';
import { Annotation } from './annotation';
export declare abstract class LinearScene<Datum extends {
    start: Pick<AnnotationPoint, 'x' | 'y'>;
    end: Pick<AnnotationPoint, 'x' | 'y'>;
    locked?: boolean;
}> extends Annotation {
    protected dragState?: {
        offset: Coords;
        start: Coords;
        end: Coords;
    };
    dragStart(datum: Datum, target: Coords, context: AnnotationContext): void;
    drag(datum: Datum, target: Coords, context: AnnotationContext, onInvalid: () => void): void;
    protected abstract dragHandle(datum: Datum, target: Coords, context: AnnotationContext, onInvalid: () => void): void;
    protected dragAll(datum: Datum, target: Coords, context: AnnotationContext): void;
    protected getOtherCoords(_datum: Datum, _topLeft: Coords, _topRight: Coords, _context: AnnotationContext): Array<Coords>;
}
