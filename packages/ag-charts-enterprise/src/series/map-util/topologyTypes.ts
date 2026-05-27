import { _ModuleSupport } from 'ag-charts-community';

import type { LonLatBBox } from './lonLatBbox';

export interface ITopology extends _ModuleSupport.Series<any, any, any> {
    topologyBounds: LonLatBBox | undefined;
    scale: _ModuleSupport.MercatorScale | undefined;
    setChartTopology(topology: any): void;
}
