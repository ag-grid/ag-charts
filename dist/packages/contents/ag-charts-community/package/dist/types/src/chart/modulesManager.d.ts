import type { ModuleInstance } from '../module/baseModule';
import type { LegendModule, RootModule } from '../module/coreModules';
import { ModuleMap } from '../module/moduleMap';
import type { ChartLegend, ChartLegendType } from './legendDatum';
export declare class ModulesManager extends ModuleMap<RootModule | LegendModule, ModuleInstance> {
    applyOptions(options: object): void;
    legends(): Generator<{
        legendType: ChartLegendType;
        legend: ChartLegend;
    }, void, unknown>;
}
