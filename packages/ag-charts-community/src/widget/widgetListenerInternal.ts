import { type AnyFn, CleanupRegistry, attachListener, boxContains, partialAssign } from 'ag-charts-core';

import { type MouseDragCallbacks, type MouseDragger, startMouseDrag } from './mouseDragger';
import { type TouchDragCallbacks, type TouchDragger, startOneFingerTouch } from './touchDragger';
import { type DragWidgetEvent, type WidgetEventMap_Internal, WidgetEventUtil } from './widgetEvents';

type EventMap = WidgetEventMap_Internal;
type EventType = keyof WidgetEventMap_Internal;
type EventHandler<T, K extends EventType = EventType> = (event: EventMap[K], current: T) => unknown;
type Targetable = { getElement(): HTMLElement };

type DragEvents = 'drag-start' | 'drag-move' | 'drag-end';
type DragOrigin = { pageX: number; pageY: number; offsetX: number; offsetY: number };

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

function getTouchOffsets(current: Targetable, { pageX, pageY }: Touch): { offsetX: number; offsetY: number } {
    const { x, y } = current.getElement().getBoundingClientRect();
    return { offsetX: pageX - x, offsetY: pageY - y };
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
            this.startMouseDrag(current, downEvent);
        }
    }

    private startMouseDrag<T extends Targetable>(current: T, initialDownEvent: MouseEvent) {
        const origin: DragOrigin = { pageX: Number.NaN, pageY: Number.NaN, offsetX: Number.NaN, offsetY: Number.NaN };
        partialAssign(['pageX', 'pageY', 'offsetX', 'offsetY'], origin, initialDownEvent);

        const dragCallbacks: MouseDragCallbacks = {
            mousedown: (downEvent: MouseEvent) => {
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
        const origin: DragOrigin = { pageX: Number.NaN, pageY: Number.NaN, ...getTouchOffsets(current, initialTouch) };
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

        const target = current.getElement();
        this.touchDragger = startOneFingerTouch(GlobalCallbacks, this, dragCallbacks, initialTouch, target);

        const dragStartEvent = makeTouchDrag(current, 'drag-start', origin, initialEvent, initialTouch);
        this.dispatch('drag-start', current, dragStartEvent);
    }

    public dispatch<T extends Targetable, K extends EventType>(type: K, current: T, event: EventMap[K]): void {
        for (const handler of this.getListenerSet(type)) {
            handler(event, current);
        }
        this.dispatchCallback(type, event);
    }
}
