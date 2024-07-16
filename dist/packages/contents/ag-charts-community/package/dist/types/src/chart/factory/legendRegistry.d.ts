import type { LegendConstructor } from '../../module/coreModules';
import type { ModuleContext } from '../../module/moduleContext';
import type { ChartLegendType } from '../legendDatum';
interface LegendRegistryRecord {
    optionsKey: string;
    instanceConstructor: LegendConstructor;
}
type LegendRegistryOptions = LegendRegistryRecord & {
    themeTemplate?: object;
};
export declare class LegendRegistry {
    private legendMap;
    private themeTemplates;
    register(legendType: ChartLegendType, { optionsKey, instanceConstructor, themeTemplate }: LegendRegistryOptions): void;
    create(legendType: ChartLegendType, moduleContext: ModuleContext): import("../legendDatum").ChartLegend;
    getThemeTemplates(): {
        [k: string]: object | undefined;
    };
    getKeys(): Record<ChartLegendType, string>;
}
export declare const legendRegistry: LegendRegistry;
export {};
