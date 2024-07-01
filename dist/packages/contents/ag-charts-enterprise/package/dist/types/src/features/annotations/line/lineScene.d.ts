import type { AnnotationContext, Coords } from '../annotationTypes';
import { LinearScene } from '../scenes/linearScene';
import type { LineAnnotation } from './lineProperties';
export declare class Line extends LinearScene<LineAnnotation> {
    static is(value: unknown): value is Line;
    type: string;
    activeHandle?: 'start' | 'end';
    private readonly line;
    private readonly start;
    private readonly end;
    private seriesRect?;
    constructor();
    update(datum: LineAnnotation, context: AnnotationContext): void;
    toggleHandles(show: boolean | Partial<Record<'start' | 'end', boolean>>): void;
    toggleActive(active: boolean): void;
    dragHandle(datum: LineAnnotation, target: Coords, context: AnnotationContext, onInvalid: () => void): void;
    stopDragging(): void;
    getAnchor(): {
        x: number;
        y: number;
    };
    getCursor(): "default" | "pointer";
    containsPoint(x: number, y: number): boolean;
}
