import { _Scene } from 'ag-charts-community';
import type { AnnotationPoint } from '../annotationProperties';
import type { AnnotationContext, LineCoords } from '../annotationTypes';
import type { Handle } from './handle';
import { LinearScene } from './linearScene';
import { CollidableLine } from './shapes';
export declare abstract class ChannelScene<Datum extends {
    background: {
        fill?: string;
        fillOpacity?: number;
    };
    locked?: boolean;
    visible?: boolean;
    start: Pick<AnnotationPoint, 'x' | 'y'>;
    end: Pick<AnnotationPoint, 'x' | 'y'>;
    bottom: {
        start: Pick<AnnotationPoint, 'x' | 'y'>;
        end: Pick<AnnotationPoint, 'x' | 'y'>;
    };
}> extends LinearScene<Datum> {
    protected handles: {
        [key: string]: Handle;
    };
    protected seriesRect?: _Scene.BBox;
    protected topLine: CollidableLine;
    protected bottomLine: CollidableLine;
    protected background: _Scene.Path;
    update(datum: Datum, context: AnnotationContext): void;
    toggleActive(active: boolean): void;
    stopDragging(): void;
    getAnchor(): {
        x: number;
        y: number;
    };
    getCursor(): string;
    containsPoint(x: number, y: number): boolean;
    protected abstract updateLines(datum: Datum, top: LineCoords, bottom: LineCoords): void;
    protected abstract updateHandles(datum: Datum, top: LineCoords, bottom: LineCoords): void;
    protected updateBackground(datum: Datum, top: LineCoords, bottom: LineCoords): void;
}
