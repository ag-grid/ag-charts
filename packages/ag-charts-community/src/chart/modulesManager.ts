import { type PluginModuleInstance } from 'ag-charts-core';
import type { AgChartInstance } from 'ag-charts-types';

import { ModuleMap } from '../module/moduleMap';
import type { ChartLegend, ChartLegendType } from './legend/legendDatum';

export type SelectionModuleFns = Pick<AgChartInstance, 'getSelection' | 'setSelection' | 'clearSelection'>;

const LEGEND_MODULES: ReadonlyArray<[legendType: ChartLegendType, moduleName: string]> = [
    ['category', 'legend'],
    ['gradient', 'gradientLegend'],
];

export class ModulesManager extends ModuleMap<PluginModuleInstance> {
    *legends(): Generator<{ legendType: ChartLegendType; legend: ChartLegend }> {
        for (const [legendType, moduleName] of LEGEND_MODULES) {
            const legend = this.getModule<ChartLegend>(moduleName);
            if (legend) {
                yield { legendType, legend };
            }
        }
    }

    selection(): SelectionModuleFns | undefined {
        return this.getModule<SelectionModuleFns>('selection');
    }
}
