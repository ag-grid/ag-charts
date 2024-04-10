import { getWindow } from '../util/dom';
import { hasConstrainedCanvasMemory } from '../util/userAgent';
import { CartesianChart } from './chart/cartesianChart';
import { ChartOptions } from './chart/chartOptions';
import { HierarchyChart } from './chart/hierarchyChart';
import { PolarChart } from './chart/polarChart';
import { TopologyChart } from './chart/topologyChart';
import { Stage } from './render/stage';
import type { IChart, IChartOptions } from './types';
import type { AgChartOptions, DownloadOptions, ImageUrlOptions } from './types/agChartsTypes';
import { ChartType } from './types/enums';

type IChartConstructor = new (stage: Stage, options: IChartOptions<any>) => IChart<any>;

export abstract class AgCharts {
    static create<T extends AgChartOptions>(options: T) {
        // first-time: check license
        return new ChartInstance<T>(options);
    }

    static update<T extends AgChartOptions>(chartInstance: ChartInstance<T>, options: Partial<T>) {
        return chartInstance.update(options);
    }

    static remove(chartInstance: ChartInstance<any>) {
        return chartInstance.remove();
    }

    static download(chartInstance: ChartInstance<any>, options: DownloadOptions) {
        return chartInstance.download(options);
    }

    static getImageDataURL(chartInstance: ChartInstance<any>, options: ImageUrlOptions) {
        return chartInstance.getImageDataURL(options);
    }
}

export class ChartInstance<T extends AgChartOptions> {
    private chart: IChart<T>;
    private options: ChartOptions<T>;
    private readonly stage: Stage;

    constructor(options: T) {
        const pixelRatio = hasConstrainedCanvasMemory() ? 1 : getWindow('devicePixelRatio');
        // default size, big enough to prevent blurriness in Safari.
        this.stage = new Stage(1024, 768, pixelRatio);
        this.options = new ChartOptions<T>(options);
        this.chart = ChartInstance.create(this.stage, this.options);
    }

    update(options: Partial<T>) {
        const outOfSync = this.chart.options !== this.options;
        this.options = new ChartOptions(options, this.options, outOfSync);
        if (this.options.chartType !== this.options.prevOptions?.chartType) {
            this.chart.remove();
            this.chart = ChartInstance.create(this.stage, this.options);
        } else {
            this.chart.setOptions(this.options);
        }
    }

    remove() {
        this.chart.remove();
    }

    download(_options: DownloadOptions) {}

    getImageDataURL(_options: ImageUrlOptions) {}

    private static create(stage: Stage, options: ChartOptions<any>) {
        const ChartConstructor = this.getConstructor(options);
        return new ChartConstructor(stage, options);
    }

    private static getConstructor(options: IChartOptions<any>): IChartConstructor {
        switch (options.chartType) {
            case ChartType.Cartesian:
                return CartesianChart;
            case ChartType.Hierarchy:
                return HierarchyChart;
            case ChartType.Polar:
                return PolarChart;
            case ChartType.Topology:
                return TopologyChart;
            default:
                throw new TypeError('invalid chartType');
        }
    }
}
