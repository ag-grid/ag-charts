import type { Series } from './series';
export interface FlowProportionSeries extends Series<any, any> {
    setChartNodes(nodes: any[] | undefined): void;
}
