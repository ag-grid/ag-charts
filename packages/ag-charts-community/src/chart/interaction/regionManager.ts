import { BBox } from '../../scene/bbox';
import { mapIterable } from '../../util/array';
import { Listeners } from '../../util/listeners';
import { clamp } from '../../util/number';
import type {
    PointerInteractionEvent as InteractionEvent,
    InteractionManager,
    PointerInteractionTypes as InteractionTypes,
} from './interactionManager';
import { INTERACTION_TYPES, InteractionState } from './interactionManager';
import { KeyNavEvent, KeyNavManager } from './keyNavManager';

export type RegionName = 'legend' | 'navigator' | 'pagination' | 'root' | 'series' | 'toolbar';

const REGION_TAB_ORDERING: RegionName[] = ['series', 'legend'];

type RegionHandler<Event extends InteractionEvent> = (event: Event) => void;

class RegionListeners extends Listeners<InteractionTypes, RegionHandler<InteractionEvent<InteractionTypes>>> {}

interface BBoxProvider {
    getCachedBBox(): BBox;
}

type Region = {
    name: RegionName;
    bboxproviders: BBoxProvider[];
    listeners: RegionListeners;
};

export class RegionManager {
    private currentTabIndex = 0;
    private readonly keyNavManager: KeyNavManager;
    private readonly focusIndicator: HTMLDivElement;

    private currentRegion?: Region;
    private isDragging = false;
    private leftCanvas = false;

    private eventHandler = (event: InteractionEvent<InteractionTypes>) => this.processEvent(event);
    private regions: Map<RegionName, Region> = new Map();
    private readonly destroyFns: (() => void)[] = [];

    constructor(
        private readonly interactionManager: InteractionManager,
        container: HTMLElement | undefined
    ) {
        this.keyNavManager = new KeyNavManager(interactionManager);
        this.destroyFns.push(
            ...INTERACTION_TYPES.map((eventName) =>
                interactionManager.addListener(eventName, this.eventHandler, InteractionState.All)
            ),
            this.keyNavManager.addListener('tab', this.onTab.bind(this))
        );

        this.focusIndicator = document.createElement('div');
        this.focusIndicator.id = 'focusIndicator';
        this.focusIndicator.style.position = 'absolute';
        this.focusIndicator.style.border = '2px solid red';
        this.focusIndicator.style.display = 'none';
        this.focusIndicator.style.pointerEvents = 'none';
        this.focusIndicator.style.userSelect = 'none';
        container?.appendChild(this.focusIndicator);
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

    private pushRegion(name: RegionName, bboxproviders: BBoxProvider[]): Region {
        const region = { name, listeners: new RegionListeners(), bboxproviders };
        this.regions.set(name, region);
        return region;
    }

    public addRegion(name: RegionName, bboxprovider: BBoxProvider, ...extraProviders: BBoxProvider[]) {
        return this.makeObserver(this.pushRegion(name, [bboxprovider, ...extraProviders]));
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
            for (const provider of region.bboxproviders) {
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
            addListener<T extends InteractionTypes>(
                type: T,
                handler: RegionHandler<InteractionEvent<T>>,
                triggeringStates: InteractionState = InteractionState.Default
            ): () => void {
                return (
                    region?.listeners.addListener(type, (e) => {
                        if (!e.consumed) {
                            const currentState = interactionManager.getState();
                            if (currentState & triggeringStates) {
                                handler(e as InteractionEvent<T>);
                            }
                        }
                    }) ?? (() => {})
                );
            }
        }
        return new ObservableRegionImplementation();
    }

    private checkPointerHistory(targetRegion: Region, event: InteractionEvent<InteractionTypes>): boolean {
        for (const historyEvent of event.pointerHistory) {
            const historyRegion = this.pickRegion(historyEvent.offsetX, historyEvent.offsetY);
            if (targetRegion.name !== historyRegion?.name) {
                return false;
            }
        }
        return true;
    }

    private dispatch(region: Region | undefined, event: InteractionEvent<InteractionTypes>) {
        region?.listeners.dispatch(event.type, event);
    }

    // Process events during a drag action. Returns false if this event should follow the standard
    // RegionManager.processEvent flow, or true if this event already processed by this function.
    private handleDragging(event: InteractionEvent<InteractionTypes>): boolean {
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

    private processEvent(event: InteractionEvent<InteractionTypes>) {
        if (this.handleDragging(event)) {
            // We are current dragging, so do not send leave/enter events until dragging is done.
            return;
        }

        const { currentRegion } = this;
        const newRegion = this.pickRegion(event.offsetX, event.offsetY);
        if (currentRegion !== undefined && newRegion?.name !== currentRegion.name) {
            this.dispatch(currentRegion, { ...event, type: 'leave' });
        }
        if (newRegion !== undefined && newRegion.name !== currentRegion?.name) {
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

    private getTabRegion(tabIndex: number): Region | undefined {
        if (tabIndex >= 0 && tabIndex < REGION_TAB_ORDERING.length) {
            return this.regions.get(REGION_TAB_ORDERING[tabIndex]);
        }
        return undefined;
    }

    private getTabRegionBounds(region: Region): BBox {
        return BBox.merge(mapIterable(region.bboxproviders, (p) => p.getCachedBBox()));
    }

    private onTab(event: KeyNavEvent<'tab'>) {
        const newTabIndex = this.currentTabIndex + event.delta;
        this.currentTabIndex = clamp(0, newTabIndex, REGION_TAB_ORDERING.length - 1);

        const newRegion = this.getTabRegion(newTabIndex);
        if (newRegion !== undefined) {
            event.interactionEvent.sourceEvent.preventDefault();
        }
        this.updateFocusIndicator(newRegion);
    }

    private updateFocusIndicator(newRegion: Region | undefined) {
        if (newRegion === undefined) {
            this.focusIndicator.style.display = 'none';
        } else {
            const bounds = this.getTabRegionBounds(newRegion);
            this.focusIndicator.style.display = 'block';
            this.focusIndicator.style.width = `${bounds.width}px`;
            this.focusIndicator.style.height = `${bounds.height}px`;
            this.focusIndicator.style.transform = `translate(${bounds.x}px, ${bounds.y}px)`

            // TODO(olegat) HACK:
            const container = this.focusIndicator.parentNode;
            container?.removeChild(this.focusIndicator);
            container?.appendChild(this.focusIndicator);
        }
    }
}
