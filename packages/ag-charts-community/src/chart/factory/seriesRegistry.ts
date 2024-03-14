import type { SeriesConstructor, SeriesModule } from '../../module/coreModules';
import type { SeriesPaletteFactory } from '../../module/coreModulesTypes';
import { enterpriseModule } from '../../module/enterpriseModule';
import type { ModuleContext } from '../../module/moduleContext';
import type {
    AgCartesianSeriesOptions,
    AgHierarchySeriesOptions,
    AgPolarSeriesOptions,
    InteractionRange,
} from '../../options/agChartOptions';
import type { AgChartOptions } from '../../options/chart/chartBuilderOptions';
import type { AgTopologySeriesOptions } from '../../options/series/topology/topologyOptions';
import { deepClone } from '../../util/json';
import { mergeDefaults } from '../../util/object';
import type { SeriesType } from '../mapping/types';
import type { ISeries } from '../series/seriesTypes';
import { chartTypes } from './chartTypes';

export type SeriesOptions =
    | AgCartesianSeriesOptions
    | AgPolarSeriesOptions
    | AgHierarchySeriesOptions
    | AgTopologySeriesOptions;

interface SeriesRegistryRecord {
    instanceConstructor?: SeriesConstructor;
    seriesDefaults?: object;
    tooltipDefaults?: { range: InteractionRange };
    paletteFactory?: SeriesPaletteFactory;
    solo?: boolean;
    groupable?: boolean;
    stackable?: boolean;
    stackedByDefault?: boolean;
    swapDefaultAxesCondition?: (opts: any) => boolean;
}

export class SeriesRegistry {
    private seriesMap = new Map<SeriesType, SeriesRegistryRecord>();
    private themeTemplates = new Map<string, { community: object; enterprise: object }>();

    register(
        seriesType: NonNullable<SeriesType>,
        {
            chartTypes: [chartType],
            instanceConstructor,
            seriesDefaults,
            tooltipDefaults,
            themeTemplate,
            enterpriseThemeTemplate,
            paletteFactory,
            solo,
            stackable,
            groupable,
            stackedByDefault,
            swapDefaultAxesCondition,
        }: SeriesModule<any>
    ) {
        this.setThemeTemplate(seriesType, themeTemplate, enterpriseThemeTemplate);
        this.seriesMap.set(seriesType, {
            instanceConstructor,
            seriesDefaults,
            tooltipDefaults,
            paletteFactory,
            solo,
            stackable,
            groupable,
            stackedByDefault,
            swapDefaultAxesCondition,
        });
        chartTypes.set(seriesType, chartType);
    }

    create(seriesType: SeriesType, moduleContext: ModuleContext): ISeries<any, any> {
        const SeriesConstructor = this.seriesMap.get(seriesType)?.instanceConstructor;
        if (SeriesConstructor) {
            return new SeriesConstructor(moduleContext);
        }
        throw new Error(`AG Charts - unknown series type: ${seriesType}`);
    }

    cloneDefaults(seriesType: SeriesType) {
        return deepClone(this.seriesMap.get(seriesType)?.seriesDefaults ?? {});
    }

    setThemeTemplate(seriesType: NonNullable<SeriesType>, themeTemplate: {}, enterpriseThemeTemplate = {}) {
        const currentTemplate = this.themeTemplates.get(seriesType);
        this.themeTemplates.set(seriesType, {
            community: mergeDefaults(themeTemplate, currentTemplate?.community),
            enterprise: mergeDefaults(enterpriseThemeTemplate, themeTemplate, currentTemplate?.community),
        });
    }

    getThemeTemplate(seriesType: string) {
        const themeTemplate = this.themeTemplates.get(seriesType);
        return enterpriseModule.isEnterprise ? themeTemplate?.enterprise : themeTemplate?.community;
    }

    getPaletteFactory(seriesType: SeriesType) {
        return this.seriesMap.get(seriesType)?.paletteFactory;
    }

    getTooltipDefaults(seriesType: SeriesType) {
        return this.seriesMap.get(seriesType)?.tooltipDefaults;
    }

    isSolo(seriesType: SeriesType) {
        return this.seriesMap.get(seriesType)?.solo ?? false;
    }

    isGroupable(seriesType: SeriesType) {
        return this.seriesMap.get(seriesType)?.groupable ?? false;
    }

    isStackable(seriesType: SeriesType) {
        return this.seriesMap.get(seriesType)?.stackable ?? false;
    }

    isStackedByDefault(seriesType: SeriesType) {
        return this.seriesMap.get(seriesType)?.stackedByDefault ?? false;
    }

    isDefaultAxisSwapNeeded(options: AgChartOptions) {
        let result: boolean | undefined;

        for (const series of options.series ?? []) {
            const { type = 'line' } = series;
            const isDefaultAxisSwapped = this.seriesMap.get(type)?.swapDefaultAxesCondition?.(series);

            if (isDefaultAxisSwapped != null) {
                if (result != null && result != isDefaultAxisSwapped) {
                    // TODO change to a warning
                    throw new Error('AG Charts - The provided series have incompatible directions');
                }

                result = isDefaultAxisSwapped;
            }
        }

        return result;
    }
}

export const seriesRegistry = new SeriesRegistry();
