import type {
    AgChartInstance,
    AgChartOptions,
    AgFinancialChartOptions,
    AgGaugeOptions,
    AgSparklineOptions,
} from 'ag-charts-types';

import { CartesianChart } from '../chart/cartesianChart';
import { Chart } from '../chart/chart';
import { AgChartInstanceProxy, type FactoryApi } from '../chart/chartProxy';
import { registerInbuiltModules } from '../chart/factory/registerInbuiltModules';
import { setupModules } from '../chart/factory/setupModules';
import { FlowProportionChart } from '../chart/flowProportionChart';
import { GaugeChart } from '../chart/gaugeChart';
import { HierarchyChart } from '../chart/hierarchyChart';
import {
    isAgCartesianChartOptions,
    isAgFlowProportionChartOptions,
    isAgGaugeChartOptions,
    isAgHierarchyChartOptions,
    isAgPolarChartOptions,
    isAgStandaloneChartOptions,
    isAgTopologyChartOptions,
} from '../chart/mapping/types';
import { PolarChart } from '../chart/polarChart';
import { StandaloneChart } from '../chart/standaloneChart';
import { TopologyChart } from '../chart/topologyChart';
import type { LicenseManager } from '../module/enterpriseModule';
import { enterpriseModule } from '../module/enterpriseModule';
import { type ChartInternalOptionMetadata, ChartOptions, type ChartSpecialOverrides } from '../module/optionsModule';
import { Debug } from '../util/debug';
import { deepClone, jsonWalk } from '../util/json';
import { mergeDefaults } from '../util/object';
import type { DeepPartial } from '../util/types';
import { VERSION } from '../version';
import { MementoCaretaker } from './state/memento';

const debug = Debug.create(true, 'opts');

function chartType(
    options: any
): 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion' | 'standalone' | 'gauge' {
    if (isAgCartesianChartOptions(options)) {
        return 'cartesian';
    } else if (isAgPolarChartOptions(options)) {
        return 'polar';
    } else if (isAgHierarchyChartOptions(options)) {
        return 'hierarchy';
    } else if (isAgTopologyChartOptions(options)) {
        return 'topology';
    } else if (isAgFlowProportionChartOptions(options)) {
        return 'flow-proportion';
    } else if (isAgStandaloneChartOptions(options)) {
        return 'standalone';
    } else if (isAgGaugeChartOptions(options)) {
        return 'gauge';
    }

    throw new Error(`AG Chart - unknown type of chart for options with type: ${options.type}`);
}

/**
 * Factory for creating and updating instances of AgChartInstance.
 *
 * @docsInterface
 */
export abstract class AgCharts {
    private static licenseManager?: LicenseManager;
    private static licenseChecked = false;
    private static licenseKey?: string;
    private static gridContext = false;

    private static licenseCheck(options: AgChartOptions) {
        if (this.licenseChecked) return;

        this.licenseManager = enterpriseModule.licenseManager?.(options);
        this.licenseManager?.setLicenseKey(this.licenseKey, this.gridContext);
        this.licenseManager?.validateLicense();
        this.licenseChecked = true;
    }

    /** @private - for use by Charts website dark-mode support. */
    static optionsMutationFn?: (opts: AgChartOptions, preset?: string) => AgChartOptions;

    public static setLicenseKey(licenseKey: string) {
        this.licenseKey = licenseKey;
    }

    public static setGridContext(gridContext: boolean) {
        this.gridContext = gridContext;
    }

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
    public static create<O extends AgChartOptions>(
        userOptions: O,
        optionsMetadata?: ChartInternalOptionMetadata
    ): AgChartInstance<O> {
        this.licenseCheck(userOptions);
        const chart = AgChartsInternal.createOrUpdate({
            userOptions,
            licenseManager: this.licenseManager,
            styles: enterpriseModule.styles != null ? [['ag-charts-enterprise', enterpriseModule.styles]] : [],
            optionsMetadata,
        });

        if (this.licenseManager?.isDisplayWatermark() && this.licenseManager) {
            enterpriseModule.injectWatermark?.(chart.chart.ctx.domManager, this.licenseManager.getWatermarkMessage());
        }
        return chart as unknown as AgChartInstance<O>;
    }

    public static createFinancialChart(options: AgFinancialChartOptions): AgChartInstance<AgFinancialChartOptions> {
        return this.create(options as any, { presetType: 'price-volume' }) as any;
    }

    public static createGauge(options: AgGaugeOptions): AgChartInstance<AgGaugeOptions> {
        return this.create(options as AgChartOptions, { presetType: 'gauge' }) as any;
    }

    public static __createSparkline(options: AgSparklineOptions): AgChartInstance<AgSparklineOptions> {
        return this.create(options as AgChartOptions, { presetType: 'sparkline' }) as any;
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
            return AgChartsInternal.createOrUpdate({
                userOptions,
                processedOverrides,
                specialOverrides,
                optionsMetadata,
            });
        },
        update(opts, chart) {
            return AgChartsInternal.createOrUpdate({ userOptions: opts, proxy: chart as AgChartInstanceProxy });
        },
        updateUserDelta(chart, deltaOptions) {
            return AgChartsInternal.updateUserDelta(chart as AgChartInstanceProxy, deltaOptions);
        },
    };

    static createOrUpdate(opts: {
        userOptions: AgChartOptions & Partial<ChartSpecialOverrides>;
        processedOverrides?: Partial<AgChartOptions>;
        proxy?: AgChartInstanceProxy;
        licenseManager?: LicenseManager;
        styles?: Array<[string, string]>;
        specialOverrides?: Partial<ChartSpecialOverrides>;
        optionsMetadata?: ChartInternalOptionMetadata;
    }) {
        let { proxy } = opts;
        const {
            userOptions,
            licenseManager,
            styles,
            processedOverrides = proxy?.chart.chartOptions.processedOverrides ?? {},
            specialOverrides = proxy?.chart.chartOptions.specialOverrides ?? {},
            optionsMetadata = proxy?.chart.chartOptions.optionMetadata ?? {},
        } = opts;
        const { presetType } = optionsMetadata;

        AgChartsInternal.initialiseModules();

        debug('>>> AgCharts.createOrUpdate() user options', userOptions);

        let mutableOptions = userOptions;
        if (AgCharts.optionsMutationFn) {
            mutableOptions = AgCharts.optionsMutationFn(mutableOptions, presetType);
            debug('>>> AgCharts.createOrUpdate() MUTATED user options', mutableOptions);
        }

        const { overrideDevicePixelRatio, document, window: userWindow, styleContainer, ...options } = mutableOptions;
        const chartOptions = new ChartOptions(
            options,
            processedOverrides,
            {
                ...specialOverrides,
                document,
                window: userWindow,
                overrideDevicePixelRatio,
                styleContainer,
            },
            optionsMetadata
        );

        let chart = proxy?.chart;
        if (
            chart == null ||
            chartType(chartOptions.processedOptions) !== chartType(chart?.chartOptions.processedOptions)
        ) {
            chart = AgChartsInternal.createChartInstance(chartOptions, chart);
            styles?.forEach(([id, css]) => {
                chart?.ctx.domManager.addStyles(id, css);
            });
        }

        if (proxy == null) {
            proxy = new AgChartInstanceProxy(chart, AgChartsInternal.callbackApi, licenseManager);
        } else {
            proxy.chart = chart;
        }

        if (debug.check() && typeof window !== 'undefined') {
            (window as any).agChartInstances ??= {};
            (window as any).agChartInstances[chart.id] = chart;
        }

        chart.queuedUserOptions.push(userOptions);
        chart.requestFactoryUpdate((chartRef) => {
            chartRef.applyOptions(chartOptions);
            // If there are a lot of update calls, `requestFactoryUpdate()` may skip callbacks,
            // so we need to remove all queue items up to the last successfully applied item.
            const queueIdx = chartRef.queuedUserOptions.indexOf(userOptions) + 1;
            chartRef.queuedUserOptions.splice(0, queueIdx);
        });

        return proxy;
    }

    static updateUserDelta(proxy: AgChartInstanceProxy, deltaOptions: DeepPartial<AgChartOptions>) {
        deltaOptions = deepClone(deltaOptions, { shallow: ['data'] });

        jsonWalk(
            deltaOptions,
            (node) => {
                if (typeof node !== 'object') return;
                for (const [key, value] of Object.entries(node)) {
                    if (typeof value === 'undefined') {
                        Object.assign(node, { [key]: Symbol('UNSET') });
                    }
                }
            },
            { skip: ['data'] }
        );

        const { chart } = proxy;
        const lastUpdateOptions = chart.getOptions();
        const userOptions = mergeDefaults(deltaOptions, lastUpdateOptions);
        debug('>>> AgCharts.updateUserDelta() user delta', deltaOptions);
        debug('AgCharts.updateUserDelta() - base options', lastUpdateOptions);
        AgChartsInternal.createOrUpdate({ userOptions, proxy });
    }

    private static createChartInstance(options: ChartOptions, oldChart?: Chart): Chart {
        const transferableResource = oldChart?.destroy({ keepTransferableResources: true });
        const ChartConstructor = AgChartsInternal.getChartByOptions(options.processedOptions);
        return new ChartConstructor(options, transferableResource);
    }

    private static getChartByOptions(options: AgChartOptions) {
        if (isAgCartesianChartOptions(options)) {
            return CartesianChart;
        } else if (isAgHierarchyChartOptions(options)) {
            return HierarchyChart;
        } else if (isAgPolarChartOptions(options)) {
            return PolarChart;
        } else if (isAgTopologyChartOptions(options)) {
            return TopologyChart;
        } else if (isAgFlowProportionChartOptions(options)) {
            return FlowProportionChart;
        } else if (isAgStandaloneChartOptions(options)) {
            return StandaloneChart;
        } else if (isAgGaugeChartOptions(options)) {
            return GaugeChart;
        }

        throw new Error(
            `AG Charts - couldn't apply configuration, check options are correctly structured and series types are specified`
        );
    }
}
