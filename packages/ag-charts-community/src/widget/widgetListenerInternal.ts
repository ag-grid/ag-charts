import { getWindow } from '../util/dom';
import { partialAssign } from '../util/object';
import type { DragWidgetEvent, WidgetEventMap_Internal } from './widgetEvents';

type EventMap = WidgetEventMap_Internal;
type EventType = keyof WidgetEventMap_Internal;
type EventHandler<T, K extends EventType = EventType> = (target: T, event: EventMap[K]) => unknown;
type Targetable = { getElement(): HTMLElement };

type DragEvents = 'drag-start' | 'drag-move' | 'drag-end';
type DragOrigin = { pageX: number; pageY: number; offsetX: number; offsetY: number };
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

export class WidgetListenerInternal {
    private dragTriggerRemovers?: Map<EventHandler<Targetable>, () => void>;
    private dragStartListeners?: EventHandler<Targetable>[];
    private dragMoveListeners?: EventHandler<Targetable>[];
    private dragEndListeners?: EventHandler<Targetable>[];

    destroy(): void {
        this.dragTriggerRemovers?.forEach((fn) => fn());
        this.dragTriggerRemovers = undefined;
        this.dragStartListeners = undefined;
        this.dragMoveListeners = undefined;
        this.dragEndListeners = undefined;
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
                break;
            }
            case 'drag-end': {
                this.dragEndListeners ??= [];
                this.dragEndListeners.push(handler);
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
        const mouseDownHandler = (event: MouseEvent) => event.button === 0 && this.startDrag(target, event);

        target.getElement().addEventListener('mousedown', mouseDownHandler);
        this.dragTriggerRemovers ??= new Map();
        this.dragTriggerRemovers.set(handler, () =>
            target.getElement().removeEventListener('mousedown', mouseDownHandler)
        );
    }

    private startDrag<T extends Targetable>(target: T, downEvent: MouseEvent) {
        const window = getWindow();
        const origin: DragOrigin = { pageX: NaN, pageY: NaN, offsetX: NaN, offsetY: NaN };
        partialAssign(['pageX', 'pageY', 'offsetX', 'offsetY'], origin, downEvent);

        const mousemove = (moveEvent: MouseEvent) => {
            const dragMoveEvent = makeDragEvent('drag-move', origin, moveEvent);
            this.dispatch('drag-move', target, dragMoveEvent);
        };

        const mouseup = (upEvent: MouseEvent) => {
            if (upEvent.button === 0) {
                window.removeEventListener('mousemove', mousemove);
                window.removeEventListener('mouseup', mouseup);
                const dragEndEvent = makeDragEvent('drag-end', origin, upEvent);
                this.dispatch('drag-end', target, dragEndEvent);
            }
        };

        window.addEventListener('mousemove', mousemove);
        window.addEventListener('mouseup', mouseup);
        const dragStartEvent = makeDragEvent('drag-start', origin, downEvent);
        this.dispatch('drag-start', target, dragStartEvent);
    }

    private dispatch<T extends Targetable, K extends EventType>(type: K, target: T, event: EventMap[K]): void {
        switch (type) {
            case 'drag-start':
                return this.dragStartListeners?.forEach((handler) => handler(target, event));
            case 'drag-move':
                return this.dragMoveListeners?.forEach((handler) => handler(target, event));
            case 'drag-end':
                return this.dragEndListeners?.forEach((handler) => handler(target, event));
        }
    }
}
