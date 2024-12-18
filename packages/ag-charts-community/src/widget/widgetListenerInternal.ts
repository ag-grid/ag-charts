import { BBoxValues } from '../util/bboxinterface';
import { getWindow } from '../util/dom';
import { partialAssign } from '../util/object';
import type { DragWidgetEvent, WidgetEventMap_Internal } from './widgetEvents';

type EventMap = WidgetEventMap_Internal;
type EventType = keyof WidgetEventMap_Internal;
type EventHandler<T, K extends EventType = EventType> = (event: EventMap[K], current: T) => unknown;
type Targetable = { getElement(): HTMLElement };

type DragEvents = 'drag-start' | 'drag-move' | 'drag-end';
type DragOrigin = { pageX: number; pageY: number; offsetX: number; offsetY: number };

type DragCallbacks = {
    down: (event: MouseEvent) => void;
    move: (event: MouseEvent) => void;
    up: (event: MouseEvent) => void;
};

function makeDragEvent<K extends DragEvents>(type: K, origin: DragOrigin, sourceEvent: MouseEvent): DragWidgetEvent<K> {
    // [offsetX, offsetY] is relative to the sourceEvent.target, which can be another element
    // such as a legend button. Therefore, calculate [offsetX, offsetY] relative to the axis
    // element that fired the 'mousedown' event.
    const originDeltaX = sourceEvent.pageX - origin.pageX;
    const originDeltaY = sourceEvent.pageY - origin.pageY;
    return {
        type,
        offsetX: origin.offsetX + originDeltaX,
        offsetY: origin.offsetY + originDeltaY,
        clientX: sourceEvent.clientX,
        clientY: sourceEvent.clientY,
        originDeltaX,
        originDeltaY,
        sourceEvent,
    };
}

function startDrag(that: { globalDragCallbacks?: DragCallbacks }, myCallbacks: DragCallbacks, downEvent: MouseEvent) {
    if (that.globalDragCallbacks != null) return;

    const window = getWindow();

    const mousegeneral = (generalEvent: MouseEvent) => {
        generalEvent.stopPropagation();
        generalEvent.stopImmediatePropagation();
    };

    const mousemove = (moveEvent: MouseEvent) => {
        moveEvent.stopPropagation();
        moveEvent.stopImmediatePropagation();
        that.globalDragCallbacks?.move(moveEvent);
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
            that.globalDragCallbacks?.up(upEvent);
            that.globalDragCallbacks = undefined;
        }
    };

    window.addEventListener('mousedown', mousegeneral, { capture: true });
    window.addEventListener('mouseenter', mousegeneral, { capture: true });
    window.addEventListener('mouseleave', mousegeneral, { capture: true });
    window.addEventListener('mouseout', mousegeneral, { capture: true });
    window.addEventListener('mouseover', mousegeneral, { capture: true });
    window.addEventListener('mousemove', mousemove, { capture: true });
    window.addEventListener('mouseup', mouseup, { capture: true });
    that.globalDragCallbacks = myCallbacks;
    that.globalDragCallbacks.down(downEvent);
}

export class WidgetListenerInternal {
    private dragTriggerRemovers?: Map<EventHandler<Targetable>, () => void>;
    private dragStartListeners?: EventHandler<Targetable>[];
    private dragMoveListeners?: EventHandler<Targetable>[];
    private dragEndListeners?: EventHandler<Targetable>[];
    // The 'mousedown' event get fired on the target DOM element and all its ancestors that have 'mousedown' event
    // listeners. However, we only want 1 DOM element to handle the dragging operation because doing so involves adding
    // temporary capture event listeners to the global `window` object. Therefore, this property much be static.
    //
    // As a consequence, the widget `'drag-*'` events do not support propagation; but that's sufficient for us because we do
    // not yet have a use-case when propagation is needed for drag events.
    static globalDragCallbacks?: DragCallbacks;
    private localDragCallbacks?: DragCallbacks;

    destroy(): void {
        this.dragTriggerRemovers?.forEach((fn) => fn());
        this.dragTriggerRemovers = undefined;
        this.dragStartListeners = undefined;
        this.dragMoveListeners = undefined;
        this.dragEndListeners = undefined;
        if (WidgetListenerInternal.globalDragCallbacks === this.localDragCallbacks) {
            WidgetListenerInternal.globalDragCallbacks = undefined;
        }
    }

    add<T extends Targetable, K extends EventType>(type: K, target: T, handler: EventHandler<T, K>): void;
    add<T extends Targetable, K extends EventType>(type: K, target: T, handler: EventHandler<unknown>): void {
        switch (type) {
            case 'drag-start': {
                this.dragStartListeners ??= [];
                this.dragStartListeners.push(handler);
                this.registerDragTrigger(target, handler);
                break;
            }
            case 'drag-move': {
                this.dragMoveListeners ??= [];
                this.dragMoveListeners.push(handler);
                this.registerDragTrigger(target, handler);
                break;
            }
            case 'drag-end': {
                this.dragEndListeners ??= [];
                this.dragEndListeners.push(handler);
                this.registerDragTrigger(target, handler);
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

    private registerDragTrigger<T extends Targetable>(target: T, handler: EventHandler<unknown>) {
        if (this.dragTriggerRemovers == null) {
            const mouseDownHandler = (event: MouseEvent) => event.button === 0 && this.startDrag(target, event);

            target.getElement().addEventListener('mousedown', mouseDownHandler);
            this.dragTriggerRemovers = new Map();
            this.dragTriggerRemovers.set(handler, () =>
                target.getElement().removeEventListener('mousedown', mouseDownHandler)
            );
        }
    }

    private startDrag<T extends Targetable>(current: T, initialDownEvent: MouseEvent) {
        const origin: DragOrigin = { pageX: NaN, pageY: NaN, offsetX: NaN, offsetY: NaN };
        partialAssign(['pageX', 'pageY', 'offsetX', 'offsetY'], origin, initialDownEvent);

        const dragCallbacks: DragCallbacks = {
            down: (downEvent: MouseEvent) => {
                this.localDragCallbacks = dragCallbacks;
                const dragStartEvent = makeDragEvent('drag-start', origin, downEvent);
                this.dispatch('drag-start', current, dragStartEvent);
            },
            move: (moveEvent: MouseEvent) => {
                const dragMoveEvent = makeDragEvent('drag-move', origin, moveEvent);
                this.dispatch('drag-move', current, dragMoveEvent);
            },
            up: (upEvent: MouseEvent) => {
                const dragEndEvent = makeDragEvent('drag-end', origin, upEvent);
                this.dispatch('drag-end', current, dragEndEvent);
                this.endDrag(current, dragEndEvent);
            },
        };

        startDrag(WidgetListenerInternal, dragCallbacks, initialDownEvent);
    }

    private endDrag(target: Targetable, { sourceEvent, clientX, clientY }: DragWidgetEvent<'drag-end'>) {
        const elem = target.getElement();
        const rect = elem.getBoundingClientRect();
        if (!BBoxValues.containsPoint(rect, clientX, clientY)) {
            elem.dispatchEvent(new MouseEvent('mouseleave', sourceEvent));
            sourceEvent.target?.dispatchEvent(new MouseEvent('mouseenter', sourceEvent));
        }
    }

    private dispatch<T extends Targetable, K extends EventType>(type: K, current: T, event: EventMap[K]): void {
        switch (type) {
            case 'drag-start':
                return this.dragStartListeners?.forEach((handler) => handler(event, current));
            case 'drag-move':
                return this.dragMoveListeners?.forEach((handler) => handler(event, current));
            case 'drag-end':
                return this.dragEndListeners?.forEach((handler) => handler(event, current));
        }
    }
}
