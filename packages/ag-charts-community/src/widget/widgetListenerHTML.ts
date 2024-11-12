import { WidgetEventUtil } from './widgetEvents';
import type { WidgetEventMap_HTML, WidgetSourceEventMap_HTML } from './widgetEvents';

type EventMap = WidgetEventMap_HTML;
type EventType = keyof WidgetEventMap_HTML;
type SourceEventMap = WidgetSourceEventMap_HTML;
type Targetable = { getElement(): HTMLElement };
type Handler<T, K extends EventType> = (target: T, event: EventMap[K]) => unknown;

type TypedMap<K extends EventType> = Map<
    (target: Targetable, widgetEvent: EventMap[K]) => unknown,
    (this: HTMLElement, sourceEvent: SourceEventMap[K]) => void
>;

export class WidgetListenerHTML {
    private readonly maps: { [K in EventType]?: TypedMap<K> } = {};

    private lazyGetMap<K extends EventType>(type: K): TypedMap<K> {
        let result = this.maps[type];
        if (result === undefined) {
            result = new Map();
            this.maps[type] = result;
        }
        return result;
    }

    add<T extends Targetable, K extends EventType>(type: K, target: T, handler: Handler<T, K>): void;
    add<T extends Targetable, K extends EventType>(type: K, target: T, handler: Handler<unknown, K>): void {
        const map = this.lazyGetMap(type);
        if (map.has(handler)) throw new Error('AG Charts - duplicate add(handler)');

        const sourceHandler = (sourceEvent: SourceEventMap[K]): void => {
            const widgetEvent = WidgetEventUtil.alloc(type, sourceEvent);
            handler(target, widgetEvent);
        };
        target.getElement().addEventListener(type, sourceHandler);
        map.set(handler, sourceHandler);
    }

    remove<T extends Targetable, K extends EventType>(type: K, target: T, handler: Handler<T, K>): void;
    remove<T extends Targetable, K extends EventType>(type: K, target: T, handler: Handler<unknown, K>): void {
        const map = this.lazyGetMap(type);
        const sourceHandler = map.get(handler);
        if (sourceHandler) {
            target.getElement().removeEventListener(type, sourceHandler);
        }
        map.delete(handler);
    }

    destroy<T extends Targetable>(target: T): void {
        for (const type of Object.keys(this.maps) as EventType[]) {
            this.typedDestroy(type, target);
        }
    }

    private typedDestroy<T extends Targetable, K extends EventType>(type: K, target: T): void {
        const map = this.maps[type];
        if (map == null) return;
        for (const [_widgetHandler, sourceHandler] of map.entries()) {
            target.getElement().removeEventListener(type, sourceHandler);
        }
    }
}
