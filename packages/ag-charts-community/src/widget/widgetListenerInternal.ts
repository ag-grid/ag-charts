import { isNever } from 'ag-charts-core';

import { BBoxValues } from '../util/bboxinterface';
import { partialAssign } from '../util/object';
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
    private dragStartListeners?: EventHandler<Targetable>[];
    private dragMoveListeners?: EventHandler<Targetable>[];
    private dragEndListeners?: EventHandler<Targetable>[];
    public mouseDragger?: MouseDragger;
    public touchDragger?: TouchDragger;

    constructor(private readonly dispatchCallback: (type: EventType, event: EventMap[EventType]) => void) {}

    destroy(): void {
        this.dragTriggerRemover?.();
        this.dragTriggerRemover = undefined;
        this.dragStartListeners = undefined;
        this.dragMoveListeners = undefined;
        this.dragEndListeners = undefined;
        this.mouseDragger?.destroy();
        this.touchDragger?.destroy();
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
            default:
                isNever(type);
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
            default:
                isNever(type);
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
        if (!BBoxValues.containsPoint(rect, clientX, clientY)) {
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

        const target = current.getElement();
        this.touchDragger = startOneFingerTouch(GlobalCallbacks, this, dragCallbacks, initialTouch, target);

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
            default:
                isNever(type);
        }

        this.dispatchCallback(type, event);
    }
}
