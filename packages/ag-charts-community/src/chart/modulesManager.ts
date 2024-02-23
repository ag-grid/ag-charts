import type { ModuleInstance } from '../module/baseModule';
import type { LegendModule, RootModule } from '../module/coreModules';
import { ModuleMap } from '../module/moduleMap';
import type { ChartLegend, ChartLegendType } from './legendDatum';

export class ModulesManager extends ModuleMap<RootModule | LegendModule, ModuleInstance> {
    legends() {
        const legends = new Map<ChartLegendType, ChartLegend>();
        for (const { module, moduleInstance } of this.moduleMap.values()) {
            if (module.type !== 'legend') continue;
            legends.set(module.identifier, moduleInstance as ChartLegend);
        }
        return legends;
    }
}
