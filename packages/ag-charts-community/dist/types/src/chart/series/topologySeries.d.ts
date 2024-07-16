import type { Series } from './series';
import type { LonLatBBox } from './topology/lonLatBbox';
import type { MercatorScale } from './topology/mercatorScale';
export interface TopologySeries extends Series<any, any> {
    topologyBounds: LonLatBBox | undefined;
    scale: MercatorScale | undefined;
    setChartTopology(topology: any): void;
}
