import type { LegendFactory } from '../../module/coreModules';
import type { ModuleContext } from '../../module/moduleContext';
import type { ChartLegendType } from '../legendDatum';

interface LegendRegistryRecord {
    optionsKey: string;
    moduleFactory: LegendFactory;
}

type LegendRegistryOptions = LegendRegistryRecord & { themeTemplate?: object };

export class LegendRegistry {
    private readonly legendMap = new Map<ChartLegendType, LegendRegistryRecord>();
    private readonly themeTemplates = new Map<string, object | undefined>();

    register(legendType: ChartLegendType, { optionsKey, moduleFactory, themeTemplate }: LegendRegistryOptions) {
        this.legendMap.set(legendType, { optionsKey, moduleFactory });
        this.themeTemplates.set(optionsKey, themeTemplate);
    }

    create(legendType: ChartLegendType, moduleContext: ModuleContext) {
        const legendFactory = this.legendMap.get(legendType)?.moduleFactory;
        if (legendFactory) {
            return legendFactory(moduleContext);
        }
        throw new Error(`AG Charts - unknown legend type: ${legendType}`);
    }

    getThemeTemplates() {
        return Object.fromEntries(this.themeTemplates);
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
