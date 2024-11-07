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

import { PRESETS, PRESET_DATA_PROCESSORS } from '../api/preset/presets';
import { axisRegistry } from '../chart/factory/axisRegistry';
import { publicChartTypes } from '../chart/factory/chartTypes';
import { isEnterpriseSeriesType } from '../chart/factory/expectedEnterpriseModules';
import { removeUnusedEnterpriseOptions, removeUsedEnterpriseOptions } from '../chart/factory/processEnterpriseOptions';
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
    isAgStandaloneChartOptions,
    isAgTopologyChartOptions,
    isAxisOptionType,
    isSeriesOptionType,
} from '../chart/mapping/types';
import { type ChartTheme } from '../chart/themes/chartTheme';
import { circularSliceArray, groupBy, unique } from '../util/array';
import { Debug } from '../util/debug';
import { setDocument, setWindow } from '../util/dom';
import { deepClone, jsonDiff, jsonPropertyCompare, jsonWalk } from '../util/json';
import { Logger } from '../util/logger';
import { mergeArrayDefaults, mergeDefaults } from '../util/object';
import { isEnumValue, isFiniteNumber, isObject, isPlainObject, isString } from '../util/type-guards';
import type { DeepPartial } from '../util/types';
import { type PaletteType, paletteType } from './coreModulesTypes';
import { enterpriseModule } from './enterpriseModule';
import type { SeriesType } from './optionsModuleTypes';

export interface ChartSpecialOverrides {
    document: Document;
    window: Window;
    overrideDevicePixelRatio?: number;
    sceneMode?: 'simple';
    styleContainer?: HTMLElement;
}

export interface ChartInternalOptionMetadata {
    presetType?: keyof typeof PRESETS;
    pool?: boolean;
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
    private static readonly OPTIONS_CLONE_OPTS = new Set(['data', 'container']);

    private static readonly FAST_PATH_OPTIONS = new Set<keyof AgChartOptions>(['data', 'width', 'height']);
    private static isFastPathDelta(deltaOptions: DeepPartial<AgChartOptions>) {
        for (const key of Object.keys(deltaOptions)) {
            if (!this.FAST_PATH_OPTIONS.has(key as keyof AgChartOptions)) return false;
        }
        return true;
    }

    activeTheme: ChartTheme;
    processedOptions: T;
    defaultAxes: T;
    userOptions: Partial<T>;
    processedOverrides: Partial<T>;
    specialOverrides: ChartSpecialOverrides;
    optionMetadata: ChartInternalOptionMetadata;
    annotationThemes: any;
    fastDelta?: DeepPartial<T>;

    private readonly debug = Debug.create(true, 'opts');

    constructor(
        userOptions: T | ChartOptions<T>,
        processedOverrides: Partial<T>,
        specialOverrides: Partial<ChartSpecialOverrides>,
        metadata: ChartInternalOptionMetadata,
        deltaOptions?: DeepPartial<T>
    ) {
        this.optionMetadata = metadata ?? {};
        this.processedOverrides = processedOverrides ?? {};

        let baseChartOptions: ChartOptions<T> | null = null;
        if (userOptions instanceof ChartOptions) {
            // Delta update case.
            baseChartOptions = userOptions;
            this.specialOverrides = baseChartOptions.specialOverrides;

            if (!deltaOptions) throw new Error('AG Charts - internal error: deltaOptions must be supplied.');

            this.userOptions = mergeDefaults(
                deltaOptions,
                deepClone(baseChartOptions.userOptions, ChartOptions.OPTIONS_CLONE_OPTS)
            ) as T;
        } else {
            // Full update case.
            this.userOptions = userOptions;
            this.specialOverrides = this.specialOverridesDefaults({ ...specialOverrides });
        }

        let activeTheme, processedOptions, defaultAxes, fastDelta;
        if (deltaOptions != null && ChartOptions.isFastPathDelta(deltaOptions) && baseChartOptions != null) {
            ({ activeTheme, processedOptions, defaultAxes, fastDelta } = this.fastSetup(
                deltaOptions,
                baseChartOptions
            ));
        } else {
            ({ activeTheme, processedOptions, defaultAxes } = this.slowSetup(processedOverrides, deltaOptions));
        }

        this.activeTheme = activeTheme;
        this.processedOptions = processedOptions;
        this.defaultAxes = defaultAxes;
        this.fastDelta = fastDelta;
    }

    private fastSetup(deltaOptions: DeepPartial<T>, baseChartOptions: ChartOptions<T>) {
        const { activeTheme, defaultAxes, processedOptions: baseOptions } = baseChartOptions;

        const { presetType } = this.optionMetadata;
        const processor = presetType ? PRESET_DATA_PROCESSORS[presetType] : undefined;
        if (presetType != null && deltaOptions.data != null && processor != null) {
            // Handle preset data transforms gracefully.
            deltaOptions = mergeDefaults(processor(deltaOptions.data), deltaOptions) as DeepPartial<T>;
        }

        this.fastSeriesSetup(deltaOptions, baseOptions);
        const processedOptions = mergeDefaults(deltaOptions, baseOptions);
        return { activeTheme, defaultAxes, processedOptions, fastDelta: deltaOptions };
    }

    private fastSeriesSetup(deltaOptions: DeepPartial<T>, baseOptions: T) {
        if (!deltaOptions.series) return;

        if (deltaOptions.series?.every((s, i) => jsonPropertyCompare(s, baseOptions.series?.[i] ?? {}))) {
            // No series changes - skip these.
            delete deltaOptions['series'];
        } else {
            // Need to take full series options in update cases.
            deltaOptions.series = deltaOptions.series.map((s, i) => {
                return mergeDefaults(s, baseOptions.series?.[i] ?? {});
            });
        }
    }

    private slowSetup(processedOverrides: Partial<T>, deltaOptions?: DeepPartial<T>) {
        let options = deepClone(this.userOptions, ChartOptions.OPTIONS_CLONE_OPTS) as T;

        if (deltaOptions) {
            options = mergeDefaults(deltaOptions, options) as T;
        }

        const { presetType } = this.optionMetadata;
        if (presetType != null) {
            type PresetConstructor = (
                options: AgPresetOptions,
                themeOptions: AgPresetOptions | undefined,
                activeTheme: () => ChartTheme
            ) => T;

            const presetConstructor: PresetConstructor | undefined = (PRESETS as any)[presetType];

            const presetParams = this.userOptions as any as AgPresetOptions;

            // Note financial charts defines the theme in its returned options
            // so we need to get the theme before and after applying the preset
            const presetSubType = (this.userOptions as any).type as keyof AgPresetOverrides | undefined;
            const presetTheme =
                presetSubType != null ? getChartTheme(this.userOptions.theme).presets[presetSubType] : undefined;

            this.debug('>>> AgCharts.createOrUpdate() - applying preset', presetParams);
            options = presetConstructor?.(presetParams, presetTheme, () => this.activeTheme) ?? options;
        }

        if (!enterpriseModule.isEnterprise) {
            removeUsedEnterpriseOptions(options);
        }

        const activeTheme = getChartTheme(options.theme);

        this.sanityCheck(options);
        this.removeDisabledOptions(options);
        const defaultAxes = this.getDefaultAxes(options);

        const chartType = this.optionsType(options);
        const {
            axes: axesThemes = {},
            annotations: { axesButtons = null, ...annotationsThemes } = {},
            series: _,
            ...themeDefaults
        } = this.getSeriesThemeConfig(chartType, activeTheme);

        let processedOptions = mergeDefaults(
            processedOverrides,
            options,
            axesButtons != null ? { annotations: { axesButtons } } : {},
            themeDefaults,
            defaultAxes
        );
        this.processAxesOptions(processedOptions, axesThemes);
        this.processSeriesOptions(processedOptions, activeTheme);
        this.processMiniChartSeriesOptions(processedOptions, activeTheme);

        this.annotationThemes = annotationsThemes;

        // Create isolated copy of options before we start mutations - this is performance sensitive
        // so we aim to only do this once in the processing flow.
        processedOptions = deepClone(processedOptions, ChartOptions.OPTIONS_CLONE_OPTS);

        // Disable legend by default for single series cartesian charts and polar charts which display legend items per series rather than data items
        if (
            (isAgCartesianChartOptions(processedOptions) ||
                isAgStandaloneChartOptions(processedOptions) ||
                isAgPolarChartOptionsWithSeriesBasedLegend(processedOptions)) &&
            processedOptions.legend?.enabled == null
        ) {
            processedOptions.legend ??= {};
            processedOptions.legend.enabled = processedOptions.series!.length > 1;
        }

        this.enableConfiguredOptions(processedOptions, this.userOptions as T);
        activeTheme.templateTheme(processedOptions, false);
        this.removeDisabledOptions(options);
        removeUnusedEnterpriseOptions(processedOptions);
        if (!enterpriseModule.isEnterprise) {
            removeUsedEnterpriseOptions(processedOptions, true);
        }

        this.debug('AgCharts.createOrUpdate() - processed options', processedOptions);

        return { activeTheme, processedOptions, defaultAxes };
    }

    getOptions() {
        return this.processedOptions ?? {};
    }

    diffOptions(other?: ChartOptions): Partial<T> {
        // Detect first creation case.
        if (this === other) return {};
        if (other == null) return this.processedOptions;

        return (this.fastDelta as Partial<T>) ?? jsonDiff(other.processedOptions, this.processedOptions);
    }

    private getSeriesThemeConfig(seriesType: string, activeTheme: ChartTheme) {
        return activeTheme?.config[seriesType] ?? {};
    }

    private getDefaultAxes(options: T) {
        const optionsType = this.optionsType(options);
        const firstSeriesOptions = options.series?.find((series) => (series.type ?? 'line') === optionsType) ?? {};
        return seriesRegistry.cloneDefaultAxes(optionsType, firstSeriesOptions) as T;
    }

    private optionsType(options: Partial<T>) {
        return options.series?.[0]?.type ?? 'line';
    }

    private sanityCheck(options: Partial<T>) {
        // output warnings and correct options when required
        this.axesTypeIntegrity(options);
        this.seriesTypeIntegrity(options);
        this.soloSeriesIntegrity(options);
    }

    private processAxesOptions(options: T, axesThemes: any) {
        if (!('axes' in options)) return;
        options.axes = options.axes?.map((axis: any) => {
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

    private processSeriesOptions(options: T, activeTheme: ChartTheme) {
        const defaultTooltipPosition = this.getTooltipPositionDefaults(options);
        const userPalette = isObject(options.theme) ? paletteType(options.theme?.palette) : 'inbuilt';
        const paletteOptions = {
            colourIndex: 0,
            userPalette,
        };

        const processedSeries = (options.series as SeriesOptionsTypes[])?.map((series) => {
            series.type ??= this.getDefaultSeriesType(options);
            const { innerLabels: innerLabelsTheme, ...seriesTheme } =
                this.getSeriesThemeConfig(series.type, activeTheme).series ?? {};
            // Don't advance series index for background series
            const seriesPaletteOptions = unthemedSeries.has(series.type)
                ? { colourIndex: 0, userPalette }
                : paletteOptions;
            const palette = this.getSeriesPalette(series.type, seriesPaletteOptions, activeTheme);
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

            return seriesOptions;
        });

        options.series = this.setSeriesGroupingOptions(processedSeries ?? []);
    }

    private processMiniChartSeriesOptions(options: T, activeTheme: ChartTheme) {
        let miniChartSeries = options.navigator?.miniChart?.series;
        if (miniChartSeries == null) return;

        const paletteOptions = {
            colourIndex: 0,
            userPalette: isObject(options.theme) ? paletteType(options.theme.palette) : 'inbuilt',
        };

        miniChartSeries = miniChartSeries.map((series) => {
            series.type ??= 'line';
            const { innerLabels: _, ...seriesTheme } = this.getSeriesThemeConfig(series.type, activeTheme).series ?? {};
            return mergeDefaults(
                this.getSeriesGroupingOptions(series),
                series,
                seriesTheme,
                this.getSeriesPalette(series.type, paletteOptions, activeTheme)
            );
        });
        options.navigator!.miniChart!.series = this.setSeriesGroupingOptions(miniChartSeries) as any;
    }

    private getSeriesPalette(
        seriesType: SeriesType,
        options: { colourIndex: number; userPalette: PaletteType },
        activeTheme: ChartTheme
    ) {
        const paletteFactory = seriesRegistry.getPaletteFactory(seriesType);
        const { colourIndex: colourOffset, userPalette } = options;
        const { fills = [], strokes = [] } = activeTheme.palette;

        return paletteFactory?.({
            userPalette,
            colorsCount: Math.max(fills.length, strokes.length),
            themeTemplateParameters: activeTheme.getTemplateParameters(),
            palette: activeTheme.palette,
            takeColors(count) {
                options.colourIndex += count;
                return {
                    fills: circularSliceArray(fills, count, colourOffset),
                    strokes: circularSliceArray(strokes, count, colourOffset),
                };
            },
        });
    }

    private getSeriesGroupingOptions(series: SeriesOptionsTypes & GroupingOptions) {
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

    private setSeriesGroupingOptions(allSeries: GroupingSeriesOptions[]) {
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

    private getSeriesGroupId(series: GroupingSeriesOptions) {
        return [series.type, series.xKey, series.stacked ? series.stackGroup ?? 'stacked' : 'grouped']
            .filter(Boolean)
            .join('-');
    }

    private getSeriesGrouping(allSeries: GroupingSeriesOptions[]) {
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
        } else if (isAgStandaloneChartOptions(options)) {
            return 'pyramid';
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

    private static enableConfiguredJsonOptions(visitingUserOpts: any, visitingMergedOpts: any) {
        if (
            visitingMergedOpts &&
            'enabled' in visitingMergedOpts &&
            !visitingMergedOpts._enabledFromTheme &&
            visitingUserOpts.enabled == null
        ) {
            visitingMergedOpts.enabled = true;
        }
    }

    private static cleanupEnabledFromThemeJsonOptions(visitingMergedOpts: any) {
        if (visitingMergedOpts._enabledFromTheme != null) {
            // Do not apply special handling, base enablement on theme.
            delete visitingMergedOpts._enabledFromTheme;
        }
    }

    private enableConfiguredOptions(options: T, userOptions: T) {
        // Set `enabled: true` for all option objects where the user has provided values.
        jsonWalk(userOptions, ChartOptions.enableConfiguredJsonOptions, new Set(['data', 'theme']), options);

        // Cleanup any special properties.
        jsonWalk(options, ChartOptions.cleanupEnabledFromThemeJsonOptions, new Set(['data', 'theme']));
    }

    private static removeDisabledOptionJson(optionsNode: any) {
        if ('enabled' in optionsNode && optionsNode.enabled === false) {
            Object.keys(optionsNode).forEach((key) => {
                if (key === 'enabled') return;
                delete optionsNode[key];
            });
        }
    }

    private removeDisabledOptions(options: Partial<T>) {
        // Remove configurations from all option objects with a `false` value for the `enabled` property.
        jsonWalk(options, ChartOptions.removeDisabledOptionJson, new Set(['data', 'theme']));
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
