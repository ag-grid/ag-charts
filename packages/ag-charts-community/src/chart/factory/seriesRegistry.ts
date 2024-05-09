import type { SeriesConstructor, SeriesModule } from '../../module/coreModules';
import type { SeriesPaletteFactory } from '../../module/coreModulesTypes';
import { enterpriseModule } from '../../module/enterpriseModule';
import type { ModuleContext } from '../../module/moduleContext';
import type {
    AgCartesianSeriesOptions,
    AgHierarchySeriesOptions,
    AgPolarSeriesOptions,
} from '../../options/agChartOptions';
import type { AgChartOptions } from '../../options/chart/chartBuilderOptions';
import type { AgTopologySeriesOptions } from '../../options/series/topology/topologyOptions';
import { deepClone } from '../../util/json';
import { mergeDefaults } from '../../util/object';
import type { SeriesType } from '../mapping/types';
import type { ISeries } from '../series/seriesTypes';
import { chartTypes, publicChartTypes } from './chartTypes';

export type SeriesOptions =
    | AgCartesianSeriesOptions
    | AgPolarSeriesOptions
    | AgHierarchySeriesOptions
    | AgTopologySeriesOptions;

interface SeriesRegistryRecord {
    instanceConstructor?: SeriesConstructor;
    defaultAxes?: object[];
    paletteFactory?: SeriesPaletteFactory;
    solo?: boolean;
    groupable?: boolean;
    stackable?: boolean;
    stackedByDefault?: boolean;
    swapDefaultAxesCondition?: (opts: any) => boolean;
}

export class SeriesRegistry {
    private readonly seriesMap = new Map<SeriesType, SeriesRegistryRecord>();
    private readonly themeTemplates = new Map<string, { community: object; enterprise: object }>();

    register(
        seriesType: NonNullable<SeriesType>,
        {
            chartTypes: [chartType],
            instanceConstructor,
            defaultAxes,
            themeTemplate,
            enterpriseThemeTemplate,
            paletteFactory,
            solo,
            stackable,
            groupable,
            stackedByDefault,
            swapDefaultAxesCondition,
            hidden,
        }: SeriesModule<any, any>
    ) {
        this.setThemeTemplate(seriesType, themeTemplate, enterpriseThemeTemplate);
        this.seriesMap.set(seriesType, {
            instanceConstructor,
            defaultAxes,
            paletteFactory,
            solo,
            stackable,
            groupable,
            stackedByDefault,
            swapDefaultAxesCondition,
        });
        chartTypes.set(seriesType, chartType);
        if (!hidden) {
            publicChartTypes.set(seriesType, chartType);
        }
    }

    create(seriesType: SeriesType, moduleContext: ModuleContext): ISeries<any, any> {
        const SeriesConstructor = this.seriesMap.get(seriesType)?.instanceConstructor;
        if (SeriesConstructor) {
            return new SeriesConstructor(moduleContext);
        }
        throw new Error(`AG Charts - unknown series type: ${seriesType}`);
    }

    cloneDefaultAxes(seriesType: SeriesType) {
        const defaultAxes = this.seriesMap.get(seriesType)?.defaultAxes;
        return defaultAxes ? { axes: deepClone(defaultAxes) } : null;
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
