import type { ChartSpecialOverrides } from '../chart/chart';
import type { ChartAxisDirection } from '../chart/chartAxisDirection';
import type { PropertyDefinition } from '../chart/data/dataModel';
import { CHART_TYPES } from '../chart/factory/chartTypes';
import { isEnterpriseSeriesType } from '../chart/factory/expectedEnterpriseModules';
import { removeUsedEnterpriseOptions } from '../chart/factory/processEnterpriseOptions';
import {
    getSeriesDefaults,
    isDefaultAxisSwapNeeded,
    isGroupableSeries,
    isSeriesStackedByDefault,
    isSoloSeries,
    isStackableSeries,
} from '../chart/factory/seriesTypes';
import type { SeriesOptions } from '../chart/mapping/prepareSeries';
import { getChartTheme } from '../chart/mapping/themes';
import {
    isAgCartesianChartOptions,
    isAgHierarchyChartOptions,
    isAgPolarChartOptions,
    isSeriesOptionType,
} from '../chart/mapping/types';
import type { SeriesNodeDatum } from '../chart/series/seriesTypes';
import type { ChartTheme } from '../chart/themes/chartTheme';
import type { AgChartOptions } from '../options/chart/chartBuilderOptions';
import { type AgTooltipPositionOptions, AgTooltipPositionType } from '../options/chart/tooltipOptions';
import type { AgCartesianSeriesOptions } from '../options/series/cartesian/cartesianSeriesTypes';
import type { AgHierarchySeriesOptions } from '../options/series/hierarchy/hierarchyOptions';
import type { AgPolarSeriesOptions } from '../options/series/polar/polarOptions';
import type { Point } from '../scene/point';
import { groupBy, unique } from '../util/array';
import { deepClone, jsonWalk } from '../util/json';
import { Logger } from '../util/logger';
import { mergeDefaults } from '../util/object';
import { isArray, isEnumValue, isFiniteNumber, isPlainObject } from '../util/type-guards';
import { isString } from '../util/value';
import type { BaseModule, ModuleInstance } from './baseModule';
import { enterpriseModule } from './enterpriseModule';
import { MODULE_CONFLICTS } from './module';
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

type GroupingOptions = { grouped?: boolean; stacked?: boolean; stackGroup?: string };
type GroupingSeriesOptions = SeriesOptions & GroupingOptions & { xKey: string };

export class ChartOptions<T extends AgChartOptions = AgChartOptions> {
    activeTheme?: ChartTheme;
    userOptions?: Partial<T>;
    seriesDefaults?: T;
    processedOptions?: T;
    specialOptions?: ChartSpecialOverrides;

    protected readonly activeModules = new Set<BaseModule>();

    setUserOptions(userOptions: T, specialOptions?: ChartSpecialOverrides) {
        const cloneOptions = { shallow: ['data'] };
        const options = deepClone(userOptions, cloneOptions);
        const mainOptionsType = this.optionsType(options);

        this.sanityCheckAndCleanup(options);

        this.userOptions = options;
        this.specialOptions = specialOptions;
        this.activeTheme = getChartTheme(options.theme);
        this.seriesDefaults = this.getOptionsDefaults(options);

        const {
            axes: axesThemes = {},
            series: seriesThemes = [],
            ...themeDefaults
        } = this.getSeriesThemeConfig(mainOptionsType);

        // const userPalette = isObject(options.theme)
        //     ? jsonMerge([this.activeTheme.palette, options.theme.palette])
        //     : null;

        this.processedOptions = deepClone(
            mergeDefaults(this.userOptions, themeDefaults, this.seriesDefaults),
            cloneOptions
        ) as T;
        // this.processedOptions = mergeDefaults(options, this.processedOptions) as T;

        this.processSeriesOptions(this.processedOptions);

        if (!enterpriseModule.isEnterprise) {
            removeUsedEnterpriseOptions(this.processedOptions);
        }
    }

    getSeriesThemeConfig(seriesType: string) {
        return deepClone(this.activeTheme?.config[seriesType] ?? {});
    }

    getOptionsDefaults(options: T) {
        const optionsType = this.optionsType(options);
        const seriesDefaults = getSeriesDefaults<T>(optionsType, options.series![0]);

        if (isDefaultAxisSwapNeeded(options)) {
            this.swapAxesPosition(seriesDefaults);
        }

        return this.activeTheme?.templateTheme(seriesDefaults) ?? seriesDefaults;
    }

    // applyChartOptions(chart: Chart) {
    //     let modulesChanged = false;
    //     for (const moduleDef of REGISTERED_MODULES) {
    //         if (moduleDef.type !== 'root' && moduleDef.type !== 'legend') {
    //             continue;
    //         }
    //
    //         const shouldBeEnabled =
    //             this.testModuleChartType(chart, moduleDef) &&
    //             this.processedOptions?.[moduleDef.optionsKey as keyof T] != null;
    //         const isEnabled = chart.isModuleEnabled(moduleDef);
    //
    //         if (shouldBeEnabled === isEnabled) {
    //             continue;
    //         }
    //
    //         if (shouldBeEnabled) {
    //             chart.addModule(moduleDef);
    //         } else {
    //             chart.removeModule(moduleDef);
    //         }
    //
    //         modulesChanged = true;
    //     }
    //
    //     return modulesChanged;
    // }

    protected optionsType(options: Partial<T>) {
        return options.series?.[0]?.type ?? 'line';
    }

    // protected applyChartModules() {}

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

    protected processSeriesOptions(options: T) {
        const defaultSeriesType = this.getDefaultSeriesType(options);
        const defaultTooltipPosition = this.getTooltipPositionDefaults(options);

        options.series = options.series!.map((series) => {
            series.type ??= defaultSeriesType;
            const { innerLabels: innerLabelsTheme, ...seriesTheme } = this.getSeriesThemeConfig(series.type).series;
            const seriesOptions = mergeDefaults(
                this.getSeriesGroupingOptions(series),
                series,
                defaultTooltipPosition,
                seriesTheme
            );

            if (innerLabelsTheme && isArray(seriesOptions.innerLabels)) {
                seriesOptions.innerLabels = seriesOptions.innerLabels.map((innerLabel: object) =>
                    mergeDefaults(innerLabel, innerLabelsTheme)
                );
            }

            return seriesOptions;
        }) as T['series'];

        this.getSeriesGrouping();
    }

    protected getSeriesGroupingOptions(series: SeriesOptions & GroupingOptions) {
        const groupable = isGroupableSeries(series.type);
        const stackable = isStackableSeries(series.type);
        const stackedByDefault = isSeriesStackedByDefault(series.type);

        if (series.grouped && !groupable) {
            Logger.warnOnce(`Unsupported grouping of series type "${series.type}".`);
        }
        if ((series.stacked || series.stackGroup) && !stackable) {
            Logger.warnOnce(`Unsupported stacking of series type "${series.type}".`);
        }

        let { grouped, stacked } = series;

        stacked ??= (stackedByDefault || series.stackGroup != null) && !(groupable && grouped);
        grouped ??= true;

        return {
            stacked: stackable && stacked,
            grouped: groupable && grouped && !(stackable && stacked),
        };
    }

    protected getSeriesGroupId(series: GroupingSeriesOptions) {
        if (!series.stacked && !series.grouped) {
            return 'default-ag-charts-group';
        }
        return [series.type, series.xKey, series.stacked ? series.stackGroup ?? 'stacked' : 'grouped']
            .filter(Boolean)
            .join('-');
    }

    public getSeriesGrouping() {
        // enum GroupingType {
        //     DEFAULT = 'default',
        //     STACK = 'stack',
        //     GROUP = 'group',
        // }
        //
        // type SeriesGroup = { type: string; series: GroupingSeriesOptions[] };
        // const series = this.processedOptions?.series as GroupingSeriesOptions[];
        // const groupMap = new Map<string, SeriesGroup>();
        //
        // const getGroupRecord = (groupId: string) => {
        //     if (!groupMap.has(groupId)) {
        //         // const type = series.stacked ? 'stack' : series.grouped ? 'group' : 'ungrouped';
        //         groupMap.set(groupId, { type: 'stack', series: [] });
        //     }
        // };
        //
        // return series.reduce<SeriesGroup[]>((result, series) => {
        //     if (!series.stacked && !series.grouped) {
        //         result.push({ type: 'ungrouped' as const, opts: [series] });
        //         return result;
        //     }
        //
        //     const groupId = this.getSeriesGroupId(series);
        //
        //     const type = series.stacked ? 'stack' : series.grouped ? 'group' : 'ungrouped';
        //     if (!groupMap.has(groupId)) {
        //         groupMap.set(groupId, { type: 'stack', series: [] });
        //     }
        //
        //     if (series.stacked) {
        //         if (!groupMap.has(groupId)) {
        //             groupMap.set(groupId, { type: 'stack', series: [] });
        //         }
        //
        //         groupMap[groupId] ??= { type: 'stack', series: [] };
        //     } else if (series.grouped) {
        //         groupMap[groupId] ??= { type: 'group', series: [] };
        //     } else {
        //     }
        // return result;
        // }, []);
    }

    // private testModuleChartType(chart: Chart, { chartTypes }: Module) {
    //     return (
    //         (chart instanceof CartesianChart && chartTypes.includes('cartesian')) ||
    //         (chart instanceof PolarChart && chartTypes.includes('polar')) ||
    //         (chart instanceof HierarchyChart && chartTypes.includes('hierarchy'))
    //     );
    // }

    private getDefaultSeriesType(options: T): SeriesType {
        if (isAgCartesianChartOptions(options)) {
            return 'line';
        } else if (isAgHierarchyChartOptions(options)) {
            return 'treemap';
        } else if (isAgPolarChartOptions(options)) {
            return 'pie';
        }
        throw new Error('Invalid chart options type detected.');
    }

    private getTooltipPositionDefaults(options: T) {
        const position = options.tooltip?.position;
        if (!isPlainObject(position)) {
            return;
        }

        const { type, xOffset, yOffset } = position;
        const result: AgTooltipPositionOptions = {};

        if (isString(type) && isEnumValue(AgTooltipPositionType, type)) {
            result.type = type;
        }
        if (isFiniteNumber(xOffset)) {
            result.xOffset = xOffset;
        }
        if (isFiniteNumber(yOffset)) {
            result.yOffset = yOffset;
        }
        return { tooltip: { position: result } };
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
