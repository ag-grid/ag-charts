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
 * Rejects arguments that cannot be options at all - anything that is not a non-empty plain object.
 * Individual option values are validated later by the options module, which warns rather than throws,
 * and `container` is optional by design (integrated, sparkline and server-side-render charts omit it),
 * so the fields named in the message are guidance for the caller, not a stricter requirement.
 */
function assertValidOptions(options: unknown, methodName: string): void {
    if (!isPlainObject(options) || Object.keys(options).length === 0) {
        throw new Error(
            `AG Charts - ${methodName} requires a non-empty options object; a minimal chart specifies a \`container\` and \`series\` (or \`data\`). Received ${describeValue(options)}.`
        );
    }
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
        assertValidOptions(userOptions, 'AgCharts.create()');
        const apiStartTime = Debug.check('scene:stats', 'scene:stats:verbose') ? performance.now() : undefined;
        return debug.group('AgCharts.create()', () => {
            // deepClone should clone EVERYTHING here, so we can detect mutations in development mode.
            userOptions = Debug.inDevelopmentMode(() => deepFreeze(deepClone(userOptions))) ?? userOptions;
            const licenseManager = this.licenseCheck(userOptions);
            const chart = AgChartsInternal.createOrUpdate({
                userOptions,
                licenseManager,
                optionsMetadata,
                apiStartTime,
            });

            if (licenseManager?.isDisplayWatermark()) {
                enterpriseRegistry.injectWatermark?.(chart.chart!.ctx.domManager, licenseManager.getWatermarkMessage());
            }
            return chart as unknown as AgChartInstance<O>;
        });
    }

    public static createFinancialChart(options: AgFinancialChartOptions): AgChartInstance<AgFinancialChartOptions> {
        assertValidOptions(options, 'AgCharts.createFinancialChart()');
        return debug.group('AgCharts.createFinancialChart()', () => {
            return this.create(options as any, { presetType: 'price-volume' }) as any;
        });
    }

    public static createGauge(options: AgGaugeOptions): AgChartInstance<AgGaugeOptions> {
        assertValidOptions(options, 'AgCharts.createGauge()');
        return debug.group('AgCharts.createGauge()', () => {
            return this.create(options as AgChartOptions, { presetType: 'gauge-preset' }) as any;
        });
    }

    public static createQuadrantChart<TDatum = DatumDefault, TContext = ContextDefault>(
        options: AgQuadrantChartOptions<TDatum, TContext>
        // TODO: any to prevent errors
    ): AgChartInstance<AgQuadrantChartOptions<TDatum, any>> {
        assertValidOptions(options, 'AgCharts.createQuadrantChart()');
        return debug.group('AgCharts.createQuadrantChart()', () => {
            return this.create(options, {
                presetType: 'quadrant',
            }) as AgChartInstance<AgQuadrantChartOptions<TDatum, any>>;
        });
    }

    public static __createSparkline(options: AgSparklineOptions): AgChartInstance<AgSparklineOptions> {
        assertValidOptions(options, 'AgCharts.__createSparkline()');
        return debug.group('AgCharts.__createSparkline()', () => {
            const { pool, ...normalOptions } = options as any;
            assertValidOptions(normalOptions, 'AgCharts.__createSparkline()');
            return this.create(normalOptions as AgChartOptions, {
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

        const { document, window: userWindow, styleContainer, skipCss, ...options } = mutableOptions ?? {};
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

        // A chart taken from the pool already exists and keeps the Logger it was built with, so the
        // one these options were validated against is a different instance. Adopt the chart's to keep
        // a chart's console output and `warnOnce` dedup on a single Logger.
        chartOptions.adoptLogger(chart.ctx.logger);
        chartOptions.adoptValidationSink((issue) => chart.validationCollector.recordCallbackIssue(issue));

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
            AgChartsInternal.requestFactoryUpdate(chart, refreshedChartOptions);
        });

        AgChartsInternal.requestFactoryUpdate(chart, chartOptions);

        return proxy;
    }

    // CRT-1018 Use `Parameters` and `unknown` to strictly enforce type-safety
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
            Infinity // AG-13480 - Prevent Grid exhausting pool during sorting.
        );
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
