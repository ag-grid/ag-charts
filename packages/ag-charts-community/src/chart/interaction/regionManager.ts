import type { BBoxProvider } from '../../util/bboxset';
import { BBoxSet } from '../../util/bboxset';
import { Listeners } from '../../util/listeners';

export type RegionName = 'legend';

type RegionEvent<EventType extends string> = {
    type: EventType;
    consumed?: boolean;
};

type RegionHandler<EventType extends string> = (event: RegionEvent<EventType>) => void;

type Region<EventType extends string> = {
    name: RegionName;
    listeners: Listeners<EventType, RegionHandler<EventType>>;
};

export class RegionManager<EventType extends string> {
    public currentRegion?: Region<EventType>;

    private regions: BBoxSet<Region<EventType>> = new BBoxSet();

    public addRegion(name: RegionName, bboxprovider: BBoxProvider): Region<EventType> {
        const region = { name, listeners: new Listeners<EventType, RegionHandler<EventType>>() };
        this.regions.add(region, bboxprovider);
        return region;
    }

    public pickRegion(x: number, y: number): Region<EventType> | undefined {
        const matchingRegions = this.regions.find(x, y);
        return matchingRegions.length > 0 ? matchingRegions[0] : undefined;
    }
}
