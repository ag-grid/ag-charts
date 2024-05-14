import type { BBoxContainsTester, BBoxProvider, BBoxValues } from '../../util/bboxinterface';
import { Listeners } from '../../util/listeners';
import type { FocusIndicator } from '../dom/focusIndicator';
import { buildConsumable } from './consumableEvent';
import type { InteractionManager, PointerInteractionEvent, PointerInteractionTypes } from './interactionManager';
import { InteractionState, POINTER_INTERACTION_TYPES } from './interactionManager';
import type { KeyNavEvent, KeyNavEventType, KeyNavManager } from './keyNavManager';

export type RegionName =
    | 'title'
    | 'subtitle'
    | 'footnote'
    | 'legend'
    | 'navigator'
    | 'pagination'
    | 'root'
    | 'series'
    | 'toolbar';

const REGION_TAB_ORDERING: RegionName[] = ['series'];

// This type-map allows the compiler to automatically figure out the parameter type of handlers
// specifies through the `addListener` method (see the `makeObserver` method).
type TypeInfo = { [K in PointerInteractionTypes]: PointerInteractionEvent<K> } & {
    [K in KeyNavEventType]: KeyNavEvent<K>;
};

type RegionEvent = PointerInteractionEvent | KeyNavEvent;
type RegionHandler = (event: RegionEvent) => void;
type RegionBBoxProvider = BBoxProvider<BBoxContainsTester & { width: number; height: number }>;

class RegionListeners extends Listeners<RegionEvent['type'], RegionHandler> {}

type Region = {
    readonly properties: RegionProperties;
    readonly listeners: RegionListeners;
};

export interface RegionProperties {
    readonly name: RegionName;
    readonly bboxproviders: RegionBBoxProvider[];
    canInteraction(): boolean;
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
            if (!e.consumed) {
                const currentState = interactionManager.getState();
                if (currentState & triggeringStates) {
                    handler(e as TypeInfo[T]);
                }
            }
        }) ?? (() => {})
    );
}

export class RegionManager {
    private currentTabIndex = 0;

    private currentRegion?: Region;
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
            this.keyNavManager.addListener('browserfocus', this.onBrowserFocus.bind(this)),
            this.keyNavManager.addListener('tab', this.onTab.bind(this)),
            this.keyNavManager.addListener('nav-vert', this.onNav.bind(this)),
            this.keyNavManager.addListener('nav-hori', this.onNav.bind(this)),
            this.keyNavManager.addListener('submit', this.onNav.bind(this))
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

    public addRegionFromProperties(properties: RegionProperties) {
        const region = { properties, listeners: new RegionListeners() };
        this.regions.set(properties.name, region);
        return this.makeObserver(region);
    }

    public addRegion(name: RegionName, bboxprovider: RegionBBoxProvider, ...extraProviders: RegionBBoxProvider[]) {
        return this.addRegionFromProperties({
            name,
            bboxproviders: [bboxprovider, ...extraProviders],
            canInteraction: () => true,
        });
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

    private find(x: number, y: number): Region[] {
        // Sort matches by area.
        // This ensure that we prioritise smaller regions are contained inside larger regions.
        type Area = number;
        const matches: [Region, Area][] = [];
        for (const [_name, region] of this.regions.entries()) {
            for (const provider of region.properties.bboxproviders) {
                const bbox = provider.getCachedBBox();
                if (bbox.containsPoint(x, y)) {
                    matches.push([region, bbox.width * bbox.height]);
                }
            }
        }
        return matches.sort((a, b) => a[1] - b[1]).map((m) => m[0]);
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
            const historyRegion = this.pickRegion(historyEvent.offsetX, historyEvent.offsetY);
            if (targetRegion.properties.name !== historyRegion?.properties.name) {
                return false;
            }
        }
        return true;
    }

    private dispatch(region: Region | undefined, event: RegionEvent) {
        event.region = region?.properties.name;
        region?.listeners.dispatch(event.type, event);
        this.allRegionsListeners.dispatch(event.type, event);
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
        const newRegion = this.pickRegion(event.offsetX, event.offsetY);
        if (currentRegion !== undefined && newRegion?.properties.name !== currentRegion.properties.name) {
            this.dispatch(currentRegion, { ...event, type: 'leave' });
        }
        if (newRegion !== undefined && newRegion.properties.name !== currentRegion?.properties.name) {
            this.dispatch(newRegion, { ...event, type: 'enter' });
        }
        if (newRegion !== undefined && this.checkPointerHistory(newRegion, event)) {
            this.dispatch(newRegion, event);
        }
        this.currentRegion = newRegion;
    }

    private pickRegion(x: number, y: number): Region | undefined {
        const matchingRegions = this.find(x, y);
        return matchingRegions.length > 0 ? matchingRegions[0] : undefined;
    }

    private getTabRegion(tabIndex: number | undefined): Region | undefined {
        if (tabIndex !== undefined && tabIndex >= 0 && tabIndex < REGION_TAB_ORDERING.length) {
            return this.regions.get(REGION_TAB_ORDERING[tabIndex]);
        }
        return undefined;
    }

    private getNextInteractableTabIndex(currentIndex: number, delta: number): number | undefined {
        const direction = delta < 0 ? -1 : 1;
        let i = currentIndex;
        while (delta !== 0) {
            const region = this.getTabRegion(i + direction);
            if (region === undefined) {
                return undefined;
            } else if (region.properties.canInteraction()) {
                delta = delta - direction;
            }
            i = i + direction;
        }
        return i;
    }

    private validateCurrentTabIndex() {
        // This currentTabIndex might be referencing a region that is no longer interactable.
        // If that's the case, then refresh the focus to the first interactable region.
        const focusedRegion = this.getTabRegion(this.currentTabIndex);
        if (focusedRegion !== undefined && !focusedRegion.properties.canInteraction()) {
            this.currentTabIndex = this.getNextInteractableTabIndex(-1, 1) ?? 0;
        }
    }

    private onBrowserFocus(event: KeyNavEvent<'browserfocus'>) {
        if (event.delta > 0) {
            this.currentTabIndex = -1;
        } else if (event.delta < 0) {
            this.currentTabIndex = REGION_TAB_ORDERING.length;
        }
    }

    private onTab(event: KeyNavEvent<'tab'>) {
        this.validateCurrentTabIndex();
        const newTabIndex = this.getNextInteractableTabIndex(this.currentTabIndex, event.delta);
        const newRegion = this.getTabRegion(newTabIndex);
        const focusedRegion = this.getTabRegion(this.currentTabIndex);
        if (newTabIndex !== undefined) {
            this.currentTabIndex = newTabIndex;
        }

        if (focusedRegion !== undefined && newRegion?.properties.name !== focusedRegion.properties.name) {
            // Build a distinct consumable event, since we don't care about consumed status of blur.
            const { delta, sourceEvent } = event;
            const blurEvent = buildConsumable({ type: 'blur' as const, delta, sourceEvent });
            this.dispatch(focusedRegion, blurEvent);
        }
        if (newRegion === undefined || !newRegion.properties.canInteraction()) {
            this.updateFocusIndicatorRect(undefined);
        } else {
            this.dispatch(newRegion, event);
        }
    }

    private onNav(event: KeyNavEvent<'blur' | 'nav-hori' | 'nav-vert' | 'submit'>) {
        const focusedRegion = this.getTabRegion(this.currentTabIndex);
        this.dispatch(focusedRegion, event);
    }

    public updateFocusIndicatorRect(rect?: BBoxValues) {
        this.focusIndicator.updateBBox(rect);
    }
}
