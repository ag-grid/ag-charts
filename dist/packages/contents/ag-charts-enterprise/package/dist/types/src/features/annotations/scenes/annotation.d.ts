import { _Scene } from 'ag-charts-community';
import type { AnnotationProperties } from '../annotationProperties';
import type { Coords } from '../annotationTypes';
export declare abstract class Annotation extends _Scene.Group {
    locked: boolean;
    abstract type: string;
    abstract activeHandle?: string;
    abstract containsPoint(x: number, y: number): boolean;
    abstract toggleHandles(show: boolean | Record<string, boolean>): void;
    abstract toggleActive(active: boolean): void;
    abstract dragHandle(datum: AnnotationProperties, target: Coords, invertPoint: (point: Coords) => Coords | undefined): void;
    abstract stopDragging(): void;
    abstract getCursor(): string;
}
