import type { LicenseManager } from '../module/enterpriseModule';
import { enterpriseModule } from '../module/enterpriseModule';
import { type Module, REGISTERED_MODULES, hasRegisteredEnterpriseModules } from '../module/module';
import type { ModuleContext } from '../module/moduleContext';
import { type AxisOptionModule, ChartOptions, type SeriesOptionModule } from '../module/optionsModule';
import type {
    AgBaseAxisOptions,
    AgBaseSeriesOptions,
    AgChartInstance,
    AgChartOptions,
    DownloadOptions,
    ImageDataUrlOptions,
} from '../options/agChartOptions';
import { Debug } from '../util/debug';
import { createDeprecationWarning } from '../util/deprecation';
import { jsonApply, jsonDiff } from '../util/json';
import { Logger } from '../util/logger';
import { mergeDefaults } from '../util/object';
import type { TypedEventListener } from '../util/observable';
import type { DeepPartial } from '../util/types';
import { Caption } from './caption';
import { CartesianChart } from './cartesianChart';
import { Chart, type ChartExtendedOptions, type ChartSpecialOverrides } from './chart';
import type { ChartAxis } from './chartAxis';
import { JSON_APPLY_OPTIONS, JSON_APPLY_PLUGINS } from './chartOptions';
import { AgChartInstanceProxy } from './chartProxy';
import { ChartUpdateType } from './chartUpdateType';
import { getAxis } from './factory/axisTypes';
import { isEnterpriseSeriesType, isEnterpriseSeriesTypeLoaded } from './factory/expectedEnterpriseModules';
import { getLegendKeys } from './factory/legendTypes';
import { registerInbuiltModules } from './factory/registerInbuiltModules';
import { getSeries } from './factory/seriesTypes';
import { setupModules } from './factory/setupModules';
import { HierarchyChart } from './hierarchyChart';
import { AxisPositionGuesser } from './mapping/prepareAxis';
import { matchSeriesOptions } from './mapping/prepareSeries';
import {
    type SeriesOptionsTypes,
    isAgCartesianChartOptions,
    isAgHierarchyChartOptions,
    isAgPolarChartOptions,
} from './mapping/types';
import { PolarChart } from './polarChart';
import type { Series } from './series/series';
import type { SeriesGrouping } from './series/seriesStateManager';

const debug = Debug.create(true, 'opts');

type ProcessedOptions = Partial<AgChartOptions> & { type?: SeriesOptionsTypes['type'] };

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

    private static licenseCheck(options: AgChartOptions) {
        if (this.licenseChecked) return;

        this.licenseManager = enterpriseModule.licenseManager?.(options);
        this.licenseManager?.setLicenseKey(this.licenseKey);
        this.licenseManager?.validateLicense();
        this.licenseChecked = true;
    }

    public static setLicenseKey(licenseKey: string) {
        this.licenseKey = licenseKey;
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

        if (Debug.check() && typeof window !== 'undefined') {
            (window as any).agChartInstances ??= {};
            (window as any).agChartInstances[chart.id] = chart;
        }

        chart.queuedUserOptions.push(userOptions);
        chart.requestFactoryUpdate(async (chart) => {
            // Chart destroyed, skip processing.
            if (chart.destroyed) return;
            const deltaOptions = chartOptions.diffOptions(chart.processedOptions);
            if (deltaOptions != null) {
                await AgChartsInternal.updateDelta(chart, deltaOptions, userOptions);
            }
            // If there are a lot of update calls, `requestFactoryUpdate()` may skip callbacks,
            // so we need to remove all queue items up to the last successfully applied item.
            chart.queuedUserOptions.splice(0, chart.queuedUserOptions.indexOf(userOptions));
        });

        return proxy;
    }

    static updateUserDelta(proxy: AgChartInstanceProxy, deltaOptions: DeepPartial<AgChartOptions>) {
        const { chart } = proxy;
        const lastUpdateOptions = chart.queuedUserOptions.at(-1) ?? chart.userOptions;
        const userOptions = mergeDefaults(deltaOptions, lastUpdateOptions);
        debug('>>> AgChartV2.updateUserDelta() user delta', deltaOptions);
        debug('AgChartV2.updateUserDelta() - base options', lastUpdateOptions);
        AgChartsInternal.createOrUpdate(userOptions, proxy);
    }

    /**
     * Returns the content of the current canvas as an image.
     * @param opts The download options including `width` and `height` of the image as well as `fileName` and `fileFormat`.
     */
    static download(proxy: AgChartInstanceProxy, opts?: DownloadOptions) {
        const asyncDownload = async () => {
            const maybeClone = await AgChartsInternal.prepareResizedChart(proxy, opts);

            const { chart } = maybeClone;
            chart.scene.download(opts?.fileName, opts?.fileFormat);

            if (maybeClone !== proxy) {
                maybeClone.destroy();
            }
        };

        asyncDownload().catch((e) => Logger.errorOnce(e));
    }

    static async getImageDataURL(proxy: AgChartInstanceProxy, opts?: ImageDataUrlOptions): Promise<string> {
        const maybeClone = await AgChartsInternal.prepareResizedChart(proxy, opts);

        const { chart } = maybeClone;
        const result = chart.scene.canvas.getDataURL(opts?.fileFormat);

        if (maybeClone !== proxy) {
            maybeClone.destroy();
        }

        return result;
    }

    private static async prepareResizedChart(
        proxy: AgChartInstanceProxy,
        opts?: DownloadOptions | ImageDataUrlOptions
    ) {
        const { chart } = proxy;

        let { width, height } = opts ?? {};
        const currentWidth = chart.width;
        const currentHeight = chart.height;

        const unchanged =
            (width === undefined && height === undefined) ||
            (chart.scene.canvas.pixelRatio === 1 && currentWidth === width && currentHeight === height);

        if (unchanged) {
            return proxy;
        }

        width ??= currentWidth;
        height ??= currentHeight;

        const options: ChartExtendedOptions = {
            ...chart.userOptions,
            container: document.createElement('div'),
            width,
            height,
            autoSize: false,
            overrideDevicePixelRatio: 1,
        };

        if (hasRegisteredEnterpriseModules()) {
            // Disable enterprise features that may interfere with image generation.
            options.animation ??= {};
            options.animation.enabled = false;
        }

        const clonedChart = AgChartsInternal.createOrUpdate(options);

        await clonedChart.chart.waitForUpdate();
        return clonedChart;
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

    private static async updateDelta(chart: Chart, processedOptions: ProcessedOptions, userOptions: AgChartOptions) {
        if (chart.destroyed) return;

        debug('AgChartV2.updateDelta() - applying delta', processedOptions);
        applyChartOptions(chart, processedOptions, userOptions);
    }
}

function applyChartOptions(chart: Chart, processedOptions: ProcessedOptions, userOptions: AgChartOptions): void {
    const completeOptions = mergeDefaults(processedOptions, chart.processedOptions);
    const modulesChanged = applyModules(chart, completeOptions);

    const skip = ['type', 'data', 'series', 'listeners', 'theme', 'legend.listeners'];
    if (isAgCartesianChartOptions(processedOptions) || isAgPolarChartOptions(processedOptions)) {
        // Append axes to defaults.
        skip.push('axes');
    } else if (isAgHierarchyChartOptions(processedOptions)) {
        // Use defaults.
    } else {
        throw new Error(
            `AG Charts - couldn't apply configuration, check type of options and chart: ${processedOptions['type']}`
        );
    }

    // Needs to be done before applying the series to detect if a seriesNode[Double]Click listener has been added
    if (processedOptions.listeners) {
        registerListeners(chart, processedOptions.listeners);
    }

    applyOptionValues(chart, chart.getModuleContext(), processedOptions, { skip });

    let forceNodeDataRefresh = false;
    let seriesStatus: SeriesChangeType = 'no-op';
    if (processedOptions.series && processedOptions.series.length > 0) {
        seriesStatus = applySeries(chart, processedOptions);
        forceNodeDataRefresh = true;
    }
    if (applyAxes(chart, completeOptions, seriesStatus)) {
        forceNodeDataRefresh = true;
    }

    const seriesDataUpdate = !!processedOptions.data || seriesStatus === 'data-change' || seriesStatus === 'replaced';
    const legendKeys = getLegendKeys();
    const optionsHaveLegend = Object.values(legendKeys).some(
        (legendKey) => (processedOptions as any)[legendKey] != null
    );
    const otherRefreshUpdate = processedOptions.title != null && processedOptions.subtitle != null;
    forceNodeDataRefresh = forceNodeDataRefresh || seriesDataUpdate || optionsHaveLegend || otherRefreshUpdate;
    if (processedOptions.data) {
        chart.data = processedOptions.data;
    }
    if (processedOptions.legend?.listeners) {
        Object.assign(chart.legend!.listeners, processedOptions.legend.listeners);
    }
    if (processedOptions.listeners) {
        chart.updateAllSeriesListeners();
    }
    chart.processedOptions = completeOptions;
    chart.userOptions = mergeDefaults(userOptions, chart.userOptions);

    const majorChange = forceNodeDataRefresh || modulesChanged;
    const updateType = majorChange ? ChartUpdateType.UPDATE_DATA : ChartUpdateType.PERFORM_LAYOUT;
    debug('AgChartV2.applyChartOptions() - update type', ChartUpdateType[updateType]);
    chart.update(updateType, { forceNodeDataRefresh, newAnimationBatch: true });
}

function applyModules(chart: Chart, options: AgChartOptions) {
    const matchingChartType = ({ chartTypes }: Module) =>
        (chart instanceof CartesianChart && chartTypes.includes('cartesian')) ||
        (chart instanceof PolarChart && chartTypes.includes('polar')) ||
        (chart instanceof HierarchyChart && chartTypes.includes('hierarchy'));

    let modulesChanged = false;
    for (const module of REGISTERED_MODULES) {
        if (module.type !== 'root' && module.type !== 'legend') {
            continue;
        }

        const shouldBeEnabled = matchingChartType(module) && (options as any)[module.optionsKey] != null;
        const isEnabled = chart.isModuleEnabled(module);

        if (shouldBeEnabled === isEnabled) {
            continue;
        }

        if (shouldBeEnabled) {
            chart.addModule(module);
            (chart as any)[module.optionsKey] = chart.modules.get(module.optionsKey); // TODO remove
        } else {
            chart.removeModule(module);
            delete (chart as any)[module.optionsKey]; // TODO remove
        }

        modulesChanged = true;
    }

    return modulesChanged;
}

type SeriesChangeType =
    | 'no-op'
    | 'no-change'
    | 'replaced'
    | 'no-op'
    | 'data-change'
    | 'series-count-changed'
    | 'updated';

function applySeries(chart: Chart, options: AgChartOptions): SeriesChangeType {
    const optSeries = options.series;
    if (!optSeries) {
        return 'no-change';
    }

    const matchResult = matchSeriesOptions(chart.series, chart.processedOptions, optSeries);
    if (matchResult.status === 'no-overlap') {
        debug(`AgChartV2.applySeries() - creating new series instances, status: ${matchResult.status}`, matchResult);
        chart.resetAnimations();
        chart.series = createSeries(chart, optSeries);
        return 'replaced';
    }

    debug(`AgChartV2.applySeries() - matchResult`, matchResult);

    const seriesInstances = [];
    for (const change of matchResult.changes) {
        if (change.status === 'add') {
            seriesInstances[change.idx] = createSeries(chart, [change.opts])[0];
            debug(`AgChartV2.applySeries() - created new series at idx ${change.idx}`, seriesInstances[change.idx]);
            continue;
        } else if (change.status === 'remove') {
            debug(`AgChartV2.applySeries() - removing series at idx ${change.idx}`, change.series);
            continue;
        } else if (change.status === 'no-op') {
            seriesInstances[change.idx] = change.series;
            debug(`AgChartV2.applySeries() - no change to series at idx ${change.idx}`, change.series);
            continue;
        }

        const { series, diff, idx } = change;
        debug(`AgChartV2.applySeries() - applying series diff idx ${idx}`, diff, series);
        applySeriesValues(series, diff);
        series.markNodeDataDirty();
        seriesInstances[change.idx] = series;
    }

    debug(`AgChartV2.applySeries() - final series instances`, seriesInstances);
    chart.series = seriesInstances;

    const dataChanged = matchResult.changes.some(({ diff }) => {
        return diff && (diff.seriesGrouping != null || diff.data != null);
    });
    const noop = matchResult.changes.every((c) => c.status === 'no-op');
    return dataChanged ? 'data-change' : noop ? 'no-op' : 'updated';
}

function applyAxes(chart: Chart, options: AgChartOptions, seriesStatus: SeriesChangeType) {
    if (!('axes' in options) || !options.axes) {
        return false;
    }

    const { axes } = options;
    const forceRecreate = seriesStatus === 'replaced';
    const matchingTypes =
        !forceRecreate && chart.axes.length === axes.length && chart.axes.every((a, i) => a.type === axes[i].type);

    // Try to optimise series updates if series count and types didn't change.
    if (matchingTypes) {
        const oldOpts = chart.processedOptions;
        const moduleContext = chart.getModuleContext();
        if (isAgCartesianChartOptions(oldOpts)) {
            chart.axes.forEach((a, i) => {
                const previousOpts = oldOpts.axes?.[i] ?? {};
                const axisDiff = jsonDiff(previousOpts, axes[i]) as any;

                debug(`AgChartV2.applyAxes() - applying axis diff idx ${i}`, axisDiff);

                const path = `axes[${i}]`;
                const skip = ['axes[].type'];
                applyOptionValues(a, moduleContext, axisDiff, { path, skip });
            });
            return true;
        }
    }

    debug(`AgChartV2.applyAxes() - creating new axes instances; seriesStatus: ${seriesStatus}`);
    chart.axes = createAxis(chart, axes);
    return true;
}

function createSeries(chart: Chart, options: SeriesOptionsTypes[]): Series<any>[] {
    const series: Series<any>[] = [];
    const moduleContext = chart.getModuleContext();

    for (const seriesOptions of options ?? []) {
        const type = seriesOptions.type ?? 'unknown';
        if (isEnterpriseSeriesType(type) && !isEnterpriseSeriesTypeLoaded(type)) {
            continue;
        }
        const seriesInstance = getSeries(type, moduleContext);
        applySeriesOptionModules(seriesInstance, seriesOptions);
        applySeriesValues(seriesInstance, seriesOptions);
        series.push(seriesInstance);
    }

    return series;
}

function applySeriesOptionModules(series: Series<any>, options: AgBaseSeriesOptions<any>) {
    const seriesOptionModules = REGISTERED_MODULES.filter((m): m is SeriesOptionModule => m.type === 'series-option');
    const moduleContext = series.createModuleContext();
    const moduleMap = series.getModuleMap();

    for (const module of seriesOptionModules) {
        const supportedSeriesTypes: readonly string[] = module.seriesTypes;
        if (module.optionsKey in options && supportedSeriesTypes.includes(series.type)) {
            moduleMap.addModule(module, (module) => new module.instanceConstructor(moduleContext));
            (series as any)[module.optionsKey] = moduleMap.getModule(module); // TODO remove
        }
    }
}

function createAxis(chart: Chart, options: AgBaseAxisOptions[]): ChartAxis[] {
    const guesser: AxisPositionGuesser = new AxisPositionGuesser();
    const moduleContext = chart.getModuleContext();
    const skip = ['axes[].type'];

    let index = 0;
    for (const axisOptions of options ?? []) {
        const axis = getAxis(axisOptions.type, moduleContext);
        const path = `axes[${index++}]`;
        applyAxisModules(axis, axisOptions);
        applyOptionValues(axis, moduleContext, axisOptions, { path, skip });

        guesser.push(axis, axisOptions);
    }

    return guesser.guessInvalidPositions();
}

function applyAxisModules(axis: ChartAxis, options: AgBaseAxisOptions) {
    let modulesChanged = false;
    const rootModules = REGISTERED_MODULES.filter((m): m is AxisOptionModule => m.type === 'axis-option');
    const moduleContext = axis.createModuleContext();

    for (const module of rootModules) {
        const shouldBeEnabled = (options as any)[module.optionsKey] != null;
        const moduleMap = axis.getModuleMap();
        const isEnabled = moduleMap.isModuleEnabled(module);

        if (shouldBeEnabled === isEnabled) continue;
        modulesChanged = true;

        if (shouldBeEnabled) {
            moduleMap.addModule(module, (module) => new module.instanceConstructor(moduleContext));
            (axis as any)[module.optionsKey] = moduleMap.getModule(module); // TODO remove
        } else {
            moduleMap.removeModule(module);
            delete (axis as any)[module.optionsKey]; // TODO remove
        }
    }

    return modulesChanged;
}

type ObservableLike = {
    addEventListener(key: string, cb: TypedEventListener): void;
    clearEventListeners(): void;
};
function registerListeners<T>(source: ObservableLike, listeners?: T) {
    source.clearEventListeners();
    const entries: [string, TypedEventListener][] = Object.entries(listeners ?? {});
    for (const [property, listener] of entries) {
        if (typeof listener !== 'function') continue;
        source.addEventListener(property, listener);
    }
}

function applyOptionValues<T extends object, S>(
    target: T,
    moduleContext: ModuleContext,
    options?: S,
    { skip, path }: { skip?: string[]; path?: string } = {}
): T {
    // Allow context to be injected and meet the type requirements
    class CaptionWithContext extends Caption {
        constructor() {
            super();
            this.registerInteraction(moduleContext);
        }
    }
    return jsonApply<T, any>(target, options, {
        constructors: {
            ...JSON_APPLY_OPTIONS.constructors,
            title: CaptionWithContext,
            subtitle: CaptionWithContext,
            footnote: CaptionWithContext,
        },
        constructedArrays: JSON_APPLY_PLUGINS.constructedArrays,
        allowedTypes: {
            ...JSON_APPLY_OPTIONS.allowedTypes,
        },
        skip,
        path,
    });
}

function applySeriesValues(target: Series<any>, options: AgBaseSeriesOptions<any>) {
    const moduleMap = target.getModuleMap();
    const { type, data, errorBar, listeners, seriesGrouping, ...seriesOptions } = options as any;

    target.properties.set(seriesOptions);
    if ('data' in options) {
        target.data = options.data;
    }
    if ('errorBar' in options && moduleMap.isModuleEnabled('errorBar')) {
        (moduleMap.getModule('errorBar') as any).properties.set(options.errorBar);
    }

    if (options?.listeners != null) {
        registerListeners(target, options.listeners);
    }

    if (seriesGrouping) {
        target.seriesGrouping = Object.freeze({ ...target.seriesGrouping, ...(seriesGrouping as SeriesGrouping) });
    }
}
