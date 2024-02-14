import type { LegendConstructor } from '../../module/coreModules';
import type { ModuleContext } from '../../module/moduleContext';
import type { ChartLegendType } from '../legendDatum';

interface LegendRegistryRecord {
    optionsKey: string;
    instanceConstructor: LegendConstructor;
    themeTemplate?: object;
}

class LegendRegistry {
    private legendMap = new Map<ChartLegendType, LegendRegistryRecord>();

    register(legendType: ChartLegendType, { optionsKey, instanceConstructor, themeTemplate }: LegendRegistryRecord) {
        this.legendMap.set(legendType, { optionsKey, instanceConstructor, themeTemplate });
    }

    create(legendType: ChartLegendType, moduleContext: ModuleContext) {
        const LegendConstructor = this.legendMap.get(legendType)?.instanceConstructor;
        if (LegendConstructor) {
            return new LegendConstructor(moduleContext);
        }
        throw new Error(`AG Charts - unknown legend type: ${legendType}`);
    }

    getThemeTemplates() {
        return Array.from(this.legendMap.entries()).reduce(
            (result, [legendType, record]) => {
                result[legendType] = record.themeTemplate;
                return result;
            },
            {} as Record<ChartLegendType, object | undefined>
        );
    }

    getKeys() {
        return Array.from(this.legendMap.entries()).reduce(
            (result, [legendType, record]) => {
                result[legendType] = record.optionsKey;
                return result;
            },
            {} as Record<ChartLegendType, string>
        );
    }
}

export const legendRegistry = new LegendRegistry();
