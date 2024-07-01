import type { AnnotationContext, Coords, LineCoords } from '../annotationTypes';
import { ChannelScene } from '../scenes/channelScene';
import { DivariantHandle, UnivariantHandle } from '../scenes/handle';
import type { DisjointChannelAnnotation } from './disjointChannelProperties';
type ChannelHandle = keyof DisjointChannel['handles'];
export declare class DisjointChannel extends ChannelScene<DisjointChannelAnnotation> {
    static is(value: unknown): value is DisjointChannel;
    type: string;
    activeHandle?: ChannelHandle;
    handles: {
        topLeft: DivariantHandle;
        topRight: DivariantHandle;
        bottomLeft: DivariantHandle;
        bottomRight: UnivariantHandle;
    };
    constructor();
    toggleHandles(show: boolean | Partial<Record<ChannelHandle, boolean>>): void;
    toggleActive(active: boolean): void;
    dragHandle(datum: DisjointChannelAnnotation, target: Coords, context: AnnotationContext, onInvalid: () => void): void;
    protected getOtherCoords(datum: DisjointChannelAnnotation, topLeft: Coords, topRight: Coords, context: AnnotationContext): Coords[];
    updateLines(datum: DisjointChannelAnnotation, top: LineCoords, bottom: LineCoords): void;
    updateHandles(datum: DisjointChannelAnnotation, top: LineCoords, bottom: LineCoords): void;
}
export {};
