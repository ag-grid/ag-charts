import type { BBox } from '../../scene/bbox';
import { getDocument } from '../../util/dom';
import { Listeners } from '../../util/listeners';
import { buildConsumable } from './consumableEvent';
import type { InteractionManager, PointerInteractionEvent, PointerInteractionTypes } from './interactionManager';
import { InteractionState, POINTER_INTERACTION_TYPES } from './interactionManager';
import { KeyNavEvent, KeyNavEventType, KeyNavManager } from './keyNavManager';

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

const REGION_TAB_ORDERING: RegionName[] = ['series', 'legend', 'footnote'];

// This type-map allows the compiler to automatically figure out the parameter type of handlers
// specifies through the `addListener` method (see the `makeObserver` method).
type TypeInfo = { [K in PointerInteractionTypes]: PointerInteractionEvent<K> } & {
    [K in KeyNavEventType]: KeyNavEvent<K>;
};

type RegionEvent = PointerInteractionEvent | KeyNavEvent;
type RegionHandler = (event: RegionEvent) => void;

class RegionListeners extends Listeners<RegionEvent['type'], RegionHandler> {}

interface BBoxProvider {
    getCachedBBox(): BBox;
}

type Region = {
    readonly properties: RegionProperties;
    readonly listeners: RegionListeners;
};

export interface RegionProperties {
    readonly name: RegionName;
    readonly bboxproviders: BBoxProvider[];
    canInteraction(): boolean;
}

export class RegionManager {
    private currentTabIndex = 0;
    public readonly keyNavManager: KeyNavManager;
    private readonly focusIndicator?: HTMLDivElement;

    private currentRegion?: Region;
    private isDragging = false;
    private leftCanvas = false;

    private regions: Map<RegionName, Region> = new Map();
    private readonly destroyFns: (() => void)[] = [];

    constructor(
        private readonly interactionManager: InteractionManager,
        element: HTMLElement,
        container: HTMLElement | undefined
    ) {
        this.keyNavManager = new KeyNavManager(interactionManager, container);
        this.destroyFns.push(
            ...POINTER_INTERACTION_TYPES.map((eventName) =>
                interactionManager.addListener(eventName, this.processPointerEvent.bind(this), InteractionState.All)
            ),
            this.keyNavManager.addListener('blur', this.onNav.bind(this)),
            this.keyNavManager.addListener('browserfocus', this.onFocus.bind(this)),
            this.keyNavManager.addListener('tab', this.onTab.bind(this)),
            this.keyNavManager.addListener('nav-vert', this.onNav.bind(this)),
            this.keyNavManager.addListener('nav-hori', this.onNav.bind(this)),
            this.keyNavManager.addListener('submit', this.onNav.bind(this))
        );

        this.focusIndicator = getDocument()?.createElement('div');
        if (this.focusIndicator !== undefined && element !== undefined) {
            this.focusIndicator.className = 'ag-charts-focusindicator';
            this.focusIndicator.style.position = 'absolute';
            this.focusIndicator.style.border = '2px solid red';
            this.focusIndicator.style.display = 'none';
            this.focusIndicator.style.pointerEvents = 'none';
            this.focusIndicator.style.userSelect = 'none';
            element.appendChild(this.focusIndicator);
        }
    }

    public destroy() {
        this.destroyFns.forEach((fn) => fn());

        this.currentRegion = undefined;
        for (const region of this.regions.values()) {
            region.listeners.destroy();
        }
        this.regions.clear();
        this.keyNavManager.destroy();
    }

    public addRegionFromProperties(properties: RegionProperties) {
        const region = { properties, listeners: new RegionListeners() };
        this.regions.set(properties.name, region);
        return this.makeObserver(region);
    }

    public addRegion(name: RegionName, bboxprovider: BBoxProvider, ...extraProviders: BBoxProvider[]) {
        return this.addRegionFromProperties({
            name,
            bboxproviders: [bboxprovider, ...extraProviders],
            canInteraction: () => true,
        });
    }

    public getRegion(name: RegionName) {
        return this.makeObserver(this.regions.get(name));
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
                return (
                    region?.listeners.addListener(type, (e: RegionEvent) => {
                        if (!e.consumed) {
                            const currentState = interactionManager.getState();
                            if (currentState & triggeringStates) {
                                handler(e as TypeInfo[T]);
                            }
                        }
                    }) ?? (() => {})
                );
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
        region?.listeners.dispatch(event.type, event);
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

    private dispatchTabStart(event: KeyNavEvent<'tab'>): boolean {
        const { delta, interactionEvent } = event;
        const startEvent: KeyNavEvent<'tab-start'> = buildConsumable({ type: 'tab-start', delta, interactionEvent });
        const focusedRegion = this.getTabRegion(this.currentTabIndex);

        this.dispatch(focusedRegion, startEvent);
        return !!startEvent.consumed;
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

    private onFocus(event: KeyNavEvent<'browserfocus'>) {
        const { delta, interactionEvent } = event;
        const newIndex =
            delta > 0
                ? this.getNextInteractableTabIndex(-1, 1)
                : this.getNextInteractableTabIndex(REGION_TAB_ORDERING.length - 1, -1);
        this.currentTabIndex = newIndex ?? 0;
        const focusedRegion = this.getTabRegion(this.currentTabIndex);
        if (focusedRegion) {
            this.dispatch(focusedRegion, buildConsumable({ type: 'tab', delta, interactionEvent }));
        }
    }

    private onTab(event: KeyNavEvent<'tab'>) {
        const consumed = this.dispatchTabStart(event);
        if (!consumed) {
            this.validateCurrentTabIndex();
            const newTabIndex = this.getNextInteractableTabIndex(this.currentTabIndex, event.delta);
            const newRegion = this.getTabRegion(newTabIndex);
            const focusedRegion = this.getTabRegion(this.currentTabIndex);
            if (newTabIndex !== undefined) {
                this.currentTabIndex = newTabIndex;
            }

            if (focusedRegion !== undefined && newRegion?.properties.name !== focusedRegion.properties.name) {
                this.dispatch(focusedRegion, { ...event, type: 'blur' });
            }
            if (newRegion === undefined || !newRegion.properties.canInteraction()) {
                this.updateFocusIndicatorRect(undefined);
            } else {
                event.interactionEvent.sourceEvent.preventDefault();
                this.dispatch(newRegion, event);
            }
        }
    }

    private onNav(event: KeyNavEvent<'blur' | 'nav-hori' | 'nav-vert' | 'submit'>) {
        const focusedRegion = this.getTabRegion(this.currentTabIndex);
        this.dispatch(focusedRegion, event);
    }

    public updateFocusIndicatorRect(rect: { x: number; y: number; width: number; height: number } | undefined) {
        if (this.focusIndicator !== undefined) {
            if (rect === undefined) {
                this.focusIndicator.style.display = 'none';
            } else {
                this.focusIndicator.style.display = 'block';
                this.focusIndicator.style.width = `${rect.width}px`;
                this.focusIndicator.style.height = `${rect.height}px`;
                this.focusIndicator.style.left = `${rect.x}px`;
                this.focusIndicator.style.top = `${rect.y}px`;
            }
        }
    }
}
