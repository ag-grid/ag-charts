// Entry point to implement and test our tree-shaking abilities
import { _ModuleSupport } from 'ag-charts-community';

export const ModuleRegistry = _ModuleSupport.ModuleRegistry;

export { FlowProportionChartModule } from './charts/flowProportionChartModule';
export { GaugeChartModule } from './charts/gaugeChartModule';
export { HierarchyChartModule } from './charts/hierarchyChartModule';
export { StandaloneChartModule } from './charts/standaloneChartModule';
export { TopologyChartModule } from './charts/topologyChartModule';
