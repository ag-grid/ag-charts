import { ModuleRegistry, ModuleType, type PluginModuleInstance } from 'ag-charts-core';

import { ModuleMap } from '../module/moduleMap';
import type { ChartLegend, ChartLegendType } from './legend/legendDatum';

export class ModulesManager extends ModuleMap<PluginModuleInstance> {
    *legends(): Generator<{ legendType: ChartLegendType; legend: ChartLegend }> {
        for (const module of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
            if (module.name === 'legend' || module.name === 'gradientLegend') {
                yield {
                    legendType: module.name === 'legend' ? 'category' : 'gradient',
                    legend: this.getModule(module.name) as ChartLegend,
                };
            }
        }
    }
}
