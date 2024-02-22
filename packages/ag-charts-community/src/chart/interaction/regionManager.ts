import type { BBoxProvider } from '../../util/bboxset';
import { BBoxSet } from '../../util/bboxset';
import { Listeners } from '../../util/listeners';
import { Logger } from '../../util/logger';
import type { InteractionEvent, InteractionManager, InteractionTypes } from './interactionManager';
import { INTERACTION_TYPES, InteractionState } from './interactionManager';

export type RegionName = 'legend' | 'pagination' | 'series';

type RegionHandler<Event extends InteractionEvent> = (event: Event) => void;

class RegionListeners extends Listeners<InteractionTypes, RegionHandler<InteractionEvent<InteractionTypes>>> {}

type Region = {
    name: RegionName;
    listeners: RegionListeners;
};

export class RegionManager {
    public currentRegion?: Region;

    private eventHandler = (event: InteractionEvent<InteractionTypes>) => this.processEvent(event);
    private regions: BBoxSet<Region> = new BBoxSet();
    private readonly destroyFns: (() => void)[] = [];

    constructor(private interactionManager: InteractionManager) {
        this.destroyFns.push(
            ...INTERACTION_TYPES.map((eventName) =>
                interactionManager.addListener(eventName, this.eventHandler, InteractionState.All)
            )
        );
    }

    public destroy() {
        this.destroyFns.forEach((fn) => fn());

        this.currentRegion = undefined;
        for (const region of this.regions) {
            region.listeners.destroy();
        }
        this.regions.clear();
    }

    private pushRegion(name: RegionName, bboxprovider: BBoxProvider): Region {
        const region = { name, listeners: new RegionListeners() };
        this.regions.add(region, bboxprovider);
        return region;
    }

    public addRegion(name: RegionName, bboxprovider: BBoxProvider) {
        const region = this.pushRegion(name, bboxprovider);
        const { interactionManager } = this;

        class ObservableRegionImplementation {
            addListener<T extends InteractionTypes>(
                type: T,
                handler: RegionHandler<InteractionEvent<T>>,
                triggeringStates: InteractionState = InteractionState.Default
            ) {
                return region.listeners.addListener(type, (e) => {
                    if (!e.consumed) {
                        const currentState = interactionManager.getState();
                        if (currentState & triggeringStates) {
                            handler(e as InteractionEvent<T>);
                        }
                    }
                });
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

    private processEvent(event: InteractionEvent<InteractionTypes>) {
        const { currentRegion } = this;
        const newRegion = this.pickRegion(event.offsetX, event.offsetY);
        if (currentRegion !== undefined && newRegion?.name !== currentRegion.name) {
            currentRegion?.listeners.dispatch('leave', { ...event, type: 'leave' });
        }
        if (newRegion !== undefined && newRegion.name !== currentRegion?.name) {
            newRegion?.listeners.dispatch('enter', { ...event, type: 'enter' });
        }
        if (newRegion !== undefined && this.checkPointerHistory(newRegion, event)) {
            // Async dispatch to avoid blocking the event-processing thread.
            const dispatcher = async () => newRegion.listeners.dispatch(event.type, event);
            dispatcher().catch((e) => Logger.errorOnce(e));
        }
        this.currentRegion = newRegion;
    }

    private pickRegion(x: number, y: number): Region | undefined {
        const matchingRegions = this.regions.find(x, y);
        return matchingRegions.length > 0 ? matchingRegions[0] : undefined;
    }
}
