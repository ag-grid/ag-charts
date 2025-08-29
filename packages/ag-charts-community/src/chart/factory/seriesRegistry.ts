import { distribute } from 'ag-charts-core';
import type { DatumDefault } from 'ag-charts-types';

import type { SeriesDefaultAxes, SeriesFactory, SeriesModule, SeriesPredictAxis } from '../../module/coreModules';
import type { RequiredSeriesType } from '../../module/coreModulesTypes';
import type { ModuleContext } from '../../module/moduleContext';
import { deepClone } from '../../util/json';
import { mergeDefaults } from '../../util/object';
import { ChartAxisDirection } from '../chartAxisDirection';
import type { SeriesType } from '../mapping/types';
import type { ISeries } from '../series/seriesTypes';
import { chartTypes, publicChartTypes } from './chartTypes';

interface SeriesRegistryRecord {
    moduleFactory?: SeriesFactory;
    predictAxis?: (
        direction: ChartAxisDirection,
        datum: DatumDefault,
        seriesOptions: any
    ) => SeriesPredictAxis<RequiredSeriesType> | undefined;
    defaultAxes?: SeriesDefaultAxes<RequiredSeriesType>;
    solo?: boolean;
    groupable?: boolean;
    stackable?: boolean;
    stackedByDefault?: boolean;
}

class SeriesRegistry {
    private readonly seriesMap = new Map<SeriesType, SeriesRegistryRecord>();
    private readonly themeTemplates = new Map<string, object>();

    register(
        seriesType: NonNullable<SeriesType>,
        {
            chartTypes: [chartType],
            moduleFactory,
            predictAxis,
            defaultAxes,
            themeTemplate,
            solo,
            stackable,
            groupable,
            stackedByDefault,
            hidden,
        }: SeriesModule
    ) {
        this.setThemeTemplate(seriesType, themeTemplate);
        this.seriesMap.set(seriesType, {
            moduleFactory,
            predictAxis,
            defaultAxes,
            solo,
            stackable,
            groupable,
            stackedByDefault,
        });
        chartTypes.set(seriesType, chartType);
        if (!hidden) {
            publicChartTypes.set(seriesType, chartType);
        }
    }

    create(seriesType: SeriesType, moduleContext: ModuleContext): ISeries<any, any, any> {
        const seriesFactory = this.seriesMap.get(seriesType)?.moduleFactory;
        if (seriesFactory) {
            return seriesFactory(moduleContext);
        }
        throw new Error(`AG Charts - unknown series type: ${seriesType}`);
    }

    predictAxes(
        seriesType: RequiredSeriesType,
        userSeriesOptions?: any,
        data?: DatumDefault[]
    ): SeriesPredictAxis<RequiredSeriesType>[] | undefined {
        const seriesData: DatumDefault[] = userSeriesOptions?.data ?? data;
        if (!seriesData?.length) return;

        const predictAxis = this.seriesMap.get(seriesType)?.predictAxis;
        if (!predictAxis) return;

        const axes = new Map<ChartAxisDirection, SeriesPredictAxis<RequiredSeriesType>>();

        const indices = distribute(0, seriesData.length - 1, 5);
        for (const index of indices) {
            const datum = seriesData[index];
            for (const direction of Object.values(ChartAxisDirection)) {
                const axis = predictAxis(direction, datum, userSeriesOptions);
                if (!axis) continue;

                if (!axes.has(direction)) {
                    axes.set(direction, axis);
                    continue;
                }

                // Check for stability in the predicted axis for this direction, if the prediction is unstable then
                // return and fallback to the defaults.
                const prevAxis = axes.get(direction)!;
                for (const key of Object.keys(prevAxis)) {
                    if ((prevAxis as any)[key] !== (axis as any)[key]) {
                        return;
                    }
                }
            }
        }

        return Array.from(axes.values());
    }

    cloneDefaultAxes(seriesType: SeriesType) {
        const defaultAxes = this.seriesMap.get(seriesType)?.defaultAxes;
        if (defaultAxes == null) return null;
        return deepClone(defaultAxes);
    }

    setThemeTemplate(seriesType: NonNullable<SeriesType>, themeTemplate: object) {
        const currentTemplate = this.themeTemplates.get(seriesType);
        this.themeTemplates.set(seriesType, mergeDefaults(themeTemplate, currentTemplate));
    }

    getThemeTemplate(seriesType: string) {
        return this.themeTemplates.get(seriesType);
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
}

export const seriesRegistry = new SeriesRegistry();
