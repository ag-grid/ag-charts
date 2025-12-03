import type { Series } from './series';
import type { DatumIndexType } from './seriesTypes';
import type { LonLatBBox } from 'ag-charts-core';
import type { MercatorScale } from './topology/mercatorScale';

export interface ITopology extends Series<DatumIndexType, any, any, any> {
    topologyBounds: LonLatBBox | undefined;
    scale: MercatorScale | undefined;
    setChartTopology(topology: any): void;
}
