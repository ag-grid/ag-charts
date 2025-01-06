import type { Series } from './series';

export interface FlowProportionSeries extends Series<unknown, any, any> {
    setChartNodes(nodes: any[] | undefined): void;
}
