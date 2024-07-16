import { _Scene } from 'ag-charts-community';
import type { AnnotationProperties } from '../annotationProperties';
import { type Coords, type LineCoords } from '../annotationTypes';
import { Annotation } from './annotation';
type ChannelHandle = keyof Channel['handles'];
export declare class Channel extends Annotation {
    type: string;
    activeHandle?: ChannelHandle;
    private topLine;
    private middleLine;
    private bottomLine;
    private background;
    private seriesRect?;
    private handles;
    constructor();
    update(datum: AnnotationProperties, seriesRect: _Scene.BBox, top?: LineCoords, bottom?: LineCoords): void;
    toggleHandles(show: boolean | Partial<Record<ChannelHandle, boolean>>): void;
    toggleActive(active: boolean): void;
    dragHandle(datum: AnnotationProperties, target: Coords, invertPoint: (point: Coords) => Coords | undefined): void;
    stopDragging(): void;
    getCursor(): string;
    containsPoint(x: number, y: number): boolean;
    private updateLines;
    private updateHandles;
    private updateBackground;
    private getHandleDatumPoint;
}
export {};
