import {
    Debug,
    type DeepPartial,
    type LicenseManager,
    ModuleRegistry,
    deepClone,
    deepFreeze,
    enterpriseRegistry,
    jsonWalk,
} from 'ag-charts-core';
import type {
    AgChartInstance,
    AgChartOptions,
    AgFinancialChartOptions,
    AgGaugeOptions,
    AgSparklineOptions,
    DatumDefault,
} from 'ag-charts-types';

import { Chart } from '../chart/chart';
import { AgChartInstanceProxy, type FactoryApi } from '../chart/chartProxy';
import type { DataServiceRestoredData } from '../chart/data/dataService';
import { detectChartType } from '../chart/mapping/types';
import { type ChartInternalOptionMetadata, ChartOptions, type ChartSpecialOverrides } from '../module/optionsModule';
import { Pool } from '../util/pool';
import { VERSION } from '../version';
import { MementoCaretaker } from './state/memento';

const debug = Debug.create(true, 'opts');

/**
 * Factory for creating and updating instances of AgChartInstance.
 *
 * @docsInterface
 */
export abstract class AgCharts {
    private static licenseManager?: LicenseManager;
    private static licenseChecked = false;

    private static licenseCheck(options: AgChartOptions) {
        if (this.licenseChecked) return;

        this.licenseManager = enterpriseRegistry.licenseManager?.(options);
        this.licenseManager?.validateLicense();
        this.licenseChecked = true;
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
        const apiStartTime = Debug.check('scene:stats', 'scene:stats:verbose') ? performance.now() : undefined;
        return debug.group('AgCharts.create()', () => {
            // deepClone should clone EVERYTHING here, so we can detect mutations in development mode.
            userOptions = Debug.inDevelopmentMode(() => deepFreeze(deepClone(userOptions))) ?? userOptions;
            this.licenseCheck(userOptions);
            const chart = AgChartsInternal.createOrUpdate({
                userOptions,
                licenseManager: this.licenseManager,
                optionsMetadata,
                apiStartTime,
            });

            if (this.licenseManager?.isDisplayWatermark() && this.licenseManager) {
                enterpriseRegistry.injectWatermark?.(
                    chart.chart!.ctx.domManager,
                    this.licenseManager.getWatermarkMessage()
                );
            }
            return chart as unknown as AgChartInstance<O>;
        });
    }

    public static createFinancialChart(options: AgFinancialChartOptions): AgChartInstance<AgFinancialChartOptions> {
        return debug.group('AgCharts.createFinancialChart()', () => {
            return this.create(options as any, { presetType: 'price-volume' }) as any;
        });
    }

    public static createGauge(options: AgGaugeOptions): AgChartInstance<AgGaugeOptions> {
        return debug.group('AgCharts.createGauge()', () => {
            return this.create(options as AgChartOptions, { presetType: 'gauge-preset' }) as any;
        });
    }

    public static __createSparkline(options: AgSparklineOptions): AgChartInstance<AgSparklineOptions> {
        return debug.group('AgCharts.__createSparkline()', () => {
            const { pool, ...normalOptions } = options as any;
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
                    'Call ModuleRegistry.registerModules(...) with the modules you need before using AgCharts.create().',
                ].join(' ')
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

        const { document, window: userWindow, styleContainer, ...options } = mutableOptions ?? {};
        const baseOptions = chart?.getChartOptions();
        const chartOptions = new ChartOptions(
            baseOptions,
            options,
            processedOverrides,
            {
                ...specialOverrides,
                document,
                window: userWindow,
                styleContainer,
            },
            optionsMetadata,
            deltaOptions,
            stripSymbols,
            chart?.id,
            apiStartTime
        );

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

        if (chartOptions.optionsGraph) {
            chart.ctx.optionsGraphService.updateCallback((path, partialOptions, resolveOptions) => {
                return chartOptions.optionsGraph?.resolvePartial(path, partialOptions, resolveOptions);
            });
        }

        for (const [id, css] of styles) {
            chart.ctx.domManager.addStyles(id, css);
        }

        chart.ctx.fontManager.updateFonts(chartOptions.googleFonts);

        if (data != null) {
            chart.ctx.dataService.restoreData(data);
        }

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

        return proxy;
    }

    private static markRemovedProperties(this: void, node: any, _: unknown, modified = false) {
        if (typeof node !== 'object') return modified;
        for (const key of Object.keys(node)) {
            const value = node[key];
            if (value === undefined) {
                Object.assign(node, { [key]: Symbol('UNSET') });
                modified ||= true;
            }
        }

        return modified;
    }

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
}
