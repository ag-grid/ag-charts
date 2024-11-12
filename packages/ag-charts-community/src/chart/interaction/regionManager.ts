import type { DragWidgetEvent, MouseWidgetEvent } from '../../module-support';
import { Debug } from '../../util/debug';
import { Listeners } from '../../util/listeners';
import type { Widget } from '../../widget/widget';
import type { InteractionManager, PointerInteractionEvent, PointerInteractionTypes } from './interactionManager';
import { DRAG_INTERACTION_TYPES, InteractionState } from './interactionManager';
import { buildPreventable } from './preventableEvent';

type RegionName = 'root' | 'series';

// This type-map allows the compiler to automatically figure out the parameter type of handlers
// specifies through the `addListener` method (see the `makeObserver` method).
type TypeInfo = { [K in PointerInteractionTypes]: PointerInteractionEvent<K> & RegionEventMixins };

type RegionEventMixins = {
    region: RegionName;
    bboxProviderId?: string;
    regionOffsetX: number;
    regionOffsetY: number;
};

export type RegionEvent<T extends PointerInteractionTypes = PointerInteractionTypes> = PointerInteractionEvent &
    RegionEventMixins & { type: T };
type RegionHandler = (event: RegionEvent) => void;

class RegionListeners extends Listeners<RegionEvent['type'], RegionHandler> {}

type Region = {
    readonly properties: RegionProperties;
    readonly listeners: RegionListeners;
};

export interface RegionProperties {
    readonly name: RegionName;
    readonly widget: Widget;
}

function addHandler<T extends RegionEvent['type']>(
    listeners: RegionListeners | undefined,
    interactionManager: InteractionManager,
    type: T,
    handler: (event: TypeInfo[T]) => void,
    triggeringStates: InteractionState = InteractionState.Default
): () => void {
    return (
        listeners?.addListener(type, (e: RegionEvent) => {
            const currentState = interactionManager.getState();
            if (currentState & triggeringStates) {
                handler(e as TypeInfo[T]);
            }
        }) ?? (() => {})
    );
}

function getTooltipContainer(target: EventTarget | null): HTMLElement | undefined {
    if (target == null || !(target instanceof HTMLElement)) return undefined;
    let current: HTMLElement | null = target;
    while (current != null && !current?.classList.contains('ag-charts-wrapper')) {
        if (current.classList.contains('ag-chart-tooltip')) {
            return current;
        }
        current = current.parentElement;
    }
    return undefined;
}

function shouldIgnore(event: MouseWidgetEvent | DragWidgetEvent): 'none' | 'leave' | 'wait' {
    const { type, sourceEvent } = event;
    const { className, classList, ariaHidden } = (event.sourceEvent?.target as HTMLElement) ?? {};
    if (className === 'ag-charts-proxy-elem' || !(classList instanceof DOMTokenList)) return 'leave';

    const dragTypes: readonly string[] = DRAG_INTERACTION_TYPES;
    if (
        // Handle drag event on the axis 'add horizontal line annotation' button as canvas events.
        (classList.contains('ag-charts-annotations__axis-button-icon') && !dragTypes.includes(type)) ||
        className === 'ag-charts-swapchain' ||
        className === 'ag-charts-canvas-proxy' ||
        sourceEvent?.target instanceof HTMLCanvasElement // This case is for nodeCanvas tests
    ) {
        return 'none';
    }

    // Ignore events on interactive tooltips, but don't fire a 'leave' event
    if (getTooltipContainer(sourceEvent.target) && ariaHidden !== 'true') {
        return 'wait';
    }

    return 'leave';
}

export class RegionManager {
    private readonly debug = Debug.create(true, 'region');

    private current?: Region;
    private readonly regions: { root?: Region; series?: Region } = {};
    private readonly destroyFns: (() => void)[] = [];
    private readonly allRegionsListeners = new RegionListeners();

    constructor(private readonly interactionManager: InteractionManager) {}

    public destroy() {
        this.destroyFns.forEach((fn) => fn());

        this.current = undefined;
        this.regions.root?.listeners.destroy();
        this.regions.series?.listeners.destroy();
        delete this.regions.root;
        delete this.regions.series;
    }

    private addRegion(name: RegionName, widget: Widget) {
        if (this.regions[name] !== undefined) {
            throw new Error(`AG Charts - Region: ${name} already exists`);
        }
        const region = { properties: { name, widget }, listeners: new RegionListeners() };
        this.regions[name] = region;
        widget.addListener('click', this.processPointerEvent);
        widget.addListener('dblclick', this.processPointerEvent);
        widget.addListener('mouseenter', this.processPointerEvent);
        widget.addListener('mousemove', this.processPointerEvent);
        widget.addListener('mouseleave', this.processPointerEvent);
        widget.addListener('drag-start', this.processPointerEvent);
        widget.addListener('drag-move', this.processPointerEvent);
        widget.addListener('drag-end', this.processPointerEvent);
        return this.makeObserver(region);
    }

    initRegions(root: Widget, series: Widget) {
        this.addRegion('root', root);
        this.addRegion('series', series);
    }

    getRegion(name: RegionName) {
        return this.makeObserver(this.regions[name]);
    }

    listenAll<T extends RegionEvent['type']>(
        type: T,
        handler: (event: TypeInfo[T]) => void,
        triggeringStates: InteractionState = InteractionState.Default
    ): () => void {
        return addHandler(this.allRegionsListeners, this.interactionManager, type, handler, triggeringStates);
    }

    // This method return a wrapper object that matches the interface of InteractionManager.addListener.
    // The intent is to allow the InteractionManager and RegionManager to be used almost interchangeably.
    private makeObserver(region: Region | undefined) {
        const { interactionManager } = this;
        class ObservableRegionImplementation {
            addListener<T extends RegionEvent['type']>(
                type: T,
                handler: (event: TypeInfo[T]) => void,
                triggeringStates: InteractionState = InteractionState.Default
            ): () => void {
                return addHandler(region?.listeners, interactionManager, type, handler, triggeringStates);
            }
        }
        return new ObservableRegionImplementation();
    }

    private widgetEventTypeToRegionEventType(
        widgetEvent: MouseWidgetEvent | DragWidgetEvent,
        regionEventType?: 'leave' | 'enter'
    ) {
        if (regionEventType !== undefined) return regionEventType;
        const map = {
            contextmenu: 'contextmenu',
            click: 'click',
            dblclick: 'dblclick',
            mouseenter: 'enter',
            mousemove: 'hover',
            mouseleave: 'leave',
            'drag-start': 'drag-start',
            'drag-move': 'drag',
            'drag-end': 'drag-end',
        } as const;
        return map[widgetEvent.type];
    }

    // Create and dispatch a copy of the InteractionEvent.
    private dispatch(
        current: Region | undefined,
        widgetEvent: MouseWidgetEvent | DragWidgetEvent,
        regionEventType?: 'leave' | 'enter'
    ) {
        if (current == null) return;

        const event: RegionEvent = buildPreventable({
            ...widgetEvent,
            type: this.widgetEventTypeToRegionEventType(widgetEvent, regionEventType),
            region: current.properties.name,
            pageX: NaN,
            pageY: NaN,
            deltaX: NaN,
            deltaY: NaN,
            button: 0,
            pointerHistory: [],
            regionOffsetX: widgetEvent.offsetX,
            regionOffsetY: widgetEvent.offsetY,
        });
        this.debug('Dispatching region event: ', event);
        this.allRegionsListeners.dispatch(event.type, event);
        current.listeners.dispatch(event.type, event);
    }

    private processPointerEvent = (target: Widget, event: MouseWidgetEvent | DragWidgetEvent) => {
        const ignore = shouldIgnore(event);
        const { current } = this;

        let newCurrent: Region | undefined;
        switch (ignore) {
            case 'wait':
                return;
            case 'none':
                newCurrent = this.pickRegion(target);
                break;
            case 'leave':
                newCurrent = undefined;
                break;
        }

        const newRegion = newCurrent;
        if (current !== undefined && newRegion?.properties.name !== current.properties.name) {
            this.dispatch(current, event, 'leave');
        }
        if (newRegion !== undefined && newRegion.properties.name !== current?.properties.name) {
            this.dispatch(newCurrent, event, 'enter');
        }
        if (newRegion !== undefined) {
            this.dispatch(newCurrent, event);
        }
        this.current = newCurrent;
    };

    private pickRegion(target: Widget) {
        if (target === this.regions.series?.properties.widget) {
            return this.regions.series;
        }
        if (target === this.regions.root?.properties.widget) {
            return this.regions.series;
        }
        return undefined;
    }
}
