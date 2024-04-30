import type { _Scene } from 'ag-charts-community';
import type { AnnotationProperties } from '../annotationProperties';
import type { Coords, LineCoords } from '../annotationTypes';
import { Annotation } from './annotation';
export declare class Line extends Annotation {
    type: string;
    activeHandle?: 'start' | 'end';
    private line;
    private start;
    private end;
    private seriesRect?;
    constructor();
    update(datum: AnnotationProperties, seriesRect: _Scene.BBox, coords?: LineCoords): void;
    toggleHandles(show: boolean | Partial<Record<'start' | 'end', boolean>>): void;
    toggleActive(active: boolean): void;
    dragHandle(datum: AnnotationProperties, target: Coords, invertPoint: (point: Coords) => Coords | undefined): void;
    stopDragging(): void;
    getCursor(): "default" | "pointer";
    containsPoint(x: number, y: number): boolean;
}
