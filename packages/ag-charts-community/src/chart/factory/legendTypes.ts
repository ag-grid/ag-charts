import type { LegendConstructor } from '../../module/coreModules';
import type { ModuleContext } from '../../module/moduleContext';
import type { ChartLegend, ChartLegendType } from '../legendDatum';

const LEGEND_FACTORIES: Partial<Record<ChartLegendType, LegendConstructor>> = {};

const LEGEND_KEYS: Partial<Record<ChartLegendType, string>> = {};

export function registerLegend(type: ChartLegendType, key: string, ctr: LegendConstructor, theme: {} | undefined) {
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
