import {
    type ChartModuleDefinition,
    type CloneOptions,
    Debug,
    type DeepPartial,
    Logger,
    ModuleRegistry,
    ModuleType,
    type PlainObject,
    deepClone,
    deepFreeze,
    distribute,
    enterpriseRegistry,
    entries,
    getDocument,
    getWindow,
    groupBy,
    hasRequiredInPath,
    isArray,
    isKeyOf,
    isObject,
    isPlainObject,
    isSymbol,
    joinFormatted,
    jsonDiff,
    jsonPropertyCompare,
    jsonWalk,
    mapValues,
    merge,
    mergeDefaults,
    setDocument,
    setWindow,
    unique,
    validate,
} from 'ag-charts-core';
import {
    type AgCartesianSeriesOptions,
    type AgChartOptions,
    type AgChartThemeParams,
    type AgMiniChartSeriesOptions,
    type AgPresetOptions,
    type AgPresetOverrides,
    type DatumDefault,
    type SeriesOptionsTypes,
    type SeriesPredictAxis,
    type SeriesType,
} from 'ag-charts-types';

import { ChartAxisDirection } from '../chart/chartAxisDirection';
import { ExpectedModules } from '../chart/factory/expectedModules';
import { processModuleOptions, sanitizeThemeModules } from '../chart/factory/processModuleOptions';
import { getChartTheme } from '../chart/mapping/themes';
import { detectChartType } from '../chart/mapping/types';
import { ChartTheme } from '../chart/themes/chartTheme';
import { OptionsGraph, createOptionsGraph } from './optionsGraph';

export interface ChartSpecialOverrides {
    document: Document;
    window: Window;
    styleContainer?: HTMLElement;
}

export interface ChartInternalOptionMetadata {
    presetType?: 'price-volume' | 'gauge-preset' | 'sparkline';
    pool?: boolean;
    domMode?: 'normal' | 'minimal';
    withDragInterpretation?: boolean;
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
type GroupingSeriesOptions = GroupingOptions & { type: SeriesType; xKey?: string };
type SeriesGroup = { groupType: GroupingType; seriesType: string; series: GroupingSeriesOptions[]; groupId: string };

enum GroupingType {
    DEFAULT = 'default',
    STACK = 'stack',
    GROUP = 'group',
}

const stringFormat = (value: string) => `'${value}'`;

// TODO: move this somewhere more appropriate
const AXIS_ID_PREFIX = '__AXIS_ID_';
const POSITION_DIRECTIONS = {
    top: ChartAxisDirection.X,
    bottom: ChartAxisDirection.X,
    left: ChartAxisDirection.Y,
    right: ChartAxisDirection.Y,
};

export class ChartOptions<T extends AgChartOptions = AgChartOptions> {
    public static readonly OPTIONS_CLONE_OPTS_SLOW: CloneOptions = {
        shallow: new Set(['data', 'container']),
        assign: new Set(['context', 'theme']),
    };
    public static readonly OPTIONS_CLONE_OPTS_FAST: CloneOptions = {
        shallow: new Set(['container']),
        assign: new Set(['data', 'context', 'theme']),
    };
    public static readonly JSON_DIFF_OPTS = new Set<any>(['data']);

    private static readonly perfDebug = Debug.create(true, 'perf');

    private static readonly FAST_PATH_OPTIONS = new Set<keyof AgChartOptions>(['data', 'width', 'height', 'container']);
    private static isFastPathDelta(deltaOptions: DeepPartial<AgChartOptions> | null) {
        for (const key of Object.keys(deltaOptions ?? {})) {
            if (!this.FAST_PATH_OPTIONS.has(key as keyof AgChartOptions)) {
                ChartOptions.perfDebug('ChartOptions.isFastPathDelta() - slow path required due to presence of: ', key);
                return false;
            }
        }
        ChartOptions.perfDebug(`ChartOptions.isFastPathDelta() - fast path possible.`);
        return true;
    }

    activeTheme: ChartTheme;
    processedOptions: T;
    userOptions: Partial<T>;
    processedOverrides: Partial<T>;
    specialOverrides: ChartSpecialOverrides;
    optionMetadata: ChartInternalOptionMetadata;
    themeParameters: AgChartThemeParams = {};
    annotationThemes: any;
    googleFonts?: Set<string>;
    fastDelta?: DeepPartial<T>;
    chartDef?: ChartModuleDefinition<any>;
    optionsProcessingTime?: number;
    optionsGraph?: OptionsGraph;
    seriesWithUserVisibility?: Set<string>; // AG-16360

    private static readonly debug = Debug.create(true, 'opts');

    constructor(
        currentUserOptions: T | ChartOptions<T> | undefined,
        newUserOptions: T,
        processedOverrides: Partial<T>,
        specialOverrides: Partial<ChartSpecialOverrides>,
        metadata: ChartInternalOptionMetadata,
        deltaOptions?: DeepPartial<T> | null,
        stripSymbols = false,
        apiStartTime?: number
    ) {
        this.optionMetadata = metadata ?? {};
        this.processedOverrides = processedOverrides ?? {};

        let baseChartOptions: ChartOptions<T> | null = null;
        if (currentUserOptions instanceof ChartOptions) {
            // Delta update case.
            baseChartOptions = currentUserOptions;
            this.specialOverrides = baseChartOptions.specialOverrides;

            // No diff case - null means diff was a no-op.
            deltaOptions ??= jsonDiff(
                baseChartOptions.userOptions as T,
                newUserOptions,
                ChartOptions.JSON_DIFF_OPTS
            ) as DeepPartial<T>;

            this.userOptions = deepClone(merge(deltaOptions, baseChartOptions.userOptions), {
                ...ChartOptions.OPTIONS_CLONE_OPTS_SLOW,
                seen: [],
            }) as T;
        } else {
            // Full update case.
            this.userOptions = deepClone(currentUserOptions ?? newUserOptions, {
                ...ChartOptions.OPTIONS_CLONE_OPTS_SLOW,
                seen: [],
            });
            this.specialOverrides = this.specialOverridesDefaults({ ...specialOverrides });
        }
        this.findSeriesWithUserVisiblity(newUserOptions, deltaOptions);

        if (stripSymbols) {
            this.removeLeftoverSymbols(this.userOptions);
        }

        const dataChangedLength =
            currentUserOptions instanceof ChartOptions &&
            deltaOptions?.data !== undefined &&
            deltaOptions?.data?.length !== currentUserOptions.userOptions.data?.length;

        let activeTheme, processedOptions, fastDelta, themeParameters, annotationThemes, googleFonts, optionsGraph;
        if (
            !stripSymbols &&
            deltaOptions !== undefined &&
            ChartOptions.isFastPathDelta(deltaOptions) &&
            baseChartOptions != null &&
            !dataChangedLength
        ) {
            ({ activeTheme, processedOptions, fastDelta } = this.fastSetup(deltaOptions, baseChartOptions));
            themeParameters = baseChartOptions.themeParameters;
            annotationThemes = baseChartOptions.annotationThemes;
        } else {
            ChartOptions.perfDebug(`ChartOptions.slowSetup()`);
            ({ activeTheme, processedOptions, themeParameters, annotationThemes, googleFonts, optionsGraph } =
                this.slowSetup(processedOverrides, deltaOptions, stripSymbols));
        }

        this.activeTheme = activeTheme;
        this.processedOptions = processedOptions;
        this.fastDelta = fastDelta ?? undefined;
        this.themeParameters = themeParameters;
        this.annotationThemes = annotationThemes;
        this.googleFonts = googleFonts;
        this.optionsGraph = optionsGraph;

        // Capture options processing time for debug stats
        if (apiStartTime !== undefined && typeof apiStartTime === 'number' && !Number.isNaN(apiStartTime)) {
            const endTime = performance.now();
            this.optionsProcessingTime = endTime - apiStartTime;
        }

        // This ChartOptions should be treated as immutable from here-on, force immutability to
        // flush out runtime issues.
        Debug.inDevelopmentMode(() => deepFreeze(this));
    }

    private findSeriesWithUserVisiblity(newUserOptions: T, deltaOptions: DeepPartial<T> | null | undefined) {
        for (const o of [newUserOptions, deltaOptions]) {
            const series = o?.series;
            if (Array.isArray(series)) {
                for (const s of series) {
                    if ('visible' in s && s.id) {
                        this.seriesWithUserVisibility ??= new Set();
                        this.seriesWithUserVisibility.add(s.id);
                    }
                }
            }
        }
    }

    private fastSetup(deltaOptions: DeepPartial<T> | null, baseChartOptions: ChartOptions<T>) {
        const { activeTheme, processedOptions: baseOptions } = baseChartOptions;
        const { presetType } = this.optionMetadata;

        if (presetType != null && deltaOptions?.data != null) {
            const presetDef = ModuleRegistry.getPresetModule(presetType);
            // Handle preset data transforms gracefully.
            if (presetDef?.processData) {
                const { series, data } = presetDef.processData(deltaOptions.data);
                deltaOptions = mergeDefaults({ series, data }, deltaOptions) as DeepPartial<T>;
            }
        }

        this.fastSeriesSetup(deltaOptions, baseOptions);
        const processedOptions = mergeDefaults(deltaOptions, baseOptions);

        ChartOptions.debug('ChartOptions.fastSetup() - processed options', processedOptions);

        return { activeTheme, processedOptions, fastDelta: deltaOptions };
    }

    private fastSeriesSetup(deltaOptions: DeepPartial<T> | null, baseOptions: T) {
        if (!deltaOptions?.series) return;

        if (deltaOptions.series?.every((s, i) => jsonPropertyCompare(s, baseOptions.series?.[i] ?? {}))) {
            // No series changes - skip these.
            delete deltaOptions['series'];
        } else {
            // Need to take full series options in update cases.
            deltaOptions.series = deltaOptions.series.map((s, i) => {
                return merge(s, baseOptions.series?.[i] ?? {});
            });
        }
    }

    private slowSetup(processedOverrides: Partial<T>, deltaOptions?: DeepPartial<T> | null, stripSymbols = false) {
        let options = deepClone(this.userOptions, ChartOptions.OPTIONS_CLONE_OPTS_FAST) as T & { type?: string };

        if (deltaOptions) {
            options = mergeDefaults(deltaOptions, options) as T;
            if (stripSymbols) {
                this.removeLeftoverSymbols(options);
            }
        }

        let activeTheme = sanitizeThemeModules(getChartTheme(options.theme));

        const { presetType } = this.optionMetadata;
        if (presetType != null) {
            const presetDef = ModuleRegistry.getPresetModule(presetType);

            if (presetDef) {
                const { validate: validatePreset = validate } = presetDef;
                const presetParams = options as any as AgPresetOptions;

                // Note financial charts defines the theme in its returned options,
                // so we need to get the theme before and after applying the preset
                const presetSubType = (options as any).type as keyof AgPresetOverrides | undefined;
                const presetTheme = presetSubType == null ? undefined : activeTheme.presets[presetSubType];

                const { cleared, invalid } = validatePreset(presetParams, presetDef.options, '');
                for (const error of invalid) {
                    Logger.warn(error);
                }

                if (hasRequiredInPath(invalid, '')) {
                    options = {} as any;
                } else {
                    ChartOptions.debug('>>> AgCharts.createOrUpdate() - applying preset', cleared);
                    options = presetDef.create(cleared, presetTheme, () => this.activeTheme);
                    activeTheme = sanitizeThemeModules(getChartTheme(options.theme));
                }
            }
        }

        this.soloSeriesIntegrity(options);

        // TODO: Remove as this is only required to pass the series validation, it is handled by the OptionsGraph.
        if (presetType != null) {
            activeTheme.templateTheme(options, false);
        }

        // Must run before chart validation to cleanup invalid types.
        processModuleOptions(undefined, options);
        this.validateSeriesOptions(options);

        const chartType = detectChartType(options);

        this.chartDef = ModuleRegistry.getChartModule(chartType);

        if (!this.chartDef.placeholder) {
            const { validate: validateChart = validate } = this.chartDef;
            const { cleared, invalid } = validateChart(options, this.chartDef.options, '');
            for (const error of invalid) {
                Logger.warn(error);
            }
            options = cleared as T;
        }

        // The first pass validation of the axes, before they have been processed. At this point the axis keys are still
        // the ones provided by the user and have not been remapped. Any axes without a `type` property are skipped.
        this.validateAxesOptions(options);

        this.removeDisabledOptions(options);

        // TODO: Chicken-or-egg, ideally should pass themeParameters in here, but this processing needs to happen
        // first. Practically, it likely doesn't matter. Either way, this should be moved to a "plugin" on the
        // graph.
        let googleFonts = this.processFonts(activeTheme.params);
        googleFonts = this.processFonts(options, googleFonts);

        // Process series options _before_ passing to the OptionsGraph. This ensures the series themes are applied in
        // the correct order to the re-ordered series.
        this.processSeriesOptions(options);
        const unmappedAxisIds = this.processAxesOptions(options, chartType);

        const optionsGraph = createOptionsGraph(activeTheme, options);
        const resolvedOptions = optionsGraph.resolve() as any;
        const themeParameters = optionsGraph.resolveParams();
        const annotationThemes = optionsGraph.resolveAnnotationThemes();
        optionsGraph.clearSafe();

        // TODO: move into options graph?
        const processedOptions = mergeDefaults(processedOverrides, resolvedOptions);

        processModuleOptions(this.chartDef.name, processedOptions);

        this.validateSeriesOptions(processedOptions);

        // The second pass validation of the axes, after they have been processed and the keys remapped. Any missing
        // `type` properties are now inferred and those axes can be validated.
        this.validateAxesOptions(processedOptions, unmappedAxisIds);

        this.validatePluginOptions(processedOptions);
        this.processMiniChartSeriesOptions(processedOptions);

        if (!processedOptions.loadGoogleFonts) {
            googleFonts.clear();
        }

        ChartOptions.debug(() => ['ChartOptions.slowSetup() - processed options', deepClone(processedOptions)]);

        return { activeTheme, processedOptions, themeParameters, annotationThemes, googleFonts, optionsGraph };
    }

    private validatePluginOptions(options: T) {
        for (const pluginDef of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
            const pluginKey = pluginDef.name as keyof T;
            if (
                pluginKey in options &&
                pluginDef.options != null &&
                (!pluginDef.chartType || pluginDef.chartType === this.chartDef?.name)
            ) {
                const { cleared, invalid } = validate(options[pluginKey], pluginDef.options, pluginDef.name);
                for (const error of invalid) {
                    Logger.warn(error);
                }
                options[pluginKey] = cleared as T[keyof T];
            }
        }
    }

    private validateSeriesOptions(options: T): void {
        const chartType = this.chartDef?.name;
        const validatedSeriesOptions: any[] = [];
        const seriesCount = options.series?.length ?? 0;

        let validSeriesTypes: string | undefined;
        for (let index = 0; index < seriesCount; index++) {
            const keyPath = `series[${index}]`;
            const seriesOptions = options.series![index];
            const seriesDef = ModuleRegistry.getSeriesModule(seriesOptions.type);

            if (seriesDef == null) {
                const isEnterprise = enterpriseRegistry.isRegistered();
                validSeriesTypes ??= joinFormatted(
                    Array.from(ExpectedModules.values())
                        .filter(
                            (def) =>
                                def.type === ModuleType.Series &&
                                (isEnterprise || !def.enterprise) &&
                                (!chartType || def.chartType === chartType)
                        )
                        .map((def) => def.name),
                    'or',
                    stringFormat
                );
                Logger.warn(
                    seriesOptions.type == null
                        ? `Option \`${keyPath}.type\` is required and has not been provided; expecting ${validSeriesTypes}, ignoring.`
                        : `Unknown type \`${seriesOptions.type}\` at \`${keyPath}.type\`; expecting ${validSeriesTypes}, ignoring.`
                );
                continue;
            } else if (chartType && seriesDef.chartType !== chartType) {
                Logger.warn(
                    `Series type \`${seriesDef.name}\` at \`${keyPath}.type\` is not supported by chart type \`${chartType}\`, ignoring.`
                );
                continue;
            }

            if (seriesDef.options == null) {
                validatedSeriesOptions.push(seriesOptions);
                continue;
            }

            const { validate: validateSeries = validate } = seriesDef;
            const { cleared, invalid } = validateSeries(seriesOptions, seriesDef.options, keyPath);

            for (const error of invalid) {
                Logger.warn(error);
            }

            if (!hasRequiredInPath(invalid, keyPath)) {
                validatedSeriesOptions.push(cleared);
            }
        }
        options.series = validatedSeriesOptions;
    }

    private validateAxesOptions(options: T, unmappedAxisIds?: Map<string, string>) {
        if (!('axes' in options) || !options.axes) return;

        const chartType = this.chartDef?.name;
        const validatedAxesOptions: PlainObject = {};
        let validAxesTypes: string | undefined;

        for (const [key, axisOptions] of entries(options.axes)) {
            if (!axisOptions) continue;

            // When the `type` property is omitted, the axis can not be validated. It will be validated only on the
            // second pass once the `type` property has been inferred by `processAxesOptions()`.
            if (axisOptions.type == null) {
                validatedAxesOptions[key] = axisOptions;
                continue;
            }

            const keyPath = `axes.${key}`;
            const keyPathUser = `axes.${unmappedAxisIds?.get(key) ?? key}`;
            const axisDef = ModuleRegistry.getAxisModule(axisOptions.type);

            if (axisDef == null) {
                const isEnterprise = enterpriseRegistry.isRegistered();
                validAxesTypes ??= joinFormatted(
                    Array.from(ExpectedModules.values())
                        .filter(
                            (def) =>
                                def.type === ModuleType.Axis &&
                                (isEnterprise || !def.enterprise) &&
                                def.chartType === chartType
                        )
                        .map((def) => def.name),
                    'or',
                    stringFormat
                );

                Logger.warn(
                    `Unknown type \`${axisOptions.type}\` at \`${keyPathUser}.type\`; expecting one of ${validAxesTypes}, ignoring.`
                );
                continue;
            } else if (axisDef.chartType !== chartType) {
                Logger.warn(
                    `Axis type \`${axisDef.name}\` at  \`${keyPathUser}.type\` is not supported by chart type \`${chartType}\`, ignoring.`
                );
                break;
            }

            const { validate: validateAxis = validate } = axisDef;
            const { cleared, invalid } = validateAxis(axisOptions, axisDef.options, keyPath);

            for (const error of invalid) {
                Logger.warn(error);
            }

            if (!hasRequiredInPath(invalid, keyPath)) {
                validatedAxesOptions[key] = cleared;
            }
        }

        options.axes = validatedAxesOptions;
    }

    diffOptions(other?: ChartOptions): Partial<T> {
        // Detect first creation case.
        if (this === other) return {};
        if (other == null) return this.processedOptions;

        return (
            (this.fastDelta as Partial<T>) ??
            jsonDiff(other.processedOptions, this.processedOptions, ChartOptions.JSON_DIFF_OPTS)
        );
    }

    private optionsType(options: Partial<T>) {
        return options.series?.[0]?.type ?? 'line';
    }

    private processSeriesOptions(options: T) {
        const processedSeries = (options.series as SeriesOptionsTypes[])?.map((series) => {
            const seriesDef = ModuleRegistry.getSeriesModule(series.type);
            const visibleDefined = Boolean(seriesDef?.options?.visible);

            return mergeDefaults(this.getSeriesGroupingOptions(series), series, visibleDefined && { visible: true });
        });

        options.series = this.setSeriesGroupingOptions(processedSeries ?? []);
    }

    /**
     * Collates axis ids from the axis and series options to determine the full set of axis ids, defaults series to
     * the primary axes and renames the primary axes to the internal direction-based names.
     */
    private processAxesOptions(options: T, chartType: string) {
        const directions =
            chartType === 'polar'
                ? [ChartAxisDirection.Angle, ChartAxisDirection.Radius]
                : [ChartAxisDirection.X, ChartAxisDirection.Y];

        const directionAxisKeys = this.getAxisDirectionKeys(directions);
        const directionValueKeys = this.getAxisDirectionValueKeys(directions);

        const hasAxes = 'axes' in options && Object.keys(options.axes ?? {}).length > 0;
        const hasNonDefaultSeriesAxisKeys = this.hasNonDefaultSeriesAxisKeys(
            options,
            directions,
            directionAxisKeys,
            directionValueKeys
        );

        const primarySeriesOptions = options.series?.[0];
        const seriesType = this.optionsType(options);
        const defaultAxes: Record<string, PlainObject> =
            this.predictAxes(seriesType, directions, primarySeriesOptions, options.data) ??
            this.cloneDefaultAxes(seriesType);

        if (!hasAxes && !hasNonDefaultSeriesAxisKeys) {
            (options as any).axes = defaultAxes;
            return;
        }

        // Axes that are considered the primary axis for their given direction are internally remapped to the standard
        // naming, e.g. the user's primary axis for the 'x' direction is named `myXAxis`, then internally it will be
        // remapped to and accessed as `x`.
        const axisKeys = 'axes' in options ? new Set(Object.keys(options.axes ?? {})) : new Set<string>();
        const primaryAxisIds = this.getPrimaryAxisIds(
            options,
            directions,
            directionAxisKeys,
            axisKeys,
            hasNonDefaultSeriesAxisKeys
        );
        const remappedAxisIds = new Map<string, string>();
        for (const [direction, axisId] of primaryAxisIds) {
            remappedAxisIds.set(axisId, direction);
        }

        // Secondary axes are then remapped to prevent clashes with the primary axis ids.
        for (const axisId of axisKeys) {
            if (remappedAxisIds.has(axisId)) continue;
            remappedAxisIds.set(axisId, `${AXIS_ID_PREFIX}${remappedAxisIds.size}`);
        }

        // Create the new axes from the remapped axis ids.
        const newAxes: Record<string, unknown> = {};
        const unmappedAxisIds = new Map<string, string>();
        for (const [fromAxisId, toAxisId] of remappedAxisIds) {
            newAxes[toAxisId] = 'axes' in options ? options.axes?.[fromAxisId] : undefined;
            unmappedAxisIds.set(toAxisId, fromAxisId);
        }

        this.remapSeriesAxisIds(
            options,
            directions,
            directionAxisKeys,
            directionValueKeys,
            newAxes,
            remappedAxisIds,
            defaultAxes
        );
        this.predictAxesMissingTypesAndPositions(
            options,
            directions,
            directionAxisKeys,
            directionValueKeys,
            newAxes,
            defaultAxes
        );

        (options as any).axes = newAxes as any;

        return unmappedAxisIds;
    }

    private getAxisDirectionKeys(directions: ChartAxisDirection[]) {
        const directionAxisKeys: Partial<Record<ChartAxisDirection, string>> = {};

        for (const seriesModule of ModuleRegistry.listModulesByType(ModuleType.Series)) {
            if (!seriesModule?.axisKeys) continue;

            for (const direction of directions) {
                const seriesAxisKey = seriesModule.axisKeys[direction];
                if (!seriesAxisKey) continue;
                directionAxisKeys[direction] ??= seriesAxisKey;
            }

            if (Object.keys(directionAxisKeys).length === directions.length) {
                break;
            }
        }

        return directionAxisKeys;
    }

    private getAxisDirectionValueKeys(directions: ChartAxisDirection[]) {
        const directionValueKeys: Partial<Record<ChartAxisDirection, string[]>> = {};

        for (const seriesModule of ModuleRegistry.listModulesByType(ModuleType.Series)) {
            if (!seriesModule?.axisValueKeys) continue;

            for (const direction of directions) {
                directionValueKeys[direction] ??= [];
                const seriesAxisValueKey = seriesModule.axisValueKeys[direction] as string | string[];
                if (!seriesAxisValueKey) continue;
                if (isArray(seriesAxisValueKey)) {
                    directionValueKeys[direction]?.push(...seriesAxisValueKey);
                } else {
                    directionValueKeys[direction]?.push(seriesAxisValueKey);
                }
            }
        }

        for (const direction of directions) {
            directionValueKeys[direction] = unique(directionValueKeys[direction]!);
        }

        return directionValueKeys;
    }

    private hasNonDefaultSeriesAxisKeys(
        options: T,
        directions: ChartAxisDirection[],
        directionAxisKeys: Partial<Record<ChartAxisDirection, string>>,
        directionValueKeys: Partial<Record<ChartAxisDirection, string[]>>
    ) {
        for (const seriesOptions of options.series ?? []) {
            for (const direction of directions) {
                if (!directionValueKeys[direction]?.some((k) => Object.keys(seriesOptions).includes(k))) continue;

                const directionAxisKey = directionAxisKeys[direction];
                if (!directionAxisKey || !isKeyOf(directionAxisKey, seriesOptions)) continue;
                if ((seriesOptions[directionAxisKey] as string) === (direction as string)) continue;

                return true;
            }
        }

        return false;
    }

    /**
     * The primary axes are defined, for each direction, as those first in the `axes` object or referenced by a series.
     * This is irregardless of the specific id of the axis, e.g. an axis with the id `y` may have the position `top`,
     * and would therefore be classified as the primary `x` axis.
     */
    private getPrimaryAxisIds(
        options: T,
        directions: Array<ChartAxisDirection>,
        directionAxisKeys: Partial<Record<ChartAxisDirection, string>>,
        axisKeys: Set<string>,
        hasNonDefaultSeriesAxisKeys: boolean
    ): Map<ChartAxisDirection, string> {
        const primaryAxisIds = new Map<ChartAxisDirection, string>();

        for (const direction of directions) {
            let foundPrimaryAxisId = false;

            if (
                // has axes
                'axes' in options &&
                options.axes &&
                // does not have standard-name primary axis without position
                !(
                    direction in options.axes &&
                    isObject(options.axes[direction]) &&
                    !('position' in options.axes[direction]!)
                )
            ) {
                for (const [axisKey, axisOptions] of entries(options.axes)) {
                    // Attempt to find primary axis by position, for cartesian axes only
                    if (
                        'position' in axisOptions &&
                        axisOptions.position &&
                        direction === POSITION_DIRECTIONS[axisOptions.position]
                    ) {
                        primaryAxisIds.set(direction, axisKey);
                        foundPrimaryAxisId = true;
                        break;
                    }
                }
            }

            if (foundPrimaryAxisId) continue;

            // If there are no series references to any axis, then skip ahead and attempt to find the primary axes by
            // one of the fallback methods.
            if (!hasNonDefaultSeriesAxisKeys) continue;

            for (const seriesOptions of options.series ?? []) {
                const key = directionAxisKeys[direction];
                if (!key) continue;
                const seriesAxisId = (seriesOptions as any)[key];

                // If this series references an axis that has been defined by the user,
                if (axisKeys.has(seriesAxisId)) continue;

                // If this series does not reference an axis in this direction, but at least one series references an
                // axis in any direction, then this series is defaulting to the primary axis id that matches the
                // direction.
                if (!seriesAxisId) {
                    primaryAxisIds.set(direction, direction);
                    break;
                }

                // Otherwise, if this series does reference an axis in this direction, then it must be defining the
                // primary axis in this direction.
                primaryAxisIds.set(direction, seriesAxisId);
                break;
            }
        }

        if (axisKeys.size === 0 || !('axes' in options) || !options.axes) return primaryAxisIds;

        // If no primary axis ids found, fallback to matching keys
        if (primaryAxisIds.size === 0) {
            for (const direction of directions) {
                if (direction in options.axes) {
                    primaryAxisIds.set(direction, direction);
                }
            }
        }

        // If still no primary axis ids found, fallback to partially matching axis types
        if (primaryAxisIds.size === 0) {
            for (const direction of directions) {
                for (const [axisKey, axisOptions] of entries(options.axes)) {
                    if (axisOptions.type?.startsWith(direction)) {
                        primaryAxisIds.set(direction, axisKey);
                        break;
                    }
                }
            }
        }

        // If not all primary axes found, attempt to fill out the missing ones by index
        if (primaryAxisIds.size < 2) {
            const primaryAxisIdsFound = new Set(primaryAxisIds.values());
            for (const [axisKey, axisOptions] of entries(options.axes)) {
                if (primaryAxisIdsFound.has(axisKey) || 'position' in axisOptions) continue;
                for (const direction of directions) {
                    if (primaryAxisIds.has(direction)) continue;
                    primaryAxisIds.set(direction, axisKey);
                    primaryAxisIdsFound.add(axisKey);
                    break;
                }
                if (primaryAxisIds.size === 2) break;
            }
        }

        return primaryAxisIds;
    }

    private remapSeriesAxisIds(
        options: T,
        directions: ChartAxisDirection[],
        directionAxisKeys: Partial<Record<ChartAxisDirection, string>>,
        directionValueKeys: Partial<Record<ChartAxisDirection, string[]>>,
        newAxes: Record<string, unknown>,
        remappedAxisIds: Map<string, string>,
        defaultAxes: Record<string, unknown>
    ) {
        for (const seriesOptions of options.series ?? []) {
            for (const direction of directions) {
                if (!directionValueKeys[direction]?.some((k) => Object.keys(seriesOptions).includes(k))) continue;

                // Ensure there is at least a default axis for each direction indirectly referenced by the series when
                // the user has provided some axes.
                newAxes[direction] ??= defaultAxes[direction];

                // Remap the series axis key to match either the direction or the remapped axis id.
                const directionAxisKey = directionAxisKeys[direction];
                if (!directionAxisKey) continue;

                let remappedSeriesAxisId: string = direction;
                if (directionAxisKey in seriesOptions) {
                    const seriesAxisId: string = (seriesOptions as any)[directionAxisKey];
                    if (remappedAxisIds.has(seriesAxisId)) {
                        remappedSeriesAxisId = remappedAxisIds.get(seriesAxisId)!;
                    } else {
                        // If the series references an axis that is not in the axis dictionary, create a new axis for
                        // this series axis id.
                        remappedSeriesAxisId = `${AXIS_ID_PREFIX}${remappedAxisIds.size}`;
                        remappedAxisIds.set(seriesAxisId, remappedSeriesAxisId);
                        newAxes[remappedSeriesAxisId] = defaultAxes[direction];
                    }
                }

                (seriesOptions as any)[directionAxisKey] = remappedSeriesAxisId;
            }
        }
    }

    private predictAxes(
        seriesType: SeriesType,
        directions: ChartAxisDirection[],
        userSeriesOptions?: any,
        data?: DatumDefault[]
    ): Record<string, PlainObject> | undefined {
        if (!userSeriesOptions) return;

        const seriesData: DatumDefault[] = userSeriesOptions?.data ?? data;
        if (!seriesData?.length) return;

        const predictAxis = ModuleRegistry.getSeriesModule(seriesType)?.predictAxis;
        if (!predictAxis) return;

        const axes = new Map<ChartAxisDirection, SeriesPredictAxis<SeriesType> | undefined>();
        const indices = distribute(0, seriesData.length - 1, 5);

        for (const index of indices) {
            const datum = seriesData[index];
            for (const direction of directions) {
                const axis = predictAxis(direction, datum, userSeriesOptions);
                if (!axes.has(direction)) {
                    axes.set(direction, axis);
                    continue;
                }

                // Check for stability in the predicted axis for this direction, if the prediction is unstable then
                // return and fallback to the defaults.
                const prevAxis = axes.get(direction);
                if (!axis && !prevAxis) continue;
                if (!axis || !prevAxis) return;
                for (const key of Object.keys(prevAxis)) {
                    if ((prevAxis as any)[key] !== (axis as any)[key]) return;
                }
            }
        }

        for (const [direction, axis] of axes) {
            if (!axis) axes.delete(direction);
        }

        // If we couldn't predict any axes, fallback to the defaults.
        if (axes.size === 0) return;

        // If we predicted a single axis, merge this with the defaults by matching positions.
        if (axes.size === 1) {
            const [predictedAxis] = axes.values();
            const defaultAxes = this.cloneDefaultAxes(seriesType);
            if (!('position' in predictedAxis!)) return;
            return mapValues(defaultAxes, (axis) => {
                if (!('position' in axis)) return axis;
                return axis.position === predictedAxis.position ? predictedAxis : axis;
            });
        }

        return Object.fromEntries(axes) as Record<string, PlainObject>;
    }

    private cloneDefaultAxes(seriesType: SeriesType) {
        const seriesModule = ModuleRegistry.getSeriesModule(seriesType);
        return seriesModule?.defaultAxes ? deepClone(seriesModule.defaultAxes) : {};
    }

    private predictAxesMissingTypesAndPositions(
        options: T,
        directions: ChartAxisDirection[],
        directionAxisKeys: Partial<Record<ChartAxisDirection, string>>,
        directionValueKeys: Partial<Record<ChartAxisDirection, string[]>>,
        newAxes: Record<string, unknown>,
        defaultAxes: Record<string, PlainObject>
    ) {
        for (const [key, axis] of entries(newAxes)) {
            if (!isPlainObject(axis)) continue;
            if ('type' in axis && 'position' in axis) continue;

            // Pick the default type and position if this is one of the primary axes.
            if (key in defaultAxes) {
                axis.type ??= defaultAxes[key].type;
                axis.position ??= defaultAxes[key].position;
                continue;
            }

            // Pick the default type where the axis position matches a default axis.
            const predictedType = this.predictAxisMissingTypeFromPosition(axis, defaultAxes);
            if (predictedType) continue;

            // Pick the default type and position where the axis key is referenced by a series axis key.
            this.predictAxisMissingTypeAndPositionFromSeries(
                options,
                directions,
                directionAxisKeys,
                directionValueKeys,
                key,
                axis,
                defaultAxes
            );

            // Remove secondary axes that are not referenced and have no type.
            if (!('type' in axis)) {
                delete newAxes[key];
            }
        }
    }

    private predictAxisMissingTypeFromPosition(axis: PlainObject, defaultAxes: Record<string, PlainObject>) {
        if (!('position' in axis) || !isKeyOf(axis.position, POSITION_DIRECTIONS)) {
            return false;
        }

        for (const defaultAxis of Object.values(defaultAxes)) {
            if (
                isKeyOf(defaultAxis.position, POSITION_DIRECTIONS) &&
                POSITION_DIRECTIONS[axis.position] === POSITION_DIRECTIONS[defaultAxis.position]
            ) {
                axis.type = defaultAxis.type;
                return true;
            }
        }

        for (const [position, positionDirection] of entries(POSITION_DIRECTIONS)) {
            if (axis.position !== position && positionDirection === POSITION_DIRECTIONS[axis.position]) {
                axis.type = defaultAxes[positionDirection].type;
                return true;
            }
        }

        return false;
    }

    private predictAxisMissingTypeAndPositionFromSeries(
        options: T,
        directions: ChartAxisDirection[],
        directionAxisKeys: Partial<Record<ChartAxisDirection, string>>,
        directionValueKeys: Partial<Record<ChartAxisDirection, string[]>>,
        axisKey: string,
        axis: PlainObject,
        defaultAxes: Record<string, PlainObject>
    ) {
        for (const seriesOptions of options.series ?? []) {
            for (const direction of directions) {
                if (!directionValueKeys[direction]?.some((k) => Object.keys(seriesOptions).includes(k))) continue;

                const directionAxisKey = directionAxisKeys[direction];
                if (!directionAxisKey || !isKeyOf(directionAxisKey, seriesOptions)) continue;
                if (seriesOptions[directionAxisKey] !== axisKey) continue;

                axis.type ??= defaultAxes[direction].type;
                axis.position ??= defaultAxes[direction].position;
                return;
            }
        }
    }

    private processMiniChartSeriesOptions(options: T) {
        const miniChartSeries = options.navigator?.miniChart?.series;
        if (miniChartSeries == null) return;

        options.navigator!.miniChart!.series = this.setSeriesGroupingOptions(
            miniChartSeries as Required<AgMiniChartSeriesOptions>[]
        ) as any;
    }

    private getSeriesGroupingOptions(series: SeriesOptionsTypes & GroupingOptions) {
        const { groupable, stackable, stackedByDefault = false } = ModuleRegistry.getSeriesModule(series.type)!;

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

        ChartOptions.debug('ChartOptions.setSeriesGroupingOptions() - series grouping: ', seriesGroups);

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
            const seriesType = series.type;
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

    private soloSeriesIntegrity(options: Partial<T>) {
        if (!isArray(options.series as unknown)) return;
        const isSolo = (seriesType: string) => ModuleRegistry.getSeriesModule(seriesType)?.solo ?? false;
        const allSeries: SeriesOptionsTypes[] | undefined = options.series;
        if (allSeries && allSeries.length > 1 && allSeries.some((series) => isSolo(series.type))) {
            const mainSeriesType = this.optionsType(options);
            if (isSolo(mainSeriesType)) {
                Logger.warn(
                    `series[0] of type '${mainSeriesType}' is incompatible with other series types. Only processing series[0]`
                );
                options.series = allSeries.slice(0, 1) as T['series'];
            } else {
                const { solo, nonSolo } = groupBy(allSeries, (s) => (isSolo(s.type) ? 'solo' : 'nonSolo'));
                const rejects = unique(solo!.map((s) => s.type)).join(', ');
                Logger.warn(`Unable to mix these series types with the lead series type: ${rejects}`);
                options.series = nonSolo as T['series'];
            }
        }
    }

    private static processFontOptions(this: void, node: any, _?: any, __?: any, googleFonts: Set<string> = new Set()) {
        if (typeof node === 'object' && 'fontFamily' in node) {
            if (Array.isArray(node.fontFamily)) {
                const fontFamily = [];
                for (const font of node.fontFamily) {
                    if (typeof font === 'object' && 'googleFont' in font) {
                        fontFamily.push(font.googleFont);
                        googleFonts?.add(font.googleFont);
                    } else {
                        fontFamily.push(font);
                    }
                }
                node.fontFamily = fontFamily.join(', ');
            } else if (typeof node.fontFamily === 'object' && 'googleFont' in node.fontFamily) {
                node.fontFamily = node.fontFamily.googleFont;
                googleFonts?.add(node.fontFamily);
            }
        }
        return googleFonts;
    }

    private processFonts(options: object, googleFonts: Set<string> = new Set()) {
        return jsonWalk<any, any, Set<string>>(
            options,
            ChartOptions.processFontOptions,
            new Set(['data', 'theme']),
            undefined,
            undefined,
            googleFonts
        );
    }

    private static removeDisabledOptionJson(this: void, optionsNode: any) {
        if ('enabled' in optionsNode && optionsNode.enabled === false) {
            for (const key of Object.keys(optionsNode)) {
                if (key === 'enabled') continue;
                delete optionsNode[key];
            }
        }
    }

    private removeDisabledOptions(options: Partial<T>) {
        // Remove configurations from all option objects with a `false` value for the `enabled` property.
        jsonWalk(options, ChartOptions.removeDisabledOptionJson, new Set(['data', 'theme', 'contextMenu']));
    }

    private static removeLeftoverSymbolsJson(this: void, optionsNode: any) {
        if (!optionsNode || !isObject(optionsNode)) return;
        for (const key of Object.keys(optionsNode)) {
            const value = optionsNode[key];
            if (isSymbol(value)) {
                delete optionsNode[key];
            }
        }
    }

    private removeLeftoverSymbols(options: Partial<T>) {
        jsonWalk(options, ChartOptions.removeLeftoverSymbolsJson, new Set(['data']));
    }

    private specialOverridesDefaults(options: Partial<ChartSpecialOverrides>) {
        if (options.window == null) {
            options.window = getWindow();
        } else {
            setWindow(options.window);
        }

        if (options.document == null) {
            options.document = getDocument();
        } else {
            setDocument(options.document);
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
