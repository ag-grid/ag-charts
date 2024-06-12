import type { AgChartInstance, AgChartOptions, DownloadOptions, ImageDataUrlOptions } from 'ag-charts-types';

import { moduleRegistry } from '../module/module';
import { deepClone } from '../util/json';
import { mergeDefaults } from '../util/object';
import { ActionOnSet } from '../util/proxy';
import type { DeepPartial } from '../util/types';
import type { Chart, ChartExtendedOptions } from './chart';
import { ChartUpdateType } from './chartUpdateType';
import type { MementoCaretaker } from './memento';

export interface AgChartProxy extends AgChartInstance {
    chart: Chart;
}

export interface FactoryApi {
    caretaker: MementoCaretaker;

    createOrUpdate(opts: AgChartOptions, chart?: AgChartInstance): AgChartProxy;
    updateUserDelta(chart: AgChartInstance, deltaOptions: DeepPartial<AgChartOptions>): void;
}

/**
 * Proxy class, to allow library users to keep a stable reference to their chart, even if we need
 * to switch concrete class (e.g. when switching between CartesianChart vs. PolarChart).
 */
export class AgChartInstanceProxy implements AgChartProxy {
    static readonly chartInstances = new WeakMap<Chart, AgChartInstanceProxy>();

    static isInstance(x: any): x is AgChartInstanceProxy {
        if (x instanceof AgChartInstanceProxy) {
            // Simple case.
            return true;
        }

        if (x.constructor?.name === 'AgChartInstanceProxy' && x.chart != null) {
            // instanceof can fail if mixing bundles (e.g. grid all-modules vs. standalone).
            return true;
        }

        return x.chart != null && this.validateImplementation(x);
    }

    private static validateImplementation(x: object) {
        const chartProps: Array<keyof AgChartInstanceProxy> = ['getOptions', 'destroy'];
        const signatureProps = Object.keys(Object.getPrototypeOf(x) ?? {});
        return chartProps.every((prop) => signatureProps.includes(prop));
    }

    @ActionOnSet<AgChartInstanceProxy>({
        oldValue(chart) {
            AgChartInstanceProxy.chartInstances.delete(chart);
        },
        newValue(chart) {
            AgChartInstanceProxy.chartInstances.set(chart, this);
        },
    })
    chart: Chart;

    constructor(
        chart: Chart,
        private readonly factoryApi: FactoryApi
    ) {
        this.chart = chart;
    }

    async update(options: AgChartOptions) {
        this.factoryApi.createOrUpdate(options, this);
        await this.chart.waitForUpdate();
    }

    async updateDelta(deltaOptions: DeepPartial<AgChartOptions>) {
        this.factoryApi.updateUserDelta(this, deltaOptions);
        await this.chart.waitForUpdate();
    }

    getOptions() {
        return deepClone(this.chart.getOptions());
    }

    waitForUpdate() {
        return this.chart.waitForUpdate();
    }

    async download(opts?: DownloadOptions) {
        const clone = await this.prepareResizedChart(this, opts);
        try {
            clone.chart.download(opts?.fileName, opts?.fileFormat);
        } finally {
            clone.destroy();
        }
    }

    async getImageDataURL(opts?: ImageDataUrlOptions) {
        const clone = await this.prepareResizedChart(this, opts);
        try {
            return clone.chart.getCanvasDataURL(opts?.fileFormat);
        } finally {
            clone.destroy();
        }
    }

    async saveAnnotations() {
        return this.factoryApi.caretaker.save(this.chart.ctx.annotationManager);
    }

    async restoreAnnotations(blob: unknown) {
        this.factoryApi.caretaker.restore(this.chart.ctx.annotationManager, blob);
        await this.chart.waitForUpdate();
    }

    resetAnimations(): void {
        this.chart.resetAnimations();
    }

    skipAnimations(): void {
        this.chart.skipAnimations();
    }

    destroy() {
        this.chart.destroy();
    }

    private async prepareResizedChart({ chart }: AgChartInstanceProxy, opts: DownloadOptions = {}) {
        const width: number = opts.width ?? chart.width ?? chart.ctx.scene.canvas.width;
        const height: number = opts.height ?? chart.height ?? chart.ctx.scene.canvas.height;

        const options: ChartExtendedOptions = mergeDefaults(
            {
                container: document.createElement('div'),
                overrideDevicePixelRatio: 1,
                width,
                height,
            },
            // Disable enterprise features that may interfere with image generation.
            moduleRegistry.hasEnterpriseModules() && { animation: { enabled: false } },
            chart.getOptions()
        );

        const cloneProxy = await this.factoryApi.createOrUpdate(options);
        cloneProxy.chart.ctx.zoomManager.updateZoom('agChartV2', chart.ctx.zoomManager.getZoom()); // sync zoom
        chart.series.forEach((series, index) => {
            if (!series.visible) {
                cloneProxy.chart.series[index].visible = false; // sync series visibility
            }
        });
        chart.update(ChartUpdateType.FULL, { forceNodeDataRefresh: true });
        await cloneProxy.waitForUpdate();
        return cloneProxy;
    }
}
