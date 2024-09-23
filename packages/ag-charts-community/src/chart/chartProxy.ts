import type {
    AgChartInstance,
    AgChartOptions,
    AgChartState,
    DownloadOptions,
    ImageDataUrlOptions,
} from 'ag-charts-types';

import type { MementoCaretaker } from '../api/state/memento';
import type { LicenseManager } from '../module/enterpriseModule';
import { moduleRegistry } from '../module/module';
import { deepClone } from '../util/json';
import { mergeDefaults } from '../util/object';
import { ActionOnSet } from '../util/proxy';
import type { DeepPartial } from '../util/types';
import type { Chart, ChartExtendedOptions } from './chart';
import { ChartUpdateType } from './chartUpdateType';
import { isAgCartesianChartOptions } from './mapping/types';

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
            if (!chart.destroyed) {
                chart.publicApi = undefined;
            }
            AgChartInstanceProxy.chartInstances.delete(chart);
        },
        newValue(chart) {
            chart.publicApi = this;
            AgChartInstanceProxy.chartInstances.set(chart, this);
        },
    })
    chart: Chart;

    constructor(
        chart: Chart,
        private readonly factoryApi: FactoryApi,
        private readonly licenseManager?: LicenseManager
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
        const options = deepClone(this.chart.getOptions());
        for (const key in options) {
            if (key.startsWith('_')) {
                delete (options as any)[key];
            }
        }
        return options;
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

    getState() {
        const {
            factoryApi: { caretaker },
            chart: {
                ctx: { annotationManager },
            },
        } = this;

        return caretaker.save(annotationManager) as Required<AgChartState>;
    }

    async setState(state: AgChartState) {
        const {
            factoryApi: { caretaker },
            chart: {
                ctx: { annotationManager },
            },
        } = this;

        caretaker.restore(state, annotationManager);
        await this.chart.waitForUpdate();
    }

    resetAnimations(): void {
        this.chart.resetAnimations();
    }

    skipAnimations(): void {
        this.chart.skipAnimations();
    }

    destroy() {
        this.chart.publicApi = undefined;
        this.chart.destroy();
    }

    private async prepareResizedChart(proxy: AgChartInstanceProxy, opts: DownloadOptions = {}) {
        const { chart } = proxy;
        const width: number = opts.width ?? chart.width ?? chart.ctx.scene.canvas.width;
        const height: number = opts.height ?? chart.height ?? chart.ctx.scene.canvas.height;
        const state = proxy.getState();

        const isEnterprise = moduleRegistry.hasEnterpriseModules();
        const overrideOptions: Partial<AgChartOptions> = {};
        const processedOptions = chart.chartOptions.getOptions();

        if (isEnterprise) {
            // Disable enterprise features that may interfere with image generation.
            overrideOptions.animation = { enabled: false };

            if (isAgCartesianChartOptions(processedOptions)) {
                overrideOptions.toolbar = { enabled: false };
            }

            // Add watermark if no license
            if (this.licenseManager?.isDisplayWatermark()) {
                // @ts-expect-error
                overrideOptions.foreground = {
                    text: this.licenseManager.getWatermarkMessage(),
                    image: {
                        url: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjU4IiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMjU4IDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBkPSJNMjUuNzc5IDI4LjY1N0gxMy4zNTlMMTEuMTczIDM0LjAxMkg1LjY3Mjk3TDE3LjE4MiA3LjA1OTk5SDIxLjk1M0wzMy40NjIgMzQuMDEySDI3Ljk2MkwyNS43NzYgMjguNjU3SDI1Ljc3OVpNMjQuMDY4IDI0LjM5N0wxOS41ODggMTMuNDM0TDE1LjEwNyAyNC4zOTdIMjQuMDY4Wk02Mi4wOTIgMTguODIzSDQ5LjgxN1YyMy4wODZINTYuNzc1QzU2LjU1NSAyNS4yMjIgNTUuNzU1IDI2LjkyNyA1NC4zNzIgMjguMjAyQzUyLjk4OSAyOS40NzYgNTEuMTY2IDMwLjExNSA0OC45MDkgMzAuMTE1QzQ3LjYyMiAzMC4xMTUgNDYuNDUgMjkuODg1IDQ1LjM5MyAyOS40MjNDNDQuMzU4MyAyOC45NzgxIDQzLjQzMjYgMjguMzEzOCA0Mi42OCAyNy40NzZDNDEuOTI3IDI2LjYzOSA0MS4zNDQgMjUuNjMxIDQwLjkzMSAyNC40NTNDNDAuNTE5IDIzLjI3NSA0MC4zMTEgMjEuOTcgNDAuMzExIDIwLjUzN0M0MC4zMTEgMTkuMTA1IDQwLjUxNiAxNy44IDQwLjkzMSAxNi42MjFDNDEuMzQ0IDE1LjQ0MyA0MS45MjcgMTQuNDM2IDQyLjY4IDEzLjU5OEM0My40Mzc2IDEyLjc1NzcgNDQuMzY5NiAxMi4wOTMyIDQ1LjQxMSAxMS42NTFDNDYuNDc4IDExLjE4OSA0Ny42NTYgMTAuOTYgNDguOTQ2IDEwLjk2QzUxLjYxMiAxMC45NiA1My42MzcgMTEuNjAyIDU1LjAyIDEyLjg4NUw1OC4zIDkuNjA0OTlDNTUuODE3IDcuNjY5OTkgNTIuNjc2IDYuNjk5OTkgNDguODcyIDYuNjk5OTlDNDYuNzYgNi42OTk5OSA0NC44NTMgNy4wMzQ5OSA0My4xNTQgNy43MDA5OUM0MS40NTUgOC4zNjc5OSAzOS45OTggOS4zMDM5OSAzOC43ODMgMTAuNTA0QzM3LjU2NyAxMS43MDcgMzYuNjM0IDEzLjE1OCAzNS45NzcgMTQuODU3QzM1LjMxOSAxNi41NTYgMzQuOTk0IDE4LjQ1MSAzNC45OTQgMjAuNTRDMzQuOTk0IDIyLjYzIDM1LjMyOSAyNC40OTQgMzUuOTk1IDI2LjIwNUMzNi42NjIgMjcuOTE2IDM3LjYwNSAyOS4zNzQgMzguODE3IDMwLjU3N0M0MC4wMzIgMzEuNzggNDEuNDg2IDMyLjcxMyA0My4xODggMzMuMzgzQzQ0Ljg4OCAzNC4wNDkgNDYuNzgyIDM0LjM4NCA0OC44NzIgMzQuMzg0QzUwLjk2MSAzNC4zODQgNTIuNzUgMzQuMDQ5IDU0LjM5IDMzLjM4M0M1Ni4wMzEgMzIuNzE2IDU3LjQyNiAzMS43OCA1OC41NzkgMzAuNTc3QzU5LjczMyAyOS4zNzQgNjAuNjE5IDI3LjkxNiA2MS4yMzkgMjYuMjA1QzYxLjg2IDI0LjQ5NCA2Mi4xNyAyMi42MDUgNjIuMTcgMjAuNTRDNjIuMTY5NiAxOS45Njg4IDYyLjE0NDUgMTkuMzk4IDYyLjA5NSAxOC44MjlMNjIuMDkyIDE4LjgyM1pNMTUxLjgxIDE2Ljk4MUMxNTMuNDEgMTQuNjA5IDE1Ny40MTkgMTQuMzU4IDE1OS4wMjIgMTQuMzU4VjE4LjkxQzE1Ni45NTcgMTguOTEgMTU0Ljk4NSAxOC45OTYgMTUzLjc1NyAxOS44OTJDMTUyLjUyOSAyMC43OTIgMTUxLjkxOSAyMS45ODIgMTUxLjkxOSAyMy40NjRWMzMuOTlIMTQ2Ljk2NFYxNC4zNThIMTUxLjczNkwxNTEuODEgMTYuOTgxWk0xNDMuMDExIDE0LjM2MVYzNC4wMzFIMTM4LjI0TDEzOC4xMzEgMzEuMDQ1QzEzNy40NjYgMzIuMDc2IDEzNi41NTEgMzIuOTIxOSAxMzUuNDcxIDMzLjUwNEMxMzQuMzc2IDM0LjA5OSAxMzMuMDY4IDM0LjM5NiAxMzEuNTM2IDM0LjM5NkMxMzAuMiAzNC4zOTYgMTI4Ljk2MyAzNC4xNTIgMTI3LjgyMiAzMy42NjhDMTI2LjcgMzMuMTk2NCAxMjUuNjg5IDMyLjQ5NSAxMjQuODU1IDMxLjYwOUMxMjQuMDE4IDMwLjcyMiAxMjMuMzU0IDI5LjY2MiAxMjIuODcxIDI4LjQyMkMxMjIuMzg0IDI3LjE4NSAxMjIuMTQyIDI1LjgxMSAxMjIuMTQyIDI0LjMwNEMxMjIuMTQyIDIyLjc5OCAxMjIuMzg0IDIxLjM3OCAxMjIuODcxIDIwLjExNkMxMjMuMzU3IDE4Ljg1NCAxMjQuMDE4IDE3Ljc3MiAxMjQuODU1IDE2Ljg3M0MxMjUuNjg4IDE1Ljk3NjQgMTI2LjY5OCAxNS4yNjM2IDEyNy44MjIgMTQuNzhDMTI4Ljk2MyAxNC4yODEgMTMwLjIwMyAxNC4wMzMgMTMxLjUzNiAxNC4wMzNDMTMzLjA0MyAxNC4wMzMgMTM0LjMzIDE0LjMxOCAxMzUuMzk3IDE0Ljg4OEMxMzYuNDYyIDE1LjQ1ODkgMTM3LjM3NSAxNi4yNzggMTM4LjA1NyAxNy4yNzZWMTQuMzYxSDE0My4wMTFaTTEzMi42MzEgMzAuMTMzQzEzNC4yNTYgMzAuMTMzIDEzNS41NjcgMjkuNTk0IDEzNi41NjUgMjguNTEyQzEzNy41NjEgMjcuNDMgMTM4LjA2IDI1Ljk5MSAxMzguMDYgMjQuMTk2QzEzOC4wNiAyMi40MDEgMTM3LjU2MSAyMC45OSAxMzYuNTY1IDE5Ljg5OUMxMzUuNTcgMTguODA3IDEzNC4yNTkgMTguMjU4IDEzMi42MzEgMTguMjU4QzEzMS4wMDMgMTguMjU4IDEyOS43MjkgMTguODA0IDEyOC43MzQgMTkuODk5QzEyNy43MzggMjAuOTkzIDEyNy4yMzkgMjIuNDM4IDEyNy4yMzkgMjQuMjMzQzEyNy4yMzkgMjYuMDI4IDEyNy43MzUgMjcuNDMzIDEyOC43MzQgMjguNTE1QzEyOS43MjkgMjkuNTk0IDEzMS4wMjggMzAuMTM2IDEzMi42MzEgMzAuMTM2VjMwLjEzM1pNOTMuNjk4IDI3Ljg3NkM5My41Nzk1IDI4LjAwMjUgOTMuNDU2NCAyOC4xMjQ2IDkzLjMyOSAyOC4yNDJDOTEuOTQ3IDI5LjUxNiA5MC4xMjMgMzAuMTU1IDg3Ljg2NiAzMC4xNTVDODYuNTggMzAuMTU1IDg1LjQwOCAyOS45MjYgODQuMzUgMjkuNDY0QzgzLjMxNTUgMjkuMDE4OSA4Mi4zODk4IDI4LjM1NDYgODEuNjM3IDI3LjUxN0M4MC44ODQgMjYuNjc5IDgwLjMwMSAyNS42NzIgNzkuODg5IDI0LjQ5NEM3OS40NzYgMjMuMzE1IDc5LjI2OSAyMi4wMSA3OS4yNjkgMjAuNTc4Qzc5LjI2OSAxOS4xNDUgNzkuNDczIDE3Ljg0IDc5Ljg4OSAxNi42NjJDODAuMzAxIDE1LjQ4NCA4MC44ODQgMTQuNDc2IDgxLjYzNyAxMy42MzlDODIuMzk0OSAxMi43OTg3IDgzLjMyNzMgMTIuMTM0MiA4NC4zNjkgMTEuNjkyQzg1LjQzNiAxMS4yMyA4Ni42MTQgMTEgODcuOTAzIDExQzkwLjU3IDExIDkyLjU5NSAxMS42NDIgOTMuOTc3IDEyLjkyNkw5Ny4yNTggOS42NDQ5OUM5NC43NzQgNy43MTA5OSA5MS42MzMgNi43Mzk5OSA4Ny44MjkgNi43Mzk5OUM4NS43MTggNi43Mzk5OSA4My44MTEgNy4wNzQ5OSA4Mi4xMTIgNy43NDE5OUM4MC40MTMgOC40MDc5OSA3OC45NTYgOS4zNDQ5OSA3Ny43NCAxMC41NDVDNzYuNTI1IDExLjc0NyA3NS41OTIgMTMuMTk5IDc0LjkzNCAxNC44OThDNzQuMjc3IDE2LjU5NyA3My45NTEgMTguNDkxIDczLjk1MSAyMC41ODFDNzMuOTUxIDIyLjY3IDc0LjI4NiAyNC41MzQgNzQuOTUzIDI2LjI0NUM3NS42MTkgMjcuOTU3IDc2LjU2MiAyOS40MTQgNzcuNzc0IDMwLjYxN0M3OC45OSAzMS44MiA4MC40NDQgMzIuNzUzIDgyLjE0NiAzMy40MjNDODMuODQ1IDM0LjA5IDg1LjczOSAzNC40MjQgODcuODI5IDM0LjQyNEM4OS45MTkgMzQuNDI0IDkxLjcwOCAzNC4wOSA5My4zNDggMzMuNDIzQzk0LjcxOCAzMi44NjUgOTUuOTE4IDMyLjEyMSA5Ni45NDggMzEuMTkxQzk3LjE0OSAzMS4wMDggOTcuMzQ4IDMwLjgxNSA5Ny41MzcgMzAuNjJMOTMuNzAxIDI3Ljg4NUw5My42OTggMjcuODc2Wk0xMTAuODAyIDE0LjAxNUMxMDkuMTk5IDE0LjAxNSAxMDYuODM2IDE0LjQ3MSAxMDUuNjExIDE2LjE1OEwxMDUuNTM3IDYuMDE1OTlIMTAwLjc2NVYzMy45MzlIMTA1LjcyVjIyLjY0MUMxMDUuNzcxIDIxLjQ2MDcgMTA2LjI4OCAyMC4zNDg4IDEwNy4xNTcgMTkuNTQ4OUMxMDguMDI3IDE4Ljc0OTEgMTA5LjE3OCAxOC4zMjY2IDExMC4zNTggMTguMzc0QzExMy4zOTcgMTguMzc0IDExNC4yNjggMjEuMTU5IDExNC4yNjggMjIuNjQxVjMzLjkzOUgxMTkuMjIzVjIxLjA1OUMxMTkuMjIzIDIxLjA1OSAxMTkuMTQyIDE0LjAxNSAxMTAuODAyIDE0LjAxNVpNMTczLjc2MyAxNC4zNThIMTY5Ljk5OVY4LjcxNDk5SDE2NS4wNDhWMTQuMzU4SDE2MS4yODRWMTguOTE2SDE2NS4wNDhWMzQuMDAzSDE2OS45OTlWMTguOTE2SDE3My43NjNWMTQuMzU4Wk0xOTAuNzg3IDI1LjI2MkMxOTAuMTI5IDI0LjUwMTQgMTg5LjMwNyAyMy44OTk0IDE4OC4zODQgMjMuNTAxQzE4Ny40ODggMjMuMTE3IDE4Ni4zMzEgMjIuNzMyIDE4NC45NDggMjIuMzY0QzE4NC4xNjUgMjIuMTQzOSAxODMuMzkgMjEuODk3OCAxODIuNjIzIDIxLjYyNkMxODIuMTYzIDIxLjQ2MjEgMTgxLjc0MSAyMS4yMDY2IDE4MS4zODMgMjAuODc1QzE4MS4yMzUgMjAuNzQyMSAxODEuMTE4IDIwLjU3ODkgMTgxLjAzOSAyMC4zOTY0QzE4MC45NjEgMjAuMjE0IDE4MC45MjIgMjAuMDE2NiAxODAuOTI3IDE5LjgxOEMxODAuOTI3IDE5LjI3MiAxODEuMTU2IDE4Ljg0NCAxODEuNjI1IDE4LjUxQzE4Mi4xMjEgMTguMTU2IDE4Mi44NjIgMTcuOTc2IDE4My44MjYgMTcuOTc2QzE4NC43OSAxNy45NzYgMTg1LjU4NyAxOC4yMDkgMTg2LjE0OCAxOC42NjhDMTg2LjcwNiAxOS4xMjQgMTg3LjAwNyAxOS43MjUgMTg3LjA3MiAyMC41TDE4Ny4wOTQgMjAuNzgySDE5MS42MzNMMTkxLjYxNyAyMC40NkMxOTEuNTIxIDE4LjQ4NSAxOTAuNzcxIDE2LjkgMTg5LjM4NSAxNS43NUMxODguMDEyIDE0LjYxMiAxODYuMTg1IDE0LjAzMyAxODMuOTYyIDE0LjAzM0MxODIuNDc3IDE0LjAzMyAxODEuMTQxIDE0LjI4NyAxNzkuOTk0IDE0Ljc4NkMxNzguODMxIDE1LjI5MSAxNzcuOTI2IDE1Ljk5NSAxNzcuMjk2IDE2Ljg4MkMxNzYuNjczIDE3Ljc0NTUgMTc2LjMzOCAxOC43ODQgMTc2LjM0MSAxOS44NDlDMTc2LjM0MSAyMS4xNjcgMTc2LjY5OCAyMi4yNDkgMTc3LjM5OSAyMy4wNjRDMTc4LjA2IDIzLjg0MzIgMTc4Ljg5OCAyNC40NTM0IDE3OS44NDIgMjQuODQ0QzE4MC43NDQgMjUuMjE2IDE4MS45MjggMjUuNjA3IDE4My4zNjEgMjZDMTg0LjgwNiAyNi40MSAxODUuODcyIDI2Ljc4NSAxODYuNTMgMjcuMTIzQzE4Ny4xIDI3LjQxNCAxODcuMzc5IDI3Ljg0NSAxODcuMzc5IDI4LjQ0NEMxODcuMzc5IDI5LjA0MiAxODcuMTIyIDI5LjQ2NyAxODYuNTk1IDI5LjgzOUMxODYuMDQzIDMwLjIyNiAxODUuMjM3IDMwLjQyNSAxODQuMjAxIDMwLjQyNUMxODMuMTY2IDMwLjQyNSAxODIuMzk0IDMwLjE3NCAxODEuNzQ5IDI5LjY3NEMxODEuMTEzIDI5LjE4MSAxODAuNzcyIDI4LjU4OSAxODAuNzEgMjcuODY0TDE4MC42ODUgMjcuNTgySDE3Ni4wMTNMMTc2LjAyNSAyNy45MDFDMTc2LjA2NyAyOS4wOTU1IDE3Ni40NzIgMzAuMjQ4NyAxNzcuMTg4IDMxLjIwNkMxNzcuOTA3IDMyLjE4IDE3OC44OTMgMzIuOTU4IDE4MC4xMTggMzMuNTE5QzE4MS4zMzYgMzQuMDc3IDE4Mi43MzIgMzQuMzYyIDE4NC4yNjYgMzQuMzYyQzE4NS44MDEgMzQuMzYyIDE4Ny4xMDkgMzQuMTA4IDE4OC4yMzggMzMuNjA5QzE4OS4zNzYgMzMuMTA0IDE5MC4yNzIgMzIuMzk0IDE5MC45MDEgMzEuNDk0QzE5MS41MzQgMzAuNTkyIDE5MS44NTMgMjkuNTU0IDE5MS44NTMgMjguNDAzQzE5MS44MjggMjcuMTEgMTkxLjQ2NiAyNi4wNTMgMTkwLjc3NyAyNS4yNjJIMTkwLjc4N1oiIGZpbGw9IiM5QjlCOUIiLz4KPHBhdGggZD0iTTI0MS45ODIgMjUuNjU4MlYxNy43MTE3SDIyOC40NDFMMjIwLjQ5NCAyNS42NTgySDI0MS45ODJaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yNTcuMjM5IDUuOTUwODFIMjQwLjI2NUwyMzIuMjU1IDEzLjg5NzNIMjU3LjIzOVY1Ljk1MDgxWiIgZmlsbD0iIzlCOUI5QiIvPgo8cGF0aCBkPSJNMjEyLjYxMSAzMy42MDQ4TDIxNi42OCAyOS41MzYxSDIzMC40MTJWMzcuNDgyN0gyMTIuNjExVjMzLjYwNDhaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yMTUuNTk5IDIxLjc4MDNIMjI0LjM3MkwyMzIuMzgyIDEzLjgzMzdIMjE1LjU5OVYyMS43ODAzWiIgZmlsbD0iIzlCOUI5QiIvPgo8cGF0aCBkPSJNMjA2IDMzLjYwNDdIMjEyLjYxMUwyMjAuNDk0IDI1LjY1ODJIMjA2VjMzLjYwNDdaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yNDAuMjY1IDUuOTUwODFMMjM2LjE5NyAxMC4wMTk0SDIxMC4yNTlWMi4wNzI4OEgyNDAuMjY1VjUuOTUwODFaIiBmaWxsPSIjOUI5QjlCIi8+Cjwvc3ZnPgo=`,
                        width: 170,
                        height: 25,
                        right: 25,
                        bottom: 50,
                        opacity: 0.7,
                    },
                };
            }
        }

        const defaultOpts: ChartExtendedOptions = {
            container: document.createElement('div'),
            width,
            height,
        };

        if (opts.width != null && opts.height != null) {
            defaultOpts.overrideDevicePixelRatio = 1;
        }

        const options: ChartExtendedOptions = mergeDefaults(defaultOpts, overrideOptions, processedOptions);

        const cloneProxy = await this.factoryApi.createOrUpdate(options);
        await cloneProxy.setState(state);
        cloneProxy.chart.ctx.zoomManager.updateZoom('chartProxy', chart.ctx.zoomManager.getZoom()); // sync zoom
        chart.series.forEach((series, index) => {
            if (!series.visible) {
                cloneProxy.chart.series[index].visible = false; // sync series visibility
            }
        });
        cloneProxy.chart.update(ChartUpdateType.FULL, { forceNodeDataRefresh: true });
        await cloneProxy.waitForUpdate();
        return cloneProxy;
    }
}
