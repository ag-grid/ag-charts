import { Node } from '../../scene/node';
import type { BBoxProvider } from '../../util/bboxinterface';
import { Debug } from '../../util/debug';
import { Listeners } from '../../util/listeners';
import type { InteractionManager, PointerInteractionEvent, PointerInteractionTypes } from './interactionManager';
import { DRAG_INTERACTION_TYPES, InteractionState, POINTER_INTERACTION_TYPES } from './interactionManager';
import { type Unpreventable, buildPreventable } from './preventableEvent';
import { NodeRegionBBoxProvider, type RegionBBoxProvider, type RegionName } from './regions';

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
    bboxproviders: RegionBBoxProvider[];
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

type RegionNodeType = NodeRegionBBoxProvider | Node | { id: string; node: Node };

function nodeToBBoxProvider(node: RegionNodeType) {
    if (node instanceof Node) {
        return new NodeRegionBBoxProvider(node);
    }
    if (node instanceof NodeRegionBBoxProvider) {
        return node;
    }

    return new NodeRegionBBoxProvider(node.node, node.id);
}

type EventTargetUpcast<K extends keyof HTMLElement> = EventTarget & { [P in K]?: unknown };
function shouldIgnore({
    type,
    sourceEvent,
}: {
    type: string;
    sourceEvent: { target: EventTargetUpcast<'id' | 'className' | 'classList'> | null };
}) {
    const { id, className, classList } = sourceEvent?.target ?? {};
    if (classList instanceof DOMTokenList && classList.contains('ag-charts-annotations__axis-button-icon')) {
        return DRAG_INTERACTION_TYPES.some((t) => t === type);
    }
    return (
        sourceEvent?.target != null && // This case is for pointerHistory events.
        className !== 'ag-charts-series-area' &&
        className !== 'ag-charts-canvas-proxy' &&
        !(className === 'ag-charts-proxy-elem' && !id?.toString().startsWith('ag-charts-legend-item-')) &&
        !(sourceEvent?.target instanceof HTMLCanvasElement) // This case is for nodeCanvas tests
    );
}

export class RegionManager {
    private readonly debug = Debug.create(true, 'region');

    private current?: { region: Region; bboxProvider?: BBoxProvider };
    private isDragging = false;
    private leftCanvas = false;

    private readonly regions: Map<RegionName, Region> = new Map();
    private readonly destroyFns: (() => void)[] = [];
    private readonly allRegionsListeners = new RegionListeners();

    constructor(private readonly interactionManager: InteractionManager) {
        this.destroyFns.push(
            ...POINTER_INTERACTION_TYPES.map((eventName) =>
                interactionManager.addListener(eventName, this.processPointerEvent.bind(this), InteractionState.All)
            )
        );
    }

    public destroy() {
        this.destroyFns.forEach((fn) => fn());

        this.current = undefined;
        for (const region of this.regions.values()) {
            region.listeners.destroy();
        }

        this.regions.clear();
    }

    public addRegion(name: RegionName, ...nodes: RegionNodeType[]) {
        if (this.regions.has(name)) {
            throw new Error(`AG Charts - Region: ${name} already exists`);
        }
        const region = {
            properties: { name, bboxproviders: nodes.map(nodeToBBoxProvider) },
            listeners: new RegionListeners(),
        };
        this.regions.set(name, region);
        return this.makeObserver(region);
    }

    public updateRegion(name: RegionName, ...nodes: RegionNodeType[]) {
        const region = this.regions.get(name);
        if (region) {
            region.properties.bboxproviders = nodes.map(nodeToBBoxProvider);
        } else {
            throw new Error('AG Charts - unknown region: ' + name);
        }
    }

    public getRegion(name: RegionName) {
        return this.makeObserver(this.regions.get(name));
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

    private checkPointerHistory(targetRegion: Region, event: PointerInteractionEvent): boolean {
        for (const historyEvent of event.pointerHistory) {
            const { region: historyRegion } = this.pickRegion(historyEvent.offsetX, historyEvent.offsetY, event) ?? {};
            if (targetRegion.properties.name !== historyRegion?.properties.name) {
                return false;
            }
        }
        return true;
    }

    // Create and dispatch a copy of the InteractionEvent.
    private dispatch(
        current: { region: Region; bboxProvider?: BBoxProvider } | undefined,
        partialEvent: Unpreventable<PointerInteractionEvent>
    ) {
        if (current == null) return;

        const mainBBoxProvider = current.region.properties.bboxproviders[0];
        let regionOffsetX = 0;
        let regionOffsetY = 0;
        if ('offsetX' in partialEvent && 'offsetY' in partialEvent) {
            ({ x: regionOffsetX, y: regionOffsetY } = mainBBoxProvider.fromCanvasPoint(
                partialEvent.offsetX,
                partialEvent.offsetY
            ));
        } else {
            const regionBBox = mainBBoxProvider.toCanvasBBox();
            regionOffsetX = regionBBox.width / 2;
            regionOffsetY = regionBBox.height / 2;
        }

        const event: RegionEvent = buildPreventable({
            ...partialEvent,
            region: current.region.properties.name,
            bboxProviderId: current.bboxProvider?.id,
            regionOffsetX,
            regionOffsetY,
        });
        this.debug('Dispatching region event: ', event);
        this.allRegionsListeners.dispatch(event.type, event);
        current.region.listeners.dispatch(event.type, event);
    }

    // Process events during a drag action. Returns false if this event should follow the standard
    // RegionManager.processEvent flow, or true if this event already processed by this function.
    private handleDragging(event: PointerInteractionEvent): boolean {
        const { current } = this;

        switch (event.type) {
            case 'drag-start':
                this.isDragging = true;
                this.leftCanvas = false;
                break;
            // If the user releases the mouse ('drag-end') outside of the canvas, then the region listeners
            // would not be notified to the 'leave' event by the usual processEvent mechanism. So we need to
            // fire a deferred 'leave' event if the mouse has left the canvas after a drag event.
            case 'leave':
                this.leftCanvas = true;
                return this.isDragging;
            case 'enter':
                this.leftCanvas = false;
                return this.isDragging;

            // AG-10875 only dispatch followup drag event to the region that received the 'drag-start'
            // This logic will deliberatly suppress 'leave' events from the InteractionManager when dragging,
            // and defers it until the drag is done.
            case 'drag':
                if (this.isDragging) {
                    this.dispatch(current, event);
                    return true;
                }
                break;
            case 'drag-end':
                if (this.isDragging) {
                    this.isDragging = false;
                    this.dispatch(current, event);
                    if (this.leftCanvas) {
                        this.dispatch(current, { ...event, type: 'leave' });
                    }
                    return true;
                }
                break;
        }

        return false;
    }

    private processPointerEvent(event: PointerInteractionEvent) {
        if (this.handleDragging(event)) {
            // We are current dragging, so do not send leave/enter events until dragging is done.
            return;
        }

        const { current } = this;

        const newCurrent = this.pickRegion(event.offsetX, event.offsetY, event);
        const newRegion = newCurrent?.region;
        if (current !== undefined && newRegion?.properties.name !== current.region.properties.name) {
            this.dispatch(current, { ...event, type: 'leave' });
        }
        if (newRegion !== undefined && newRegion.properties.name !== current?.region.properties.name) {
            this.dispatch(newCurrent, { ...event, type: 'enter' });
        }
        if (newRegion !== undefined && this.checkPointerHistory(newRegion, event)) {
            this.dispatch(newCurrent, event);
        }
        this.current = newCurrent;
    }

    private pickRegion(x: number, y: number, event: PointerInteractionEvent) {
        if (shouldIgnore(event)) return undefined;

        // Sort matches by area.
        // This ensure that we prioritise smaller regions are contained inside larger regions.
        let currentArea = Infinity;
        let currentRegion: Region | undefined;
        let currentBBoxProvider: RegionBBoxProvider | undefined;
        for (const region of this.regions.values()) {
            for (const provider of region.properties.bboxproviders) {
                if (provider.visible === false) continue;

                const bbox = provider.toCanvasBBox();
                const area = bbox.width * bbox.height;
                if (area < currentArea && bbox.containsPoint(x, y)) {
                    currentArea = area;
                    currentRegion = region;
                    currentBBoxProvider = provider;
                }
            }
        }
        return currentRegion ? { region: currentRegion, bboxProvider: currentBBoxProvider } : undefined;
    }
}
