import type { ChartAxis } from '../chart/chartAxis';
import type { BaseModule } from './baseModule';
import type { ModuleContext } from './moduleContext';
type ModuleInstanceConstructor<M> = new (moduleContext: ModuleContext) => M;
export type AxisConstructor = ModuleInstanceConstructor<ChartAxis>;
export interface AxisModule extends BaseModule {
    type: 'axis';
    identifier: string;
    instanceConstructor: AxisConstructor;
    hidden?: boolean;
    themeTemplate?: {};
}
export {};
