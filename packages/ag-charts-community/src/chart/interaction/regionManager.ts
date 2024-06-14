import { Listeners } from '../../util/listeners';
import type { FocusIndicator } from '../dom/focusIndicator';
import type { InteractionManager, PointerInteractionEvent, PointerInteractionTypes } from './interactionManager';
import { InteractionState, POINTER_INTERACTION_TYPES } from './interactionManager';
import type { KeyNavEvent, KeyNavEventType, KeyNavManager } from './keyNavManager';
import { type Unpreventable, buildPreventable } from './preventableEvent';
import type { RegionBBoxProvider, RegionName } from './regions';

// This type-map allows the compiler to automatically figure out the parameter type of handlers
// specifies through the `addListener` method (see the `makeObserver` method).
type TypeInfo = { [K in PointerInteractionTypes]: PointerInteractionEvent<K> & { region: RegionName } } & {
    [K in KeyNavEventType]: KeyNavEvent<K> & { region: RegionName };
};

export type RegionEvent = (PointerInteractionEvent | KeyNavEvent) & { region: RegionName; bboxProviderId?: string };
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

export class RegionManager {
    private currentRegion?: Region;
    private currentBBoxProviderId?: string;
    private isDragging = false;
    private leftCanvas = false;

    private readonly regions: Map<RegionName, Region> = new Map();
    private readonly destroyFns: (() => void)[] = [];
    private readonly allRegionsListeners = new RegionListeners();

    constructor(
        private readonly interactionManager: InteractionManager,
        private readonly keyNavManager: KeyNavManager,
        private readonly focusIndicator: FocusIndicator
    ) {
        this.destroyFns.push(
            ...POINTER_INTERACTION_TYPES.map((eventName) =>
                interactionManager.addListener(eventName, this.processPointerEvent.bind(this), InteractionState.All)
            ),
            this.keyNavManager.addListener('blur', this.onNav.bind(this)),
            this.keyNavManager.addListener('focus', this.onNav.bind(this)),
            this.keyNavManager.addListener('nav-vert', this.onNav.bind(this)),
            this.keyNavManager.addListener('nav-hori', this.onNav.bind(this)),
            this.keyNavManager.addListener('nav-zoom', this.onNav.bind(this)),
            this.keyNavManager.addListener('submit', this.onNav.bind(this)),
            this.keyNavManager.addListener('cancel', this.onNav.bind(this)),
            this.keyNavManager.addListener('delete', this.onNav.bind(this))
        );
    }

    public destroy() {
        this.destroyFns.forEach((fn) => fn());

        this.currentRegion = undefined;
        for (const region of this.regions.values()) {
            region.listeners.destroy();
        }

        this.focusIndicator.destroy();
        this.regions.clear();
    }

    public addRegion(name: RegionName, ...bboxproviders: RegionBBoxProvider[]) {
        if (this.regions.has(name)) {
            throw new Error(`AG Charts - Region: ${name} already exists`);
        }
        const region = {
            properties: { name, bboxproviders: [...bboxproviders] },
            listeners: new RegionListeners(),
        };
        this.regions.set(name, region);
        return this.makeObserver(region);
    }

    public updateRegion(name: RegionName, ...bboxprovider: RegionBBoxProvider[]) {
        const region = this.regions.get(name);
        if (region) {
            region.properties.bboxproviders = [...bboxprovider];
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
            const { region: historyRegion } = this.pickRegion(historyEvent.offsetX, historyEvent.offsetY);
            if (targetRegion.properties.name !== historyRegion?.properties.name) {
                return false;
            }
        }
        return true;
    }

    // Create and dispatch a copy of the InteractionEvent.
    private dispatch(
        region: Region | undefined,
        partialEvent: Unpreventable<PointerInteractionEvent> | Unpreventable<KeyNavEvent>,
        bboxProviderId?: string
    ) {
        if (region == null) return;
        const event: RegionEvent = buildPreventable({
            ...partialEvent,
            region: region.properties.name,
            bboxProviderId: bboxProviderId,
        });
        this.allRegionsListeners.dispatch(event.type, event);
        region.listeners.dispatch(event.type, event);
    }

    // Process events during a drag action. Returns false if this event should follow the standard
    // RegionManager.processEvent flow, or true if this event already processed by this function.
    private handleDragging(event: PointerInteractionEvent): boolean {
        const { currentRegion } = this;

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
                    this.dispatch(currentRegion, event);
                    return true;
                }
                break;
            case 'drag-end':
                if (this.isDragging) {
                    this.isDragging = false;
                    this.dispatch(currentRegion, event);
                    if (this.leftCanvas) {
                        this.dispatch(currentRegion, { ...event, type: 'leave' });
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

        const { currentRegion } = this;

        if (event.type === 'leave') {
            this.dispatch(currentRegion, { ...event, type: 'leave' });
            this.currentRegion = undefined;
            return;
        }

        const { region: newRegion, bboxProviderId } = this.pickRegion(event.offsetX, event.offsetY);
        if (currentRegion !== undefined && newRegion?.properties.name !== currentRegion.properties.name) {
            this.dispatch(currentRegion, { ...event, type: 'leave' }, this.currentBBoxProviderId);
        }
        if (newRegion !== undefined && newRegion.properties.name !== currentRegion?.properties.name) {
            this.dispatch(newRegion, { ...event, type: 'enter' }, bboxProviderId);
        }
        if (newRegion !== undefined && this.checkPointerHistory(newRegion, event)) {
            this.dispatch(newRegion, event, bboxProviderId);
        }
        this.currentRegion = newRegion;
        this.currentBBoxProviderId = bboxProviderId;
    }

    private pickRegion(x: number, y: number) {
        // Sort matches by area.
        // This ensure that we prioritise smaller regions are contained inside larger regions.
        let currentArea = Infinity;
        let currentRegion: Region | undefined;
        let currentBBoxProviderId: string | undefined;
        for (const region of this.regions.values()) {
            for (const provider of region.properties.bboxproviders) {
                if (provider.visible === false) continue;

                const bbox = provider.computeTransformedRegionBBox?.() ?? provider.computeTransformedBBox();
                const area = bbox.width * bbox.height;
                if (area < currentArea && bbox.containsPoint(x, y)) {
                    currentArea = area;
                    currentRegion = region;
                    currentBBoxProviderId = provider.id;
                }
            }
        }
        return { region: currentRegion, bboxProviderId: currentBBoxProviderId };
    }

    private onNav(event: KeyNavEvent<KeyNavEventType>) {
        const focusedRegion = this.regions.get('series');
        this.dispatch(focusedRegion, event);
    }
}
