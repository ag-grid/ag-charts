import type { AnnotationContext, Coords } from '../annotationTypes';
import { Annotation } from '../scenes/annotation';
import { type CrossLineAnnotation } from './crossLineProperties';
export declare class CrossLine extends Annotation {
    static is(value: unknown): value is CrossLine;
    type: string;
    activeHandle?: 'middle';
    private readonly line;
    private readonly middle;
    private axisLabel?;
    private seriesRect?;
    private dragState?;
    private isHorizontal;
    constructor();
    update(datum: CrossLineAnnotation, context: AnnotationContext): void;
    private createAxisLabel;
    private updateAxisLabel;
    toggleHandles(show: boolean): void;
    destroy(): void;
    toggleActive(active: boolean): void;
    dragStart(datum: CrossLineAnnotation, target: Coords, context: AnnotationContext): void;
    drag(datum: CrossLineAnnotation, target: Coords, context: AnnotationContext, onInvalid: () => void): void;
    stopDragging(): void;
    getCursor(): "default" | "col-resize" | "row-resize" | "pointer";
    containsPoint(x: number, y: number): boolean;
    getAnchor(): {
        x: number;
        y: number;
        position?: undefined;
    } | {
        x: number;
        y: number;
        position: string;
    };
    private convertCrossLine;
}
