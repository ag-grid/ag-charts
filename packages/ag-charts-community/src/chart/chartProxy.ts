import type { MementoCaretaker, MementoOriginator } from 'ag-charts-core';
import {
    ActionOnSet,
    ChartUpdateType,
    Debug,
    type DeepPartial,
    type LicenseManager,
    ModuleRegistry,
    deepClone,
    getDocument,
} from 'ag-charts-core';
import type {
    AgChartInstance,
    AgChartOptions,
    AgChartState,
    AgDataTransaction,
    AgInitialStateLegendOptions,
    DownloadOptions,
    ImageDataUrlOptions,
} from 'ag-charts-types';

import { type ChartInternalOptionMetadata, ChartOptions, type ChartSpecialOverrides } from '../module/optionsModule';
import type { Chart } from './chart';
import type { DataServiceRestoredData } from './data/dataService';
import type { UpdateZoomSourcing } from './interaction/zoomManager';

const debug = Debug.create(true, 'opts');
const DESTROYED_ERROR = 'AG Charts - Chart was destroyed, cannot perform request.';

export interface AgChartProxy extends AgChartInstance {
    chart?: Chart;
}

export interface FactoryApi {
    caretaker: MementoCaretaker;

    create(
        userOptions: AgChartOptions,
        processedOverrides?: Partial<AgChartOptions>,
        specialOverrides?: ChartSpecialOverrides,
        optionsMetadata?: ChartInternalOptionMetadata,
        data?: DataServiceRestoredData
    ): AgChartProxy;
    update(
        opts: AgChartOptions,
        chart?: AgChartInstance,
        specialOverrides?: ChartSpecialOverrides,
        apiStartTime?: number
    ): AgChartProxy;
    updateUserDelta(chart: AgChartInstance, deltaOptions: DeepPartial<AgChartOptions>, apiStartTime?: number): void;
}

/**
 * Proxy class, to allow library users to keep a stable reference to their chart, even if we need
 * to switch concrete class (e.g. when switching between CartesianChart vs. PolarChart).
 */
export class AgChartInstanceProxy implements AgChartProxy {
    static readonly chartInstances = new WeakMap<Chart, AgChartInstanceProxy>();

    @ActionOnSet<AgChartInstanceProxy>({
        oldValue(chart) {
            if (!chart.destroyed) {
                chart.publicApi = undefined;
            }
            AgChartInstanceProxy.chartInstances.delete(chart);
        },
        newValue(chart) {
            if (!chart) return;
            chart.publicApi = this;
            AgChartInstanceProxy.chartInstances.set(chart, this);
        },
    })
    chart?: Chart;
    releaseChart?: () => void;

    constructor(
        chart: Chart,
        private readonly factoryApi: FactoryApi,
        private readonly licenseManager?: LicenseManager
    ) {
        this.chart = chart;
    }

    async update(options: AgChartOptions) {
        if (!this.chart) throw new Error(DESTROYED_ERROR);

        return debug.group('AgChartInstance.update()', async () => {
            const apiStartTime = Debug.check('scene:stats', 'scene:stats:verbose') ? performance.now() : undefined;
            this.factoryApi.update(options, this, undefined, apiStartTime);
            await this.chart?.waitForUpdate();
        });
    }

    async updateDelta(deltaOptions: DeepPartial<AgChartOptions>) {
        if (!this.chart) throw new Error(DESTROYED_ERROR);

        return debug.group('AgChartInstance.updateDelta()', async () => {
            const apiStartTime = Debug.check('scene:stats', 'scene:stats:verbose') ? performance.now() : undefined;
            this.factoryApi.updateUserDelta(this, deltaOptions, apiStartTime);
            await this.chart?.waitForUpdate();
        });
    }

    getOptions() {
        if (!this.chart) throw new Error(DESTROYED_ERROR);

        const options = deepClone(this.chart.getOptions(), ChartOptions.OPTIONS_CLONE_OPTS_FAST);
        for (const key of Object.keys(options)) {
            if (key.startsWith('_')) {
                delete (options as any)[key];
            }
        }
        return options;
    }

    waitForUpdate() {
        if (!this.chart) throw new Error(DESTROYED_ERROR);

        return this.chart.waitForUpdate();
    }

    applyTransaction(transaction: AgDataTransaction) {
        const { chart } = this;
        if (!chart) throw new Error(DESTROYED_ERROR);

        // Validate transaction structure synchronously
        if (transaction == null || typeof transaction !== 'object') {
            throw new Error('AG Charts - applyTransaction expects a transaction object.');
        }

        const { add, addIndex, remove, update } = transaction;

        if (add != null && !Array.isArray(add)) {
            throw new Error('AG Charts - transaction "add" must be an array.');
        }

        if (addIndex != null) {
            // Use isSafeInteger for better safety (includes isInteger check and bounds validation)
            if (typeof addIndex !== 'number' || !Number.isSafeInteger(addIndex) || addIndex < 0) {
                throw new Error(
                    'AG Charts - transaction "addIndex" must be a safe non-negative integer (0 to 9007199254740991).'
                );
            }

            // Validate consistency: addIndex requires add array with items
            if (add == null || add.length === 0) {
                throw new Error('AG Charts - transaction "addIndex" requires a non-empty "add" array.');
            }
        }

        if (remove != null && !Array.isArray(remove)) {
            throw new Error('AG Charts - transaction "remove" must be an array.');
        }

        if (update != null && !Array.isArray(update)) {
            throw new Error('AG Charts - transaction "update" must be an array.');
        }

        return debug.group('AgChartInstance.applyTransaction()', async () => {
            if (!chart.isDataTransactionSupported()) {
                // Avoid mutating original data set; it will be compared with in options processing.
                const dataSet = chart.data.deepClone();
                dataSet.addTransaction(transaction);
                dataSet.commitPendingTransactions();
                return this.updateDelta({ data: dataSet.data });
            }

            debug('transaction', transaction);
            return await this.chart?.applyTransaction(transaction);
        });
    }

    async download(opts?: DownloadOptions) {
        if (!this.chart) throw new Error(DESTROYED_ERROR);

        const clone = await this.prepareResizedChart(this, this.chart, opts);
        try {
            clone.chart?.download(opts?.fileName, opts?.fileFormat);
        } finally {
            clone.destroy();
        }
    }

    async __toSVG(opts?: DownloadOptions) {
        if (!this.chart) throw new Error(DESTROYED_ERROR);

        const clone = await this.prepareResizedChart(this, this.chart, { width: 600, height: 300, ...opts });
        try {
            return clone?.chart?.toSVG();
        } finally {
            clone?.destroy();
        }
    }

    async getImageDataURL(opts?: ImageDataUrlOptions) {
        if (!this.chart) throw new Error(DESTROYED_ERROR);

        const clone = await this.prepareResizedChart(this, this.chart, opts);
        try {
            return clone.chart!.getCanvasDataURL(opts?.fileFormat);
        } finally {
            clone.destroy();
        }
    }

    getState() {
        return this.factoryApi.caretaker.save(...this.getEnabledOriginators());
    }

    async setState(state: AgChartState) {
        const { chart } = this;
        if (!chart) return;

        const originators = this.getEnabledOriginators();

        if (!originators.includes(chart.ctx.legendManager)) {
            await this.setStateOriginators(state, originators);
            return;
        }

        // TODO: CRT-633 - The zoom state depends on the legend state and so must be restored after the legend state
        // has updated the axis scale domains.
        await this.setStateOriginators(
            state,
            originators.filter((originator) => originator !== chart.ctx.zoomManager)
        );
        await this.setStateOriginators(state, [chart.ctx.zoomManager]);
    }

    resetAnimations(): void {
        this.chart?.resetAnimations();
    }

    skipAnimations(): void {
        this.chart?.skipAnimations();
    }

    destroy() {
        if (this.releaseChart) {
            this.releaseChart();
            this.releaseChart = undefined;
        } else if (this.chart) {
            this.chart.publicApi = undefined;
            this.chart.destroy();
        }
        this.chart = undefined;
    }

    private async prepareResizedChart(
        proxy: AgChartInstanceProxy,
        chart: NonNullable<AgChartInstanceProxy['chart']>,
        opts: DownloadOptions = {}
    ) {
        const width: number = opts.width ?? chart.width ?? chart.ctx.scene.canvas.width;
        const height: number = opts.height ?? chart.height ?? chart.ctx.scene.canvas.height;
        const state = proxy.getState();

        const processedOverrides: Partial<AgChartOptions> = {
            ...chart.chartOptions.processedOverrides,
            container: getDocument().createElement('div'),
            width,
            height,
        };
        if (opts.width != null && opts.height != null) {
            // @ts-expect-error undocumented option
            processedOverrides.overrideDevicePixelRatio = 1;
        }
        const userOptions = chart.getOptions();

        if (ModuleRegistry.isEnterprise()) {
            // Disable enterprise features that may interfere with image generation.
            processedOverrides.animation = { enabled: false };

            // Add watermark if no license
            const foreground = this.licenseManager?.getWatermarkForegroundConfigForBrowser();
            if (foreground) {
                // @ts-expect-error undocumented option
                processedOverrides.foreground = foreground;
            }
        }

        const specialOverrides = { ...chart.chartOptions.specialOverrides };
        const optionsMetadata = { ...chart.chartOptions.optionMetadata };

        const data = await this.chart?.ctx.dataService.getData();

        const cloneProxy = this.factoryApi.create(
            userOptions,
            processedOverrides,
            specialOverrides,
            optionsMetadata,
            data
        );

        if (state.legend) {
            this.syncLegend(chart, cloneProxy, state);
        }

        // prepared chart is updated so everything is configured before state is restored
        cloneProxy.chart?.update(ChartUpdateType.FULL, { forceNodeDataRefresh: true });
        await cloneProxy.waitForUpdate();
        await cloneProxy.setState(state);

        // sync zoom
        const sourcing: UpdateZoomSourcing = { source: 'chart-update', sourceDetail: 'internal-prepareResizedChart' };
        cloneProxy.chart?.ctx.zoomManager.updateZoom(sourcing, chart.ctx.zoomManager.getZoom());

        cloneProxy.chart?.update(ChartUpdateType.FULL, { forceNodeDataRefresh: true });
        await cloneProxy.waitForUpdate();

        // Sync legend pagination
        const legendPages = [];
        for (const legend of chart.modulesManager.legends()) {
            legendPages.push(legend.legend.pagination?.currentPage ?? 0);
        }
        for (const legend of cloneProxy.chart!.modulesManager.legends()) {
            const page = legendPages.shift() ?? 0;
            if (!legend.legend.pagination) continue;
            legend.legend.pagination.setPage(page);
        }

        cloneProxy.chart?.update(ChartUpdateType.FULL, { forceNodeDataRefresh: true });
        await cloneProxy.waitForUpdate();
        return cloneProxy;
    }

    private syncLegend(chart: Chart, cloneProxy: AgChartProxy, state: AgChartState) {
        const seriesIdMap = new Map<string, string>();
        for (const [index, series] of chart.series.entries()) {
            const cloneSeries = cloneProxy.chart?.series[index];
            if (!cloneSeries) continue;
            seriesIdMap.set(series.id, cloneSeries.id);
        }

        state.legend = state.legend?.map((legend: AgInitialStateLegendOptions) => {
            return {
                ...legend,
                seriesId: seriesIdMap.get(legend.seriesId ?? '') ?? legend.seriesId,
            };
        });
    }

    private getEnabledOriginators(): MementoOriginator<unknown>[] {
        if (!this.chart) return [];

        const {
            chartOptions: { processedOptions, optionMetadata },
            ctx: { annotationManager, chartTypeOriginator, zoomManager, legendManager },
            modulesManager,
        } = this.chart;

        const originators: MementoOriginator<unknown>[] = [this.chart.ctx.activeManager];

        if ('annotations' in processedOptions && processedOptions.annotations?.enabled) {
            originators.push(annotationManager);
        }

        const isFinancialChart = optionMetadata.presetType === 'price-volume';
        if (isFinancialChart) {
            originators.push(chartTypeOriginator);
        }

        if (processedOptions.navigator?.enabled || processedOptions.zoom?.enabled) {
            originators.push(zoomManager);
        }

        const legendEnabled = modulesManager.isEnabled('legend') && processedOptions.legend?.enabled !== false;
        if (legendEnabled) {
            originators.push(legendManager);
        }

        return originators;
    }

    private async setStateOriginators(state: AgChartState, originators: MementoOriginator[]) {
        this.factoryApi.caretaker.restore(state, ...originators);
        this.chart?.ctx.updateService.update(ChartUpdateType.PROCESS_DATA, { forceNodeDataRefresh: true });
        await this.chart?.waitForUpdate();
    }
}
