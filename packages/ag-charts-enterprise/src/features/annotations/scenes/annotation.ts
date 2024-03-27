import { _Scene } from 'ag-charts-community';

import type { AnnotationProperties } from '../annotationProperties';
import type { Coords } from '../annotationTypes';

export abstract class Annotation extends _Scene.Group {
    public abstract type: string;
    public abstract activeHandle?: string;

    // TODO: stats

    abstract override containsPoint(x: number, y: number): boolean;

    public abstract toggleHandles(show: boolean): void;
    public abstract toggleActive(active: boolean): void;
    public abstract dragHandle(
        datum: AnnotationProperties,
        target: Coords,
        invertPoint: (point: Coords) => Coords
    ): void;
    public abstract stopDragging(): void;
    public abstract getCursor(): string;
}
