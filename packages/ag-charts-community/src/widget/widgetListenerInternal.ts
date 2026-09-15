import type { AnyFn, CurrentPoint, OffsetPoint, PagePoint } from 'ag-charts-core';
import { attachListener, partialAssign } from 'ag-charts-core';

import type { DragWidgetEvent, WidgetEventMap_Internal } from './widgetEvents';
import { WidgetEventUtil } from './widgetEvents';

type EventMap = WidgetEventMap_Internal;
type EventType = keyof WidgetEventMap_Internal;
type EventHandler<T, K extends EventType = EventType> = (event: EventMap[K], current: T) => unknown;
type Targetable = { getElement(): HTMLElement };

type DragEvents = 'drag-start' | 'drag-move' | 'drag-end';
type DragOrigin = CurrentPoint & OffsetPoint & PagePoint;
function makeDrag<K extends DragEvents>(type: K, origin: DragOrigin, sourceEvent: PointerEvent): DragWidgetEvent<K> {
    // sourceEvent's [offsetX, offsetY] is relative to its own target (which may be e.g. a legend
    // button), so re-base it on the element that fired the 'mousedown'.
    const originDeltaX = sourceEvent.pageX - origin.pageX;
    const originDeltaY = sourceEvent.pageY - origin.pageY;

    // FIXME: dragging an axis moves its tick labels, which resizes the axis element and makes the drag
    // twitch. Measure against the pre-resize origin instead of the live element bounds.
    const currentX = origin.currentX + originDeltaX;
    const currentY = origin.currentY + originDeltaY;

    // https://developer.mozilla.org/en-US/docs/Web/API/PointerEvent/pointerType
    type PointerType = 'mouse' | 'touch' | 'pen';
    return {
        type,
        device: sourceEvent.pointerType as PointerType,
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

export class WidgetListenerInternal {
    public dragTouchEnabled = true;
    private dragTriggerRemover?: () => void;
    private listeners?: Map<EventType, Set<AnyFn>>;

    constructor(private readonly dispatchCallback: (type: EventType, event: EventMap[EventType]) => void) {}

    destroy(): void {
        this.dragTriggerRemover?.();
        this.dragTriggerRemover = undefined;
        this.listeners?.clear();
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
            this.dragTriggerRemover = attachListener(element, 'pointerdown', (event: PointerEvent) =>
                this.onPointerDown(target, event)
            );
        }
    }

    private onPointerDown<T extends Targetable>(current: T, downEvent: PointerEvent) {
        if (downEvent.button === 0 || downEvent.pointerType !== 'mouse') {
            this.startPointerDrag(current, downEvent);
        }
    }

    private startPointerDrag<T extends Targetable>(current: T, downEvent: PointerEvent) {
        const elem = current.getElement();
        // setPointerCapture prevents click events on descendant elements.
        // Therefore, only capture the pointer when we are on-target:
        if (elem !== downEvent.target) return;

        const { currentX, currentY } = WidgetEventUtil.calcCurrentXY(current.getElement(), downEvent);
        const origin: DragOrigin = {
            pageX: Number.NaN,
            pageY: Number.NaN,
            offsetX: Number.NaN,
            offsetY: Number.NaN,
            currentX,
            currentY,
        };
        partialAssign(['pageX', 'pageY', 'offsetX', 'offsetY'], origin, downEvent);

        elem.setPointerCapture(downEvent.pointerId);
        const onPointerMove = (moveEvent: PointerEvent) => {
            if (moveEvent.pointerId !== downEvent.pointerId) return;
            const dragMoveEvent = makeDrag('drag-move', origin, moveEvent);
            this.dispatch('drag-move', current, dragMoveEvent);
        };
        const onPointerUp = (upEvent: PointerEvent) => {
            if (upEvent.pointerId !== downEvent.pointerId) return;
            if (downEvent.pointerType === 'mouse' && downEvent.button !== 0) return;
            elem.removeEventListener('pointermove', onPointerMove);
            elem.removeEventListener('pointerup', onPointerUp);
            elem.removeEventListener('lostpointercapture', onPointerUp);
            const dragEndEvent = makeDrag('drag-end', origin, upEvent);
            this.dispatch('drag-end', current, dragEndEvent);
            elem.releasePointerCapture(upEvent.pointerId);
        };
        elem.addEventListener('pointermove', onPointerMove);
        elem.addEventListener('pointerup', onPointerUp);
        elem.addEventListener('lostpointercapture', onPointerUp);

        const dragStartEvent = makeDrag('drag-start', origin, downEvent);
        this.dispatch('drag-start', current, dragStartEvent);
    }

    public dispatch<T extends Targetable, K extends EventType>(type: K, current: T, event: EventMap[K]): void {
        for (const handler of this.getListenerSet(type)) {
            handler(event, current);
        }
        this.dispatchCallback(type, event);
    }
}
