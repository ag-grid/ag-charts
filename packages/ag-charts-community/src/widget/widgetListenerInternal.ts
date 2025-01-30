import { getWindow } from '../core';
import { BBoxValues } from '../util/bboxinterface';
import { partialAssign } from '../util/object';
import { type DragWidgetEvent, type WidgetEventMap_Internal, WidgetEventUtil } from './widgetEvents';

type EventMap = WidgetEventMap_Internal;
type EventType = keyof WidgetEventMap_Internal;
type EventHandler<T, K extends EventType = EventType> = (event: EventMap[K], current: T) => unknown;
type Targetable = { getElement(): HTMLElement };

type DragEvents = 'drag-start' | 'drag-move' | 'drag-end';
type DragOrigin = { pageX: number; pageY: number; offsetX: number; offsetY: number };

type MouseDragCallbacks = {
    mousedown: (event: MouseEvent) => void;
    mousemove: (event: MouseEvent) => void;
    mouseup: (event: MouseEvent) => void;
};

type TouchDragCallbacks = {
    touchmove: (event: TouchEvent, touch: Touch) => void;
    touchend: (event: TouchEvent, touch: Touch) => void;
};

function makeMouseDrag<K extends DragEvents>(
    current: Targetable,
    type: K,
    origin: DragOrigin,
    sourceEvent: MouseEvent
): DragWidgetEvent<K> {
    const { currentX, currentY } = WidgetEventUtil.calcCurrentXY(current.getElement(), sourceEvent);
    // [offsetX, offsetY] is relative to the sourceEvent.target, which can be another element
    // such as a legend button. Therefore, calculate [offsetX, offsetY] relative to the axis
    // element that fired the 'mousedown' event.
    const originDeltaX = sourceEvent.pageX - origin.pageX;
    const originDeltaY = sourceEvent.pageY - origin.pageY;
    return {
        type,
        device: 'mouse',
        offsetX: origin.offsetX + originDeltaX,
        offsetY: origin.offsetY + originDeltaY,
        clientX: sourceEvent.clientX,
        clientY: sourceEvent.clientY,
        currentX,
        currentY,
        originDeltaX,
        originDeltaY,
        sourceEvent,
    };
}

function startMouseDrag(
    that: { globalMouseDragCallbacks?: MouseDragCallbacks },
    myCallbacks: MouseDragCallbacks,
    downEvent: MouseEvent
) {
    if (that.globalMouseDragCallbacks != null) return;

    const window = getWindow();

    const mousegeneral = (generalEvent: MouseEvent) => {
        generalEvent.stopPropagation();
        generalEvent.stopImmediatePropagation();
    };

    const mousemove = (moveEvent: MouseEvent) => {
        moveEvent.stopPropagation();
        moveEvent.stopImmediatePropagation();
        that.globalMouseDragCallbacks?.mousemove(moveEvent);
    };

    const mouseup = (upEvent: MouseEvent) => {
        if (upEvent.button === 0) {
            upEvent.stopPropagation();
            upEvent.stopImmediatePropagation();
            window.removeEventListener('mousedown', mousegeneral, { capture: true });
            window.removeEventListener('mouseenter', mousegeneral, { capture: true });
            window.removeEventListener('mouseleave', mousegeneral, { capture: true });
            window.removeEventListener('mouseout', mousegeneral, { capture: true });
            window.removeEventListener('mouseover', mousegeneral, { capture: true });
            window.removeEventListener('mousemove', mousemove, { capture: true });
            window.removeEventListener('mouseup', mouseup, { capture: true });
            that.globalMouseDragCallbacks?.mouseup(upEvent);
            that.globalMouseDragCallbacks = undefined;
        }
    };

    window.addEventListener('mousedown', mousegeneral, { capture: true });
    window.addEventListener('mouseenter', mousegeneral, { capture: true });
    window.addEventListener('mouseleave', mousegeneral, { capture: true });
    window.addEventListener('mouseout', mousegeneral, { capture: true });
    window.addEventListener('mouseover', mousegeneral, { capture: true });
    window.addEventListener('mousemove', mousemove, { capture: true });
    window.addEventListener('mouseup', mouseup, { capture: true });
    that.globalMouseDragCallbacks = myCallbacks;
    that.globalMouseDragCallbacks.mousedown(downEvent);
}

function getTouchOffsets(current: Targetable, { pageX, pageY }: Touch): { offsetX: number; offsetY: number } {
    const { x, y } = current.getElement().getBoundingClientRect();
    return { offsetX: pageX - x, offsetY: pageY - y };
}

function deltaClientSquared(a: Touch, b: Touch): number {
    const dx = a.clientX - b.clientX;
    const dy = a.clientY - b.clientY;
    return dx * dx + dy * dy;
}

function makeTouchDrag<K extends DragEvents>(
    current: Targetable,
    type: K,
    origin: DragOrigin,
    sourceEvent: TouchEvent,
    touch: Touch
): DragWidgetEvent<K> {
    const { currentX, currentY } = WidgetEventUtil.calcCurrentXY(current.getElement(), touch);
    const originDeltaX = touch.pageX - origin.pageX;
    const originDeltaY = touch.pageY - origin.pageY;
    return {
        type,
        device: 'touch',
        offsetX: origin.offsetX + originDeltaX,
        offsetY: origin.offsetY + originDeltaY,
        clientX: touch.clientX,
        clientY: touch.clientY,
        currentX,
        currentY,
        originDeltaX,
        originDeltaY,
        sourceEvent,
    };
}

const LONG_TAP_DURATION_MS = 500; /* milliseconds */
const LONG_TAP_INTERRUPT_MIN_TOUCHMOVE = 100; /* px²*/

let gIsInLongTap = false;
function startOneFingerTouch(
    dragTouchEnabled: boolean,
    that: { globalTouchDragCallbacks?: TouchDragCallbacks },
    myCallbacks: TouchDragCallbacks,
    initialTouch: Touch,
    target: HTMLElement
) {
    if (that.globalTouchDragCallbacks != null || gIsInLongTap) return;

    let longTapInterrupted = false;
    setTimeout(() => {
        if (!longTapInterrupted) {
            // Cancel current 'drag-start':
            target.dispatchEvent(new TouchEvent('touchcancel', { touches: [initialTouch], bubbles: true }));

            // Block new 'drag-start' events:
            gIsInLongTap = true;

            // Block 'touchmove' page-scroll until the user lifts the finger:
            const longTapMove = (e: Event) => {
                e.preventDefault();
            };
            // Unblock new 'drag-start' events:
            const longTapEnd = (e: Event) => {
                gIsInLongTap = false;
                e.preventDefault();
                target.removeEventListener('touchmove', longTapMove);
                target.removeEventListener('touchend', longTapEnd);
                target.removeEventListener('touchcancel', longTapEnd);
            };
            target.addEventListener('touchmove', longTapMove, { passive: false });
            target.addEventListener('touchend', longTapEnd, { passive: false });
            target.addEventListener('touchcancel', longTapEnd, { passive: false });

            // Fire context menu
            const { clientX, clientY } = initialTouch;
            const contextMenuEvent = new MouseEvent('contextmenu', {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX,
                clientY,
            });
            target.dispatchEvent(contextMenuEvent);
        }
    }, LONG_TAP_DURATION_MS);

    const findInitialFinger = (...touchLists: TouchList[]): Touch | undefined => {
        const touches: Touch[] = touchLists.map((touchList) => Array.from(touchList)).flat();
        return Array.from(touches).find((v) => v.identifier === initialTouch.identifier);
    };

    const touchmove = (moveEvent: TouchEvent) => {
        const touch = findInitialFinger(moveEvent.targetTouches);
        if (touch != null) {
            longTapInterrupted =
                longTapInterrupted || deltaClientSquared(initialTouch, touch) < LONG_TAP_INTERRUPT_MIN_TOUCHMOVE;
            if (dragTouchEnabled && touch != null) {
                that.globalTouchDragCallbacks?.touchmove(moveEvent, touch);
            }
        }
    };
    const touchend = (endEvent: TouchEvent) => {
        longTapInterrupted = true;
        target.removeEventListener('touchstart', touchend);
        target.removeEventListener('touchmove', touchmove);
        target.removeEventListener('touchend', touchend);
        target.removeEventListener('touchcancel', touchend);
        const touch = findInitialFinger(endEvent.changedTouches, endEvent.touches);
        if (touch != null) {
            that.globalTouchDragCallbacks?.touchend(endEvent, touch);
            that.globalTouchDragCallbacks = undefined;
        }
    };

    // "drag-move" happens when there is exactly 1 finger on the screen, so callback touchend whenever a finger is
    // removed or added.
    target.addEventListener('touchmove', touchmove, { passive: false });
    target.addEventListener('touchstart', touchend, { passive: false });
    target.addEventListener('touchend', touchend, { passive: false });
    target.addEventListener('touchcancel', touchend, { passive: false });
    that.globalTouchDragCallbacks = myCallbacks;
}

const GlobalCallbacks: {
    // The 'mousedown' event get fired on the target DOM element and all its ancestors that have 'mousedown' event
    // listeners. However, we only want 1 DOM element to handle the dragging operation because doing so involves adding
    // temporary capture event listeners to the global `window` object. Therefore, this property much be static.
    //
    // As a consequence, the widget `'drag-*'` events do not support propagation; but that's sufficient for us because
    // we do not yet have a use-case when propagation is needed for drag events.
    globalMouseDragCallbacks?: MouseDragCallbacks;
    globalTouchDragCallbacks?: TouchDragCallbacks;
} = {};

export class WidgetListenerInternal {
    public dragTouchEnabled = true;
    private dragTriggerRemover?: () => void;
    private dragStartListeners?: EventHandler<Targetable>[];
    private dragMoveListeners?: EventHandler<Targetable>[];
    private dragEndListeners?: EventHandler<Targetable>[];
    private localMouseDragCallbacks?: MouseDragCallbacks;
    private localTouchDragCallbacks?: TouchDragCallbacks;

    constructor(private readonly dispatchCallback: (type: EventType, event: EventMap[EventType]) => void) {}

    destroy(): void {
        this.dragTriggerRemover?.();
        this.dragTriggerRemover = undefined;
        this.dragStartListeners = undefined;
        this.dragMoveListeners = undefined;
        this.dragEndListeners = undefined;
        if (GlobalCallbacks.globalMouseDragCallbacks === this.localMouseDragCallbacks) {
            GlobalCallbacks.globalMouseDragCallbacks = undefined;
        }
        if (GlobalCallbacks.globalTouchDragCallbacks === this.localTouchDragCallbacks) {
            GlobalCallbacks.globalTouchDragCallbacks = undefined;
        }
    }

    add<T extends Targetable, K extends EventType>(type: K, target: T, handler: EventHandler<T, K>): void;
    add<T extends Targetable, K extends EventType>(type: K, target: T, handler: EventHandler<unknown>): void {
        switch (type) {
            case 'drag-start': {
                this.dragStartListeners ??= [];
                this.dragStartListeners.push(handler);
                this.registerDragTrigger(target);
                break;
            }
            case 'drag-move': {
                this.dragMoveListeners ??= [];
                this.dragMoveListeners.push(handler);
                this.registerDragTrigger(target);
                break;
            }
            case 'drag-end': {
                this.dragEndListeners ??= [];
                this.dragEndListeners.push(handler);
                this.registerDragTrigger(target);
                break;
            }
        }
    }

    remove<T extends Targetable, K extends EventType>(type: K, _target: T, handler: EventHandler<T, K>): void;
    remove<T extends Targetable, K extends EventType>(type: K, _target: T, handler: EventHandler<unknown>): void {
        switch (type) {
            case 'drag-start':
                return this.removeHandler(this.dragStartListeners, handler);
            case 'drag-move':
                return this.removeHandler(this.dragMoveListeners, handler);
            case 'drag-end':
                return this.removeHandler(this.dragEndListeners, handler);
        }
    }

    private removeHandler<T extends Targetable>(array: EventHandler<T>[] | undefined, handler: EventHandler<T>): void {
        const index = array?.indexOf(handler);
        if (index !== undefined) array?.splice(index, 1);
    }

    private registerDragTrigger<T extends Targetable>(target: T) {
        if (this.dragTriggerRemover == null) {
            const mouseTrigger = (event: MouseEvent) => this.triggerMouseDrag(target, event);
            const touchTrigger = (event: TouchEvent) => this.triggerTouchDrag(target, event);
            target.getElement().addEventListener('mousedown', mouseTrigger);
            target.getElement().addEventListener('touchstart', touchTrigger, { passive: false });
            this.dragTriggerRemover = () => {
                target.getElement().removeEventListener('mousedown', mouseTrigger);
                target.getElement().removeEventListener('touchstart', touchTrigger);
            };
        }
    }

    private triggerMouseDrag<T extends Targetable>(current: T, downEvent: MouseEvent) {
        if (downEvent.button === 0) {
            this.startMouseDrag(current, downEvent);
        }
    }

    private startMouseDrag<T extends Targetable>(current: T, initialDownEvent: MouseEvent) {
        const origin: DragOrigin = { pageX: NaN, pageY: NaN, offsetX: NaN, offsetY: NaN };
        partialAssign(['pageX', 'pageY', 'offsetX', 'offsetY'], origin, initialDownEvent);

        const dragCallbacks: MouseDragCallbacks = {
            mousedown: (downEvent: MouseEvent) => {
                this.localMouseDragCallbacks = dragCallbacks;
                const dragStartEvent = makeMouseDrag(current, 'drag-start', origin, downEvent);
                this.dispatch('drag-start', current, dragStartEvent);
            },
            mousemove: (moveEvent: MouseEvent) => {
                const dragMoveEvent = makeMouseDrag(current, 'drag-move', origin, moveEvent);
                this.dispatch('drag-move', current, dragMoveEvent);
            },
            mouseup: (upEvent: MouseEvent) => {
                const dragEndEvent = makeMouseDrag(current, 'drag-end', origin, upEvent);
                this.dispatch('drag-end', current, dragEndEvent);
                this.endDrag(current, dragEndEvent);
            },
        };

        startMouseDrag(GlobalCallbacks, dragCallbacks, initialDownEvent);
    }

    private endDrag(target: Targetable, { sourceEvent, clientX, clientY }: DragWidgetEvent<'drag-end'>) {
        const elem = target.getElement();
        const rect = elem.getBoundingClientRect();
        if (!BBoxValues.containsPoint(rect, clientX, clientY)) {
            elem.dispatchEvent(new MouseEvent('mouseleave', sourceEvent));
            sourceEvent.target?.dispatchEvent(new MouseEvent('mouseenter', sourceEvent));
        }
    }

    private triggerTouchDrag<T extends Targetable>(current: T, startEvent: TouchEvent) {
        const touch = startEvent.targetTouches.item(0);
        if (startEvent.targetTouches.length === 1 && touch != null) {
            this.startOneFingerTouch(current, startEvent, touch);
        }
    }

    private startOneFingerTouch<T extends Targetable>(current: T, initialEvent: TouchEvent, initialTouch: Touch) {
        const origin: DragOrigin = { pageX: NaN, pageY: NaN, ...getTouchOffsets(current, initialTouch) };
        partialAssign(['pageX', 'pageY'], origin, initialTouch);

        const dragCallbacks: TouchDragCallbacks = {
            touchmove: (moveEvent: TouchEvent, touch: Touch) => {
                const dragMoveEvent = makeTouchDrag(current, 'drag-move', origin, moveEvent, touch);
                this.dispatch('drag-move', current, dragMoveEvent);
            },
            touchend: (cancelEvent: TouchEvent, touch: Touch) => {
                const dragMoveEvent = makeTouchDrag(current, 'drag-end', origin, cancelEvent, touch);
                this.dispatch('drag-end', current, dragMoveEvent);
            },
        };
        this.localTouchDragCallbacks = dragCallbacks;

        startOneFingerTouch(this.dragTouchEnabled, GlobalCallbacks, dragCallbacks, initialTouch, current.getElement());

        const dragStartEvent = makeTouchDrag(current, 'drag-start', origin, initialEvent, initialTouch);
        this.dispatch('drag-start', current, dragStartEvent);
    }

    public dispatch<T extends Targetable, K extends EventType>(type: K, current: T, event: EventMap[K]): void {
        switch (type) {
            case 'drag-start':
                this.dragStartListeners?.forEach((handler) => handler(event, current));
                break;
            case 'drag-move':
                this.dragMoveListeners?.forEach((handler) => handler(event, current));
                break;
            case 'drag-end':
                this.dragEndListeners?.forEach((handler) => handler(event, current));
                break;
        }

        this.dispatchCallback(type, event);
    }
}
