import {
    Debug,
    type DeepPartial,
    type LicenseManager,
    MementoCaretaker,
    ModuleRegistry,
    deepClone,
    deepFreeze,
    enterpriseRegistry,
    isPlainObject,
    jsonWalk,
    strictObjectKeys,
} from 'ag-charts-core';
import type {
    AgChartInstance,
    AgChartOptions,
    AgFinancialChartOptions,
    AgGaugeOptions,
    AgQuadrantChartOptions,
    AgSparklineOptions,
    ContextDefault,
    DatumDefault,
} from 'ag-charts-types';

import { Chart } from '../chart/chart';
import { AgChartInstanceProxy, type FactoryApi } from '../chart/chartProxy';
import type { DataServiceRestoredData } from '../chart/data/dataService';
import { detectChartType } from '../chart/mapping/types';
import { type ChartInternalOptionMetadata, ChartOptions, type ChartSpecialOverrides } from '../module/optionsModule';
import { Pool } from '../util/pool';
import { VERSION } from '../version';

const debug = Debug.create(true, 'opts');

function describeValue(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'an array';
    if (typeof value === 'string') {
        const truncated = value.length > 20 ? `${value.slice(0, 20)}\u2026` : value;
        return `a string ('${truncated}')`;
    }
    if (typeof value === 'object') {
        return Object.keys(value).length === 0 ? 'an empty object' : 'an object';
    }
    if (typeof value === 'function') return 'a function';
    if (value === undefined) return 'undefined';
    return `a ${typeof value} (${String(value)})`;
}

/**
 * Carries the diagnostic for an argument that could not be options at all from the entry point that
 * spotted it to the chart that ends up being built, which is the only thing able to report it through
 * the console logger and the validation overlay. A symbol key rather than a property so it cannot
 * collide with, or be mistaken for, a user option; `create()` and `createOrUpdate()` strip it before
 * anything else sees the object.
 */
const OPTIONS_ARGUMENT_ISSUE = Symbol('agChartsOptionsArgumentIssue');

/**
 * Describes an argument that cannot be options at all - anything that is not a non-empty plain object.
 * Individual option values are validated later by the options module, which warns rather than throws,
 * and `container` is optional by design (integrated, sparkline and server-side-render charts omit it),
 * so the fields named in the message are guidance for the caller, not a stricter requirement.
 *
 * Reported, never thrown: the chart reports it as an `error`-severity validation issue, so it reaches
 * the console, the `validations.overlayLevel` overlay and `validations.onErrorRaised` like any other
 * validation error, and a wrapper does not have to translate an exception into its own error channel.
 */
function optionsArgumentIssue(options: unknown, methodName: string): string | undefined {
    if (isPlainObject(options) && Object.keys(options).length > 0) return undefined;
    return `${methodName} requires a non-empty options object; a minimal chart specifies a \`container\` and \`series\` (or \`data\`). Received ${describeValue(options)}.`;
}

/** Tags an invalid argument with its diagnostic, leaving a valid one - and an already-tagged one - alone. */
function withOptionsArgumentIssue<O>(options: O, methodName: string): O {
    if (isPlainObject(options) && OPTIONS_ARGUMENT_ISSUE in options) return options;
    const issue = optionsArgumentIssue(options, methodName);
    return issue == null ? options : ({ [OPTIONS_ARGUMENT_ISSUE]: issue } as O);
}

/**
 * Splits a tagged argument back into the options to build from and the diagnostic to report. Done here
 * rather than in `createOrUpdate()` for the create path, because `deepClone()` copies own string keys
 * only and would drop the tag in development mode.
 */
function takeOptionsArgumentIssue<O>(options: O, methodName: string): { options: O; issue?: string } {
    const tagged = withOptionsArgumentIssue(options, methodName);
    if (!isPlainObject(tagged) || !(OPTIONS_ARGUMENT_ISSUE in tagged)) return { options };
    const { [OPTIONS_ARGUMENT_ISSUE]: issue, ...rest } = tagged as Record<string | symbol, unknown>;
    return { options: rest as O, issue: issue as string };
}

/**
 * Factory for creating and updating instances of AgChartInstance.
 *
 * @docsInterface
 */
export abstract class AgCharts {
    private static licenseManager?: LicenseManager;
    private static licenseChecked = false;

    private static licenseCheck(options: AgChartOptions): LicenseManager | undefined {
        if ((options as { withinStudio?: boolean }).withinStudio) {
            return undefined;
        }
        let licenseManager = this.licenseManager;
        if (!this.licenseChecked) {
            licenseManager = enterpriseRegistry.licenseManager?.(options);
            this.licenseManager = licenseManager;
            licenseManager?.validateLicense();
            this.licenseChecked = true;
        }
        return licenseManager;
    }

    /** @private - for use by Charts website dark-mode support. */
    static readonly optionsMutationFn?: (opts: AgChartOptions, preset?: string) => AgChartOptions;

    /**
     * @private - for use by the framework wrappers.
     *
     * The wrappers merge their own `container` into the caller's `options` before delegating, so an
     * invalid `options` prop reaches `create()` as a perfectly valid `{ container }` object and the
     * check there cannot fire. They call this on the raw prop, before the merge, and build from what
     * it returns: the prop itself when it is usable, otherwise an empty object carrying the diagnostic
     * for the chart to report. Nothing is thrown - the wrapper's own render is not the place to fail.
     */
    public static __validateOptionsArgument<O>(options: O, methodName: string): O {
        return withOptionsArgumentIssue(options, methodName);
    }

    public static getLicenseDetails(licenseKey: string) {
        return enterpriseRegistry.licenseManager?.({}).getLicenseDetails(licenseKey);
    }

    /**
     * Returns the `AgChartInstance` for a DOM node, if there is one.
     */
    public static getInstance(element: HTMLElement): AgChartInstance | undefined {
        return AgChartsInternal.getInstance(element);
    }

    /**
     * Create a new `AgChartInstance` based upon the given configuration options.
     */
    public static create<O extends AgChartOptions<DatumDefault, any>>( // set TContext=any for backward-compatibility
        userOptions: O,
        optionsMetadata?: ChartInternalOptionMetadata
    ): AgChartInstance<O> {
        const { options: validOptions, issue: argumentIssue } = takeOptionsArgumentIssue(
            userOptions,
            'AgCharts.create()'
        );
        userOptions = validOptions;
        const apiStartTime = Debug.check('scene:stats', 'scene:stats:verbose') ? performance.now() : undefined;
        return debug.group('AgCharts.create()', () => {
            // deepClone should clone EVERYTHING here, so we can detect mutations in development mode.
            userOptions = Debug.inDevelopmentMode(() => deepFreeze(deepClone(userOptions))) ?? userOptions;
            const licenseManager = this.licenseCheck(userOptions);
            const chart = AgChartsInternal.createOrUpdate({
                userOptions,
                licenseManager,
                optionsMetadata,
                optionsArgumentIssue: argumentIssue,
                apiStartTime,
            });

            if (licenseManager?.isDisplayWatermark()) {
                enterpriseRegistry.injectWatermark?.(chart.chart!.ctx.domManager, licenseManager.getWatermarkMessage());
            }
            return chart as unknown as AgChartInstance<O>;
        });
    }

    public static createFinancialChart(options: AgFinancialChartOptions): AgChartInstance<AgFinancialChartOptions> {
        options = withOptionsArgumentIssue(options, 'AgCharts.createFinancialChart()');
        return debug.group('AgCharts.createFinancialChart()', () => {
            return this.create(options as any, { presetType: 'price-volume' }) as any;
        });
    }

    public static createGauge(options: AgGaugeOptions): AgChartInstance<AgGaugeOptions> {
        options = withOptionsArgumentIssue(options, 'AgCharts.createGauge()');
        return debug.group('AgCharts.createGauge()', () => {
            return this.create(options as AgChartOptions, { presetType: 'gauge-preset' }) as any;
        });
    }

    public static createQuadrantChart<TDatum = DatumDefault, TContext = ContextDefault>(
        options: AgQuadrantChartOptions<TDatum, TContext>
        // TODO: any to prevent errors
    ): AgChartInstance<AgQuadrantChartOptions<TDatum, any>> {
        options = withOptionsArgumentIssue(options, 'AgCharts.createQuadrantChart()');
        return debug.group('AgCharts.createQuadrantChart()', () => {
            return this.create(options, {
                presetType: 'quadrant',
            }) as AgChartInstance<AgQuadrantChartOptions<TDatum, any>>;
        });
    }

    public static __createSparkline(options: AgSparklineOptions): AgChartInstance<AgSparklineOptions> {
        options = withOptionsArgumentIssue(options, 'AgCharts.__createSparkline()');
        return debug.group('AgCharts.__createSparkline()', () => {
            const { pool, ...normalOptions } = options as any;
            return this.create(withOptionsArgumentIssue(normalOptions, 'AgCharts.__createSparkline()'), {
                presetType: 'sparkline',
                pool: pool ?? true,
                domMode: 'minimal',
                withDragInterpretation: false,
            }) as any;
        });
    }
}

class AgChartsInternal {
    private static readonly caretaker = new MementoCaretaker(VERSION);

    static getInstance(element: HTMLElement): AgChartInstanceProxy | undefined {
        const chart = Chart.getInstance(element);
        return chart ? AgChartInstanceProxy.chartInstances.get(chart) : undefined;
    }

    private static readonly callbackApi: FactoryApi = {
        caretaker: AgChartsInternal.caretaker,
        create(userOptions, processedOverrides, specialOverrides, optionsMetadata, data) {
            return AgChartsInternal.createOrUpdate({
                userOptions,
                processedOverrides,
                specialOverrides,
                optionsMetadata,
                data,
            });
        },
        update(opts, chart, specialOverrides, apiStartTime) {
            return AgChartsInternal.createOrUpdate({
                userOptions: opts,
                proxy: chart as AgChartInstanceProxy,
                specialOverrides,
                apiStartTime,
            });
        },
        updateUserDelta(chart, deltaOptions, apiStartTime) {
            return AgChartsInternal.updateUserDelta(chart as AgChartInstanceProxy, deltaOptions, apiStartTime);
        },
    };

    static createOrUpdate(opts: {
        userOptions?: AgChartOptions & Partial<ChartSpecialOverrides>;
        deltaOptions?: DeepPartial<AgChartOptions>;
        processedOverrides?: Partial<AgChartOptions>;
        proxy?: AgChartInstanceProxy;
        licenseManager?: LicenseManager;
        specialOverrides?: Partial<ChartSpecialOverrides>;
        optionsMetadata?: ChartInternalOptionMetadata;
        /** Reported as an `error` validation issue once the chart exists - see `optionsArgumentIssue()`. */
        optionsArgumentIssue?: string;
        data?: DataServiceRestoredData;
        stripSymbols?: boolean;
        apiStartTime?: number;
    }) {
        let { proxy } = opts;
        const {
            userOptions,
            licenseManager,
            processedOverrides = proxy?.chart?.chartOptions.processedOverrides ?? {},
            specialOverrides = proxy?.chart?.chartOptions.specialOverrides ?? {},
            optionsMetadata = proxy?.chart?.chartOptions.optionMetadata ?? {},
            deltaOptions,
            data,
            stripSymbols = false,
            apiStartTime,
        } = opts;
        let { optionsArgumentIssue: argumentIssue } = opts;
        const styles = enterpriseRegistry.styles == null ? [] : [['ag-charts-enterprise', enterpriseRegistry.styles]];

        if (ModuleRegistry.listModules().next().done) {
            throw new Error(
                [
                    'AG Charts - No modules have been registered.',
                    '',
                    'Call ModuleRegistry.registerModules(...) with the modules you need before using AgCharts.create().',
                    '',
                    'See https://www.ag-grid.com/charts/r/module-registry/ for more details.',
                ].join('\n')
            );
        }

        debug(() => ['>>> AgCharts.createOrUpdate() user options', deepClone(userOptions)]);

        const { presetType } = optionsMetadata;
        let mutableOptions = userOptions;
        if (AgCharts.optionsMutationFn && mutableOptions) {
            mutableOptions = AgCharts.optionsMutationFn(
                deepClone(mutableOptions, ChartOptions.OPTIONS_CLONE_OPTS_FAST),
                presetType
            );
            debug(() => ['>>> AgCharts.createOrUpdate() MUTATED user options', deepClone(mutableOptions)]);
        }

        const pool = this.getPool(optionsMetadata);
        let create = false;
        let poolResult;
        let chart = proxy?.chart;
        if (chart == null && pool?.hasFree()) {
            // Pooled re-use case - we should use the pooled instances options as our base options
            // to optimise the processing here.
            poolResult = pool.obtainFree();
            chart = poolResult.item;
        }

        const {
            document,
            window: userWindow,
            styleContainer,
            skipCss,
            // A wrapper validated its raw prop before merging its container in, so the diagnostic
            // arrives on the options object; strip it here so nothing downstream sees it.
            [OPTIONS_ARGUMENT_ISSUE]: taggedIssue,
            ...options
        } = (mutableOptions ?? {}) as Record<string | symbol, any>;
        argumentIssue ??= taggedIssue;
        const baseOptions = chart?.getChartOptions();
        const newSpecialOverrides = { ...specialOverrides, document, window: userWindow, styleContainer, skipCss };
        let chartOptions;
        try {
            chartOptions = new ChartOptions(
                baseOptions,
                options,
                processedOverrides,
                newSpecialOverrides,
                optionsMetadata,
                deltaOptions,
                stripSymbols,
                false,
                apiStartTime,
                chart?.ctx.logger
            );
        } catch (e) {
            // Options processing can throw (`validations.throwOn`), and a chart already taken out of
            // the pool above would otherwise stay in the busy pool for the rest of the page's life.
            poolResult?.release();
            throw e;
        }

        if (
            chart == null ||
            detectChartType(chartOptions.processedOptions) !== detectChartType(chart.chartOptions.processedOptions)
        ) {
            poolResult?.release(); // Undo previous obtain(), we need to use a different pool!
            poolResult = this.getPool(chartOptions.optionMetadata)?.obtain(chartOptions);
            if (poolResult) {
                chart = poolResult.item;
            } else {
                create = true;
                chart = AgChartsInternal.createChartInstance(chartOptions, chart);
            }
        }

        // A pooled chart keeps its own Logger, so adopt it to keep console output and `warnOnce` dedup unified.
        chartOptions.adoptLogger(chart.ctx.logger);
        chartOptions.adoptValidationSink((issue) => chart.validationCollector.recordCallbackIssue(issue));

        // After `adoptLogger`, so the report goes to the Logger the chart actually keeps.
        if (argumentIssue != null) {
            chartOptions.recordOptionsArgumentError(argumentIssue);
        }

        if (chartOptions.optionsGraph) {
            chart.ctx.optionsGraphService.updateCallback((logger, path, partialOptions, resolveOptions) => {
                const processedCSSVariables = chartOptions.processCSSVariablesPartial(
                    partialOptions,
                    chartOptions.processedOptions.container
                );
                chart.ctx.domManager.updateCSSVariableWatchers(processedCSSVariables);

                return chartOptions.optionsGraph?.resolvePartial(
                    logger,
                    path,
                    partialOptions,
                    resolveOptions,
                    processedCSSVariables
                );
            });
        }

        for (const [id, css] of styles) {
            chart.ctx.domManager.addStyles(id, css);
        }

        if (chartOptions.remappedAxisKeys) {
            chart.ctx.axisManager.setRemappedAxisKeys(chartOptions.remappedAxisKeys);
        }

        chart.ctx.fontManager.updateFonts(chartOptions.googleFonts);
        chart.ctx.fontManager.waitForFonts(chartOptions.fonts);

        if (data != null) {
            chart.ctx.dataService.restoreData(data);
        }
        const loading =
            'loading' in chartOptions.processedOptions
                ? (chartOptions.processedOptions as { loading?: boolean }).loading
                : undefined;
        chart.ctx.dataService.setForcedLoading(loading);

        if (proxy == null) {
            proxy = new AgChartInstanceProxy(chart, AgChartsInternal.callbackApi, licenseManager);
            proxy.releaseChart = poolResult?.release;
        } else if (poolResult || create) {
            proxy.releaseChart?.();
            proxy.chart = chart;
            proxy.releaseChart = poolResult?.release;
        }

        if (debug.check() && typeof globalThis.window !== 'undefined') {
            (globalThis as any).agChartInstances ??= {};
            (globalThis as any).agChartInstances[chart.id] = chart;
        }

        chart.ctx.domManager.updateCSSVariableWatchers(chartOptions.processedCSSVariables);

        // Must precede the short-circuit below: each listener closes over its own update's options.
        chart.setRequestRefreshListener(() => {
            const refreshedChartOptions = new ChartOptions(
                baseOptions,
                options,
                processedOverrides,
                newSpecialOverrides,
                optionsMetadata,
                deltaOptions,
                stripSymbols,
                true,
                Debug.check('scene:stats', 'scene:stats:verbose') ? performance.now() : undefined,
                chart.ctx.logger
            );
            // Re-derived per refresh, so registering the module later recovers.
            if (refreshedChartOptions.unusableLeadSeriesType != null) return;
            AgChartsInternal.requestFactoryUpdate(chart, refreshedChartOptions);
        });

        // The theme prunes an unusable lead series type's entry, and with it the chart-level defaults
        // an update dereferences. The mismatch is already reported as an error.
        if (chartOptions.unusableLeadSeriesType != null) {
            AgChartsInternal.queueSkippedUpdate(chart, chartOptions);
            return proxy;
        }

        AgChartsInternal.requestFactoryUpdate(chart, chartOptions);

        return proxy;
    }

    // `Parameters` and `unknown` here strictly enforce type-safety.
    private static readonly markRemovedProperties: Parameters<
        typeof jsonWalk<DeepPartial<AgChartOptions>, unknown, boolean>
    >[1] = (
        node: DeepPartial<AgChartOptions>,
        _parallelNode: DeepPartial<AgChartOptions> | undefined,
        _ctx: unknown,
        previousModified: boolean | undefined
    ): boolean => {
        let modified = previousModified ?? false;
        if (typeof node !== 'object' || node == null) return modified;
        for (const key of strictObjectKeys(node)) {
            const value = node[key];
            if (value === undefined) {
                Object.assign(node, { [key]: Symbol('UNSET') });
                modified ||= true;
            }
        }

        return modified;
    };

    static updateUserDelta(
        proxy: AgChartInstanceProxy,
        deltaOptions: DeepPartial<AgChartOptions>,
        apiStartTime?: number
    ) {
        deltaOptions = deepClone(deltaOptions, ChartOptions.OPTIONS_CLONE_OPTS_FAST);

        const stripSymbols = jsonWalk(
            deltaOptions,
            AgChartsInternal.markRemovedProperties,
            new Set(['data']),
            undefined,
            undefined,
            false
        );

        debug(() => ['>>> AgCharts.updateUserDelta() user delta', deepClone(deltaOptions)]);
        AgChartsInternal.createOrUpdate({
            proxy,
            deltaOptions,
            stripSymbols,
            apiStartTime,
        });
    }

    private static createChartInstance(this: void, options: ChartOptions, oldChart?: Chart): Chart {
        const transferableResource = oldChart?.destroy({ keepTransferableResources: true });
        const chartType = detectChartType(options.processedOptions);
        const chartDef = ModuleRegistry.getChartModule(chartType);
        return chartDef.create(options, transferableResource) as Chart;
    }

    private static readonly detachAndClear = (chart: Chart) => chart.detachAndClear();
    private static readonly destroy = (chart: Chart) => chart.destroy();
    private static getPool(optionMetadata: ChartInternalOptionMetadata) {
        if (optionMetadata.pool !== true) return;

        return Pool.getPool<Chart, ChartOptions>(
            optionMetadata.presetType ?? 'default',
            this.createChartInstance,
            this.detachAndClear,
            this.destroy,
            Infinity // Unbounded, so Grid sorting cannot exhaust the pool.
        );
    }

    /** Options of updates the `unusableLeadSeriesType` short-circuit skipped. */
    private static readonly skippedChartOptions = new WeakSet<ChartOptions>();

    /**
     * Queues without applying, so a later delta merges onto the caller's latest options rather than the
     * last applied ones. Only an applied update splices its entry off the queue, so replace rather than
     * stack.
     */
    private static queueSkippedUpdate(chart: Chart, chartOptions: ChartOptions) {
        const queued = chart.queuedChartOptions.at(-1);
        if (queued != null && AgChartsInternal.skippedChartOptions.has(queued)) {
            chart.queuedChartOptions.pop();
            chart.queuedUserOptions.pop();
        }
        AgChartsInternal.skippedChartOptions.add(chartOptions);
        chart.queuedUserOptions.push(chartOptions.userOptions);
        chart.queuedChartOptions.push(chartOptions);
    }

    private static requestFactoryUpdate(chart: Chart, chartOptions: ChartOptions) {
        chart.queuedUserOptions.push(chartOptions.userOptions);
        chart.queuedChartOptions.push(chartOptions);
        chart.requestFactoryUpdate((chartRef) => {
            debug.group('>>>> Chart.applyOptions()', () => {
                chartRef.applyOptions(chartOptions);
                // If there are a lot of update calls, `requestFactoryUpdate()` may skip callbacks,
                // so we need to remove all queue items up to the last successfully applied item.
                const queueIdx = chartRef.queuedUserOptions.indexOf(chartOptions.userOptions) + 1;
                chartRef.queuedUserOptions.splice(0, queueIdx);
                chartRef.queuedChartOptions.splice(0, queueIdx);
            });
        });
    }
}
