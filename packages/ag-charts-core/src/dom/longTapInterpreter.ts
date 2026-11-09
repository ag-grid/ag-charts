import { CleanupRegistry } from '../state/cleanupRegistry';
import type { Widget } from '../widget/widget';
import type { TouchWidgetEvent } from '../widget/widgetEvents';
import { attachListener } from './domEvents';
import { deltaClientSquared } from './domUtil';

const LONG_TAP_DURATION_MS = 500;
const LONG_TAP_INTERRUPT_MIN_TOUCHMOVE_PXPX = 100; /* px² */

function findTouch(touches: TouchList, identifier: number): Touch | undefined {
    // Indexed to avoid the array copy: runs on every 'touchmove' while a candidate is alive.
    for (let i = 0; i < touches.length; i += 1) {
        if (touches[i].identifier === identifier) return touches[i];
    }
    return undefined;
}

/**
 * Synthesises the 'contextmenu' that touch devices never send: iOS Safari reserves long-press for selectable
 * content, so touch users cannot otherwise reach the chart's context menus. Listening on the chart element and
 * re-dispatching on `sourceEvent.target` means a widget needs only its existing 'contextmenu' listener.
 */
export class LongTapInterpreter {
    private readonly cleanup = new CleanupRegistry();
    // Separate lifetime: registered when the long tap fires, flushed when the finger lifts.
    private readonly gestureCleanup = new CleanupRegistry();
    private timer?: ReturnType<typeof setTimeout>;
    private candidate?: { touch: Touch; target: EventTarget };

    constructor(private readonly widget: Widget) {
        this.cleanup.register(
            widget.addListener('touchstart', this.onTouchStart.bind(this)),
            widget.addListener('touchmove', this.onTouchMove.bind(this)),
            widget.addListener('touchend', this.disarm.bind(this)),
            widget.addListener('touchcancel', this.disarm.bind(this))
        );
    }

    destroy(): void {
        this.disarm();
        this.gestureCleanup.flush();
        this.cleanup.flush();
    }

    private onTouchStart(event: TouchWidgetEvent<'touchstart'>) {
        this.disarm();
        // Counted per target, so a pinch on the series area cancels itself, but a finger on each of two
        // elements does not.
        const { targetTouches, target } = event.sourceEvent;
        const touch = targetTouches[0];
        if (targetTouches.length !== 1 || touch == null || target == null) return;

        this.candidate = { touch, target };
        this.timer = setTimeout(this.onLongTap, LONG_TAP_DURATION_MS);
    }

    private onTouchMove(event: TouchWidgetEvent<'touchmove'>) {
        const { candidate } = this;
        if (candidate == null) return;

        // Measured from the touch-down point, so a finger that wanders and returns is still a drag.
        const touch = findTouch(event.sourceEvent.targetTouches, candidate.touch.identifier);
        if (touch != null && deltaClientSquared(candidate.touch, touch) > LONG_TAP_INTERRUPT_MIN_TOUCHMOVE_PXPX) {
            this.disarm();
        }
    }

    private disarm() {
        clearTimeout(this.timer);
        this.timer = undefined;
        this.candidate = undefined;
    }

    private readonly onLongTap = () => {
        const { candidate } = this;
        if (candidate == null) return;
        const { touch, target } = candidate;
        // TODO: Phase 3 "Common Widget Ancestor" - the gesture listeners below need capture and non-passive options,
        // which Widget listeners do not offer.
        const element = this.widget.getElement();
        this.disarm();

        // A chart update can replace the touched element mid-hold, leaving nothing to dispatch to.
        if (!element.contains(target as Node)) return;

        // Must precede the listeners below, whose 'touchcancel' handler would misread it as a lift.
        target.dispatchEvent(
            new TouchEvent('touchcancel', {
                bubbles: true,
                touches: [touch],
                targetTouches: [touch],
                changedTouches: [touch],
            })
        );

        // The context menu owns the rest of the gesture: no page scroll, no emulated click on lift.
        const suppressDefault = (e: Event) => e.preventDefault();
        const finish = (e: Event) => {
            e.preventDefault();
            this.gestureCleanup.flush();
        };
        const opts: AddEventListenerOptions = { passive: false, capture: true };
        this.gestureCleanup.register(
            attachListener(element, 'touchstart', suppressDefault, opts),
            attachListener(element, 'touchmove', suppressDefault, opts),
            attachListener(element, 'touchend', finish, opts),
            attachListener(element, 'touchcancel', finish, opts)
        );

        const { clientX, clientY } = touch;
        target.dispatchEvent(
            new PointerEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                view: element.ownerDocument.defaultView,
                clientX,
                clientY,
                pointerType: 'touch',
            })
        );
    };
}
