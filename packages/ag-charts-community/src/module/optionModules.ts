import { CartesianChart } from '../chart/cartesianChart';
import type { Chart, ChartSpecialOverrides } from '../chart/chart';
import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { PropertyDefinition } from '../chart/data/dataModel';
import { CHART_TYPES } from '../chart/factory/chartTypes';
import { isEnterpriseSeriesType } from '../chart/factory/expectedEnterpriseModules';
import { getSeriesDefaults, isDefaultAxisSwapNeeded, isSoloSeries } from '../chart/factory/seriesTypes';
import { HierarchyChart } from '../chart/hierarchyChart';
import type { SeriesOptions } from '../chart/mapping/prepareSeries';
import { getChartTheme } from '../chart/mapping/themes';
import {
    isAgCartesianChartOptions,
    isAgHierarchyChartOptions,
    isAgPolarChartOptions,
    isSeriesOptionType,
} from '../chart/mapping/types';
import { PolarChart } from '../chart/polarChart';
import type { SeriesNodeDatum } from '../chart/series/seriesTypes';
import type { ChartTheme } from '../chart/themes/chartTheme';
import type { AgChartOptions } from '../options/chart/chartBuilderOptions';
import type { AgCartesianSeriesOptions } from '../options/series/cartesian/cartesianSeriesTypes';
import type { AgHierarchySeriesOptions } from '../options/series/hierarchy/hierarchyOptions';
import type { AgPolarSeriesOptions } from '../options/series/polar/polarOptions';
import type { Point } from '../scene/point';
import { groupBy, unique } from '../util/array';
import { deepClone, jsonWalk } from '../util/json';
import { Logger } from '../util/logger';
import { mergeDefaults } from '../util/object';
import type { BaseModule, ModuleInstance } from './baseModule';
import { MODULE_CONFLICTS, type Module, REGISTERED_MODULES } from './module';
import type { AxisContext, ModuleContextWithParent, SeriesContext } from './moduleContext';

export type SeriesType = NonNullable<
    AgCartesianSeriesOptions['type'] | AgPolarSeriesOptions['type'] | AgHierarchySeriesOptions['type']
>;

export type PickNodeDatumResult = { datum: SeriesNodeDatum; distanceSquared: number } | undefined;

type AxisType = 'category' | 'number' | 'log' | 'time';

export interface AxisOptionModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'axis-option';
    axisTypes: AxisType[];
    instanceConstructor: new (ctx: ModuleContextWithParent<AxisContext>) => M;
    themeTemplate: { [K in AxisType]?: object };
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
    activeTheme?: ChartTheme;
    userOptions?: Partial<T>;
    seriesDefaults?: T;
    processedOptions?: T;
    specialOptions?: ChartSpecialOverrides;

    protected readonly activeModules = new Set<BaseModule>();

    private getOptionsThemeConfig(options: T) {
        const optionsType = this.optionsType(options);
        return this.activeTheme?.config[optionsType] ?? {};
    }

    private getOptionsDefaults(options: T) {
        const optionsType = this.optionsType(options);
        const seriesDefaults = getSeriesDefaults<T>(optionsType, options.series![0]);

        if (isDefaultAxisSwapNeeded(options)) {
            this.swapAxesPosition(seriesDefaults);
        }

        return this.activeTheme!.templateTheme(seriesDefaults);
    }

    setUserOptions(userOptions: T) {
        const options = deepClone(userOptions, { shallow: ['data'] });

        this.sanityCheckAndCleanup(options);

        this.activeTheme = getChartTheme(options.theme);
        const { axes = {}, series = [], ...themeDefaults } = this.getOptionsThemeConfig(options);

        // const userPalette = isObject(options.theme)
        //     ? jsonMerge([this.activeTheme.palette, options.theme.palette])
        //     : null;

        const seriesDefaults = this.getOptionsDefaults(options);

        this.userOptions = options;
        this.seriesDefaults = seriesDefaults;
        this.processedOptions = mergeDefaults(options, themeDefaults, seriesDefaults) as T;
        // this.processedOptions = mergeDefaults(options, this.processedOptions) as T;
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
                this.testModuleChartType(chart, moduleDef) &&
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

    protected optionsType(options: Partial<T>) {
        return options.series?.[0]?.type ?? 'line';
    }

    protected applyChartModules() {}

    protected sanityCheckAndCleanup(options: Partial<T>) {
        // output warnings and correct options when required
        this.deprecationWarnings(options);
        this.seriesTypeIntegrity(options);
        this.soloSeriesIntegrity(options);
        this.disableConflictedModules(options);
        this.removeDisabledOptions(options);
    }

    protected swapAxesPosition(options: T) {
        if (isAgCartesianChartOptions(options)) {
            const [axis0, axis1] = options.axes ?? [];
            options.axes = [
                { ...axis0, position: axis1.position },
                { ...axis1, position: axis0.position },
            ];
        }
    }

    protected getOptionsDefaultSeriesType(options: T): string | null {
        if (isAgCartesianChartOptions(options)) {
            return 'line';
        } else if (isAgHierarchyChartOptions(options)) {
            return 'treemap';
        } else if (isAgPolarChartOptions(options)) {
            return 'pie';
        }
        return null;
    }

    private testModuleChartType(chart: Chart, { chartTypes }: Module) {
        return (
            (chart instanceof CartesianChart && chartTypes.includes('cartesian')) ||
            (chart instanceof PolarChart && chartTypes.includes('polar')) ||
            (chart instanceof HierarchyChart && chartTypes.includes('hierarchy'))
        );
    }

    private deprecationWarnings(options: Partial<T>) {
        const deprecatedArrayProps = { yKeys: 'yKey', yNames: 'yName' };
        Object.entries(deprecatedArrayProps).forEach(([oldProp, newProp]) => {
            if (options.series?.some((s: any) => s[oldProp] != null)) {
                Logger.warnOnce(
                    `Property [series.${oldProp}] is deprecated, please use [series.${newProp}] and multiple series instead.`
                );
            }
        });
    }

    private seriesTypeIntegrity(options: Partial<T>) {
        const series = (options.series ?? []) as SeriesOptions[];
        options.series = series.filter(({ type }) => {
            if (type == null || isSeriesOptionType(type) || isEnterpriseSeriesType(type)) {
                return true;
            }
            Logger.warn(
                `AG Charts - unknown series type: ${type}; expected one of: ${CHART_TYPES.seriesTypes.join(', ')}`
            );
        }) as T['series'];
    }

    private soloSeriesIntegrity(options: Partial<T>) {
        const series: SeriesOptions[] | undefined = options.series;
        if (series && series.length > 1 && series.some((series) => isSoloSeries(series.type))) {
            const mainSeriesType = this.optionsType(options);
            if (isSoloSeries(mainSeriesType)) {
                Logger.warn(
                    `series[0] of type '${mainSeriesType}' is incompatible with other series types. Only processing series[0]`
                );
                options.series = series.slice(0, 1) as T['series'];
            } else {
                const { solo, nonSolo } = groupBy(series, (s) => (isSoloSeries(s.type) ? 'solo' : 'nonSolo'));
                const rejects = unique(solo!.map((s) => s.type)).join(', ');
                Logger.warn(`Unable to mix these series types with the lead series type: ${rejects}`);
                options.series = nonSolo as T['series'];
            }
        }
    }

    private disableConflictedModules(options: Partial<T>) {
        type PossibleObject = { enabled?: boolean } | undefined;

        for (const [source, conflicts] of MODULE_CONFLICTS.entries()) {
            const sourceOptions = options[source] as PossibleObject;
            if (!sourceOptions?.enabled) {
                continue;
            }
            for (const conflict of conflicts) {
                const conflictOptions = options[conflict] as PossibleObject;
                if (conflictOptions?.enabled) {
                    Logger.warnOnce(
                        `the [${source}] module can not be used at the same time as [${conflict}], it will be disabled.`
                    );
                    conflictOptions.enabled = false;
                }
            }
        }
    }

    private removeDisabledOptions(options: Partial<T>) {
        // Remove configurations from all option objects with a `false` value for the `enabled` property.
        jsonWalk(
            options,
            (optionsNode) => {
                if ('enabled' in optionsNode && optionsNode.enabled === false) {
                    Object.keys(optionsNode).forEach((key) => {
                        if (key === 'enabled') return;
                        delete optionsNode[key as keyof T];
                    });
                }
            },
            { skip: ['data', 'theme'] }
        );
    }
}
