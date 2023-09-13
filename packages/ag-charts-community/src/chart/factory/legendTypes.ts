import type { LegendConstructor } from '../../util/module';
import type { ModuleContext } from '../../util/moduleContext';
import { Legend } from '../legend';
import type { ChartLegend, ChartLegendType } from '../legendDatum';

const LEGEND_FACTORIES: Partial<Record<ChartLegendType, LegendConstructor>> = {
    category: Legend,
};

const LEGEND_KEYS: Partial<Record<ChartLegendType, string>> = {
    category: 'legend',
};

export function registerLegend(type: ChartLegendType, key: string, ctr: LegendConstructor, theme: {} | undefined) {
    if (LEGEND_FACTORIES[type]) {
        throw new Error(`AG Charts - already registered legend type: ${type}`);
    }

    LEGEND_FACTORIES[type] = ctr;
    LEGEND_KEYS[type] = key;
    LEGEND_THEME_TEMPLATES[key] = theme;
}

export function getLegend(type: ChartLegendType, ctx: ModuleContext): ChartLegend {
    const ctor = LEGEND_FACTORIES[type];
    if (ctor) {
        return new ctor(ctx);
    }

    throw new Error(`AG Charts - unknown legend type: ${type}`);
}

const LEGEND_THEME_TEMPLATES: Record<string, {} | undefined> = {};

export function getLegendThemeTemplates() {
    return LEGEND_THEME_TEMPLATES;
}

export function getLegendKeys() {
    return LEGEND_KEYS;
}
