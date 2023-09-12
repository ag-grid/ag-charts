import type { LegendConstructor } from '../../util/module';
import type { ModuleContext } from '../../util/moduleContext';
import { Legend } from '../legend';
import type { ChartLegend } from '../legendDatum';

const LEGEND_FACTORIES: Record<string, LegendConstructor> = {
    category: Legend,
};

export function registerLegend(type: string, ctr: LegendConstructor) {
    if (LEGEND_FACTORIES[type]) {
        throw new Error(`AG Charts - already registered legend type: ${type}`);
    }

    LEGEND_FACTORIES[type] = ctr;
}

export function getLegend(type: string, ctx: ModuleContext): ChartLegend {
    if (LEGEND_FACTORIES[type]) {
        return new LEGEND_FACTORIES[type](ctx);
    }

    throw new Error(`AG Charts - unknown legend type: ${type}`);
}

const LEGEND_THEME_TEMPLATES: Record<string, {} | undefined> = {};

export function registerLegendThemeTemplate(legendProp: string, theme: {} | undefined) {
    LEGEND_THEME_TEMPLATES[legendProp] = theme;
}

export function getLegendThemeTemplates() {
    return LEGEND_THEME_TEMPLATES;
}
