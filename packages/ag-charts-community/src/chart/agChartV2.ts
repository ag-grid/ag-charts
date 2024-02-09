import type { LicenseManager } from '../module/enterpriseModule';
import { enterpriseModule } from '../module/enterpriseModule';
import { hasRegisteredEnterpriseModules } from '../module/module';
import { ChartOptions } from '../module/optionsModule';
import type { AgChartInstance, AgChartOptions, DownloadOptions, ImageDataUrlOptions } from '../options/agChartOptions';
import { Debug } from '../util/debug';
import { createDeprecationWarning } from '../util/deprecation';
import { Logger } from '../util/logger';
import { mergeDefaults } from '../util/object';
import type { DeepPartial } from '../util/types';
import { CartesianChart } from './cartesianChart';
import { Chart, type ChartExtendedOptions, type ChartSpecialOverrides } from './chart';
import { AgChartInstanceProxy } from './chartProxy';
import { registerInbuiltModules } from './factory/registerInbuiltModules';
import { setupModules } from './factory/setupModules';
import { HierarchyChart } from './hierarchyChart';
import { isAgCartesianChartOptions, isAgHierarchyChartOptions, isAgPolarChartOptions } from './mapping/types';
import { PolarChart } from './polarChart';

const debug = Debug.create(true, 'opts');

function chartType(options: any): 'cartesian' | 'polar' | 'hierarchy' {
    if (isAgCartesianChartOptions(options)) {
        return 'cartesian';
    } else if (isAgPolarChartOptions(options)) {
        return 'polar';
    } else if (isAgHierarchyChartOptions(options)) {
        return 'hierarchy';
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
            enterpriseModule.injectWatermark?.(
                (options as ChartExtendedOptions).document ?? document,
                chart.chart.element,
                this.licenseManager.getWatermarkMessage()
            );
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
        AgChartsInternal.download(chart, options);
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
}

/** @deprecated v9.0 use AgCharts instead */
export class AgChart {
    private static warnDeprecated(memberName: string) {
        const warnDeprecated = createDeprecationWarning();
        warnDeprecated(`AgChart.${memberName}`, `Use AgCharts.${memberName} instead`);
    }

    public static create(options: AgChartOptions): AgChartInstance {
        AgChart.warnDeprecated('create');
        return AgCharts.create(options);
    }

    public static update(chart: AgChartInstance, options: AgChartOptions) {
        AgChart.warnDeprecated('update');
        return AgCharts.update(chart, options);
    }

    public static updateDelta(chart: AgChartInstance, deltaOptions: DeepPartial<AgChartOptions>) {
        AgChart.warnDeprecated('updateDelta');
        return AgCharts.updateDelta(chart, deltaOptions);
    }

    public static download(chart: AgChartInstance, options?: DownloadOptions) {
        AgChart.warnDeprecated('download');
        return AgCharts.download(chart, options);
    }

    public static getImageDataURL(chart: AgChartInstance, options?: ImageDataUrlOptions): Promise<string> {
        AgChart.warnDeprecated('getImageDataURL');
        return AgCharts.getImageDataURL(chart, options);
    }
}

class AgChartsInternal {
    static getInstance(element: HTMLElement): AgChartInstanceProxy | undefined {
        const chart = Chart.getInstance(element);
        return chart != null ? AgChartInstanceProxy.chartInstances.get(chart) : undefined;
    }

    static initialised = false;
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
        const chartOptions = new ChartOptions(userOptions);

        let chart = proxy?.chart;
        if (chart == null || chartType(userOptions) !== chartType(chart.processedOptions)) {
            const specialOverrides = { overrideDevicePixelRatio, document, window: userWindow };
            chart = AgChartsInternal.createChartInstance(chartOptions.processedOptions, specialOverrides, chart);
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
        chart.requestFactoryUpdate((chart) => {
            const deltaOptions = chartOptions.diffOptions(chart.processedOptions);
            if (deltaOptions != null) {
                debug('AgChartV2.updateDelta() - applying delta', deltaOptions);
                chart.applyOptions(deltaOptions, userOptions);
            }
            // If there are a lot of update calls, `requestFactoryUpdate()` may skip callbacks,
            // so we need to remove all queue items up to the last successfully applied item.
            chart.queuedUserOptions.splice(0, chart.queuedUserOptions.indexOf(userOptions));
        });

        return proxy;
    }

    static updateUserDelta(proxy: AgChartInstanceProxy, deltaOptions: DeepPartial<AgChartOptions>) {
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
    static download(proxy: AgChartInstanceProxy, opts?: DownloadOptions) {
        AgChartsInternal.prepareResizedChart(proxy, opts)
            .then((maybeClone) => {
                maybeClone.chart.scene.download(opts?.fileName, opts?.fileFormat);

                if (maybeClone !== proxy) {
                    maybeClone.destroy();
                }
            })
            .catch(Logger.errorOnce);
    }

    static async getImageDataURL(proxy: AgChartInstanceProxy, opts?: ImageDataUrlOptions): Promise<string> {
        const maybeClone = await AgChartsInternal.prepareResizedChart(proxy, opts);

        const { canvas } = maybeClone.chart.scene;
        const result = canvas.getDataURL(opts?.fileFormat);

        if (maybeClone !== proxy) {
            maybeClone.destroy();
        }

        return result;
    }

    private static async prepareResizedChart(
        chartProxy: AgChartInstanceProxy,
        opts: DownloadOptions | ImageDataUrlOptions = {}
    ) {
        const { chart } = chartProxy;
        const { width = chart.width, height = chart.height } = opts;
        if (chart.scene.canvas.pixelRatio === 1 && chart.width === width && chart.height === height) {
            return chartProxy;
        }

        const options: ChartExtendedOptions = mergeDefaults(
            {
                container: document.createElement('div'),
                overrideDevicePixelRatio: 1,
                autoSize: false,
                width,
                height,
            },
            // Disable enterprise features that may interfere with image generation.
            hasRegisteredEnterpriseModules() && { animation: { enabled: false } },
            chart.userOptions
        );

        const cloneProxy = AgChartsInternal.createOrUpdate(options);
        await cloneProxy.chart.waitForUpdate();
        return cloneProxy;
    }

    private static createChartInstance(
        options: AgChartOptions,
        specialOverrides: ChartSpecialOverrides,
        oldChart?: Chart
    ): Chart {
        const transferableResource = oldChart?.destroy({ keepTransferableResources: true });

        if (isAgCartesianChartOptions(options)) {
            return new CartesianChart(specialOverrides, transferableResource);
        } else if (isAgHierarchyChartOptions(options)) {
            return new HierarchyChart(specialOverrides, transferableResource);
        } else if (isAgPolarChartOptions(options)) {
            return new PolarChart(specialOverrides, transferableResource);
        }

        throw new Error(
            `AG Charts - couldn't apply configuration, check options are correctly structured and series types are specified`
        );
    }
}
