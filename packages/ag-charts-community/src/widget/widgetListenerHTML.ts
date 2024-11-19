import { WidgetEventUtil } from './widgetEvents';
import type { WidgetEventMap_HTML, WidgetSourceEventMap_HTML } from './widgetEvents';

type EventMap = WidgetEventMap_HTML;
type EventType = keyof WidgetEventMap_HTML;
type SourceEventMap = WidgetSourceEventMap_HTML;
type TargetableWidget = { getElement(): HTMLElement };

type TypedMap<K extends EventType, TWidget extends TargetableWidget> = Map<
    (target: TWidget, widgetEvent: EventMap[K]) => unknown,
    (this: HTMLElement, sourceEvent: SourceEventMap[K]) => void
>;

export class WidgetListenerHTML<T extends TargetableWidget> {
    private readonly maps: { [K in EventType]?: TypedMap<K, T> } = {};

    private lazyGetMap<K extends EventType>(type: K): TypedMap<K, T> {
        let result = this.maps[type];
        if (result === undefined) {
            result = new Map();
            this.maps[type] = result;
        }
        return result;
    }

    add<K extends EventType>(type: K, target: T, handler: (target: T, event: EventMap[K]) => unknown): void {
        const map = this.lazyGetMap(type);
        if (map.has(handler)) throw new Error('AG Charts - duplicate add(handler)');

        const sourceHandler = (sourceEvent: SourceEventMap[K]): void => {
            const widgetEvent = WidgetEventUtil.alloc(type, sourceEvent);
            handler(target, widgetEvent);
        };
        target.getElement().addEventListener(type, sourceHandler);
        map.set(handler, sourceHandler);
    }

    remove<K extends EventType>(type: K, target: T, handler: (target: T, event: EventMap[K]) => unknown): void {
        const map = this.lazyGetMap(type);
        const sourceHandler = map.get(handler);
        if (sourceHandler) {
            target.getElement().removeEventListener(type, sourceHandler);
        }
        map.delete(handler);
    }

    destroy(target: T): void {
        for (const type of Object.keys(this.maps) as (keyof WidgetEventMap_HTML)[]) {
            this.typedDestroy(type, target);
        }
    }

    private typedDestroy<K extends EventType>(type: K, target: T): void {
        const map = this.maps[type];
        if (map == null) return;
        for (const [_widgetHandler, sourceHandler] of map.entries()) {
            target.getElement().removeEventListener(type, sourceHandler);
        }
    }
}
