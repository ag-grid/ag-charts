import { type DeepPartial, ModuleRegistry } from 'ag-charts-core';
import type {
    AgChartInstance,
    AgChartOptions,
    AgFinancialChartOptions,
    AgGaugeOptions,
    AgSparklineOptions,
} from 'ag-charts-types';

import { Chart } from '../chart/chart';
import { AgChartInstanceProxy, type FactoryApi } from '../chart/chartProxy';
import { registerInbuiltModules } from '../chart/factory/registerInbuiltModules';
import { setupModules } from '../chart/factory/setupModules';
import { AllCommunityModules } from '../main-modules';
import type { LicenseManager } from '../module/enterpriseModule';
import { enterpriseModule } from '../module/enterpriseModule';
import { type ChartInternalOptionMetadata, ChartOptions, type ChartSpecialOverrides } from '../module/optionsModule';
import { Debug } from '../util/debug';
import { deepClone, jsonWalk } from '../util/json';
import { deepFreeze } from '../util/object';
import { Pool } from '../util/pool';
import { VERSION } from '../version';
import { MementoCaretaker } from './state/memento';

// Temporarily set here, in the future users will register modules manually
// Remember to remove dep-cruiser exception for main-modules imports when removed
ModuleRegistry.registerMany(AllCommunityModules);

const debug = Debug.create(true, 'opts');

/**
 * Factory for creating and updating instances of AgChartInstance.
 *
 * @docsInterface
 */
export abstract class AgCharts {
    private static licenseManager?: LicenseManager;
    private static licenseChecked = false;

    private static licenseCheck<TDatum, TOptions extends AgChartOptions<TDatum>>(options: TOptions) {
        if (this.licenseChecked) return;

        this.licenseManager = enterpriseModule.licenseManager?.<TDatum, TOptions>(options);
        this.licenseManager?.validateLicense();
        this.licenseChecked = true;
    }

    /** @private - for use by Charts website dark-mode support. */
    static readonly optionsMutationFn?: <TDatum, TOptions extends AgChartOptions<TDatum>>(
        opts: TOptions,
        preset?: string
    ) => TOptions;

    public static getLicenseDetails(licenseKey: string) {
        return enterpriseModule.licenseManager?.({}).getLicenseDetails(licenseKey);
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
    public static create<TDatum, TOptions extends AgChartOptions<TDatum>>(
        userOptions: TOptions,
        optionsMetadata?: ChartInternalOptionMetadata
    ): AgChartInstance<TDatum, TOptions> {
        return debug.group('AgCharts.create()', () => {
            userOptions = Debug.inDevelopmentMode(() => deepFreeze(deepClone(userOptions))) ?? userOptions;
            this.licenseCheck<TDatum, TOptions>(userOptions);
            const chart = AgChartsInternal.createOrUpdate<TDatum, TOptions>({
                userOptions,
                licenseManager: this.licenseManager,
                optionsMetadata,
            });

            if (this.licenseManager?.isDisplayWatermark() && this.licenseManager) {
                enterpriseModule.injectWatermark?.(
                    chart.chart!.ctx.domManager,
                    this.licenseManager.getWatermarkMessage()
                );
            }
            return chart as unknown as AgChartInstance<TDatum, TOptions>;
        });
    }

    public static createFinancialChart<TDatum>(
        options: AgFinancialChartOptions<TDatum>
    ): AgChartInstance<AgFinancialChartOptions<TDatum>> {
        return debug.group('AgCharts.createFinancialChart()', () => {
            return this.create(options as any, { presetType: 'price-volume' }) as any;
        });
    }

    public static createGauge(options: AgGaugeOptions): AgChartInstance<AgGaugeOptions> {
        return debug.group('AgCharts.createGauge()', () => {
            return this.create(options as AgChartOptions, { presetType: 'gauge' }) as any;
        });
    }

    public static __createSparkline<TDatum>(
        options: AgSparklineOptions<TDatum>
    ): AgChartInstance<AgSparklineOptions<TDatum>> {
        return debug.group('AgCharts.__createSparkline()', () => {
            const { pool, ...normalOptions } = options as any;
            return this.create(normalOptions, {
                presetType: 'sparkline',
                pool: pool ?? true,
                domMode: 'minimal',
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

    private static initialised = false;
    static initialiseModules() {
        if (AgChartsInternal.initialised) return;

        registerInbuiltModules();
        setupModules();

        AgChartsInternal.initialised = true;
    }

    private static readonly callbackApi: FactoryApi = {
        caretaker: AgChartsInternal.caretaker,
        create(userOptions, processedOverrides, specialOverrides, optionsMetadata) {
            type TOptions = typeof userOptions;
            type TDatum = NonNullable<TOptions['data']>[number];
            return AgChartsInternal.createOrUpdate<TDatum, TOptions>({
                userOptions,
                processedOverrides,
                specialOverrides,
                optionsMetadata,
            });
        },
        update(opts, chart) {
            type TOptions = typeof opts;
            type TDatum = NonNullable<TOptions['data']>[number];
            return AgChartsInternal.createOrUpdate<TDatum, TOptions>({
                userOptions: opts,
                proxy: chart as unknown as AgChartInstanceProxy,
            });
        },
        updateUserDelta(chart, deltaOptions) {
            type TOptions = ReturnType<(typeof chart)['getOptions']>;
            type TDatum = NonNullable<TOptions['data']>[number];
            return AgChartsInternal.updateUserDelta<TDatum, TOptions>(
                chart as unknown as AgChartInstanceProxy,
                deltaOptions
            );
        },
    };

    static createOrUpdate<TDatum, TOptions extends AgChartOptions<TDatum>>(opts: {
        userOptions?: TOptions & Partial<ChartSpecialOverrides>;
        deltaOptions?: DeepPartial<TOptions>;
        processedOverrides?: Partial<TOptions>;
        proxy?: AgChartInstanceProxy;
        licenseManager?: LicenseManager;
        specialOverrides?: Partial<ChartSpecialOverrides>;
        optionsMetadata?: ChartInternalOptionMetadata;
        stripSymbols?: boolean;
    }) {
        let { proxy } = opts;
        const {
            userOptions,
            licenseManager,
            processedOverrides = proxy?.chart?.chartOptions.processedOverrides ?? {},
            specialOverrides = proxy?.chart?.chartOptions.specialOverrides ?? {},
            optionsMetadata = proxy?.chart?.chartOptions.optionMetadata ?? {},
            deltaOptions,
            stripSymbols = false,
        } = opts;
        const styles = enterpriseModule.styles != null ? [['ag-charts-enterprise', enterpriseModule.styles]] : [];

        const { presetType } = optionsMetadata;

        AgChartsInternal.initialiseModules();

        debug(() => ['>>> AgCharts.createOrUpdate() user options', deepClone(userOptions)]);

        let mutableOptions = userOptions;
        if (AgCharts.optionsMutationFn && mutableOptions) {
            mutableOptions = AgCharts.optionsMutationFn<TDatum, TOptions>(deepClone(mutableOptions), presetType);
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
        const chartOptions: ChartOptions<TDatum, TOptions> = new ChartOptions<any, any>(
            baseOptions,
            options as AgChartOptions<unknown>,
            processedOverrides,
            {
                ...specialOverrides,
                document,
                window: userWindow,
                styleContainer,
            },
            optionsMetadata,
            deltaOptions,
            stripSymbols
        );

        if (
            chart == null ||
            ModuleRegistry.detectChartDefinition(chartOptions.processedOptions) !==
                ModuleRegistry.detectChartDefinition(chart.chartOptions.processedOptions)
        ) {
            poolResult?.release(); // Undo previous obtain(), we need to use a different pool!
            poolResult = this.getPool<TDatum, TOptions>(chartOptions.optionMetadata)?.obtain(chartOptions);
            if (poolResult) {
                chart = poolResult.item;
            } else {
                create = true;
                chart = AgChartsInternal.createChartInstance<TDatum, TOptions>(chartOptions, chart);
            }
        }

        styles.forEach(([id, css]) => {
            chart?.ctx.domManager.addStyles(id, css);
        });

        if (proxy == null) {
            proxy = new AgChartInstanceProxy(chart, AgChartsInternal.callbackApi, licenseManager);
            proxy.releaseChart = poolResult?.release;
        } else if (poolResult || create) {
            proxy.releaseChart?.();
            proxy.chart = chart;
            proxy.releaseChart = poolResult?.release;
        }

        if (debug.check() && typeof window !== 'undefined') {
            (window as any).agChartInstances ??= {};
            (window as any).agChartInstances[chart.id] = chart;
        }

        chart.pushOptions(chartOptions);
        chart.requestFactoryUpdate((chartRef) => {
            debug.group('>>>> Chart.applyOptions()', () => {
                chartRef.applyOptions(chartOptions);
                // If there are a lot of update calls, `requestFactoryUpdate()` may skip callbacks,
                // so we need to remove all queue items up to the last successfully applied item.
                chartRef.popOptions(chartOptions);
            });
        });

        return proxy;
    }

    private static markRemovedProperties(this: void, node: any, _: unknown, modified = false) {
        if (typeof node !== 'object') return modified;
        for (const key of Object.keys(node)) {
            const value = node[key];
            if (typeof value === 'undefined') {
                Object.assign(node, { [key]: Symbol('UNSET') });
                modified ||= true;
            }
        }

        return modified;
    }

    static updateUserDelta<TDatum, TOptions extends AgChartOptions<TDatum>>(
        proxy: AgChartInstanceProxy,
        deltaOptions: DeepPartial<TOptions>
    ) {
        deltaOptions = deepClone(deltaOptions, ChartOptions.OPTIONS_CLONE_OPTS);

        const stripSymbols = jsonWalk(
            deltaOptions,
            AgChartsInternal.markRemovedProperties,
            new Set(['data']),
            undefined,
            undefined,
            false
        );

        debug(() => ['>>> AgCharts.updateUserDelta() user delta', deepClone(deltaOptions)]);
        AgChartsInternal.createOrUpdate<TDatum, TOptions>({
            proxy,
            deltaOptions,
            stripSymbols,
        });
    }

    private static createChartInstance<TDatum, TOptions extends AgChartOptions<TDatum>>(
        this: void,
        options: ChartOptions<TDatum, TOptions>,
        oldChart?: Chart
    ): Chart {
        const transferableResource = oldChart?.destroy({ keepTransferableResources: true });
        const chartDef = ModuleRegistry.detectChartDefinition(options.processedOptions);
        return chartDef.create(options, transferableResource) as Chart;
    }

    private static readonly detachAndClear = (chart: Chart) => chart.detachAndClear();
    private static readonly destroy = (chart: Chart) => chart.destroy();
    private static getPool<TDatum, TOptions extends AgChartOptions<TDatum>>(
        optionMetadata: ChartInternalOptionMetadata
    ) {
        if (optionMetadata.pool !== true) return;

        return Pool.getPool<Chart, ChartOptions<TDatum, TOptions>>(
            optionMetadata.presetType ?? 'default',
            this.createChartInstance,
            this.detachAndClear,
            this.destroy,
            Infinity // AG-13480 - Prevent Grid exhausting pool during sorting.
        );
    }
}
