import type { BBoxProvider } from '../../util/bboxset';
import { BBoxSet } from '../../util/bboxset';
import { Listeners } from '../../util/listeners';
import { Logger } from '../../util/logger';
import type { InteractionEvent, InteractionManager, InteractionTypes } from './interactionManager';
import { InteractionState, InteractionTypesArray } from './interactionManager';

export type RegionName = 'legend';

type RegionHandler<Event extends InteractionEvent> = (event: Event) => void;

class RegionListeners extends Listeners<InteractionTypes, RegionHandler<InteractionEvent<InteractionTypes>>> {}

type Region = {
    name: RegionName;
    listeners: RegionListeners;
};

export class RegionManager {
    public currentRegion?: Region;

    private regions: BBoxSet<Region> = new BBoxSet();
    private readonly destroyFns: (() => void)[] = [];

    constructor(private interactionManager: InteractionManager) {
        InteractionTypesArray.forEach((t) =>
            this.destroyFns.push(interactionManager.addListener(t, this.processEvent))
        );
    }

    public destroy() {
        this.destroyFns.forEach((fn) => fn());
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
                triggeringStates?: InteractionState
            ) {
                return region.listeners.addListener(type, (e) => {
                    if (!e.consumed) {
                        const currentState = interactionManager.getState();
                        if (currentState & (triggeringStates ?? InteractionState.Default)) {
                            handler(e as InteractionEvent<T>);
                        }
                    }
                });
            }
        }
        return new ObservableRegionImplementation();
    }

    private processEvent(event: InteractionEvent<InteractionTypes>) {
        const { currentRegion } = this;
        const newRegion = this.pickRegion(event.offsetX, event.offsetY);
        if (currentRegion !== undefined && newRegion?.name !== currentRegion.name) {
            currentRegion?.listeners.dispatch('leave', { ...event, type: 'leave' });
        }
        if (newRegion !== undefined) {
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
