import { BBox } from '../scene/bbox';
import { Chart } from './chart';
export declare class FlowProportionChart extends Chart {
    static readonly className = "FlowProportionChart";
    static readonly type: "flow-proportion";
    updateData(): Promise<void>;
    performLayout(): Promise<BBox>;
}
