import { _ModuleSupport } from 'ag-charts-community';

import type { LonLatBBox } from './lonLatBbox';
import type { MercatorScale } from './mercatorScale';

export interface ITopology extends _ModuleSupport.Series<any, any, any> {
    topologyBounds: LonLatBBox | undefined;
    scale: MercatorScale | undefined;
    setChartTopology(topology: any): void;
}
