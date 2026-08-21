import type { AnyFn, OffsetPoint } from 'ag-charts-core';
import { CleanupRegistry, attachListener, boxContains, partialAssign } from 'ag-charts-core';

import { type MouseDragCallbacks, type MouseDragger, startMouseDrag } from './mouseDragger';
import { type TouchDragCallbacks, type TouchDragger, startOneFingerTouch } from './touchDragger';
import { type DragWidgetEvent, type WidgetEventMap_Internal, WidgetEventUtil } from './widgetEvents';

type EventMap = WidgetEventMap_Internal;
type EventType = keyof WidgetEventMap_Internal;
type EventHandler<T, K extends EventType = EventType> = (event: EventMap[K], current: T) => unknown;
type Targetable = { getElement(): HTMLElement };

type DragEvents = 'drag-start' | 'drag-move' | 'drag-end';
type DragOrigin = {
    pageX: number;
    pageY: number;
    currentX: number;
    currentY: number;
    offsetX: number;
    offsetY: number;
};

function makeMouseDrag<K extends DragEvents>(type: K, origin: DragOrigin, sourceEvent: MouseEvent): DragWidgetEvent<K> {
    // sourceEvent's [offsetX, offsetY] is relative to its own target (which may be e.g. a legend
    // button), so re-base it on the element that fired the 'mousedown'.
    const originDeltaX = sourceEvent.pageX - origin.pageX;
    const originDeltaY = sourceEvent.pageY - origin.pageY;

    // FIXME: dragging an axis moves its tick labels, which resizes the axis element and makes the drag
    // twitch. Measure against the pre-resize origin instead of the live element bounds.
    const currentX = origin.currentX + originDeltaX;
    const currentY = origin.currentY + originDeltaY;

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

export function getTouchOffsets(current: Targetable, touch: Touch): OffsetPoint {
    const elem = current.getElement();
    const rect = elem.getBoundingClientRect();
    // clientX/Y matches rect.x/y's coordinate space; pageX/Y would be wrong by the page scroll offset.
    const clientWidth = elem.clientWidth;
    const clientHeight = elem.clientHeight;
    const scaleX = rect.width > 0 && clientWidth > 0 ? clientWidth / rect.width : 1;
    const scaleY = rect.height > 0 && clientHeight > 0 ? clientHeight / rect.height : 1;
    return {
        offsetX: (touch.clientX - rect.x) * scaleX,
        offsetY: (touch.clientY - rect.y) * scaleY,
    };
}

function makeTouchDrag<K extends DragEvents>(
    type: K,
    origin: DragOrigin,
    sourceEvent: TouchEvent,
    touch: Touch
): DragWidgetEvent<K> {
    const originDeltaX = touch.pageX - origin.pageX;
    const originDeltaY = touch.pageY - origin.pageY;

    // FIXME: Same as makeMouseDrag
    const currentX = origin.currentX + originDeltaX;
    const currentY = origin.currentY + originDeltaY;

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

const GlobalCallbacks: {
    // Static because a drag adds temporary capture listeners on `window`, so exactly one element may
    // own it — which is why the widget `'drag-*'` events do not support propagation.
    globalMouseDragCallbacks?: MouseDragCallbacks;
    globalTouchDragCallbacks?: TouchDragCallbacks;
} = {};

export class WidgetListenerInternal {
    public dragTouchEnabled = true;
    private dragTriggerRemover?: () => void;
    private listeners?: Map<EventType, Set<AnyFn>>;
    public mouseDragger?: MouseDragger;
    public touchDragger?: TouchDragger;

    constructor(private readonly dispatchCallback: (type: EventType, event: EventMap[EventType]) => void) {}

    destroy(): void {
        this.dragTriggerRemover?.();
        this.dragTriggerRemover = undefined;
        this.listeners?.clear();
        this.mouseDragger?.destroy();
        this.touchDragger?.destroy();
    }

    private getListenerSet<T extends Targetable, K extends EventType>(type: K): Set<EventHandler<T, K>> {
        this.listeners ??= new Map();
        let result: Set<EventHandler<T, K>> | undefined = this.listeners.get(type);
        if (result === undefined) {
            result = new Set();
            this.listeners.set(type, result);
        }
        return result;
    }

    add<T extends Targetable, K extends EventType>(type: K, target: T, handler: EventHandler<T, K>): void;
    add<T extends Targetable, K extends EventType>(type: K, target: T, handler: EventHandler<unknown>): void {
        this.getListenerSet(type).add(handler);
        switch (type) {
            case 'drag-start':
            case 'drag-move':
            case 'drag-end': {
                this.registerDragTrigger(target);
                break;
            }
        }
    }

    remove<T extends Targetable, K extends EventType>(type: K, _target: T, handler: EventHandler<T, K>): void;
    remove<T extends Targetable, K extends EventType>(type: K, _target: T, handler: EventHandler<unknown>): void {
        this.getListenerSet(type).delete(handler);
    }

    private registerDragTrigger<T extends Targetable>(target: T) {
        if (this.dragTriggerRemover == null) {
            const element = target.getElement();
            const cleanup = new CleanupRegistry();
            cleanup.register(
                attachListener(element, 'mousedown', (event: MouseEvent) => this.triggerMouseDrag(target, event)),
                attachListener(element, 'touchstart', (event: TouchEvent) => this.triggerTouchDrag(target, event), {
                    passive: false,
                })
            );
            this.dragTriggerRemover = () => cleanup.flush();
        }
    }

    private triggerMouseDrag<T extends Targetable>(current: T, downEvent: MouseEvent) {
        if (downEvent.button === 0) {
            if (downEvent.view == null) {
                // Fallback event `view` in case it's missing. (local tests)
                const elWin = current.getElement().ownerDocument.defaultView!;
                downEvent = new elWin.MouseEvent(downEvent.type, { ...downEvent, view: elWin });
            }
            this.startMouseDrag(current, downEvent);
        }
    }

    private startMouseDrag<T extends Targetable>(current: T, initialDownEvent: MouseEvent) {
        const { currentX, currentY } = WidgetEventUtil.calcCurrentXY(current.getElement(), initialDownEvent);
        const origin: DragOrigin = {
            pageX: Number.NaN,
            pageY: Number.NaN,
            offsetX: Number.NaN,
            offsetY: Number.NaN,
            currentX,
            currentY,
        };
        partialAssign(['pageX', 'pageY', 'offsetX', 'offsetY'], origin, initialDownEvent);

        const dragCallbacks: MouseDragCallbacks = {
            mousedown: (downEvent: MouseEvent) => {
                const dragStartEvent = makeMouseDrag('drag-start', origin, downEvent);
                this.dispatch('drag-start', current, dragStartEvent);
            },
            mousemove: (moveEvent: MouseEvent) => {
                const dragMoveEvent = makeMouseDrag('drag-move', origin, moveEvent);
                this.dispatch('drag-move', current, dragMoveEvent);
            },
            mouseup: (upEvent: MouseEvent) => {
                const dragEndEvent = makeMouseDrag('drag-end', origin, upEvent);
                this.dispatch('drag-end', current, dragEndEvent);
                this.endDrag(current, dragEndEvent);
            },
        };

        this.mouseDragger = startMouseDrag(GlobalCallbacks, this, dragCallbacks, initialDownEvent);
    }

    private endDrag(target: Targetable, { sourceEvent, clientX, clientY }: DragWidgetEvent<'drag-end'>) {
        const elem = target.getElement();
        const rect = elem.getBoundingClientRect();
        if (!boxContains(rect, clientX, clientY)) {
            elem.dispatchEvent(new MouseEvent('mouseleave', sourceEvent));
            sourceEvent.target?.dispatchEvent(new MouseEvent('mouseenter', sourceEvent));
        }
    }

    private triggerTouchDrag<T extends Targetable>(current: T, startEvent: TouchEvent) {
        const touch: Touch | null = startEvent.targetTouches[0];
        if (startEvent.targetTouches.length === 1 && touch != null) {
            this.startOneFingerTouch(current, startEvent, touch);
        }
    }

    private startOneFingerTouch<T extends Targetable>(current: T, initialEvent: TouchEvent, initialTouch: Touch) {
        const { currentX, currentY } = WidgetEventUtil.calcCurrentXY(current.getElement(), initialTouch);
        const origin: DragOrigin = {
            pageX: Number.NaN,
            pageY: Number.NaN,
            currentX,
            currentY,
            ...getTouchOffsets(current, initialTouch),
        };
        partialAssign(['pageX', 'pageY'], origin, initialTouch);

        const dragCallbacks: TouchDragCallbacks = {
            touchmove: (moveEvent: TouchEvent, touch: Touch) => {
                const dragMoveEvent = makeTouchDrag('drag-move', origin, moveEvent, touch);
                this.dispatch('drag-move', current, dragMoveEvent);
            },
            touchend: (cancelEvent: TouchEvent, touch: Touch) => {
                const dragMoveEvent = makeTouchDrag('drag-end', origin, cancelEvent, touch);
                this.dispatch('drag-end', current, dragMoveEvent);
            },
        };

        const target = current.getElement();
        this.touchDragger = startOneFingerTouch(GlobalCallbacks, this, dragCallbacks, initialTouch, target);

        const dragStartEvent = makeTouchDrag('drag-start', origin, initialEvent, initialTouch);
        this.dispatch('drag-start', current, dragStartEvent);
    }

    public dispatch<T extends Targetable, K extends EventType>(type: K, current: T, event: EventMap[K]): void {
        for (const handler of this.getListenerSet(type)) {
            handler(event, current);
        }
        this.dispatchCallback(type, event);
    }
}
