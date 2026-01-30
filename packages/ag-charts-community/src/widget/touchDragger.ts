import { CleanupRegistry, attachListener } from 'ag-charts-core';

const LONG_TAP_DURATION_MS = 500; /* milliseconds */
const LONG_TAP_INTERRUPT_MIN_TOUCHMOVE_PXPX = 100; /* px²*/

export type TouchDragCallbacks = {
    touchmove: (event: TouchEvent, touch: Touch) => void;
    touchend: (event: TouchEvent, touch: Touch) => void;
};

function deltaClientSquared(a: Touch, b: Touch): number {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return dx * dx + dy * dy;
}

let gIsInLongTap = false;

export class TouchDragger {
    private readonly cleanup = new CleanupRegistry();
    private readonly longtapTimer: ReturnType<typeof setTimeout>;
    private longTapInterrupted = false;
    private readonly window: Window;

    constructor(
        private readonly glob: { globalTouchDragCallbacks?: TouchDragCallbacks },
        private readonly self: { dragTouchEnabled: boolean; touchDragger?: TouchDragger },
        myCallbacks: TouchDragCallbacks,
        private readonly initialTouch: Touch,
        private readonly target: HTMLElement
    ) {
        const window = target.ownerDocument.defaultView;
        if (!window) {
            throw new Error('AG Charts - unable to resolve window');
        }
        this.window = window;
        this.longtapTimer = setTimeout(this.longtap, LONG_TAP_DURATION_MS);

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
        clearTimeout(this.longtapTimer);
        this.cleanup.flush();
        this.glob.globalTouchDragCallbacks = undefined;
        this.self.touchDragger = undefined;
    }

    private findInitialFinger(...touchLists: TouchList[]): Touch | undefined {
        const touches: Touch[] = touchLists.flatMap((touchList) => Array.from(touchList));
        return Array.from(touches).find((v) => v.identifier === this.initialTouch.identifier);
    }

    private readonly longtap = () => {
        const { target, initialTouch } = this;
        if (!this.longTapInterrupted) {
            const cleanup = new CleanupRegistry();

            // Cancel current 'drag-start':
            target.dispatchEvent(new TouchEvent('touchcancel', { touches: [initialTouch], bubbles: true }));

            // Block new 'drag-start' events:
            gIsInLongTap = true;

            // Block 'touchmove' page-scroll until the user lifts the finger:
            const longTapMove = (e: Event) => e.preventDefault();

            // Unblock new 'drag-start' events:
            const longTapEnd = (e: Event) => {
                gIsInLongTap = false;
                e.preventDefault();
                cleanup.flush();
            };

            cleanup.register(
                attachListener(target, 'touchmove', longTapMove, { passive: false }),
                attachListener(target, 'touchend', longTapEnd, { passive: false }),
                attachListener(target, 'touchcancel', longTapEnd, { passive: false })
            );

            // Fire context menu
            const { clientX, clientY } = initialTouch;
            const contextMenuEvent = new PointerEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                view: this.window,
                clientX,
                clientY,
                pointerType: 'touch',
            });
            target.dispatchEvent(contextMenuEvent);
        }
    };

    private readonly touchmove = (moveEvent: TouchEvent) => {
        const { glob, self, initialTouch } = this;
        const touch = this.findInitialFinger(moveEvent.targetTouches);
        if (touch != null) {
            this.longTapInterrupted =
                this.longTapInterrupted ||
                deltaClientSquared(initialTouch, touch) > LONG_TAP_INTERRUPT_MIN_TOUCHMOVE_PXPX;
            if (self.dragTouchEnabled) {
                glob.globalTouchDragCallbacks?.touchmove(moveEvent, touch);
            }
        }
    };

    private readonly touchend = (endEvent: TouchEvent) => {
        this.longTapInterrupted = true;
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
    if (glob.globalTouchDragCallbacks != null || gIsInLongTap) return undefined;
    return new TouchDragger(glob, self, myCallbacks, initialTouch, target);
}
