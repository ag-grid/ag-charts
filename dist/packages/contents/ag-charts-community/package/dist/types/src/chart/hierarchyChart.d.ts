import type { ChartOptions } from '../module/optionsModule';
import { BBox } from '../scene/bbox';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
export declare class HierarchyChart extends Chart {
    static readonly className = "HierarchyChart";
    static readonly type: "hierarchy";
    constructor(options: ChartOptions, resources?: TransferableResources);
    performLayout(): Promise<BBox>;
}
