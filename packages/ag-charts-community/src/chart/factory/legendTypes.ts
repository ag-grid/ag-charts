import { LegendConstructor, ModuleContext } from '../../util/module';
import { Legend } from '../legend';
import { ChartLegend } from '../legendDatum';

const LEGEND_FACTORIES: Record<string, LegendConstructor> = {
    category: Legend,
};

export function registerLegend(type: string, ctr: LegendConstructor) {
    LEGEND_FACTORIES[type] = ctr;
}

export function getLegend(type: string, ctx: ModuleContext): ChartLegend {
    if (LEGEND_FACTORIES[type] != null) {
        return new LEGEND_FACTORIES[type](ctx);
    }

    throw new Error(`AG Charts - unknown legend type: ${type}`);
}
