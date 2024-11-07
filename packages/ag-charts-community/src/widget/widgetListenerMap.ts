import { WidgetEvent, type WidgetEventMap } from './widgetEvents';

type TargetableWidget = { getElement(): HTMLElement };

type TypedMap<K extends keyof WidgetEventMap & keyof HTMLElementEventMap, TWidget extends TargetableWidget> = Map<
    (target: TWidget, widgetEvent: WidgetEventMap[K]) => unknown,
    (this: HTMLElement, sourceEvent: HTMLElementEventMap[K]) => void
>;

export class WidgetListenerMap<TWidget extends TargetableWidget> {
    private readonly maps: { [K in keyof WidgetEventMap]?: TypedMap<K, TWidget> } = {};

    private lazyGetMap<K extends keyof WidgetEventMap>(type: K): TypedMap<K, TWidget> {
        let result = this.maps[type];
        if (result === undefined) {
            result = new Map();
            this.maps[type] = result;
        }
        return result;
    }

    add<K extends keyof WidgetEventMap>(
        type: K,
        target: TWidget,
        widgetHandler: (target: TWidget, widgetEvent: WidgetEventMap[K]) => unknown
    ): void {
        const map = this.lazyGetMap(type);
        if (map.has(widgetHandler)) throw new Error('AG Charts - duplicate add(handler)');

        const sourceHandler = (sourceEvent: HTMLElementEventMap[K]): void => {
            const widgetEvent = WidgetEvent.alloc(type, sourceEvent);
            widgetHandler(target, widgetEvent);
        };
        target.getElement().addEventListener(type, sourceHandler);
        map.set(widgetHandler, sourceHandler);
    }

    remove<K extends keyof WidgetEventMap>(
        type: K,
        target: TWidget,
        widgetHandler: (target: TWidget, widgetEvent: WidgetEventMap[K]) => unknown
    ): void {
        const map = this.lazyGetMap(type);
        const sourceHandler = map.get(widgetHandler);
        if (sourceHandler) {
            target.getElement().removeEventListener(type, sourceHandler);
        }
        map.delete(widgetHandler);
    }

    destroy(target: TWidget): void {
        for (const type of Object.keys(this.maps) as (keyof WidgetEventMap)[]) {
            this.typedDestroy(type, target);
        }
    }

    private typedDestroy<K extends keyof WidgetEventMap>(type: K, target: TWidget): void {
        const map = this.maps[type];
        if (map == null) return;
        for (const [_widgetHandler, sourceHandler] of map.entries()) {
            target.getElement().removeEventListener(type, sourceHandler);
        }
    }
}
