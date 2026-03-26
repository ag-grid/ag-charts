import { entries } from 'ag-charts-core';

import type { WidgetEventMap_HTML, WidgetSourceEventMap_HTML } from './widgetEvents';
import { WidgetEventUtil } from './widgetEvents';

type EventMap = WidgetEventMap_HTML;
type EventType = keyof WidgetEventMap_HTML;
type SourceEventMap = WidgetSourceEventMap_HTML;
type Targetable = { getElement(): HTMLElement };
type Handler<T, K extends EventType> = (event: EventMap[K], current: T) => unknown;

type WidgetListener<K extends EventType> = (widgetEvent: EventMap[K], current: Targetable) => unknown;
type SourceListener<K extends EventType> = (this: HTMLElement, sourceEvent: SourceEventMap[K]) => void;

export class WidgetListenerHTML {
    private widgetListeners?: { [K in EventType]?: WidgetListener<EventType>[] } = {};
    private sourceListeners?: { [K in EventType]?: SourceListener<K> } = {};

    private initSourceHandler<K extends EventType>(type: K, handler: SourceListener<K>): void;
    private initSourceHandler<K extends EventType>(type: K, handler: (this: HTMLElement, event: unknown) => void) {
        this.sourceListeners ??= {};
        this.sourceListeners[type] = handler;
    }

    private lazyGetWidgetListeners<T extends Targetable, K extends EventType>(type: K, target: T): WidgetListener<K>[] {
        if (!(type in (this.sourceListeners ?? {}))) {
            const sourceHandler = (sourceEvent: SourceEventMap[K]): void => {
                const widgetEvent = WidgetEventUtil.alloc(type, sourceEvent, target.getElement());
                this.dispatch(type, target, widgetEvent);
            };
            const opts: AddEventListenerOptions = {};
            if (type.startsWith('touch') || type === 'wheel') {
                opts.passive = false;
            }
            this.initSourceHandler(type, sourceHandler);
            target.getElement().addEventListener(type, sourceHandler, opts);
        }
        this.widgetListeners ??= {};
        this.widgetListeners[type] ??= [];
        return this.widgetListeners[type] as NonNullable<(typeof this.widgetListeners)[K]>;
    }

    add<T extends Targetable, K extends EventType>(type: K, target: T, handler: Handler<T, K>): void;
    add<T extends Targetable, K extends EventType>(type: K, target: T, handler: Handler<unknown, K>): void {
        const listeners = this.lazyGetWidgetListeners(type, target);
        listeners.push(handler);
    }

    remove<T extends Targetable, K extends EventType>(type: K, target: T, handler: Handler<T, K>): void;
    remove<T extends Targetable, K extends EventType>(type: K, target: T, handler: Handler<unknown, K>): void {
        const listeners = this.lazyGetWidgetListeners(type, target);
        const index = listeners.indexOf(handler);
        if (index > -1) listeners.splice(index, 1);
    }

    destroy<T extends Targetable>(target: T): void {
        this.widgetListeners = undefined;
        if (this.sourceListeners) {
            for (const [key, sourceHandler] of entries(this.sourceListeners)) {
                target.getElement().removeEventListener(key, sourceHandler as any);
            }
            this.sourceListeners = undefined;
        }
    }

    dispatch<T extends Targetable, K extends EventType>(type: K, target: T, event: EventMap[K]): void {
        for (const widgetListener of this.widgetListeners?.[type] ?? []) {
            widgetListener(event, target);
        }
    }
}
