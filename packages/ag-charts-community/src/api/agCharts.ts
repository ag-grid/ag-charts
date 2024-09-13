import type { AgChartInstance, AgChartOptions, AgFinancialChartOptions, AgGaugeOptions } from 'ag-charts-types';

import { CartesianChart } from '../chart/cartesianChart';
import { Chart, type ChartExtendedOptions } from '../chart/chart';
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
    isAgTopologyChartOptions,
} from '../chart/mapping/types';
import { PolarChart } from '../chart/polarChart';
import { TopologyChart } from '../chart/topologyChart';
import type { LicenseManager } from '../module/enterpriseModule';
import { enterpriseModule } from '../module/enterpriseModule';
import { ChartOptions } from '../module/optionsModule';
import { Debug } from '../util/debug';
import { deepClone, jsonWalk } from '../util/json';
import { mergeDefaults } from '../util/object';
import type { DeepPartial } from '../util/types';
import { VERSION } from '../version';
import { MementoCaretaker } from './state/memento';

const debug = Debug.create(true, 'opts');

function chartType(options: any): 'cartesian' | 'polar' | 'hierarchy' | 'topology' | 'flow-proportion' | 'gauge' {
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
    public static create<O extends AgChartOptions>(options: O): AgChartInstance<O> {
        this.licenseCheck(options);
        const chart = AgChartsInternal.createOrUpdate(
            options,
            undefined,
            this.licenseManager,
            enterpriseModule.styles != null ? [['ag-charts-enterprise', enterpriseModule.styles]] : []
        );

        if (this.licenseManager?.isDisplayWatermark() && this.licenseManager) {
            enterpriseModule.injectWatermark?.(chart.chart.ctx.domManager, this.licenseManager.getWatermarkMessage());
        }
        return chart as unknown as AgChartInstance<O>;
    }

    public static createFinancialChart(options: AgFinancialChartOptions): AgChartInstance<AgFinancialChartOptions> {
        return this.create({ presetType: 'price-volume', ...options } as AgChartOptions) as any;
    }

    public static createGauge(options: AgGaugeOptions): AgChartInstance<AgGaugeOptions> {
        return this.create({ presetType: 'gauge', ...(options as any) } as AgChartOptions) as any;
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

    static callbackApi: FactoryApi = {
        caretaker: AgChartsInternal.caretaker,
        createOrUpdate(opts, chart) {
            return AgChartsInternal.createOrUpdate(opts, chart as AgChartInstanceProxy);
        },
        updateUserDelta(chart, deltaOptions) {
            return AgChartsInternal.updateUserDelta(chart as AgChartInstanceProxy, deltaOptions);
        },
    };

    static createOrUpdate(
        options: ChartExtendedOptions,
        proxy?: AgChartInstanceProxy,
        licenseManager?: LicenseManager,
        styles?: Array<[string, string]>
    ) {
        AgChartsInternal.initialiseModules();

        debug('>>> AgCharts.createOrUpdate() user options', options);

        const { presetType = proxy?.chart.chartOptions.presetType, ...otherOptions } = options;

        let mutableOptions = otherOptions;
        if (AgCharts.optionsMutationFn) {
            mutableOptions = AgCharts.optionsMutationFn(mutableOptions, presetType);
            debug('>>> AgCharts.createOrUpdate() MUTATED user options', options);
        }

        const { overrideDevicePixelRatio, document, window: userWindow, ...userOptions } = mutableOptions;
        const chartOptions = new ChartOptions(userOptions, {
            presetType,
            document,
            window: userWindow,
            overrideDevicePixelRatio,
        });

        let chart = proxy?.chart;
        if (chart == null || chartType(userOptions) !== chartType(chart?.chartOptions.processedOptions)) {
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
        AgChartsInternal.createOrUpdate(userOptions, proxy);
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
        } else if (isAgGaugeChartOptions(options)) {
            return GaugeChart;
        }

        throw new Error(
            `AG Charts - couldn't apply configuration, check options are correctly structured and series types are specified`
        );
    }
}
