import type { AgChartInstance, AgChartOptions, AgChartState, DownloadOptions, ImageDataUrlOptions } from 'ag-charts-types';
import type { MementoCaretaker } from '../api/state/memento';
import type { DeepPartial } from '../util/types';
import type { Chart } from './chart';
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
export declare class AgChartInstanceProxy implements AgChartProxy {
    private readonly factoryApi;
    static readonly chartInstances: WeakMap<Chart, AgChartInstanceProxy>;
    static isInstance(x: any): x is AgChartInstanceProxy;
    private static validateImplementation;
    chart: Chart;
    constructor(chart: Chart, factoryApi: FactoryApi);
    update(options: AgChartOptions): Promise<void>;
    updateDelta(deltaOptions: DeepPartial<AgChartOptions>): Promise<void>;
    getOptions(): import("ag-charts-types").AgCartesianChartOptions | import("ag-charts-types").AgPolarChartOptions | import("ag-charts-types").AgHierarchyChartOptions | import("ag-charts-types").AgTopologyChartOptions | import("ag-charts-types").AgFlowProportionChartOptions;
    waitForUpdate(): Promise<void>;
    download(opts?: DownloadOptions): Promise<void>;
    getImageDataURL(opts?: ImageDataUrlOptions): Promise<string>;
    getState(): Required<AgChartState>;
    setState(state: AgChartState): Promise<void>;
    resetAnimations(): void;
    skipAnimations(): void;
    destroy(): void;
    private prepareResizedChart;
}
