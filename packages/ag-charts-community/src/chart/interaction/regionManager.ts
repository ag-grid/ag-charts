import type { DOMManager } from '../../dom/domManager';
import { Debug } from '../../util/debug';
import { Listeners } from '../../util/listeners';
import type { Widget } from '../../widget/widget';
import type { DragWidgetEvent, MouseWidgetEvent, WheelWidgetEvent } from '../../widget/widgetEvents';
import { InteractionManager } from './interactionManager';
import type { PointerInteractionTypes } from './interactionManager';
import { InteractionState } from './interactionManager';
import { type PreventableEvent, buildPreventable } from './preventableEvent';

type RegionName = 'root' | 'series';
type RegionInteractionTypes = PointerInteractionTypes | 'drag-start' | 'drag' | 'drag-end';

export type RegionEvent<T extends RegionInteractionTypes = RegionInteractionTypes> = PreventableEvent & {
    type: T;
    region: RegionName;
    regionX: number;
    regionY: number;
    canvasX: number;
    canvasY: number;
    deltaX: T extends 'wheel' ? number : never;
    deltaY: T extends 'wheel' ? number : never;
    sourceEvent: Event;
    timestamp: number;
};

export type MockEvent = {
    target: HTMLElement;
    offsetX: number;
    offsetY: number;
    mockRegion?: Pick<RegionEvent, 'region' | 'canvasX' | 'canvasY' | 'regionX' | 'regionY'>;
};

type TWidgetEvent = DragWidgetEvent | MouseWidgetEvent | WheelWidgetEvent;

// This type-map allows the compiler to automatically figure out the parameter type of handlers
// specifies through the `addListener` method (see the `makeObserver` method).
type TypeInfo = { [K in RegionInteractionTypes]: RegionEvent<K> };

type RegionHandler = (event: RegionEvent) => void;

class RegionListeners extends Listeners<RegionEvent['type'], RegionHandler> {}

type Region = {
    readonly properties: RegionProperties;
    readonly listeners: RegionListeners;
};

export interface RegionProperties {
    readonly name: RegionName;
    widget?: Widget;
}

const DRAG_THRESHOLD_MS = 300;
const DRAG_THRESHOLD_PX = 3;

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
        if (current.classList.contains('ag-charts-tooltip')) {
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
    private readonly regions: { root: Region; series: Region } = {
        root: { properties: { name: 'root' }, listeners: new RegionListeners() },
        series: { properties: { name: 'series' }, listeners: new RegionListeners() },
    };
    private readonly destroyFns: (() => void)[] = [];
    private readonly allRegionsListeners = new RegionListeners();
    private deferredDragStart?: RegionEvent<'drag-start'>;
    private isDragMoving = false;
    private blockNextClickEvent = false;

    constructor(
        private readonly interactionManager: InteractionManager,
        domManager: DOMManager
    ) {
        this.initRegions(domManager.containerWidget, domManager.seriesWidget);
    }

    public destroy() {
        this.destroyFns.forEach((fn) => fn());
        this.current = undefined;
        this.regions.root.listeners.destroy();
        this.regions.series.listeners.destroy();
    }

    private initRegions(root: Widget, series: Widget) {
        this.regions.root.properties.widget = root;
        this.regions.series.properties.widget = series;
        const events = [
            'wheel',
            'contextmenu',
            'click',
            'dblclick',
            'mouseenter',
            'mousemove',
            'mouseleave',
            'drag-start',
            'drag-move',
            'drag-end',
        ] as const;

        for (const type of events) {
            root.addListener(type, this.processPointerEvent);
        }
        this.destroyFns.push(() => {
            for (const type of events) {
                root.removeListener(type, this.processPointerEvent);
            }
        });
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

    private computeEventOffsets(currentWidget: Widget, rootWidget: Widget, widgetEvent: TWidgetEvent) {
        const { deltaX, deltaY } = InteractionManager.getWheelDeltas(widgetEvent.sourceEvent);

        if ('mockRegion' in widgetEvent.sourceEvent) {
            const mockRegion = widgetEvent.sourceEvent.mockRegion as MockEvent['mockRegion'];
            if (mockRegion) {
                return { deltaX, deltaY, ...mockRegion };
            }
        }

        const rootRect = rootWidget.getElement().getBoundingClientRect();
        const currentWidgetRect = currentWidget.getElement().getBoundingClientRect();
        return {
            canvasX: widgetEvent.clientX - rootRect.x,
            canvasY: widgetEvent.clientY - rootRect.y,
            regionX: widgetEvent.clientX - currentWidgetRect.x,
            regionY: widgetEvent.clientY - currentWidgetRect.y,
            deltaX,
            deltaY,
        };
    }

    // Create and dispatch a copy of the InteractionEvent.
    private dispatch(current: Region | undefined, widgetEvent: TWidgetEvent, regionEventType?: 'leave' | 'enter') {
        const { widget: currentWidget } = current?.properties ?? {};
        const { widget: rootWidget } = this.regions.root.properties;
        if (current == null || currentWidget == null || rootWidget == null) return;

        const event: RegionEvent = buildPreventable({
            ...this.computeEventOffsets(currentWidget, rootWidget, widgetEvent),
            sourceEvent: widgetEvent.sourceEvent,
            type: this.widgetEventTypeToRegionEventType(widgetEvent, regionEventType),
            region: current.properties.name,
            timestamp: Date.now(),
        });

        switch (event.type) {
            case 'drag-start': {
                this.deferredDragStart = event as RegionEvent<'drag-start'>;
                break;
            }
            case 'drag': {
                if (this.deferredDragStart) {
                    if (this.canStartDrag(event as RegionEvent<'drag'>)) {
                        this.dispatchEvent(current, this.deferredDragStart);
                    } else {
                        return;
                    }
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
            case 'leave':
            case 'enter':
                if (!this.isDragMoving || this.deferredDragStart != null) {
                    this.dispatchEvent(current, event);
                }
                break;
            case 'hover': {
                this.blockNextClickEvent = false;
                this.dispatchEvent(current, event);
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

    private readonly processPointerEvent = (event: TWidgetEvent) => {
        const ignore = shouldIgnore(event);
        const { current } = this;

        let newCurrent: Region | undefined = current;
        if (!this.isDragMoving && this.deferredDragStart == null) {
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

    private pickRegion({ sourceEvent }: TWidgetEvent) {
        if ('mockRegion' in sourceEvent && sourceEvent.mockRegion) {
            return (sourceEvent.mockRegion as NonNullable<MockEvent['mockRegion']>).region === 'series'
                ? this.regions.series
                : this.regions.root;
        }
        if (sourceEvent.target == this.regions.root?.properties.widget?.getElement()) {
            return this.regions.root;
        }
        return this.regions.series;
    }

    private canStartDrag(event: RegionEvent<'drag'>) {
        if (!this.deferredDragStart) return false;

        const time = event.timestamp - this.deferredDragStart.timestamp;
        if (time > DRAG_THRESHOLD_MS) {
            return true;
        }

        const distanceApproximation =
            Math.abs(event.canvasX - this.deferredDragStart.canvasX) +
            Math.abs(event.canvasY - this.deferredDragStart.canvasY);
        return distanceApproximation > DRAG_THRESHOLD_PX;
    }
}
