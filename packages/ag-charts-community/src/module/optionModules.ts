import { CartesianChart } from '../chart/cartesianChart';
import type { Chart, ChartSpecialOverrides } from '../chart/chart';
import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { PropertyDefinition } from '../chart/data/dataModel';
import { CHART_TYPES } from '../chart/factory/chartTypes';
import { isEnterpriseSeriesType } from '../chart/factory/expectedEnterpriseModules';
import { getSeriesDefaults, isSoloSeries } from '../chart/factory/seriesTypes';
import { HierarchyChart } from '../chart/hierarchyChart';
import type { SeriesOptions } from '../chart/mapping/prepareSeries';
import { isSeriesOptionType } from '../chart/mapping/types';
import { PolarChart } from '../chart/polarChart';
import type { SeriesNodeDatum } from '../chart/series/seriesTypes';
import type { AgChartOptions } from '../options/chart/chartBuilderOptions';
import type { AgCartesianSeriesOptions } from '../options/series/cartesian/cartesianSeriesTypes';
import type { AgHierarchySeriesOptions } from '../options/series/hierarchy/hierarchyOptions';
import type { AgPolarSeriesOptions } from '../options/series/polar/polarOptions';
import type { Point } from '../scene/point';
import { unique } from '../util/array';
import { Logger } from '../util/logger';
import { mergeDefaults } from '../util/object';
import type { BaseModule, ModuleInstance } from './baseModule';
import { type Module, REGISTERED_MODULES } from './module';
import type { AxisContext, ModuleContextWithParent, SeriesContext } from './moduleContext';

export type SeriesType = NonNullable<
    AgCartesianSeriesOptions['type'] | AgPolarSeriesOptions['type'] | AgHierarchySeriesOptions['type']
>;

export type PickNodeDatumResult = { datum: SeriesNodeDatum; distanceSquared: number } | undefined;

export interface AxisOptionModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'axis-option';
    axisTypes: ('category' | 'number' | 'log' | 'time')[];
    instanceConstructor: new (ctx: ModuleContextWithParent<AxisContext>) => M;
    themeTemplate: {};
}

export interface SeriesOptionInstance extends ModuleInstance {
    pickNodeExact(point: Point): PickNodeDatumResult;
    pickNodeNearest(point: Point): PickNodeDatumResult;
    pickNodeMainAxisFirst(point: Point): PickNodeDatumResult;

    getPropertyDefinitions(opts: { isContinuousX: boolean; isContinuousY: boolean }): PropertyDefinition<unknown>[];
    getDomain(direction: ChartAxisDirection): any[];
    getTooltipParams(): object;
}

export interface SeriesOptionModule<M extends SeriesOptionInstance = SeriesOptionInstance> extends BaseModule {
    type: 'series-option';
    seriesTypes: readonly SeriesType[];
    instanceConstructor: new (ctx: SeriesContext) => M;
    themeTemplate: {};
}

export class ChartOptions<T extends AgChartOptions> {
    processedOptions?: T;
    specialOptions?: ChartSpecialOverrides;
    themeOptions?: Partial<T>;
    userOptions?: Partial<T>;

    protected readonly activeModules = new Set<BaseModule>();

    setUserOptions(userOptions: Partial<T>) {
        this.sanityCheck(userOptions);

        // Determine type and ensure it's explicit in the options' config.
        // const type = this.optionsType(userOptions);

        for (const { type: seriesType = 'line' } of userOptions.series ?? []) {
            this.validateSeriesType(seriesType);
        }

        this.processedOptions = mergeDefaults(userOptions, this.processedOptions) as T;
    }

    setSpecialOptions(specialOptions: ChartSpecialOverrides) {
        this.specialOptions = specialOptions;
    }

    applyChartOptions(chart: Chart) {
        let modulesChanged = false;
        for (const moduleDef of REGISTERED_MODULES) {
            if (moduleDef.type !== 'root' && moduleDef.type !== 'legend') {
                continue;
            }

            const shouldBeEnabled =
                this.validateModuleChartType(chart, moduleDef) &&
                this.processedOptions?.[moduleDef.optionsKey as keyof T] != null;
            const isEnabled = chart.isModuleEnabled(moduleDef);

            if (shouldBeEnabled === isEnabled) {
                continue;
            }

            if (shouldBeEnabled) {
                chart.addModule(moduleDef);
            } else {
                chart.removeModule(moduleDef);
            }

            modulesChanged = true;
        }

        return modulesChanged;
    }

    protected sanityCheck(options: Partial<T>) {
        // check deprecated options
        const deprecatedArrayProps = { yKeys: 'yKey', yNames: 'yName' };
        Object.entries(deprecatedArrayProps).forEach(([oldProp, newProp]) => {
            if (options.series?.some((s: any) => s[oldProp] != null)) {
                Logger.warnOnce(
                    `Property [series.${oldProp}] is deprecated, please use [series.${newProp}] and multiple series instead.`
                );
            }
        });

        // check solo series types
        const series: SeriesOptions[] | undefined = options.series;
        if (series && series.length > 1 && series.some((series) => isSoloSeries(series.type))) {
            const firstSeriesType = series[0].type ?? 'line';
            if (isSoloSeries(firstSeriesType)) {
                Logger.warn(
                    `series[0] of type '${firstSeriesType}' is incompatible with other series types. Only processing series[0]`
                );
                options.series = series.slice(0, 1) as T['series'];
            } else {
                const rejects = unique(series.filter((s) => isSoloSeries(s.type)).map((s) => s.type));
                Logger.warnOnce(`Unable to mix these series types with the lead series type: ${rejects.join(', ')}`);
                options.series = series.filter((s) => !isSoloSeries(s.type)) as T['series'];
            }
        }
    }

    protected validateSeriesType(type: string) {
        if (!isSeriesOptionType(type) && !isEnterpriseSeriesType(type) && !getSeriesDefaults(type)) {
            throw new Error(
                `AG Charts - unknown series type: ${type}; expected one of: ${CHART_TYPES.seriesTypes.join(', ')}`
            );
        }
    }

    protected optionsType(options: Partial<T>) {
        return options.series?.[0]?.type ?? 'line';
    }

    protected applyChartModules() {}

    private validateModuleChartType(chart: Chart, { chartTypes }: Module) {
        return (
            (chart instanceof CartesianChart && chartTypes.includes('cartesian')) ||
            (chart instanceof PolarChart && chartTypes.includes('polar')) ||
            (chart instanceof HierarchyChart && chartTypes.includes('hierarchy'))
        );
    }
}
