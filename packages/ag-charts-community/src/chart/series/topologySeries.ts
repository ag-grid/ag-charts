import type { Series } from './series';
import type { DatumIndexType } from './seriesTypes';
import type { LonLatBBox } from './topology/lonLatBbox';
import type { MercatorScale } from './topology/mercatorScale';

export interface ITopology extends Series<DatumIndexType, any, any, any> {
    topologyBounds: LonLatBBox | undefined;
    scale: MercatorScale | undefined;
    setChartTopology(topology: any): void;
}
