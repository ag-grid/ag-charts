import { ModuleRegistry, ModuleType } from 'ag-charts-core';

import { ModuleMap } from '../module/moduleMap';
import type { ChartLegend, ChartLegendType } from './legend/legendDatum';

export class ModulesManager extends ModuleMap {
    *legends(): Generator<{ legendType: ChartLegendType; legend: ChartLegend }> {
        for (const module of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
            if (module.name.startsWith('legend')) {
                yield {
                    legendType: module.name === 'legend' ? 'category' : 'gradient',
                    legend: this.getModule(module.name) as ChartLegend,
                };
            }
        }
    }
}
