import type { AnnotationContext, Coords, LineCoords } from '../annotationTypes';
import { ChannelScene } from '../scenes/channelScene';
import { DivariantHandle, UnivariantHandle } from '../scenes/handle';
import type { ParallelChannelAnnotation } from './parallelChannelProperties';
type ChannelHandle = keyof ParallelChannel['handles'];
export declare class ParallelChannel extends ChannelScene<ParallelChannelAnnotation> {
    static is(value: unknown): value is ParallelChannel;
    type: string;
    activeHandle?: ChannelHandle;
    handles: {
        topLeft: DivariantHandle;
        topMiddle: UnivariantHandle;
        topRight: DivariantHandle;
        bottomLeft: DivariantHandle;
        bottomMiddle: UnivariantHandle;
        bottomRight: DivariantHandle;
    };
    private readonly middleLine;
    constructor();
    toggleHandles(show: boolean | Partial<Record<ChannelHandle, boolean>>): void;
    toggleActive(active: boolean): void;
    dragHandle(datum: ParallelChannelAnnotation, target: Coords, context: AnnotationContext, onInvalid: () => void): void;
    protected getOtherCoords(datum: ParallelChannelAnnotation, topLeft: Coords, topRight: Coords, context: AnnotationContext): Coords[];
    updateLines(datum: ParallelChannelAnnotation, top: LineCoords, bottom: LineCoords): void;
    updateHandles(datum: ParallelChannelAnnotation, top: LineCoords, bottom: LineCoords): void;
}
export {};
