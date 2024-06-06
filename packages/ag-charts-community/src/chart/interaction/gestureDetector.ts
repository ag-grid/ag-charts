import { Logger } from '../../util/logger';
import { partialAssign } from '../../util/object';
import { BaseManager } from '../baseManager';
import type { DOMManager } from '../dom/domManager';
import { type PreventableEvent, buildPreventable } from './preventableEvent';

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
    origin: { x: number; y: number };
    deltaDistance: number;
};

enum PinchTrackingStatus {
    Off,
    Initialized,
    Running,
}

function distanceSquared(finger1: Finger, finger2: Finger): number {
    const dx = finger1.screenX - finger2.screenX;
    const dy = finger1.screenY - finger2.screenY;
    return dx * dx + dy * dy;
}

function distance(finger1: Finger, finger2: Finger): number {
    return Math.sqrt(distanceSquared(finger1, finger2));
}

// The minimum distance that two pinch fingers need to move away from to fire a
// 'pinch-start' event.
const MIN_DISTANCE_TO_START_PINCH = 1;

export class GestureDetector extends BaseManager<GestureEventTypes, GestureEvent> {
    private readonly touchstart = (event: TouchEvent) => this.onTouchStart(event);
    private readonly touchmove = (event: TouchEvent) => this.onTouchMove(event);
    private readonly touchend = (event: TouchEvent) => this.onTouchEnd(event);
    private readonly touchcancel = (event: TouchEvent) => this.onTouchCancel(event);

    private readonly pinch = {
        finger1: { identifier: NaN, screenX: NaN, screenY: NaN },
        finger2: { identifier: NaN, screenX: NaN, screenY: NaN },
        origin: { x: NaN, y: NaN },
        distance: NaN,
        status: PinchTrackingStatus.Off,
    };

    public constructor(private readonly domManager: DOMManager) {
        super();
        this.domManager.addEventListener('touchstart', this.touchstart, { passive: true });
        this.domManager.addEventListener('touchmove', this.touchmove, { passive: false });
        this.domManager.addEventListener('touchend', this.touchend);
        this.domManager.addEventListener('touchcancel', this.touchcancel);
    }

    override destroy() {
        this.domManager.removeEventListener('touchstart', this.touchstart);
        this.domManager.removeEventListener('touchmove', this.touchmove);
        this.domManager.removeEventListener('touchend', this.touchend);
        this.domManager.removeEventListener('touchcancel', this.touchcancel);
    }

    private findPinchTouches(moveEvent: TouchEvent): undefined | [Touch, Touch] {
        const { touches } = moveEvent;
        const { finger1, finger2 } = this.pinch;
        if (this.pinch.status !== PinchTrackingStatus.Off && touches.length === 2) {
            if (touches[0].identifier === finger1.identifier && touches[1].identifier === finger2.identifier) {
                return [touches[0], touches[1]];
            }
            if (touches[0].identifier === finger2.identifier && touches[1].identifier === finger1.identifier) {
                return [touches[1], touches[0]];
            }
        }
    }

    private copyTouchData(event: TouchEvent) {
        const keys: (keyof Finger)[] = ['identifier', 'screenX', 'screenY'];
        partialAssign(keys, this.pinch.finger1, event.touches[0]);
        partialAssign(keys, this.pinch.finger2, event.touches[1]);
        this.pinch.distance = distance(this.pinch.finger1, this.pinch.finger2);
    }

    private dispatchPinchEvent<T extends PinchEventTypes>(type: T, deltaDistance: number, sourceEvent: Event) {
        const { finger1, finger2, origin } = this.pinch;
        this.listeners.dispatch(type, buildPreventable({ sourceEvent, type, finger1, finger2, deltaDistance, origin }));
    }

    private onTouchStart(event: TouchEvent) {
        this.stopPinchTracking(event);

        const { pinch } = this;
        if (event.touches.length === 2) {
            pinch.status = PinchTrackingStatus.Initialized;
            this.copyTouchData(event);
            pinch.origin.x = (event.touches[0].clientX + event.touches[1].clientX) / 2;
            pinch.origin.y = (event.touches[0].clientY + event.touches[1].clientY) / 2;
        }
    }

    private onTouchMove(event: TouchEvent) {
        const pinchTouches = this.findPinchTouches(event);
        if (pinchTouches !== undefined) {
            const [touch1, touch2] = pinchTouches;
            const { pinch } = this;
            const newDistance = distance(touch1, touch2);
            const deltaDistance = newDistance - pinch.distance;

            if (pinch.status === PinchTrackingStatus.Initialized) {
                if (Math.abs(deltaDistance) > MIN_DISTANCE_TO_START_PINCH) {
                    pinch.status = PinchTrackingStatus.Running;
                    this.copyTouchData(event);
                    this.dispatchPinchEvent('pinch-start', 0, event);
                }
            } else if (pinch.status === PinchTrackingStatus.Running) {
                pinch.distance = newDistance;
                this.copyTouchData(event);
                this.dispatchPinchEvent('pinch-move', deltaDistance, event);
            } else {
                Logger.error(`unexpected pinch.status: ${pinch.status}`);
            }
        }
    }

    private onTouchEnd(event: TouchEvent) {
        this.stopPinchTracking(event);
    }

    private onTouchCancel(event: TouchEvent) {
        this.stopPinchTracking(event);
    }

    private stopPinchTracking(event: Event) {
        const { pinch } = this;
        if (pinch.status === PinchTrackingStatus.Running) {
            this.dispatchPinchEvent('pinch-end', 0, event);
        }
        this.pinch.status = PinchTrackingStatus.Off;
    }
}
