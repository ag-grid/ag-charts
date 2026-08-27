import {
    type AxisID,
    CSS_GENERIC_FAMILIES,
    ChartAxisDirection,
    type ChartModuleDefinition,
    type CloneOptions,
    Color,
    Debug,
    type DeepPartial,
    type FontOptions,
    Logger,
    ModuleRegistry,
    ModuleType,
    type PlainObject,
    type PresetModuleDefinition,
    type ValidateParams,
    type ValidationError,
    deepClone,
    deepFreeze,
    distribute,
    entries,
    getDocument,
    getWindow,
    groupBy,
    hasRequiredInPath,
    isArray,
    isKeyOf,
    isLogLevel,
    isNumericValue,
    isObject,
    isObjectLike,
    isObjectWithProperty,
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
    shallowClone,
    toFontString,
    unique,
    validate,
} from 'ag-charts-core';
import {
    type AgChartOptions,
    type AgChartThemeParams,
    type AgChartValidationLevel,
    type AgChartValidationsOptions,
    type AgMiniChartSeriesOptions,
    type AgPresetOptions,
    type AgPresetOverrides,
    type DatumDefault,
    type SeriesOptionsTypes,
    type SeriesPredictAxis,
    type SeriesType,
} from 'ag-charts-types';

import { ExpectedModules, type ModulePlaceholder } from '../chart/factory/expectedModules';
import {
    processModuleOptions,
    removeIncompatibleModuleOptions,
    sanitizeThemeModules,
} from '../chart/factory/processModuleOptions';
import { getChartTheme } from '../chart/mapping/themes';
import { detectChartType } from '../chart/mapping/types';
import { ChartTheme } from '../chart/themes/chartTheme';
import {
    type ValidationIssue,
    type ValidationIssueListener,
    severityAtOrAbove,
} from '../chart/validation/validationIssueCollector';
import {
    type OptionsGraphAccessor,
    SHALLOW_OPTION_KEYS,
    createOptionsGraph,
    createOptionsGraphMemoised,
} from './optionsGraph';
import {
    type StructuralCacheEntry,
    VOLATILE_KEYS,
    computeStructuralCacheKey,
    getStructuralCacheEntry,
    setStructuralCacheEntry,
} from './optionsStructuralCache';
import type { SeriesGrouping } from './seriesGrouping';

/** The default `validations.consoleLogLevel` — everything, including deprecation notices. */
const DEFAULT_CONSOLE_LOG_LEVEL: AgChartValidationLevel = 'deprecation';

/** The default `validations.throwOn` — fail-fast is opt-in, so nothing throws unless a consumer asks for it. */
const DEFAULT_THROW_ON: AgChartValidationLevel = 'none';

/**
 * A `validations.throwOn` fail-fast throw. Marks the error as already prefixed and already written to
 * the console, so a wrapper further out re-reports neither.
 */
class FailFastError extends Error {}

/**
 * Drops the trailing `, ignoring.` clause a shared validation message ends with. Accurate for the
 * warn-and-default path that message was written for, and false under an armed `validations.throwOn`
 * — nothing was ignored there, the pass aborted (AG-17831 TC2). Applied to the *thrown* copy only:
 * the console record is written for armed and unarmed charts alike and must stay byte-identical.
 *
 * A message with no such tail is returned unchanged, so an unrecognised wording is a no-op.
 */
function withoutIgnoredClause(message: string): string {
    return message.replace(/[,;]? ignoring\.$/i, '');
}

/**
 * Runaway backstop for {@link ChartOptions.dispatchIssuesBeforeThrow}. Deliberately far above any
 * nesting a consumer could mean: no chain of callbacks each legitimately constructing a further chart
 * gets near this, so crossing it is unbounded recursion rather than depth, and unwinding there beats
 * overflowing the stack. It is not a cycle detector — listener identity is (see the call site).
 */
const MAX_DISPATCH_DEPTH = 32;

/** The `validations` subtree of options that are not yet known to be valid: public keys, unknown values. */
type UnvalidatedValidations = { [K in keyof AgChartValidationsOptions]?: unknown };

function getValidations(options: unknown): UnvalidatedValidations | undefined {
    if (!isObjectWithProperty(options, 'validations')) return undefined;
    const { validations } = options;
    return isObject(validations) ? validations : undefined;
}

interface FontAccumulator {
    /** Google font families to load from the CDN (gated by `loadGoogleFonts`). */
    googleFonts: Set<string>;
    /**
     * FontFaceSet shorthands (e.g. `900 16px "Font Awesome 6 Free"`) for every concrete font
     * referenced in options, to wait on before re-rendering. Weight/style are part of the key
     * because a single family (e.g. FontAwesome) ships each weight as a separate font file.
     */
    fonts: Set<string>;
}

function newFontAccumulator(): FontAccumulator {
    return { googleFonts: new Set(), fonts: new Set() };
}

/**
 * Collect FontFaceSet shorthands for each concrete family in a node's `fontFamily`, carrying the
 * node's weight/style so weight-specific font files are loaded. CSS generic keywords
 * (`sans-serif`, etc.) are never web fonts, so there is nothing to wait for.
 */
function addReferencedFonts(
    fonts: Set<string>,
    node: { fontFamily?: unknown; fontWeight?: unknown; fontStyle?: unknown }
) {
    const { fontFamily, fontWeight, fontStyle } = node;
    if (typeof fontFamily !== 'string') return;
    for (const part of fontFamily.split(',')) {
        const family = part.trim().replace(/(^['"])|(['"]$)/g, '');
        if (family !== '' && !CSS_GENERIC_FAMILIES.has(family.toLowerCase())) {
            fonts.add(
                toFontString({
                    fontSize: 16,
                    fontFamily: family,
                    fontWeight: fontWeight as FontOptions['fontWeight'],
                    fontStyle: fontStyle as FontOptions['fontStyle'],
                })
            );
        }
    }
}

export interface ChartSpecialOverrides {
    document: Document;
    window: Window;
    styleContainer?: HTMLElement;
    skipCss?: boolean;
}

export interface ChartInternalOptionMetadata {
    presetType?: 'price-volume' | 'gauge-preset' | 'sparkline' | 'quadrant';
    pool?: boolean;
    domMode?: 'normal' | 'minimal';
    withDragInterpretation?: boolean;
}

type GroupingOptions = {
    grouped?: boolean;
    stacked?: boolean;
    stackGroup?: string;
    seriesGrouping?: SeriesGrouping;
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

const SIZE_BOUND_KEYS: Record<string, [min: string, max: string]> = {
    bubble: ['minSize', 'maxSize'],
    'map-marker': ['minSize', 'maxSize'],
    'map-line': ['minStrokeWidth', 'maxStrokeWidth'],
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
    public static readonly JSON_DIFF_OPTS = new Set<any>(['data', 'localeText']);
    // Sentinel marking a key removed by a full `update()` so it is dropped on merge (replace semantics).
    private static readonly REMOVED = Symbol('UNSET');

    private static readonly perfDebug = Debug.create(true, 'perf');

    private static readonly FAST_PATH_OPTIONS = new Set<keyof AgChartOptions>([
        'data',
        'width',
        'height',
        'container',
        // `context` is a pass-through consumed only at callback time; no preset/theme
        // processing branches on it, so context-only deltas can take the fast path.
        'context',
    ]);
    private static isFastPathDelta(
        deltaOptions: DeepPartial<AgChartOptions> | null,
        presetFastUpdateKeys?: ReadonlySet<string>
    ) {
        for (const key of Object.keys(deltaOptions ?? {})) {
            if (!this.FAST_PATH_OPTIONS.has(key as keyof AgChartOptions) && !presetFastUpdateKeys?.has(key)) {
                ChartOptions.perfDebug('ChartOptions.isFastPathDelta() - slow path required due to presence of: ', key);
                return false;
            }
        }
        ChartOptions.perfDebug(`ChartOptions.isFastPathDelta() - fast path possible.`);
        return true;
    }

    private static containsRemovalSentinel(node: unknown): boolean {
        // Pass-throughs and non-plain objects can hold user-supplied cycles but never a removal
        // sentinel, so declining to recurse into them cannot miss one.
        if (!isPlainObject(node)) return false;
        for (const key of Object.keys(node)) {
            const value = (node as Record<string, unknown>)[key];
            if (isSymbol(value)) return true;
            if (!SHALLOW_OPTION_KEYS.has(key) && ChartOptions.containsRemovalSentinel(value)) return true;
        }
        return false;
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
    fonts?: Set<string>;
    fastDelta?: DeepPartial<T>;
    chartDef?: ChartModuleDefinition<any>;
    optionsProcessingTime?: number;
    optionsGraph?: OptionsGraphAccessor;
    remappedAxisKeys?: Map<string, AxisID>;
    seriesWithUserVisibility?: {
        identifiers: Set<string>;
        indices: Set<number>;
    };
    userDeltaKeys?: Set<string>;
    processedCSSVariables?: Record<string, string>;
    validationIssues: ValidationIssue[] = [];
    // Provide the unmapped axis keys for error logging & callbacks.
    unmappedAxisKeys: Map<string, string> = new Map();

    // Validation runs in this constructor, before a chart exists; the chart then adopts this
    // instance as `ctx.logger`.
    logger: Logger;

    // Callbacks are wrapped before the chart exists, so their error sink is read at invocation time
    // rather than captured, making the adopt order irrelevant.
    private validationSink?: (issue: ValidationIssue) => void;

    private throwOn: AgChartValidationLevel = 'none';

    // `validations.onErrorRaised`, resolved here rather than read off the chart because a fail-fast
    // throw aborts this constructor: the chart never adopts these issues, so this is the only
    // reference to the listener that survives to report them. See `dispatchIssuesBeforeThrow`.
    private issueListener?: ValidationIssueListener;

    // CSS-refresh re-construction runs from a DOM `transitionend` handler with no caller to throw to.
    private readonly suppressFailFast: boolean;

    private static readonly debug = Debug.create(true, 'opts');

    /**
     * Re-entrancy guard for {@link ChartOptions.dispatchIssuesBeforeThrow}, keyed by listener rather
     * than global; see its comment.
     */
    private static readonly dispatchingListeners = new Set<ValidationIssueListener>();

    /** Runaway backstop only, not a cycle key; see {@link MAX_DISPATCH_DEPTH}. */
    private static dispatchDepth = 0;

    constructor(
        currentUserOptions: T | ChartOptions<T> | undefined,
        newUserOptions: T,
        processedOverrides: Partial<T>,
        specialOverrides: Partial<ChartSpecialOverrides>,
        metadata: ChartInternalOptionMetadata,
        deltaOptions?: DeepPartial<T> | null,
        stripSymbols = false,
        refreshCSSVariables = false,
        apiStartTime?: number,
        logger?: Logger
    ) {
        this.logger = logger ?? new Logger();
        this.optionMetadata = metadata ?? {};
        this.processedOverrides = processedOverrides ?? {};
        this.suppressFailFast = refreshCSSVariables;

        let baseChartOptions: ChartOptions<T> | null = null;
        if (currentUserOptions instanceof ChartOptions) {
            // Delta update case.
            baseChartOptions = currentUserOptions;
            this.specialOverrides = baseChartOptions.specialOverrides;

            // Must precede the fallback jsonDiff below to capture user intent rather than the diff's.
            if (deltaOptions) {
                this.userDeltaKeys = new Set(Object.keys(deltaOptions));
            }

            // A null `deltaOptions` means a full `update()`, whose contract is replace: diff against
            // the previous options and mark omitted subtrees for removal.
            if (deltaOptions == null) {
                deltaOptions = jsonDiff(
                    baseChartOptions.userOptions as T,
                    newUserOptions,
                    ChartOptions.JSON_DIFF_OPTS,
                    ChartOptions.REMOVED
                ) as DeepPartial<T>;
                // Only strip symbols (and so take the slow path) when the diff actually removed a
                // subtree; a fast-path-only change (e.g. width/data) must stay on the fast path.
                stripSymbols ||= ChartOptions.containsRemovalSentinel(deltaOptions);
            }

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
        // Must precede `slowSetup()`'s first validation pass so a user-supplied `'none'` suppresses the
        // first warning. Keyed on presence, not nullishness, so an explicit `null` still warns.
        const userValidations = getValidations(this.userOptions);
        this.applyConsoleLogLevel(
            isObjectWithProperty(userValidations, 'consoleLogLevel')
                ? userValidations.consoleLogLevel
                : getValidations(this.processedOverrides)?.consoleLogLevel
        );
        this.applyThrowOn(
            isObjectWithProperty(userValidations, 'throwOn')
                ? userValidations.throwOn
                : getValidations(this.processedOverrides)?.throwOn
        );
        // Armed before the first validation pass for the same reason as `throwOn`: an issue raised
        // during `slowSetup()` can abort it, and the listener must already be known to be told.
        this.applyIssueListener(
            isObjectWithProperty(userValidations, 'onErrorRaised')
                ? userValidations.onErrorRaised
                : getValidations(this.processedOverrides)?.onErrorRaised
        );

        let activeTheme,
            processedOptions,
            fastDelta,
            themeParameters,
            annotationThemes,
            googleFonts,
            fonts,
            optionsGraph,
            remappedAxisKeys;

        try {
            this.findSeriesWithUserVisiblity(newUserOptions, deltaOptions);

            if (stripSymbols) {
                this.removeLeftoverSymbols(this.userOptions);
            }

            const dataChangedLength =
                currentUserOptions instanceof ChartOptions &&
                deltaOptions?.data !== undefined &&
                deltaOptions?.data?.length !== currentUserOptions.userOptions.data?.length;

            const presetDef =
                this.optionMetadata.presetType == null
                    ? undefined
                    : ModuleRegistry.getPresetModule(this.optionMetadata.presetType);
            if (
                !stripSymbols &&
                !refreshCSSVariables &&
                this.seriesWithUserVisibility == undefined &&
                deltaOptions !== undefined &&
                ChartOptions.isFastPathDelta(deltaOptions, presetDef?.fastUpdateKeys) &&
                baseChartOptions != null &&
                !dataChangedLength &&
                // An armed `throwOn` must re-validate on every pass — the fast path carries `validationIssues`
                // forward without calling the `record*` methods that throw.
                this.throwOn === 'none'
            ) {
                ({ activeTheme, processedOptions, fastDelta } = this.fastSetup(deltaOptions, baseChartOptions));
                themeParameters = baseChartOptions.themeParameters;
                annotationThemes = baseChartOptions.annotationThemes;
                // The fast path doesn't re-extract fonts, so carry them forward to keep waiting for them.
                fonts = baseChartOptions.fonts;
                // The fast path doesn't re-validate, so carry forward the issues from the previous options.
                this.validationIssues = baseChartOptions.validationIssues;
            } else {
                ChartOptions.perfDebug(`ChartOptions.slowSetup()`);
                ({
                    activeTheme,
                    processedOptions,
                    themeParameters,
                    annotationThemes,
                    googleFonts,
                    fonts,
                    optionsGraph,
                    remappedAxisKeys,
                } = this.slowSetup(processedOverrides, deltaOptions, stripSymbols));
            }
        } catch (error) {
            throw this.decorateOptionsProcessingFailure(error);
        }

        this.activeTheme = activeTheme;
        this.processedOptions = processedOptions;
        // Re-apply from the merged result so a value arriving via a theme or preset also takes effect.
        this.applyConsoleLogLevel(getValidations(this.processedOptions)?.consoleLogLevel);
        // State consistency only: this runs after every `record*` call, so it arms nothing this pass.
        this.applyThrowOn(getValidations(this.processedOptions)?.throwOn);
        // As above: re-applied from the merged result so a theme- or preset-supplied listener also counts.
        this.applyIssueListener(getValidations(this.processedOptions)?.onErrorRaised);
        this.fastDelta = fastDelta ?? undefined;
        this.themeParameters = themeParameters;
        this.annotationThemes = annotationThemes;
        this.googleFonts = googleFonts;
        this.fonts = fonts;
        this.optionsGraph = optionsGraph;
        this.remappedAxisKeys = remappedAxisKeys;

        // Capture options processing time for debug stats
        if (apiStartTime !== undefined && typeof apiStartTime === 'number' && !Number.isNaN(apiStartTime)) {
            const endTime = performance.now();
            this.optionsProcessingTime = endTime - apiStartTime;
        }

        // Immutable from here on; freeze in dev to flush out runtime mutations.
        Debug.inDevelopmentMode(() => deepFreeze(this));
    }

    private findSeriesWithUserVisiblity(newUserOptions: T, deltaOptions: DeepPartial<T> | null | undefined) {
        for (const o of [newUserOptions, deltaOptions]) {
            const series = o?.series;
            if (!Array.isArray(series)) continue;
            for (let index = 0; index < series.length; index++) {
                const s = series[index];
                if (!('visible' in s)) continue;
                this.seriesWithUserVisibility ??= {
                    identifiers: new Set<string>(),
                    indices: new Set<number>(),
                };
                if (s.id) {
                    this.seriesWithUserVisibility.identifiers.add(s.id);
                } else {
                    this.seriesWithUserVisibility.indices.add(index);
                }
            }
        }
    }

    private fastSetup(deltaOptions: DeepPartial<T> | null, baseChartOptions: ChartOptions<T>) {
        const { activeTheme, processedOptions: baseOptions } = baseChartOptions;
        const { presetType } = this.optionMetadata;

        if (presetType != null && deltaOptions != null) {
            const presetDef = ModuleRegistry.getPresetModule(presetType);
            // Handle preset data transforms gracefully.
            if (presetDef?.processData && deltaOptions.data != null) {
                const { series, data } = presetDef.processData(deltaOptions.data);
                deltaOptions = mergeDefaults({ series, data }, deltaOptions) as DeepPartial<T>;
            }
            // Map preset-owned root keys (e.g. a gauge's `value`) onto the internal series shape.
            if (presetDef?.processFastUpdate) {
                deltaOptions = presetDef.processFastUpdate(deltaOptions) as DeepPartial<T>;
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
        this.validationIssues = [];

        // Minimal-mode structural-output cache fast path.
        const cacheKey = this.computeStructuralCacheKeyForSlowSetup(deltaOptions, stripSymbols);
        // As above: an armed `throwOn` must re-validate, and a cache hit skips every `record*` call.
        if (cacheKey !== undefined && this.throwOn === 'none') {
            const cached = getStructuralCacheEntry(cacheKey);
            if (cached) {
                return this.slowSetupCached(cached);
            }
        }

        let options = deepClone(this.userOptions, ChartOptions.OPTIONS_CLONE_OPTS_FAST) as T & { type?: string };

        if (deltaOptions) {
            options = mergeDefaults(deltaOptions, options) as T;
            if (stripSymbols) {
                this.removeLeftoverSymbols(options);
            }
        }

        const { presetType } = this.optionMetadata;
        let presetDef: PresetModuleDefinition<any> | undefined;
        let presetDefName: string | undefined;
        let presetOptions: Partial<any> | undefined;
        let optionsTheme = options.theme;
        if (presetType != null) {
            presetDef = ModuleRegistry.getPresetModule(presetType);
            presetDefName = presetDef?.name;
            optionsTheme ??= presetDef?.baseTheme;
        }

        const activeTheme = sanitizeThemeModules(getChartTheme(optionsTheme, this.logger, presetDefName));

        if (presetDef) {
            const { validate: validatePreset = validate } = presetDef;
            const presetParams = options as any as AgPresetOptions;

            const presetSubType = (options as any).type as keyof AgPresetOverrides | undefined;
            const presetTheme = presetSubType == null ? undefined : activeTheme.presets[presetSubType];

            const { cleared, invalid } = validatePreset(presetParams, presetDef.options, '', this.validateParams);
            this.recordValidationErrors(invalid);

            presetOptions = cleared ?? undefined;

            if (hasRequiredInPath(invalid, '')) {
                options = {} as any;
            } else {
                ChartOptions.debug('>>> AgCharts.createOrUpdate() - applying preset', presetOptions);
                options = presetDef.create(
                    presetOptions,
                    presetTheme,
                    () => this.activeTheme,
                    activeTheme.overrides,
                    this.logger,
                    () => this.optionsGraph
                );
            }
        }

        this.soloSeriesIntegrity(options);

        // TODO: Remove as this is only required to pass the series validation, it is handled by the OptionsGraph.
        if (presetType != null) {
            activeTheme.templateTheme(options, false);
        }

        // Must run before chart validation to cleanup invalid types.
        removeIncompatibleModuleOptions(undefined, options);

        const missingSeriesModules = this.validateSeriesOptions(options, this.validateParams);

        const chartType = detectChartType(options);

        this.chartDef = ModuleRegistry.getChartModule(chartType);

        // Must run before chart validation, which would otherwise report these as unknown options.
        this.removeIncompatibleSeriesAreaOptions(options);

        if (!this.chartDef.placeholder) {
            const { validate: validateChart = validate } = this.chartDef;
            const { cleared, invalid } = validateChart(options, this.chartDef.options, '', this.validateParams);
            this.recordValidationErrors(invalid);
            options = cleared as T;
        }

        // The first pass validation of the axes, before they have been processed. At this point the axis keys are still
        // the ones provided by the user and have not been remapped. Any axes without a `type` property are skipped.
        const missingAxesModules = this.validateAxesOptions(options, this.validateParams);

        this.removeDisabledOptions(options);

        // TODO: Chicken-or-egg, ideally should pass themeParameters in here, but this processing needs to happen
        // first. Practically, it likely doesn't matter. Either way, this should be moved to a "plugin" on the
        // graph.
        let fontAccumulator = this.processFonts(activeTheme.params);
        fontAccumulator = this.processFonts(options, fontAccumulator);
        const { googleFonts } = fontAccumulator;

        // Process series options _before_ passing to the OptionsGraph. This ensures the series themes are applied in
        // the correct order to the re-ordered series.
        this.processSeriesOptions(options);
        const remappedAxisKeys = this.processAxesOptions(options, chartType);

        if (this.optionMetadata.presetType !== 'sparkline') {
            this.processedCSSVariables = this.processCSSVariables(options, activeTheme.params);
        }

        const optionsGraph = createOptionsGraphMemoised(
            activeTheme,
            options,
            this.processedCSSVariables,
            presetOptions
        );
        const resolvedOptions = optionsGraph.resolve(this.logger) as any;
        const themeParameters = optionsGraph.resolveParams();
        const annotationThemes = optionsGraph.resolveAnnotationThemes();
        optionsGraph.clearSafe();

        // TODO: move into options graph?
        const processedOptions = mergeDefaults(processedOverrides, resolvedOptions);

        removeIncompatibleModuleOptions(this.chartDef.name, processedOptions);
        const reportedMissingModules = processModuleOptions(
            this.chartDef.name,
            processedOptions,
            missingSeriesModules.concat(missingAxesModules),
            this.logger
        );
        // A dropped series/axis/plugin option is error-severity under fail-fast, thrown only after
        // `processModuleOptions` has already written its console record above.
        if (reportedMissingModules != null) {
            this.throwIfFailFast({ severity: 'error', message: reportedMissingModules.message });
        }

        // Second-pass validation runs after `removeDisabledOptions`, so disabled nodes have been
        // stripped to `{ enabled: false }`; skip their required-field/discriminant warnings.
        const secondPassParams: ValidateParams = {
            skipDisabledNodeValidation: true,
            silentAdvisories: true,
            logger: this.logger,
            onCallbackError: (error, errorPath) => this.reportCallbackError(error, errorPath),
        };

        this.validateSeriesOptions(processedOptions, secondPassParams);

        // Second pass: axis keys are remapped and missing `type` properties inferred, so axes validate.
        this.validateAxesOptions(processedOptions, secondPassParams);

        this.validatePluginOptions(processedOptions, secondPassParams);
        this.processMiniChartSeriesOptions(processedOptions);

        if (!processedOptions.loadGoogleFonts) {
            googleFonts.clear();
        }

        const { fonts } = fontAccumulator;

        ChartOptions.debug(() => ['ChartOptions.slowSetup() - processed options', deepClone(processedOptions)]);

        if (cacheKey !== undefined) {
            // Strip `data` and VOLATILE_KEYS before caching; the read path re-attaches them.
            const { data: _cachedData, ...rest } = processedOptions as Record<string, unknown>;
            for (const key of VOLATILE_KEYS) {
                delete rest[key];
            }
            setStructuralCacheEntry(cacheKey, {
                processedOptions: rest,
                themeParameters,
                googleFonts: googleFonts.size > 0 ? new Set(googleFonts) : undefined,
                fonts: fonts.size > 0 ? new Set(fonts) : undefined,
                annotationThemes,
                chartDef: this.chartDef,
                validationIssues: this.validationIssues,
                remappedAxisKeys,
            });
        }

        return {
            activeTheme,
            processedOptions,
            themeParameters,
            annotationThemes,
            googleFonts,
            fonts,
            optionsGraph,
            remappedAxisKeys,
        };
    }

    private computeStructuralCacheKeyForSlowSetup(
        deltaOptions: DeepPartial<T> | null | undefined,
        stripSymbols: boolean
    ): string | undefined {
        if (this.optionMetadata.domMode !== 'minimal') return undefined;
        if (stripSymbols) return undefined;
        // Delta updates take a different path (fastSetup); cache targets cold creation only.
        if (deltaOptions) return undefined;
        return computeStructuralCacheKey(this.userOptions);
    }

    private slowSetupCached(cached: StructuralCacheEntry) {
        const presetDef =
            this.optionMetadata.presetType == null
                ? undefined
                : ModuleRegistry.getPresetModule(this.optionMetadata.presetType);

        // Must resolve the theme exactly as `slowSetup` does, or a cached chart is styled differently
        // from the one that populated the cache.
        const optionsTheme = (this.userOptions as any).theme ?? presetDef?.baseTheme;
        const activeTheme = sanitizeThemeModules(getChartTheme(optionsTheme, this.logger, presetDef?.name));
        this.chartDef = cached.chartDef;

        // A cache hit skips the loops that populate `validationIssues`, so replay the captured issues.
        this.validationIssues = [...cached.validationIssues];

        // Re-run the preset's data transform on this chart's data — the cached
        // processedOptions has `data` stripped to prevent aliasing.
        const userData = (this.userOptions as any).data;
        const resolvedData = presetDef?.processData ? presetDef.processData(userData).data : userData;

        // Shallow-clone only: sharing frozen nested refs across charts is the point of the cache.
        const userOpts = this.userOptions as Record<string, unknown>;
        const processedOptions = { ...(cached.processedOptions as object), data: resolvedData } as T;
        for (const key of VOLATILE_KEYS) {
            if (key in userOpts) {
                (processedOptions as any)[key] = userOpts[key];
            }
        }

        if (this.optionMetadata.presetType !== 'sparkline') {
            this.processedCSSVariables = this.processCSSVariables(processedOptions);
        }

        // Un-memoized graph — each chart needs its own resolution state for stylers' resolvePartial.
        const optionsGraph = createOptionsGraph(activeTheme, processedOptions as PlainObject);

        return {
            activeTheme,
            processedOptions,
            themeParameters: cached.themeParameters,
            annotationThemes: cached.annotationThemes,
            googleFonts: cached.googleFonts ? new Set(cached.googleFonts) : undefined,
            fonts: cached.fonts ? new Set(cached.fonts) : undefined,
            optionsGraph,
            remappedAxisKeys: cached.remappedAxisKeys,
        };
    }

    /**
     * Point these options at the Logger of the chart that ended up owning them, which is not knowable
     * until the chart type is resolved and the pool consulted.
     */
    adoptLogger(logger: Logger) {
        this.logger = logger;
        // A pooled chart adopts a different Logger after validation, so the level must be re-applied.
        this.applyConsoleLogLevel(getValidations(this.processedOptions)?.consoleLogLevel);
        // Likewise for the throw threshold and the issue listener.
        this.applyThrowOn(getValidations(this.processedOptions)?.throwOn);
        this.applyIssueListener(getValidations(this.processedOptions)?.onErrorRaised);
    }

    /** Point wrapped user callbacks at the owning chart's validation sink, so a swallowed throw surfaces. */
    adoptValidationSink(sink: (issue: ValidationIssue) => void) {
        this.validationSink = sink;
    }

    private reportCallbackError(error: unknown, errorPath: string) {
        const location = errorPath ? ` \`${errorPath}\`` : '';
        const detail = error instanceof Error ? error.message : String(error);
        this.validationSink?.({
            severity: 'error',
            message: `Uncaught exception in user callback${location}: ${detail}`,
        });
    }

    /**
     * Points the Logger at the requested level, falling back to the default for anything unrecognised.
     * The fallback is load-bearing: this runs before the union validator has, so an invalid value must
     * not silence the very warning that reports it.
     */
    private applyConsoleLogLevel(level: unknown) {
        // Typed as the public option so the two level unions stay pinned to each other at compile time.
        const consoleLogLevel: AgChartValidationLevel = isLogLevel(level) ? level : DEFAULT_CONSOLE_LOG_LEVEL;
        this.logger.setLevel(consoleLogLevel);
    }

    /**
     * Resolves `validations.throwOn`, falling back to `'none'` for anything unrecognised. The fallback
     * direction is the opposite of `applyConsoleLogLevel`'s deliberately: this runs before the union
     * validator has, and an invalid value must not make the chart throw about itself — nor turn
     * fail-fast on for a consumer who never asked for it.
     */
    private applyThrowOn(level: unknown) {
        // Reuses `isLogLevel` so a new level cannot be missed by either union.
        this.throwOn = isLogLevel(level) ? level : DEFAULT_THROW_ON;
    }

    /**
     * Resolves `validations.onErrorRaised`. This runs before the union validator has, hence the
     * coercion rather than trusting the value.
     */
    private applyIssueListener(listener: unknown) {
        this.issueListener = typeof listener === 'function' ? (listener as ValidationIssueListener) : undefined;
    }

    /**
     * Reports every issue this pass produced — the accumulated ones plus the `trigger` that tripped
     * the threshold — to `validations.onErrorRaised` immediately before a fail-fast throw. AC 3: the
     * listener is never gated by a severity threshold, and `throwOn` is a threshold — but the throw unwinds out of this constructor, so `Chart.applyOptions()` never runs
     * and the collector that normally dispatches never receives these issues. Delivering here is what
     * makes the two independent. Ordering is the listener first, then the throw.
     */
    private dispatchIssuesBeforeThrow(trigger: ValidationIssue) {
        const listener = this.issueListener;
        if (listener == null) return;
        // Static, unlike the collector's instance-level guard: a consumer that re-applies options from
        // its callback re-enters through a *new* `ChartOptions`, so nothing on `this` can see the
        // recursion. Without this a handler that re-applies the same failing options recurses until the
        // stack overflows, and the fail-fast error the caller is owed never surfaces.
        //
        // Listener identity is the whole cycle detector, and it is exact in both directions: a consumer
        // re-applying failing options from its own callback re-enters through this same function and is
        // stopped, while a callback that legitimately builds a *further* chart still gets that chart's
        // own listener called, however deep the chain goes.
        //
        // Nothing weaker than identity can stand in for it. A consumer whose listener identity changes
        // per pass — the Angular zone wrapper allocates a fresh closure every time — is indistinguishable
        // here from a genuinely new chart, and every proxy for identity is worse than none: source text
        // is shared by every closure a single factory produces, and the trigger issue is shared by two
        // independent charts misconfigured the same way. Both would silence a listener that is owed its
        // event, which is the failure this guard must not cause. So that case falls to the depth
        // backstop below, set far enough out that only runaway recursion reaches it.
        if (ChartOptions.dispatchingListeners.has(listener) || ChartOptions.dispatchDepth >= MAX_DISPATCH_DEPTH) {
            return;
        }
        // Cleared first: `recordOptionsArgumentError` can throw from a second call site after this
        // one, and a consumer must not be told the same issue twice for a single options pass.
        // The dropped-module call site trips fail-fast with an issue it never adds to the collection —
        // `processModuleOptions` is what writes that one to the console — so append it by identity.
        const recorded = this.validationIssues;
        const issues = recorded.includes(trigger) ? recorded : [...recorded, trigger];
        this.validationIssues = [];
        ChartOptions.dispatchingListeners.add(listener);
        ChartOptions.dispatchDepth++;
        try {
            for (const issue of issues) {
                try {
                    listener({ level: issue.severity, message: issue.message });
                } catch (error) {
                    // A throwing consumer must not displace the fail-fast error the caller is about to get.
                    this.logger.error('validations.onErrorRaised threw an error', error);
                }
            }
        } finally {
            ChartOptions.dispatchingListeners.delete(listener);
            ChartOptions.dispatchDepth--;
        }
    }

    private get validateParams(): ValidateParams {
        return {
            logger: this.logger,
            onCallbackError: (error, errorPath) => this.reportCallbackError(error, errorPath),
            onDeprecation: (message, path) => this.recordDeprecation(message, path),
        };
    }

    private recordDeprecation(message: string, path: string) {
        const issue: ValidationIssue = { severity: 'deprecation', message, code: path || undefined };
        this.validationIssues.push(issue);
        this.throwIfFailFast(issue);
    }

    // Every option-validation error goes to both the console log and the per-chart overlay collector.

    private recordValidationErrors(invalid: ValidationError[]) {
        for (const error of invalid) {
            this.logger.warn(error);
            let path = error.path;
            if (error.key) {
                path = path ? `${path}.${error.key}` : error.key;
            }
            const issue: ValidationIssue = { severity: 'warning', message: error.toString(), code: path || undefined };
            this.validationIssues.push(issue);
            this.throwIfFailFast(issue);
        }
    }

    /**
     * Report an argument that could not be options at all (`create(undefined)`, `create(3)`, an empty
     * object) through the same feed as any option-validation error, so it reaches the console log, the
     * `validations.overlayLevel` overlay, `validations.onErrorRaised` and `validations.throwOn`. Raised
     * at `error` severity - unlike a per-option problem, nothing of the caller's intent survives it.
     *
     * Pushed as a new array: the unchanged-options fast path aliases `validationIssues` to the base
     * options' array, which must not gain this chart's issue.
     */
    recordOptionsArgumentError(message: string) {
        this.logger.error(message);
        const issue: ValidationIssue = { severity: 'error', message };
        this.validationIssues = [...this.validationIssues, issue];
        this.throwIfFailFast(issue);
    }

    private recordValidationMessage(message: string) {
        this.logger.warn(message);
        const issue: ValidationIssue = { severity: 'warning', message };
        this.validationIssues.push(issue);
        this.throwIfFailFast(issue);
    }

    /**
     * Throws for the first issue whose severity meets the armed `validations.throwOn` threshold — never
     * called before the console record and the overlay push above have already happened, and never
     * before this pass's issues have reached `validations.onErrorRaised`.
     */
    private throwIfFailFast(issue: ValidationIssue): void {
        if (this.suppressFailFast || this.throwOn === 'none' || !severityAtOrAbove(this.throwOn, issue.severity)) {
            return;
        }
        this.dispatchIssuesBeforeThrow(issue);
        const location = issue.code ? `\`${issue.code}\`: ` : '';
        throw new FailFastError(
            `AG Charts - validations.throwOn: ${issue.severity} - ${location}${withoutIgnoredClause(issue.message)}`
        );
    }

    /**
     * An error raised *while* options are processed — a throwing datum getter, a user callback invoked
     * during validation — escapes this constructor synchronously, ahead of the update loop's own catch
     * in `Chart.tryPerformUpdate()`. Arming `throwOn` is what makes that reachable on a warm update: it
     * forces the slow path, so the read happens during option processing rather than during the update.
     *
     * With the threshold armed at `error` that escape *is* the fail-fast delivery, so it must carry the
     * same console record and the same prefix as every other one (AG-17831 TC1). A `record*` fail-fast
     * throw already has both, and the CSS-refresh re-construction has no caller to throw to, so both
     * pass through untouched.
     */
    private decorateOptionsProcessingFailure(error: unknown): unknown {
        if (error instanceof FailFastError) return error;
        if (this.suppressFailFast || !severityAtOrAbove(this.throwOn, 'error')) return error;

        // Console record first, and worded exactly as the unarmed update-loop catch words it, so the
        // two paths read identically in the console.
        this.logger.error('update error', error, error instanceof Error ? error.stack : undefined);
        // Then `validations.onErrorRaised`, for the same reason the `record*` path dispatches before its
        // throw (AG-17830 AC 3): this escape bypasses the update loop's catch, so the collector that
        // normally reports a caught runtime error never sees this one. The message is the raw error's,
        // matching both the thrown copy and what the collector would have reported unarmed.
        const message = String(error instanceof Error ? error.message : error);
        this.dispatchIssuesBeforeThrow({ severity: 'error', message });
        return new FailFastError(`AG Charts - validations.throwOn: error - ${message}`);
    }

    private removeIncompatibleSeriesAreaOptions(options: T) {
        const chartType = this.chartDef?.name;
        const seriesArea = options.seriesArea as Record<string, unknown> | undefined;
        if (chartType == null || seriesArea == null) return;

        for (const module of ModuleRegistry.listModulesByType(ModuleType.SeriesAreaPlugin)) {
            if (!module.chartType || module.chartType === chartType || seriesArea[module.name] == null) continue;

            delete seriesArea[module.name];

            const seriesTypeMessage =
                options.series?.at(0)?.type == null ? 'this series type' : `\`${options.series?.at(0)?.type}\` series`;
            this.recordValidationMessage(
                `Option \`seriesArea.${module.name}\` is not supported by ${seriesTypeMessage}, ignoring.`
            );
        }
    }

    private validatePluginOptions(options: T, params: ValidateParams) {
        for (const pluginDef of ModuleRegistry.listModulesByType(ModuleType.Plugin)) {
            const pluginKey = pluginDef.name as keyof T;
            if (
                pluginKey in options &&
                pluginDef.options != null &&
                (!pluginDef.chartType || pluginDef.chartType === this.chartDef?.name)
            ) {
                const { cleared, invalid } = validate(options[pluginKey], pluginDef.options, pluginDef.name, params);
                this.recordValidationErrors(invalid);
                options[pluginKey] = cleared as T[keyof T];
            }
        }
    }

    private validateSeriesOptions(options: T, params: ValidateParams): ModulePlaceholder[] {
        // Leave a non-array `series` in place so the chart-def validation pass reports it, rather
        // than silently replacing it with an empty array here.
        if (options.series != null && !isArray(options.series)) return [];

        const chartType = this.chartDef?.name;
        const validatedSeriesOptions: any[] = [];
        const seriesCount = options.series?.length ?? 0;
        const missingModules: ModulePlaceholder[] = [];

        if (seriesCount === 0) {
            // With no `series` the chart still resolves against the default series type, so a missing
            // module for it is the same defect as the explicit mismatch below. Presets supply their own.
            const defaultType = this.optionsType(options);
            const defaultPlaceholder = ExpectedModules.get(defaultType);
            if (
                this.optionMetadata.presetType == null &&
                ModuleRegistry.getSeriesModule(defaultType) == null &&
                defaultPlaceholder?.type === ModuleType.Series
            ) {
                missingModules.push(defaultPlaceholder);
            }
        }

        let validSeriesTypes: string | undefined;
        for (let index = 0; index < seriesCount; index++) {
            const keyPath = `series[${index}]`;
            const seriesOptions = options.series![index];
            const seriesDef = ModuleRegistry.getSeriesModule(seriesOptions.type);

            if (seriesDef == null) {
                const isEnterprise = ModuleRegistry.isEnterprise();
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

                const modulePlaceholder = ExpectedModules.get(seriesOptions.type);
                if (seriesOptions.type != null && modulePlaceholder?.type === ModuleType.Series) {
                    missingModules.push(modulePlaceholder);
                    continue;
                }

                this.recordValidationMessage(
                    seriesOptions.type == null
                        ? `Option \`${keyPath}.type\` is required and has not been provided; expecting ${validSeriesTypes}, ignoring.`
                        : `Unknown type \`${seriesOptions.type}\` at \`${keyPath}.type\`; expecting ${validSeriesTypes}, ignoring.`
                );
                continue;
            } else if (chartType && seriesDef.chartType !== chartType) {
                this.recordValidationMessage(
                    `Series type \`${seriesDef.name}\` at \`${keyPath}.type\` is not supported by chart type \`${chartType}\`, ignoring.`
                );
                continue;
            }

            if (seriesDef.options == null) {
                validatedSeriesOptions.push(seriesOptions);
                continue;
            }

            const { validate: validateSeries = validate } = seriesDef;
            const { cleared, invalid } = validateSeries(seriesOptions, seriesDef.options, keyPath, params);

            this.recordValidationErrors(invalid);

            if (!hasRequiredInPath(invalid, keyPath)) {
                validatedSeriesOptions.push(cleared);
            }
        }
        options.series = validatedSeriesOptions;

        return missingModules;
    }

    private validateAxesOptions(options: T, params: ValidateParams): ModulePlaceholder[] {
        const missingModules: ModulePlaceholder[] = [];
        if (!('axes' in options) || !options.axes) return missingModules;

        const chartType = this.chartDef?.name;
        const validatedAxesOptions: PlainObject = {};
        let validAxesTypes: string | undefined;

        for (const [key, axisOptions] of entries(options.axes)) {
            if (!axisOptions) continue;

            // Without `type` the axis cannot be validated until the second pass infers it.
            if (axisOptions.type == null) {
                validatedAxesOptions[key] = axisOptions;
                continue;
            }

            const keyPath = `axes.${this.unmappedAxisKeys?.get(key) ?? key}`;
            const axisDef = ModuleRegistry.getAxisModule(axisOptions.type);

            if (axisDef == null) {
                const modulePlaceholder = ExpectedModules.get(axisOptions.type);
                if (modulePlaceholder?.type === ModuleType.Axis) {
                    missingModules.push(modulePlaceholder);
                    continue;
                }

                const isEnterprise = ModuleRegistry.isEnterprise();
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

                this.recordValidationMessage(
                    `Unknown type \`${axisOptions.type}\` at \`${keyPath}.type\`; expecting one of ${validAxesTypes}, ignoring.`
                );
                continue;
            } else if (axisDef.chartType !== chartType) {
                this.recordValidationMessage(
                    `Axis type \`${axisDef.name}\` at  \`${keyPath}.type\` is not supported by chart type \`${chartType}\`, ignoring.`
                );
                break;
            }

            const { validate: validateAxis = validate } = axisDef;
            const { cleared, invalid } = validateAxis(axisOptions, axisDef.options, keyPath, params);

            this.recordValidationErrors(invalid);

            if (!hasRequiredInPath(invalid, keyPath)) {
                validatedAxesOptions[key] = cleared;
            }
        }

        options.axes = validatedAxesOptions;

        return missingModules;
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
        const displayNullData = (options as any).displayNullData;

        const processedSeries = (options.series as SeriesOptionsTypes[])?.map((series, index) => {
            this.validateSizeBounds(series, index);

            const seriesDef = ModuleRegistry.getSeriesModule(series.type);
            const visibleDefined = Boolean(seriesDef?.options?.visible);

            const seriesDefaults: Record<string, unknown> = {};
            if (visibleDefined) {
                seriesDefaults.visible = true;
            }
            if (displayNullData !== undefined && (series as any).allowNullKeys === undefined) {
                seriesDefaults.allowNullKeys = displayNullData;
            }

            return mergeDefaults(this.getSeriesGroupingOptions(series), series, seriesDefaults);
        });

        options.series = this.setSeriesGroupingOptions(processedSeries ?? []);
    }

    // Inverted explicit bounds (min > max) are dropped so theme defaults re-apply; a single bound is
    // resolved at render time and is not checked here.
    private validateSizeBounds(series: SeriesOptionsTypes, index: number) {
        const keys = SIZE_BOUND_KEYS[series.type];
        if (keys == null) return;

        const [minKey, maxKey] = keys;
        const seriesOptions = series as unknown as Record<string, unknown>;
        const minValue = seriesOptions[minKey];
        const maxValue = seriesOptions[maxKey];
        if (isNumericValue(minValue) && isNumericValue(maxValue) && minValue > maxValue) {
            this.logger.warnOnce(
                `series[${index}].${minKey} (${minValue}) cannot be greater than ${maxKey} (${maxValue}), ignoring both.`
            );
            delete seriesOptions[minKey];
            delete seriesOptions[maxKey];
        }
    }

    /**
     * Collates axis keys from the axis and series options to determine the full set of axis keys, defaults series to
     * the primary axes and renames the primary axes to the internal direction-based names.
     */
    private processAxesOptions(options: T, chartType: string) {
        const directions =
            chartType === 'polar'
                ? [ChartAxisDirection.Angle, ChartAxisDirection.Radius]
                : [ChartAxisDirection.X, ChartAxisDirection.Y];

        const hasAxes = 'axes' in options && Object.keys(options.axes ?? {}).length > 0;
        const nonDefaultSeriesAxisKeysCount = this.countNonDefaultSeriesAxisKeys(options, directions);
        const hasNonDefaultSeriesAxisKeys = nonDefaultSeriesAxisKeysCount > 0;
        const hasExtraImplicitDefaultSeriesAxisKeys =
            hasNonDefaultSeriesAxisKeys && nonDefaultSeriesAxisKeysCount < (options?.series?.length ?? 0);

        const primarySeriesOptions = options.series?.[0];
        const seriesType = this.optionsType(options);
        const defaultAxes: Record<string, PlainObject> =
            this.predictAxes(seriesType, directions, primarySeriesOptions, options.data) ??
            this.cloneDefaultAxes(seriesType);

        const isPrimarySeriesFlipped =
            isObject(primarySeriesOptions) &&
            'direction' in primarySeriesOptions &&
            primarySeriesOptions.direction === 'horizontal' &&
            ModuleRegistry.getSeriesModule(primarySeriesOptions.type)?.axisKeysFlipped != null;

        if (!hasAxes && !hasNonDefaultSeriesAxisKeys && !isPrimarySeriesFlipped) {
            (options as any).axes = defaultAxes;
            return;
        }

        // The primary axis for each direction is remapped to the standard naming, e.g. a user's `myXAxis`
        // becomes `x`.
        const axisKeys = 'axes' in options ? new Set(Object.keys(options.axes ?? {})) : new Set<string>();
        const primaryAxisKeys = this.getPrimaryAxisKeys(options, directions, axisKeys, hasNonDefaultSeriesAxisKeys);

        const remappedAxisKeys = this.getRemappedAxisKeys(
            axisKeys,
            primaryAxisKeys,
            directions,
            hasExtraImplicitDefaultSeriesAxisKeys
        );

        // Create the new axes from the remapped axis keys.
        const newAxes: Record<string, unknown> = {};
        this.unmappedAxisKeys.clear();
        for (const [fromAxisKey, toAxisKey] of remappedAxisKeys) {
            newAxes[toAxisKey] = 'axes' in options ? shallowClone(options.axes?.[fromAxisKey]) : undefined;
            this.unmappedAxisKeys.set(toAxisKey, fromAxisKey);
        }

        this.remapSeriesAxisKeys(
            options,
            directions,
            newAxes,
            remappedAxisKeys,
            defaultAxes,
            hasExtraImplicitDefaultSeriesAxisKeys
        );
        this.predictAxesMissingTypesAndPositions(options, directions, newAxes, defaultAxes);
        this.alternateSecondaryAxisPositions(options, newAxes);

        (options as any).axes = newAxes as any;

        return remappedAxisKeys;
    }

    /**
     * These keys are used to map a series to an axis for each direction. They are retrieved per-series to allow a
     * mixture of flipped and non-flipped series within the same chart.
     */
    private getSeriesDirectionAxisKey(seriesOptions: NonNullable<T['series']>[number], direction: ChartAxisDirection) {
        const seriesModule = ModuleRegistry.getSeriesModule(seriesOptions.type);
        if (!seriesModule) return;

        const isFlipped = 'direction' in seriesOptions && seriesOptions.direction === 'horizontal';

        return isFlipped && seriesModule.axisKeysFlipped
            ? seriesModule.axisKeysFlipped[direction]
            : seriesModule.axisKeys?.[direction];
    }

    /**
     * Check if any of the series' axis keys have values that do not match the expected value, i.e. the direction.
     */
    private countNonDefaultSeriesAxisKeys(options: T, directions: ChartAxisDirection[]) {
        let count = 0;

        for (const seriesOptions of options.series ?? []) {
            for (const direction of directions) {
                const directionAxisKey = this.getSeriesDirectionAxisKey(seriesOptions, direction);
                if (!directionAxisKey || !isKeyOf(directionAxisKey, seriesOptions)) continue;
                if ((seriesOptions[directionAxisKey] as string) === (direction as string)) continue;

                count++;
            }
        }

        return count;
    }

    /**
     * The primary axes are defined, for each direction, as those first in the `axes` object or referenced by a series.
     * This is irregardless of the specific key of the axis, e.g. an axis with the key `y` may have the position `top`,
     * and would therefore be classified as the primary `x` axis.
     */
    private getPrimaryAxisKeys(
        options: T,
        directions: Array<ChartAxisDirection>,
        axisKeys: Set<string>,
        hasNonDefaultSeriesAxisKeys: boolean
    ): Map<ChartAxisDirection, string> {
        const primaryAxisKeys = new Map<ChartAxisDirection, string>();

        for (const direction of directions) {
            let foundPrimaryAxisKey = false;

            if (
                // has axes
                'axes' in options &&
                options.axes &&
                // does not have standard-name primary axis without position
                !(
                    direction in options.axes &&
                    isObject(options.axes[direction]) &&
                    !('position' in options.axes[direction])
                )
            ) {
                for (const [axisKey, axisOptions] of entries(options.axes)) {
                    // Attempt to find primary axis by position, for cartesian axes only
                    if (
                        'position' in axisOptions &&
                        axisOptions.position &&
                        direction === POSITION_DIRECTIONS[axisOptions.position]
                    ) {
                        primaryAxisKeys.set(direction, axisKey);
                        foundPrimaryAxisKey = true;
                        break;
                    }
                }
            }

            if (foundPrimaryAxisKey) continue;

            // With no series references to any axis, fall through to the fallback methods below.
            if (!hasNonDefaultSeriesAxisKeys) continue;

            for (const seriesOptions of options.series ?? []) {
                const directionAxisKey = this.getSeriesDirectionAxisKey(seriesOptions, direction);
                if (!directionAxisKey) continue;

                const seriesAxisKey = (seriesOptions as any)[directionAxisKey];

                // A user-defined axis not chosen as primary by position must be a secondary axis.
                if (axisKeys.has(seriesAxisKey)) continue;

                // No reference in this direction while other series reference axes: default to the
                // primary axis id matching the direction.
                if (!seriesAxisKey) {
                    primaryAxisKeys.set(direction, direction);
                    break;
                }

                // A referenced but undefined axis in this direction defines the primary axis for it.
                primaryAxisKeys.set(direction, seriesAxisKey);
                break;
            }
        }

        if (axisKeys.size === 0 || !('axes' in options) || !options.axes) return primaryAxisKeys;

        // If no primary axis keys found, fallback to matching keys by direction.
        if (primaryAxisKeys.size === 0) {
            for (const direction of directions) {
                if (direction in options.axes) {
                    primaryAxisKeys.set(direction, direction);
                }
            }
        }

        // If still no primary axis keys found, fallback to partially matching axis types.
        if (primaryAxisKeys.size === 0) {
            for (const direction of directions) {
                for (const [axisKey, axisOptions] of entries(options.axes)) {
                    if (axisOptions.type?.startsWith(direction)) {
                        primaryAxisKeys.set(direction, axisKey);
                        break;
                    }
                }
            }
        }

        // If still no primary axis keys found, get the first axis key for each direction from the series.
        if (primaryAxisKeys.size === 0 && (options.series?.length ?? 0) > 0) {
            for (const direction of directions) {
                for (const seriesOptions of options.series!) {
                    const directionAxisKey = this.getSeriesDirectionAxisKey(seriesOptions, direction);
                    if (!directionAxisKey) continue;

                    const seriesAxisKey = (seriesOptions as any)[directionAxisKey];
                    if (!axisKeys.has(seriesAxisKey)) continue;

                    primaryAxisKeys.set(direction, seriesAxisKey);
                    break;
                }
            }
        }

        // If not all primary axes found, attempt to fill out the missing ones by index.
        if (primaryAxisKeys.size < 2) {
            const primaryAxisIdsFound = new Set(primaryAxisKeys.values());
            for (const [axisKey, axisOptions] of entries(options.axes)) {
                if (primaryAxisIdsFound.has(axisKey) || 'position' in axisOptions) continue;
                for (const direction of directions) {
                    if (primaryAxisKeys.has(direction)) continue;
                    primaryAxisKeys.set(direction, axisKey);
                    primaryAxisIdsFound.add(axisKey);
                    break;
                }
                if (primaryAxisKeys.size === 2) break;
            }
        }

        return primaryAxisKeys;
    }

    private getRemappedAxisKeys(
        axisKeys: Set<string>,
        primaryAxisKeys: Map<ChartAxisDirection, string>,
        directions: ChartAxisDirection[],
        hasExtraImplicitDefaultSeriesAxisKeys: boolean
    ) {
        const remappedAxisKeys = new Map<string, AxisID>();
        for (const [direction, axisKey] of primaryAxisKeys) {
            remappedAxisKeys.set(axisKey, direction as AxisID);
        }

        // Secondary axes are then remapped to prevent clashes with the primary axis keys.
        for (const axisKey of axisKeys) {
            if (remappedAxisKeys.has(axisKey)) continue;
            remappedAxisKeys.set(axisKey, `${AXIS_ID_PREFIX}${remappedAxisKeys.size}` as AxisID);
        }

        // Append secondary axes with the default directions if there are extra series with implicit default axis keys.
        if (hasExtraImplicitDefaultSeriesAxisKeys) {
            for (const direction of directions) {
                if (!remappedAxisKeys.has(direction)) {
                    remappedAxisKeys.set(direction, `${AXIS_ID_PREFIX}${remappedAxisKeys.size}` as AxisID);
                }
            }
        }

        return remappedAxisKeys;
    }

    /**
     * Update each series' axis keys to match the name used internally, such as the direction or a constant suffixed by
     * the index for secondary axes.
     */
    private remapSeriesAxisKeys(
        options: T,
        directions: ChartAxisDirection[],
        newAxes: Record<string, unknown>,
        remappedAxisKeys: Map<string, string>,
        defaultAxes: Record<string, unknown>,
        hasExtraImplicitDefaultSeriesAxisKeys: boolean
    ) {
        for (const seriesOptions of options.series ?? []) {
            for (const direction of directions) {
                const directionAxisKey = this.getSeriesDirectionAxisKey(seriesOptions, direction);
                if (!directionAxisKey) continue;

                // Ensure there is at least a default axis for each direction required by the series.
                newAxes[direction] ??= shallowClone(defaultAxes[direction]);

                // Remap the series axis key to match either the direction or the remapped axis id.
                let remappedSeriesAxisKey: string = direction;

                if (directionAxisKey in seriesOptions) {
                    const seriesAxisKey: string = (seriesOptions as any)[directionAxisKey];
                    if (remappedAxisKeys.has(seriesAxisKey)) {
                        remappedSeriesAxisKey = remappedAxisKeys.get(seriesAxisKey)!;
                    } else {
                        // If the series references an axis that is not in the axis dictionary, create a new axis for
                        // this series axis id.
                        remappedSeriesAxisKey = `${AXIS_ID_PREFIX}${remappedAxisKeys.size}`;
                        remappedAxisKeys.set(seriesAxisKey, remappedSeriesAxisKey);
                        // The series names this axis even though `axes` does not declare it, so record the
                        // mapping — `unmappedAxisKeys` was populated before this method added the entry.
                        this.unmappedAxisKeys.set(remappedSeriesAxisKey, seriesAxisKey);
                        newAxes[remappedSeriesAxisKey] = shallowClone(defaultAxes[direction]);
                    }
                } else if (remappedAxisKeys.has(direction) && hasExtraImplicitDefaultSeriesAxisKeys) {
                    remappedSeriesAxisKey = remappedAxisKeys.get(direction)!;
                    newAxes[remappedSeriesAxisKey] ??= shallowClone(defaultAxes[direction]);
                }

                (seriesOptions as any)[directionAxisKey] = remappedSeriesAxisKey;
            }
        }
    }

    /**
     * Attempt to predict the axes for each direction based on a subset of the data. Each series has its own prediction
     * algorithm.
     */
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
            this.predictAxisMissingTypeAndPositionFromSeries(options, directions, key, axis, defaultAxes);

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
        axisKey: string,
        axis: PlainObject,
        defaultAxes: Record<string, PlainObject>
    ) {
        for (const seriesOptions of options.series ?? []) {
            for (const direction of directions) {
                const directionAxisKey = this.getSeriesDirectionAxisKey(seriesOptions, direction);
                if (!directionAxisKey || !isKeyOf(directionAxisKey, seriesOptions)) continue;
                if (seriesOptions[directionAxisKey] !== axisKey) continue;

                axis.type ??= defaultAxes[direction].type;
                axis.position ??= defaultAxes[direction].position;

                return direction === ChartAxisDirection.Y;
            }
        }

        return false;
    }

    /**
     * If the first secondary axis in either direction does not have a specified position, it will be placed in the
     * alternate position to the primary axis (i.e. right or top).
     */
    private alternateSecondaryAxisPositions(options: T, newAxes: Record<string, unknown>) {
        let xAxisCount = 0;
        let yAxisCount = 0;

        for (const [axisKey, axis] of entries(newAxes)) {
            if (!isPlainObject(axis) || !('position' in axis)) continue;

            const unmappedAxisKey = this.unmappedAxisKeys.get(axisKey);
            const unmappedAxis =
                'axes' in options && options.axes && unmappedAxisKey && unmappedAxisKey in options.axes
                    ? options.axes[unmappedAxisKey]
                    : undefined;
            const unmappedAxisPosition = unmappedAxis && 'position' in unmappedAxis ? unmappedAxis.position : undefined;

            if (axis.position === 'top' || axis.position === 'bottom') {
                xAxisCount += 1;
                if (xAxisCount === 2 && unmappedAxisPosition == null) {
                    axis.position = 'top';
                }
            } else if (axis.position === 'left' || axis.position === 'right') {
                yAxisCount += 1;
                if (yAxisCount === 2 && unmappedAxisPosition == null) {
                    axis.position = 'right';
                }
            }

            if (xAxisCount > 1 && yAxisCount > 1) break;
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
            this.logger.warnOnce(`unsupported grouping of series type "${series.type}".`);
        }
        if ((series.stacked || series.stackGroup) && !stackable) {
            this.logger.warnOnce(`unsupported stacking of series type "${series.type}".`);
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
        return [series.type, series.xKey, series.stacked ? (series.stackGroup ?? 'stacked') : 'grouped']
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
                this.logger.warn(
                    `series[0] of type '${mainSeriesType}' is incompatible with other series types. Only processing series[0]`
                );
                options.series = allSeries.slice(0, 1) as T['series'];
            } else {
                const { solo, nonSolo } = groupBy(allSeries, (s) => (isSolo(s.type) ? 'solo' : 'nonSolo'));
                const rejects = unique(solo!.map((s) => s.type)).join(', ');
                this.logger.warn(`Unable to mix these series types with the lead series type: ${rejects}`);
                options.series = nonSolo as T['series'];
            }
        }
    }

    private static processFontOptions(this: void, node: any, acc: FontAccumulator = newFontAccumulator()) {
        if (typeof node === 'object' && 'fontFamily' in node) {
            const { fontWeight, fontStyle } = node;
            if (Array.isArray(node.fontFamily)) {
                const fontFamily = [];
                for (const font of node.fontFamily) {
                    if (typeof font === 'object' && 'googleFont' in font) {
                        fontFamily.push(font.googleFont);
                        acc.googleFonts.add(font.googleFont);
                        addReferencedFonts(acc.fonts, { fontFamily: font.googleFont, fontWeight, fontStyle });
                    } else {
                        fontFamily.push(font);
                        addReferencedFonts(acc.fonts, { fontFamily: font, fontWeight, fontStyle });
                    }
                }
                node.fontFamily = fontFamily.join(', ');
            } else if (typeof node.fontFamily === 'object' && 'googleFont' in node.fontFamily) {
                node.fontFamily = node.fontFamily.googleFont;
                acc.googleFonts.add(node.fontFamily);
                addReferencedFonts(acc.fonts, { fontFamily: node.fontFamily, fontWeight, fontStyle });
            } else if (typeof node.fontFamily === 'string') {
                addReferencedFonts(acc.fonts, { fontFamily: node.fontFamily, fontWeight, fontStyle });
            }
        }
        return acc;
    }

    private processFonts(options: object, acc: FontAccumulator = newFontAccumulator()) {
        // `jsonWalk` threads its accumulator via a different parameter slot than this visitor
        // expects, so close over `acc` directly to collect fonts from every nested node.
        jsonWalk(options, (node) => ChartOptions.processFontOptions(node, acc), new Set(['data', 'theme']));
        return acc;
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
        jsonWalk(options, ChartOptions.removeDisabledOptionJson, new Set(['data', 'theme', 'contextMenu', 'ranges']));
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

    private static processCSSVariablesJSON(
        this: void,
        optionsNode: any,
        _parallelNode: any,
        ctx: { container: HTMLElement | null | undefined; logger: Logger } | undefined,
        processedCSSVariables: Record<string, string> | undefined
    ) {
        processedCSSVariables ??= {};

        const container = ctx?.container;
        if (!ctx || !optionsNode || !isObjectLike(optionsNode) || !container) {
            return processedCSSVariables;
        }

        for (const key of Object.keys(optionsNode) as any[]) {
            const value = optionsNode[key];

            if (!ChartOptions.isExternalColorVar(value)) continue;

            const resolved = ChartOptions.resolveColorVar(value, container);
            if (!resolved) continue;

            if (!resolved.isValid) {
                ctx.logger.warnOnce(`CSS property [${value}] is not a valid color, ignoring.`);
                delete optionsNode[key];
                continue;
            }

            processedCSSVariables[value] ??= resolved.propertyValue;
        }

        return processedCSSVariables;
    }

    private static isExternalColorVar(value: unknown): value is string {
        return typeof value === 'string' && value.startsWith('var(--') && !value.slice(4, -1).startsWith('--ag-charts');
    }

    private static resolveColorVar(
        value: string,
        container: HTMLElement
    ): { isValid: boolean; propertyValue: string } | undefined {
        const propertyKey = value.slice(4, -1);
        const [mainKey, ...fallbackKeys] = propertyKey.split(',');

        const computedStyle = getComputedStyle(container);
        let propertyValue = computedStyle.getPropertyValue(mainKey.trim());
        let isValid = Color.validColorString(propertyValue);

        if (!isValid && fallbackKeys.length > 0) {
            const fallback = fallbackKeys.join(',').trim();
            // A nested `var(--…)` fallback needs the same custom-property lookup, not a raw `getPropertyValue`.
            if (fallback.startsWith('var(--')) {
                return ChartOptions.resolveColorVar(fallback, container);
            }
            propertyValue = computedStyle.getPropertyValue(fallback) || fallback;
            isValid = Color.validColorString(propertyValue);
        }

        return { isValid, propertyValue };
    }

    private processCSSVariables(options: Partial<T>, themeParams?: object) {
        const { container } = options;
        if (container == null) return;

        const skip = new Set(['data']);
        const ctx = { container, logger: this.logger };
        let processed = jsonWalk(options, ChartOptions.processCSSVariablesJSON, skip, undefined, ctx);
        // The options graph resolves theme params from `activeTheme.params`, a distinct object from `options`, so an
        // invalid `var()` colour there must be dropped here too — otherwise it reaches the blend engine unresolved.
        processed = jsonWalk(themeParams, ChartOptions.processCSSVariablesJSON, skip, undefined, ctx, processed);
        return processed;
    }

    processCSSVariablesPartial(partialOptions: PlainObject | undefined, container: HTMLElement | null | undefined) {
        if (partialOptions == null || container == null) return;

        return jsonWalk(partialOptions, ChartOptions.processCSSVariablesJSON, new Set(['data']), undefined, {
            container,
            logger: this.logger,
        });
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
