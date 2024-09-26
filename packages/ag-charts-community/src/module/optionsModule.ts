import {
    type AgBaseAxisOptions,
    type AgCartesianAxisOptions,
    type AgChartOptions,
    type AgPolarAxisOptions,
    type AgPresetOptions,
    type AgPresetOverrides,
    type AgTooltipPositionOptions,
    AgTooltipPositionType,
} from 'ag-charts-types';

import { PRESETS } from '../api/preset/presets';
import { axisRegistry } from '../chart/factory/axisRegistry';
import { publicChartTypes } from '../chart/factory/chartTypes';
import { isEnterpriseSeriesType } from '../chart/factory/expectedEnterpriseModules';
import { removeUsedEnterpriseOptions } from '../chart/factory/processEnterpriseOptions';
import { seriesRegistry } from '../chart/factory/seriesRegistry';
import { getChartTheme } from '../chart/mapping/themes';
import {
    type SeriesOptionsTypes,
    isAgCartesianChartOptions,
    isAgFlowProportionChartOptions,
    isAgGaugeChartOptions,
    isAgHierarchyChartOptions,
    isAgPolarChartOptions,
    isAgPolarChartOptionsWithSeriesBasedLegend,
    isAgTopologyChartOptions,
    isAxisOptionType,
    isSeriesOptionType,
} from '../chart/mapping/types';
import { type ChartTheme } from '../chart/themes/chartTheme';
import { circularSliceArray, groupBy, unique } from '../util/array';
import { Debug } from '../util/debug';
import { setDocument, setWindow } from '../util/dom';
import { deepClone, jsonDiff, jsonWalk } from '../util/json';
import { Logger } from '../util/logger';
import { mergeArrayDefaults, mergeDefaults } from '../util/object';
import { isEnumValue, isFiniteNumber, isObject, isPlainObject, isString, isSymbol } from '../util/type-guards';
import type { AxisContext } from './axisContext';
import type { BaseModule, ModuleInstance } from './baseModule';
import { type PaletteType, paletteType } from './coreModulesTypes';
import { enterpriseModule } from './enterpriseModule';
import type { ModuleContextWithParent } from './moduleContext';
import type { SeriesType } from './optionsModuleTypes';

type AxisType = 'category' | 'number' | 'log' | 'time' | 'ordinal-time';

export interface AxisOptionModule<M extends ModuleInstance = ModuleInstance> extends BaseModule {
    type: 'axis-option';
    axisTypes: AxisType[];
    moduleFactory: (ctx: ModuleContextWithParent<AxisContext>) => M;
    themeTemplate: {};
}

interface ChartSpecialOverrides {
    document: Document;
    window: Window;
    overrideDevicePixelRatio?: number;
    sceneMode?: 'simple';
    presetType?: string;
}

type GroupingOptions = {
    grouped?: boolean;
    stacked?: boolean;
    stackGroup?: string;
    seriesGrouping?: {
        groupIndex: number;
        groupCount: number;
        stackIndex: number;
        stackCount: number;
    };
};
type GroupingSeriesOptions = SeriesOptionsTypes & GroupingOptions & { xKey?: string };
type SeriesGroup = { groupType: GroupingType; seriesType: string; series: GroupingSeriesOptions[]; groupId: string };

enum GroupingType {
    DEFAULT = 'default',
    STACK = 'stack',
    GROUP = 'group',
}

const unthemedSeries = new Set<SeriesType>(['map-shape-background', 'map-line-background']);

export class ChartOptions<T extends AgChartOptions = AgChartOptions> {
    activeTheme: ChartTheme;
    processedOptions: T;
    defaultAxes: T;
    userOptions: Partial<T>;
    specialOverrides: ChartSpecialOverrides;
    annotationThemes: any;
    presetType?: string;

    private readonly debug = Debug.create(true, 'opts');

    constructor(userOptions: T, specialOverrides?: Partial<ChartSpecialOverrides>) {
        this.presetType = specialOverrides?.presetType;

        const cloneOptions = { shallow: ['data'] };
        userOptions = deepClone(userOptions, cloneOptions);

        let options = deepClone(userOptions, cloneOptions);

        if (this.presetType != null) {
            type PresetConstructor = (
                options: AgPresetOptions,
                themeOptions: AgPresetOptions | undefined,
                activeTheme: () => ChartTheme
            ) => T;

            const presetConstructor: PresetConstructor | undefined = (PRESETS as any)[this.presetType];

            const presetParams = options as any as AgPresetOptions;

            // Note financial charts defines the theme in its returned options
            // so we need to get the theme before and after applying the preset
            const presetType = (options as any).type as keyof AgPresetOverrides | undefined;
            const presetTheme = presetType != null ? getChartTheme(options.theme).presets[presetType] : undefined;

            this.debug('>>> AgCharts.createOrUpdate() - applying preset', options, presetParams);
            options = presetConstructor?.(presetParams, presetTheme, () => this.activeTheme) ?? options;
        }

        if (!enterpriseModule.isEnterprise) {
            removeUsedEnterpriseOptions(options);
        }

        this.activeTheme = getChartTheme(options.theme);
        if (this.presetType) {
            options = this.activeTheme.templateTheme(options);
        }

        this.sanityCheckAndCleanup(options);
        this.defaultAxes = this.getDefaultAxes(options);
        this.specialOverrides = this.specialOverridesDefaults({ ...specialOverrides });

        const chartType = this.optionsType(options);
        const {
            axes: axesThemes = {},
            annotations: { axesButtons = null, ...annotationsThemes } = {},
            series: _,
            ...themeDefaults
        } = this.getSeriesThemeConfig(chartType);

        this.userOptions = userOptions;
        this.processedOptions = deepClone(
            mergeDefaults(
                options,
                axesButtons != null ? { annotations: { axesButtons } } : {},
                themeDefaults,
                this.defaultAxes
            ),
            cloneOptions
        ) as T;

        this.processAxesOptions(this.processedOptions, axesThemes);
        this.processSeriesOptions(this.processedOptions);
        this.processMiniChartSeriesOptions(this.processedOptions);

        this.annotationThemes = annotationsThemes;

        // Disable legend by default for single series cartesian charts and polar charts which display legend items per series rather than data items
        if (
            (isAgCartesianChartOptions(this.processedOptions) ||
                isAgPolarChartOptionsWithSeriesBasedLegend(this.processedOptions)) &&
            this.processedOptions.legend?.enabled == null
        ) {
            this.processedOptions.legend ??= {};
            this.processedOptions.legend.enabled = this.processedOptions.series!.length > 1;
        }

        this.enableConfiguredOptions(this.processedOptions, options);

        if (!enterpriseModule.isEnterprise) {
            removeUsedEnterpriseOptions(this.processedOptions, true);
        }
    }

    getOptions() {
        return this.processedOptions ?? {};
    }

    diffOptions(options: T) {
        return jsonDiff(options, this.processedOptions);
    }

    protected getSeriesThemeConfig(seriesType: string) {
        const themeConfig = deepClone(this.activeTheme?.config[seriesType] ?? {});
        this.removeLeftoverSymbols(themeConfig);
        return themeConfig;
    }

    protected getDefaultAxes(options: T) {
        const optionsType = this.optionsType(options);
        const firstSeriesOptions = options.series?.find((series) => (series.type ?? 'line') === optionsType) ?? {};
        return seriesRegistry.cloneDefaultAxes(optionsType, firstSeriesOptions) as T;
    }

    protected optionsType(options: Partial<T>) {
        return options.series?.[0]?.type ?? 'line';
    }

    protected sanityCheckAndCleanup(options: Partial<T>) {
        // output warnings and correct options when required
        this.deprecationWarnings(options);
        this.axesTypeIntegrity(options);
        this.seriesTypeIntegrity(options);
        this.soloSeriesIntegrity(options);
        this.removeDisabledOptions(options);
        this.removeLeftoverSymbols(options);

        if (
            options.series?.some((s) => s.type === 'bullet') &&
            options.sync != null &&
            options.sync.enabled !== false
        ) {
            Logger.warnOnce('bullet series cannot be synced, disabling synchronization.');
            delete options.sync;
        }
    }

    protected processAxesOptions(options: T, axesThemes: any) {
        if (!('axes' in options)) return;
        options.axes = options.axes!.map((axis: any) => {
            const { crossLines: crossLinesTheme, ...axisTheme } = mergeDefaults(
                axesThemes[axis.type]?.[axis.position],
                axesThemes[axis.type]
            );

            if (axis.crossLines) {
                axis.crossLines = mergeArrayDefaults(axis.crossLines, crossLinesTheme);
            }

            const gridLineStyle = axisTheme.gridLine?.style;
            if (axis.gridLine?.style && gridLineStyle?.length) {
                axis.gridLine.style = axis.gridLine.style.map((style: any, index: number) =>
                    style.stroke != null || style.lineDash != null
                        ? mergeDefaults(style, gridLineStyle.at(index % gridLineStyle.length))
                        : style
                );
            }
            const { top: _1, right: _2, bottom: _3, left: _4, ...axisOptions } = mergeDefaults(axis, axisTheme);
            return axisOptions;
        }) as AgCartesianAxisOptions[] | AgPolarAxisOptions[];
    }

    protected processSeriesOptions(options: T) {
        const defaultSeriesType = this.getDefaultSeriesType(options);
        const defaultTooltipPosition = this.getTooltipPositionDefaults(options);
        const userPalette = isObject(options.theme) ? paletteType(options.theme?.palette) : 'inbuilt';
        const paletteOptions = {
            colourIndex: 0,
            userPalette,
        };

        const processedSeries = (options.series as SeriesOptionsTypes[])?.map((series) => {
            series.type ??= defaultSeriesType;
            const { innerLabels: innerLabelsTheme, ...seriesTheme } =
                this.getSeriesThemeConfig(series.type).series ?? {};
            // Don't advance series index for background series
            const seriesPaletteOptions = unthemedSeries.has(series.type)
                ? { colourIndex: 0, userPalette }
                : paletteOptions;
            const palette = this.getSeriesPalette(series.type, seriesPaletteOptions);
            const defaultTooltipRange = this.getTooltipRangeDefaults(options, series.type);
            const seriesOptions = mergeDefaults(
                this.getSeriesGroupingOptions(series),
                series,
                defaultTooltipPosition,
                defaultTooltipRange,
                seriesTheme,
                palette,
                { visible: true }
            );

            if (seriesOptions.innerLabels) {
                seriesOptions.innerLabels = mergeArrayDefaults(seriesOptions.innerLabels, innerLabelsTheme);
            }

            return this.activeTheme.templateTheme(seriesOptions);
        });

        options.series = this.setSeriesGroupingOptions(processedSeries ?? []);
    }

    protected processMiniChartSeriesOptions(options: T) {
        let miniChartSeries = options.navigator?.miniChart?.series;
        if (miniChartSeries == null) return;

        const paletteOptions = {
            colourIndex: 0,
            userPalette: isObject(options.theme) ? paletteType(options.theme.palette) : 'inbuilt',
        };

        miniChartSeries = miniChartSeries.map((series) => {
            series.type ??= 'line';
            const { innerLabels: _, ...seriesTheme } = this.getSeriesThemeConfig(series.type).series ?? {};
            const seriesOptions = mergeDefaults(
                this.getSeriesGroupingOptions(series),
                series,
                seriesTheme,
                this.getSeriesPalette(series.type, paletteOptions)
            );
            return this.activeTheme.templateTheme(seriesOptions);
        });
        options.navigator!.miniChart!.series = this.setSeriesGroupingOptions(miniChartSeries) as any;
    }

    protected getSeriesPalette(seriesType: SeriesType, options: { colourIndex: number; userPalette: PaletteType }) {
        const paletteFactory = seriesRegistry.getPaletteFactory(seriesType);
        const { colourIndex: colourOffset, userPalette } = options;
        const { fills = [], strokes = [] } = this.activeTheme.palette;

        return paletteFactory?.({
            userPalette,
            colorsCount: Math.max(fills.length, strokes.length),
            themeTemplateParameters: this.activeTheme.getTemplateParameters(),
            palette: this.activeTheme.palette,
            takeColors(count) {
                options.colourIndex += count;
                return {
                    fills: circularSliceArray(fills, count, colourOffset),
                    strokes: circularSliceArray(strokes, count, colourOffset),
                };
            },
        });
    }

    protected getSeriesGroupingOptions(series: SeriesOptionsTypes & GroupingOptions) {
        const groupable = seriesRegistry.isGroupable(series.type);
        const stackable = seriesRegistry.isStackable(series.type);
        const stackedByDefault = seriesRegistry.isStackedByDefault(series.type);

        if (series.grouped && !groupable) {
            Logger.warnOnce(`unsupported grouping of series type "${series.type}".`);
        }
        if ((series.stacked || series.stackGroup) && !stackable) {
            Logger.warnOnce(`unsupported stacking of series type "${series.type}".`);
        }

        let { grouped, stacked } = series;

        stacked ??= (stackedByDefault || series.stackGroup != null) && !(groupable && grouped);
        grouped ??= true;

        return {
            stacked: stackable && stacked,
            grouped: groupable && grouped && !(stackable && stacked),
        };
    }

    protected setSeriesGroupingOptions(allSeries: GroupingSeriesOptions[]) {
        const seriesGroups = this.getSeriesGrouping(allSeries);

        this.debug('setSeriesGroupingOptions() - series grouping: ', seriesGroups);

        const groupIdx: Record<string, number> = {};
        const groupCount = seriesGroups.reduce<Record<string, number>>((countMap, seriesGroup) => {
            if (seriesGroup.groupType === GroupingType.DEFAULT) {
                return countMap;
            }
            countMap[seriesGroup.seriesType] ??= 0;
            countMap[seriesGroup.seriesType] +=
                seriesGroup.groupType === GroupingType.STACK ? 1 : seriesGroup.series.length;
            return countMap;
        }, {});

        // sort series by grouping and enrich with seriesGrouping metadata
        return seriesGroups
            .flatMap((seriesGroup) => {
                groupIdx[seriesGroup.seriesType] ??= 0;
                switch (seriesGroup.groupType) {
                    case GroupingType.STACK: {
                        const groupIndex = groupIdx[seriesGroup.seriesType]++;
                        return seriesGroup.series.map((series, stackIndex) =>
                            Object.assign(series, {
                                seriesGrouping: {
                                    groupId: seriesGroup.groupId,
                                    groupIndex,
                                    groupCount: groupCount[seriesGroup.seriesType],
                                    stackIndex,
                                    stackCount: seriesGroup.series.length,
                                },
                            })
                        );
                    }

                    case GroupingType.GROUP:
                        return seriesGroup.series.map((series) =>
                            Object.assign(series, {
                                seriesGrouping: {
                                    groupId: seriesGroup.groupId,
                                    groupIndex: groupIdx[seriesGroup.seriesType]++,
                                    groupCount: groupCount[seriesGroup.seriesType],
                                    stackIndex: 0,
                                    stackCount: 0,
                                },
                            })
                        );
                }

                return seriesGroup.series;
            })
            .map(({ stacked: _, grouped: __, ...seriesOptions }) => seriesOptions) as T['series'];
    }

    protected getSeriesGroupId(series: GroupingSeriesOptions) {
        return [series.type, series.xKey, series.stacked ? series.stackGroup ?? 'stacked' : 'grouped']
            .filter(Boolean)
            .join('-');
    }

    protected getSeriesGrouping(allSeries: GroupingSeriesOptions[]) {
        const groupMap = new Map<string, SeriesGroup>();
        return allSeries.reduce<SeriesGroup[]>((result, series) => {
            const seriesType = series.type!;
            if (!series.stacked && !series.grouped) {
                result.push({ groupType: GroupingType.DEFAULT, seriesType, series: [series], groupId: '__default__' });
            } else {
                const groupId = this.getSeriesGroupId(series);
                if (!groupMap.has(groupId)) {
                    const groupType = series.stacked ? GroupingType.STACK : GroupingType.GROUP;
                    const record = { groupType, seriesType, series: [], groupId };
                    groupMap.set(groupId, record);
                    result.push(record);
                }
                groupMap.get(groupId)!.series.push(series);
            }
            return result;
        }, []);
    }

    private getDefaultSeriesType(options: T): SeriesType {
        if (isAgCartesianChartOptions(options)) {
            return 'line';
        } else if (isAgPolarChartOptions(options)) {
            return 'pie';
        } else if (isAgHierarchyChartOptions(options)) {
            return 'treemap';
        } else if (isAgTopologyChartOptions(options)) {
            return 'map-shape';
        } else if (isAgFlowProportionChartOptions(options)) {
            return 'sankey';
        } else if (isAgGaugeChartOptions(options)) {
            return 'radial-gauge';
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

    // AG-11591 Support for new series-specific & legacy chart-global 'tooltip.range' options
    //
    // The `chart.series[].tooltip.range` option is a bit different for legacy reason. This use to be
    // global option (`chart.tooltip.range`) that could override the theme. But now, the tooltip range
    // option is series-specific.
    //
    // To preserve backward compatiblity, the `chart.tooltip.range` theme default has been changed from
    // 'nearest' to undefined.
    private getTooltipRangeDefaults(options: T, seriesType: SeriesType) {
        return {
            tooltip: {
                range: options.tooltip?.range ?? seriesRegistry.getTooltipDefauls(seriesType)?.range,
            },
        };
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

    private axesTypeIntegrity(options: Partial<T>) {
        if ('axes' in options) {
            const axes = (options.axes ?? []) as AgBaseAxisOptions[];
            for (const { type } of axes) {
                // If any of the axes type is invalid remove all user provided options in favour of our defaults.
                if (!isAxisOptionType(type)) {
                    delete options.axes;
                    const expectedTypes = axisRegistry.publicKeys().join(', ');
                    Logger.warnOnce(`unknown axis type: ${type}; expected one of: ${expectedTypes}`);
                }
            }
        }
    }

    private seriesTypeIntegrity(options: Partial<T>) {
        options.series = options.series?.filter(({ type }) => {
            if (type == null || isSeriesOptionType(type) || isEnterpriseSeriesType(type)) {
                return true;
            }
            Logger.warnOnce(
                `unknown series type: ${type}; expected one of: ${publicChartTypes.seriesTypes.join(', ')}`
            );
        }) as T['series'];
    }

    private soloSeriesIntegrity(options: Partial<T>) {
        const allSeries: SeriesOptionsTypes[] | undefined = options.series;
        if (allSeries && allSeries.length > 1 && allSeries.some((series) => seriesRegistry.isSolo(series.type))) {
            const mainSeriesType = this.optionsType(options);
            if (seriesRegistry.isSolo(mainSeriesType)) {
                Logger.warn(
                    `series[0] of type '${mainSeriesType}' is incompatible with other series types. Only processing series[0]`
                );
                options.series = allSeries.slice(0, 1) as T['series'];
            } else {
                const { solo, nonSolo } = groupBy(allSeries, (s) =>
                    seriesRegistry.isSolo(s.type) ? 'solo' : 'nonSolo'
                );
                const rejects = unique(solo!.map((s) => s.type)).join(', ');
                Logger.warn(`Unable to mix these series types with the lead series type: ${rejects}`);
                options.series = nonSolo as T['series'];
            }
        }
    }

    private enableConfiguredOptions(options: T, userOptions: T) {
        // Set `enabled: true` for all option objects where the user has provided values.
        jsonWalk<any>(
            userOptions,
            (visitingUserOpts, visitingMergedOpts) => {
                if (
                    visitingMergedOpts &&
                    'enabled' in visitingMergedOpts &&
                    !visitingMergedOpts._enabledFromTheme &&
                    visitingUserOpts.enabled == null
                ) {
                    visitingMergedOpts.enabled = true;
                }
            },
            { skip: ['data', 'theme'] },
            options
        );

        // Cleanup any special properties.
        jsonWalk<any>(
            options,
            (visitingMergedOpts) => {
                if (visitingMergedOpts._enabledFromTheme != null) {
                    // Do not apply special handling, base enablement on theme.
                    delete visitingMergedOpts._enabledFromTheme;
                }
            },
            { skip: ['data', 'theme'] }
        );
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

    private removeLeftoverSymbols(options: Partial<T>) {
        jsonWalk(
            options,
            (optionsNode) => {
                if (!optionsNode || !isObject(optionsNode)) return;
                for (const [key, value] of Object.entries(optionsNode)) {
                    if (isSymbol(value)) {
                        delete optionsNode[key as keyof T];
                    }
                }
            },
            { skip: ['data'] }
        );
    }

    private specialOverridesDefaults(options: Partial<ChartSpecialOverrides>) {
        if (options.window != null) {
            setWindow(options.window);
        } else if (typeof window !== 'undefined') {
            options.window = window;
        } else if (typeof global !== 'undefined') {
            options.window = global.window;
        }

        if (options.document != null) {
            setDocument(options.document);
        } else if (typeof document !== 'undefined') {
            options.document = document;
        } else if (typeof global !== 'undefined') {
            options.document = global.document;
        }

        if (options.window == null) {
            throw new Error('AG Charts - unable to resolve global window');
        }
        if (options.document == null) {
            throw new Error('AG Charts - unable to resolve global document');
        }

        return options as ChartSpecialOverrides;
    }
}
