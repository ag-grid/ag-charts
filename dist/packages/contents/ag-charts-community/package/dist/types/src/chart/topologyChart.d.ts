import type { ChartOptions } from '../module/optionsModule';
import { BBox } from '../scene/bbox';
import type { TransferableResources } from './chart';
import { Chart } from './chart';
export declare class TopologyChart extends Chart {
    static readonly className = "TopologyChart";
    static readonly type: "topology";
    private readonly xAxis;
    private readonly yAxis;
    constructor(options: ChartOptions, resources?: TransferableResources);
    updateData(): Promise<void>;
    performLayout(): Promise<BBox>;
}
