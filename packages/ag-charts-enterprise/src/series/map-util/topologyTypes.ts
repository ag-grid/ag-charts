import { _ModuleSupport } from 'ag-charts-community';

import type { LonLatBBox } from './lonLatBbox';

export interface ITopology extends _ModuleSupport.Series<_ModuleSupport.DatumIndexType, any, any, any> {
    topologyBounds: LonLatBBox | undefined;
    scale: _ModuleSupport.MercatorScale | undefined;
    setChartTopology(topology: any): void;
}
