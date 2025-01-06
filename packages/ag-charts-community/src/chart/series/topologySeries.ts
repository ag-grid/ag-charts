import type { Series } from './series';
import type { LonLatBBox } from './topology/lonLatBbox';
import type { MercatorScale } from './topology/mercatorScale';

export interface ITopology extends Series<unknown, any, any> {
    topologyBounds: LonLatBBox | undefined;
    scale: MercatorScale | undefined;
    setChartTopology(topology: any): void;
}
