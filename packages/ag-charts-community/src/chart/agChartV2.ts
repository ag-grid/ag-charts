import type { LicenseManager } from '../module/enterpriseModule';
import { enterpriseModule } from '../module/enterpriseModule';
import { moduleRegistry } from '../module/module';
import { ChartOptions } from '../module/optionsModule';
import type { AgChartInstance, AgChartOptions, DownloadOptions, ImageDataUrlOptions } from '../options/agChartOptions';
import { Debug } from '../util/debug';
import { deepClone, jsonWalk } from '../util/json';
import { Logger } from '../util/logger';
import { mergeDefaults } from '../util/object';
import type { DeepPartial } from '../util/types';
import { VERSION } from '../version';
import { CartesianChart } from './cartesianChart';
import { Chart, type ChartExtendedOptions } from './chart';
import { AgChartInstanceProxy } from './chartProxy';
import { ChartUpdateType } from './chartUpdateType';
import { registerInbuiltModules } from './factory/registerInbuiltModules';
import { setupModules } from './factory/setupModules';
import { HierarchyChart } from './hierarchyChart';
import {
    isAgCartesianChartOptions,
    isAgHierarchyChartOptions,
    isAgPolarChartOptions,
    isAgTopologyChartOptions,
} from './mapping/types';
import { MementoCaretaker } from './memento';
import { PolarChart } from './polarChart';
import { TopologyChart } from './topologyChart';

const debug = Debug.create(true, 'opts');

function chartType(options: any): 'cartesian' | 'polar' | 'hierarchy' | 'topology' {
    if (isAgCartesianChartOptions(options)) {
        return 'cartesian';
    } else if (isAgPolarChartOptions(options)) {
        return 'polar';
    } else if (isAgHierarchyChartOptions(options)) {
        return 'hierarchy';
    } else if (isAgTopologyChartOptions(options)) {
        return 'topology';
    }

    throw new Error(`AG Chart - unknown type of chart for options with type: ${options.type}`);
}

/**
 * Factory for creating and updating instances of AgChartInstance.
 *
 * @docsInterface
 */
export abstract class AgCharts {
    private static readonly INVALID_CHART_REF_MESSAGE = 'AG Charts - invalid chart reference passed';
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
    public static create(options: AgChartOptions): AgChartInstance {
        this.licenseCheck(options);
        const chart = AgChartsInternal.createOrUpdate(options);

        if (this.licenseManager?.isDisplayWatermark()) {
            enterpriseModule.injectWatermark?.(chart.chart.ctx.domManager, this.licenseManager.getWatermarkMessage());
        }
        return chart;
    }

    /**
     * Update an existing `AgChartInstance`. Options provided should be complete and not
     * partial.
     *
     * __NOTE__: As each call could trigger a chart redraw, multiple calls to update options in
     * quick succession could result in undesirable flickering, so callers should batch up and/or
     * debounce changes to avoid unintended partial update renderings.
     */
    public static update(chart: AgChartInstance, options: AgChartOptions) {
        if (!AgChartInstanceProxy.isInstance(chart)) {
            throw new Error(AgCharts.INVALID_CHART_REF_MESSAGE);
        }
        AgChartsInternal.createOrUpdate(options, chart);
    }

    /**
     * Update an existing `AgChartInstance` by applying a partial set of option changes.
     *
     * __NOTE__: As each call could trigger a chart redraw, each individual delta options update
     * should leave the chart in a valid options state. Also, multiple calls to update options in
     * quick succession could result in undesirable flickering, so callers should batch up and/or
     * debounce changes to avoid unintended partial update renderings.
     */
    public static updateDelta(chart: AgChartInstance, deltaOptions: DeepPartial<AgChartOptions>) {
        if (!AgChartInstanceProxy.isInstance(chart)) {
            throw new Error(AgCharts.INVALID_CHART_REF_MESSAGE);
        }
        AgChartsInternal.updateUserDelta(chart, deltaOptions);
    }

    /**
     * Starts a browser-based image download for the given `AgChartInstance`.
     */
    public static download(chart: AgChartInstance, options?: DownloadOptions) {
        if (!(chart instanceof AgChartInstanceProxy)) {
            throw new Error(AgCharts.INVALID_CHART_REF_MESSAGE);
        }
        AgChartsInternal.download(chart, options).catch((e) => Logger.errorOnce(e));
    }

    /**
     * Returns a base64-encoded image data URL for the given `AgChartInstance`.
     */
    public static getImageDataURL(chart: AgChartInstance, options?: ImageDataUrlOptions): Promise<string> {
        if (!(chart instanceof AgChartInstanceProxy)) {
            throw new Error(AgCharts.INVALID_CHART_REF_MESSAGE);
        }
        return AgChartsInternal.getImageDataURL(chart, options);
    }

    public static saveAnnotations(chart: AgChartInstance) {
        if (!(chart instanceof AgChartInstanceProxy)) {
            throw new Error(AgCharts.INVALID_CHART_REF_MESSAGE);
        }
        return AgChartsInternal.saveAnnotations(chart);
    }

    public static restoreAnnotations(chart: AgChartInstance, blob: unknown) {
        if (!(chart instanceof AgChartInstanceProxy)) {
            throw new Error(AgCharts.INVALID_CHART_REF_MESSAGE);
        }
        return AgChartsInternal.restoreAnnotations(chart, blob);
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

    static createOrUpdate(options: ChartExtendedOptions, proxy?: AgChartInstanceProxy) {
        AgChartsInternal.initialiseModules();

        debug('>>> AgChartV2.createOrUpdate() user options', options);

        const { overrideDevicePixelRatio, document, window: userWindow, ...userOptions } = options;
        const chartOptions = new ChartOptions(userOptions, { overrideDevicePixelRatio, document, window: userWindow });

        let chart = proxy?.chart;
        if (chart == null || chartType(userOptions) !== chartType(chart.processedOptions)) {
            chart = AgChartsInternal.createChartInstance(chartOptions, chart);
        }

        if (proxy == null) {
            proxy = new AgChartInstanceProxy(chart);
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
            chartRef.queuedUserOptions.splice(0, chartRef.queuedUserOptions.indexOf(userOptions));
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
        debug('>>> AgChartV2.updateUserDelta() user delta', deltaOptions);
        debug('AgChartV2.updateUserDelta() - base options', lastUpdateOptions);
        AgChartsInternal.createOrUpdate(userOptions, proxy);
    }

    /**
     * Returns the content of the current canvas as an image.
     */
    static async download(proxy: AgChartInstanceProxy, opts?: DownloadOptions) {
        try {
            const clone = await AgChartsInternal.prepareResizedChart(proxy, opts);
            clone.chart.ctx.scene.download(opts?.fileName, opts?.fileFormat);
            clone.destroy();
        } catch (error) {
            Logger.errorOnce(error);
        }
    }

    static async getImageDataURL(proxy: AgChartInstanceProxy, opts?: ImageDataUrlOptions): Promise<string> {
        const clone = await AgChartsInternal.prepareResizedChart(proxy, opts);
        const result = clone.chart.ctx.scene.getDataURL(opts?.fileFormat);

        clone.destroy();

        return result;
    }

    static saveAnnotations(proxy: AgChartInstanceProxy) {
        return AgChartsInternal.caretaker.save(proxy.chart.ctx.annotationManager);
    }

    static restoreAnnotations(proxy: AgChartInstanceProxy, blob: unknown) {
        return AgChartsInternal.caretaker.restore(proxy.chart.ctx.annotationManager, blob);
    }

    private static async prepareResizedChart({ chart }: AgChartInstanceProxy, opts: DownloadOptions = {}) {
        const width: number = opts.width ?? chart.width ?? chart.ctx.scene.canvas.width;
        const height: number = opts.height ?? chart.height ?? chart.ctx.scene.canvas.height;

        const options: ChartExtendedOptions = mergeDefaults(
            {
                container: document.createElement('div'),
                overrideDevicePixelRatio: 1,
                autoSize: false,
                width,
                height,
            },
            // Disable enterprise features that may interfere with image generation.
            moduleRegistry.hasEnterpriseModules() && { animation: { enabled: false } },
            chart.userOptions
        );

        const cloneProxy = AgChartsInternal.createOrUpdate(options);
        cloneProxy.chart.ctx.zoomManager.updateZoom('agChartV2', chart.ctx.zoomManager.getZoom()); // sync zoom
        chart.series.forEach((series, index) => {
            if (!series.visible) {
                cloneProxy.chart.series[index].visible = false; // sync series visibility
            }
        });
        chart.update(ChartUpdateType.FULL, { forceNodeDataRefresh: true });
        await cloneProxy.chart.waitForUpdate();
        return cloneProxy;
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
        }

        throw new Error(
            `AG Charts - couldn't apply configuration, check options are correctly structured and series types are specified`
        );
    }
}
