import type { ModuleInstance } from '../module/baseModule';
import type { LegendModule, RootModule } from '../module/coreModules';
import type { ModuleContext } from '../module/moduleContext';
import { ModuleMap } from '../module/moduleMap';
import { isProperties } from '../util/properties';
import type { ChartLegend, ChartLegendType } from './legendDatum';

export class ModulesManager extends ModuleMap<RootModule | LegendModule, ModuleInstance, ModuleContext> {
    applyOptions(options: object) {
        for (const m of this.moduleMap.values()) {
            if (m.module.optionsKey in options && isProperties(m.moduleInstance)) {
                m.moduleInstance.set(options[m.module.optionsKey as keyof typeof options]);
            }
        }
    }

    *legends() {
        for (const { module, moduleInstance } of this.moduleMap.values()) {
            if (module.type !== 'legend') continue;
            yield {
                legendType: module.identifier as ChartLegendType,
                legend: moduleInstance as ChartLegend,
            };
        }
    }
}
