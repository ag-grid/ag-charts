import type { SeriesFactory, SeriesModule, SeriesTooltipDefaults } from '../../module/coreModules';
import type { SeriesPaletteFactory } from '../../module/coreModulesTypes';
import type { ModuleContext } from '../../module/moduleContext';
import { deepClone } from '../../util/json';
import { mergeDefaults } from '../../util/object';
import type { SeriesType } from '../mapping/types';
import type { ISeries } from '../series/seriesTypes';
import { chartTypes, publicChartTypes } from './chartTypes';

interface SeriesRegistryRecord {
    moduleFactory?: SeriesFactory;
    defaultAxes?: object[] | ((opts: {}) => object[]);
    tooltipDefaults?: SeriesTooltipDefaults;
    paletteFactory?: SeriesPaletteFactory<unknown>;
    solo?: boolean;
    groupable?: boolean;
    stackable?: boolean;
    stackedByDefault?: boolean;
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

    cloneDefaultAxes(seriesType: SeriesType, options: {}) {
        const defaultAxes = this.seriesMap.get(seriesType)?.defaultAxes;
        if (defaultAxes == null) return null;

        const axes = typeof defaultAxes === 'function' ? defaultAxes(options) : defaultAxes;
        return { axes: deepClone(axes) };
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
}

export const seriesRegistry = new SeriesRegistry();
