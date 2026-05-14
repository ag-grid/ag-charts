import { ModuleRegistry, ModuleType, type PluginModuleInstance } from 'ag-charts-core';
import type { AgChartInstance } from 'ag-charts-types';

import { ModuleMap } from '../module/moduleMap';
import type { ChartLegend, ChartLegendType } from './legend/legendDatum';

export type SelectionModuleFns = Pick<AgChartInstance, 'getSelection' | 'setSelection' | 'clearSelection'>;

export class ModulesManager extends ModuleMap<PluginModuleInstance> {
    *legends(): Generator<{ legendType: ChartLegendType; legend: ChartLegend }> {
        for (const module of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
            if (module.name === 'legend' || module.name === 'gradientLegend') {
                yield {
                    legendType: module.name === 'legend' ? 'category' : 'gradient',
                    legend: this.getModule<ChartLegend>(module.name)!,
                };
            }
        }
    }

    selection(): SelectionModuleFns | undefined {
        return this.getModule<SelectionModuleFns>('selection');
    }
}
