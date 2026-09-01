import { CleanupRegistry, attachListener } from 'ag-charts-core';

export type TouchDragCallbacks = {
    touchmove: (event: TouchEvent, touch: Touch) => void;
    touchend: (event: TouchEvent, touch: Touch) => void;
};

export class TouchDragger {
    private readonly cleanup = new CleanupRegistry();

    constructor(
        private readonly glob: { globalTouchDragCallbacks?: TouchDragCallbacks },
        private readonly self: { dragTouchEnabled: boolean; touchDragger?: TouchDragger },
        myCallbacks: TouchDragCallbacks,
        private readonly initialTouch: Touch,
        target: HTMLElement
    ) {
        // "drag-move" happens when there is exactly 1 finger on the screen, so callback touchend whenever a finger is
        // removed or added.
        const { touchmove, touchend } = this;
        this.cleanup.register(
            attachListener(target, 'touchmove', touchmove, { passive: false }),
            attachListener(target, 'touchstart', touchend, { passive: false }),
            attachListener(target, 'touchend', touchend, { passive: false }),
            attachListener(target, 'touchcancel', touchend, { passive: false })
        );

        self.touchDragger = this;
        glob.globalTouchDragCallbacks = myCallbacks;
    }

    destroy(): void {
        this.cleanup.flush();
        this.glob.globalTouchDragCallbacks = undefined;
        this.self.touchDragger = undefined;
    }

    private findInitialFinger(...touchLists: TouchList[]): Touch | undefined {
        const touches: Touch[] = touchLists.flatMap((touchList) => Array.from(touchList));
        return Array.from(touches).find((v) => v.identifier === this.initialTouch.identifier);
    }

    private readonly touchmove = (moveEvent: TouchEvent) => {
        const { glob, self } = this;
        const touch = this.findInitialFinger(moveEvent.targetTouches);
        if (touch != null && self.dragTouchEnabled) {
            glob.globalTouchDragCallbacks?.touchmove(moveEvent, touch);
        }
    };

    private readonly touchend = (endEvent: TouchEvent) => {
        const touch = this.findInitialFinger(endEvent.changedTouches, endEvent.touches);
        if (touch != null) {
            this.glob.globalTouchDragCallbacks?.touchend(endEvent, touch);
        }
        this.destroy();
    };
}

type Arg = ConstructorParameters<typeof TouchDragger>;
export function startOneFingerTouch(
    glob: Arg[0],
    self: Arg[1],
    myCallbacks: Arg[2],
    initialTouch: Arg[3],
    target: Arg[4]
) {
    if (glob.globalTouchDragCallbacks != null) return undefined;
    return new TouchDragger(glob, self, myCallbacks, initialTouch, target);
}
