import { BaseManager } from '../baseManager';
import type { DOMManager } from '../dom/domManager';
import { type PreventableEvent } from './preventableEvent';
type PinchEventTypes = 'pinch-start' | 'pinch-move' | 'pinch-end';
type GestureEventTypes = PinchEventTypes;
type Finger = {
    identifier: number;
    screenX: number;
    screenY: number;
};
export type GestureEvent<T extends GestureEventTypes = GestureEventTypes> = {
    type: T;
};
export type PinchEvent<T extends PinchEventTypes = PinchEventTypes> = PreventableEvent & {
    type: T;
    finger1: Finger;
    finger2: Finger;
    origin: {
        x: number;
        y: number;
    };
    deltaDistance: number;
};
export declare class GestureDetector extends BaseManager<GestureEventTypes, GestureEvent> {
    private readonly domManager;
    private readonly touchstart;
    private readonly touchmove;
    private readonly touchend;
    private readonly touchcancel;
    private readonly pinch;
    constructor(domManager: DOMManager);
    destroy(): void;
    private findPinchTouches;
    private copyTouchData;
    private dispatchPinchEvent;
    private onTouchStart;
    private onTouchMove;
    private onTouchEnd;
    private onTouchCancel;
    private stopPinchTracking;
}
export {};
