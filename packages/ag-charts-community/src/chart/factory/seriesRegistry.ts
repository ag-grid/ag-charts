import type {
    AgCartesianSeriesOptions,
    AgChartOptions,
    AgFlowProportionSeriesOptions,
    AgGaugeSeriesOptions,
    AgHierarchySeriesOptions,
    AgPolarSeriesOptions,
    AgTopologySeriesOptions,
} from 'ag-charts-types';

import type { SeriesFactory, SeriesModule, SeriesTooltipDefaults } from '../../module/coreModules';
import type { SeriesPaletteFactory } from '../../module/coreModulesTypes';
import type { ModuleContext } from '../../module/moduleContext';
import { deepClone } from '../../util/json';
import { mergeDefaults } from '../../util/object';
import type { SeriesType } from '../mapping/types';
import type { ISeries } from '../series/seriesTypes';
import { chartTypes, publicChartTypes } from './chartTypes';

export type SeriesOptions =
    | AgCartesianSeriesOptions
    | AgPolarSeriesOptions
    | AgHierarchySeriesOptions
    | AgTopologySeriesOptions
    | AgFlowProportionSeriesOptions
    | AgGaugeSeriesOptions;

interface SeriesRegistryRecord {
    moduleFactory?: SeriesFactory;
    defaultAxes?: object[];
    tooltipDefaults?: SeriesTooltipDefaults;
    paletteFactory?: SeriesPaletteFactory;
    solo?: boolean;
    groupable?: boolean;
    stackable?: boolean;
    stackedByDefault?: boolean;
    swapDefaultAxesCondition?: (opts: any) => boolean;
}

export class SeriesRegistry {
    private readonly seriesMap = new Map<SeriesType, SeriesRegistryRecord>();
    private readonly themeTemplates = new Map<string, object>();

    register(
        seriesType: NonNullable<SeriesType>,
        {
            chartTypes: [chartType],
            moduleFactory,
            tooltipDefaults,
            defaultAxes,
            themeTemplate,
            paletteFactory,
            solo,
            stackable,
            groupable,
            stackedByDefault,
            swapDefaultAxesCondition,
            hidden,
        }: SeriesModule<any, any>
    ) {
        this.setThemeTemplate(seriesType, themeTemplate);
        this.seriesMap.set(seriesType, {
            moduleFactory,
            tooltipDefaults,
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
        const seriesFactory = this.seriesMap.get(seriesType)?.moduleFactory;
        if (seriesFactory) {
            return seriesFactory(moduleContext);
        }
        throw new Error(`AG Charts - unknown series type: ${seriesType}`);
    }

    cloneDefaultAxes(seriesType: SeriesType) {
        const defaultAxes = this.seriesMap.get(seriesType)?.defaultAxes;
        return defaultAxes ? { axes: deepClone(defaultAxes) } : null;
    }

    setThemeTemplate(seriesType: NonNullable<SeriesType>, themeTemplate: {}) {
        const currentTemplate = this.themeTemplates.get(seriesType);
        this.themeTemplates.set(seriesType, mergeDefaults(themeTemplate, currentTemplate));
    }

    getThemeTemplate(seriesType: string) {
        return this.themeTemplates.get(seriesType);
    }

    getPaletteFactory(seriesType: SeriesType) {
        return this.seriesMap.get(seriesType)?.paletteFactory;
    }

    getTooltipDefauls(seriesType: SeriesType) {
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
