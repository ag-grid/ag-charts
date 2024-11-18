import { Debug } from '../../util/debug';
import { Listeners } from '../../util/listeners';
import type { Widget } from '../../widget/widget';
import type { DragWidgetEvent, MouseWidgetEvent, WheelWidgetEvent } from '../../widget/widgetEvents';
import { InteractionManager } from './interactionManager';
import type { PointerInteractionTypes } from './interactionManager';
import { InteractionState } from './interactionManager';
import { type PreventableEvent, buildPreventable } from './preventableEvent';

type RegionName = 'root' | 'series';

export type RegionEvent<T extends PointerInteractionTypes = PointerInteractionTypes> = PreventableEvent & {
    type: T;
    region: RegionName;
    regionX: number;
    regionY: number;
    canvasX: number;
    canvasY: number;
    deltaX: T extends 'wheel' ? number : never;
    deltaY: T extends 'wheel' ? number : never;
    sourceEvent: Event;
};

type TWidgetEvent = DragWidgetEvent | MouseWidgetEvent | WheelWidgetEvent;

// This type-map allows the compiler to automatically figure out the parameter type of handlers
// specifies through the `addListener` method (see the `makeObserver` method).
type TypeInfo = { [K in PointerInteractionTypes]: RegionEvent<K> };

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

export type MockRegionEvent = Pick<RegionEvent, 'region' | 'canvasX' | 'canvasY' | 'regionX' | 'regionY'>;

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

function shouldIgnore(event: TWidgetEvent): 'none' | 'leave' | 'wait' {
    const { sourceEvent } = event;
    const { className, classList, ariaHidden } = (event.sourceEvent?.target as HTMLElement) ?? {};
    if (className === 'ag-charts-proxy-elem' || !(classList instanceof DOMTokenList)) return 'leave';

    if (
        // Handle drag event on the axis 'add horizontal line annotation' button as canvas events.
        classList.contains('ag-charts-annotations__axis-button-icon') ||
        className === 'ag-charts-swapchain' ||
        className === 'ag-charts-canvas-container' ||
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
    private deferredDragStart?: RegionEvent<'drag-start'>;
    private isDragMoving = false;
    private blockNextClickEvent = false;

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
        return this.makeObserver(region);
    }

    initRegions(root: Widget, series: Widget) {
        this.addRegion('root', root);
        this.addRegion('series', series);
        root.addListener('wheel', this.processPointerEvent);
        root.addListener('contextmenu', this.processPointerEvent);
        root.addListener('click', this.processPointerEvent);
        root.addListener('dblclick', this.processPointerEvent);
        root.addListener('mouseenter', this.processPointerEvent);
        root.addListener('mousemove', this.processPointerEvent);
        root.addListener('mouseleave', this.processPointerEvent);
        root.addListener('drag-start', this.processPointerEvent);
        root.addListener('drag-move', this.processPointerEvent);
        root.addListener('drag-end', this.processPointerEvent);
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

    private widgetEventTypeToRegionEventType(widgetEvent: TWidgetEvent, regionEventType?: 'leave' | 'enter') {
        if (regionEventType !== undefined) return regionEventType;
        const map = {
            contextmenu: 'contextmenu',
            click: 'click',
            dblclick: 'dblclick',
            mouseenter: 'enter',
            mousemove: 'hover',
            mouseleave: 'leave',
            wheel: 'wheel',
            'drag-start': 'drag-start',
            'drag-move': 'drag',
            'drag-end': 'drag-end',
        } as const;
        return map[widgetEvent.type];
    }

    private computeEventOffsets(current: Region, widget: Widget, widgetEvent: TWidgetEvent) {
        const { deltaX, deltaY } = InteractionManager.getWheelDeltas(widgetEvent.sourceEvent);

        if ('mockRegion' in widgetEvent.sourceEvent) {
            const mockRegion = widgetEvent.sourceEvent.mockRegion as MockRegionEvent;
            return { deltaX, deltaY, ...mockRegion };
        }

        const widgetRect = widget.getElement().getBoundingClientRect();
        const currentWidgetRect = current.properties.widget.getElement().getBoundingClientRect();
        return {
            canvasX: widgetEvent.clientX - widgetRect.x,
            canvasY: widgetEvent.clientY - widgetRect.y,
            regionX: widgetEvent.clientX - currentWidgetRect.x,
            regionY: widgetEvent.clientY - currentWidgetRect.y,
            deltaX,
            deltaY,
        };
    }

    // Create and dispatch a copy of the InteractionEvent.
    private dispatch(
        current: Region | undefined,
        widget: Widget,
        widgetEvent: TWidgetEvent,
        regionEventType?: 'leave' | 'enter'
    ) {
        if (current == null) return;

        const event: RegionEvent = buildPreventable({
            ...this.computeEventOffsets(current, widget, widgetEvent),
            sourceEvent: widgetEvent.sourceEvent,
            type: this.widgetEventTypeToRegionEventType(widgetEvent, regionEventType),
            region: current.properties.name,
        });

        switch (event.type) {
            case 'drag-start': {
                this.deferredDragStart = event as RegionEvent<'drag-start'>;
                break;
            }
            case 'drag': {
                if (this.deferredDragStart) {
                    this.dispatchEvent(current, this.deferredDragStart);
                }
                this.dispatchEvent(current, event);
                this.deferredDragStart = undefined;
                this.isDragMoving = true;
                this.blockNextClickEvent = true;
                break;
            }
            case 'drag-end': {
                if (this.isDragMoving) {
                    this.dispatchEvent(current, event);
                }
                this.deferredDragStart = undefined;
                this.isDragMoving = false;
                break;
            }
            case 'click': {
                if (!this.blockNextClickEvent) {
                    this.dispatchEvent(current, event);
                }
                this.blockNextClickEvent = false;
                break;
            }
            case 'hover': {
                if (!this.isDragMoving) {
                    this.dispatchEvent(current, event);
                    this.blockNextClickEvent = false;
                }
                break;
            }
            default: {
                this.dispatchEvent(current, event);
                break;
            }
        }
    }

    private dispatchEvent(current: Region, event: RegionEvent) {
        this.debug('Dispatching region event: ', event);
        this.allRegionsListeners.dispatch(event.type, event);
        current.listeners.dispatch(event.type, event);
    }

    private readonly processPointerEvent = (widget: Widget, event: TWidgetEvent) => {
        const ignore = shouldIgnore(event);
        const { current } = this;

        let newCurrent: Region | undefined;
        switch (ignore) {
            case 'wait':
                return;
            case 'none':
                newCurrent = this.pickRegion(event);
                break;
            case 'leave':
                newCurrent = undefined;
                break;
        }

        const newRegion = newCurrent;
        if (current !== undefined && newRegion?.properties.name !== current.properties.name) {
            this.dispatch(current, widget, event, 'leave');
        }
        if (newRegion !== undefined && newRegion.properties.name !== current?.properties.name) {
            this.dispatch(newCurrent, widget, event, 'enter');
        }
        if (newRegion !== undefined) {
            this.dispatch(newCurrent, widget, event);
        }
        this.current = newCurrent;
    };

    private pickRegion(event: TWidgetEvent) {
        if ('mockRegion' in event.sourceEvent) {
            return (event.sourceEvent.mockRegion as MockRegionEvent).region === 'series'
                ? this.regions.series
                : this.regions.root;
        }
        if (event.sourceEvent.target == this.regions.root?.properties.widget.getElement()) {
            return this.regions.root;
        }
        return this.regions.series;
    }
}
