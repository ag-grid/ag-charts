import { CartesianChart, HierarchyChart, PolarChart, TopologyChart } from './chart/baseChart';
import { ChartOptions } from './chart/chartOptions';
import { Scene } from './chart/scene';
import { AgChartOptions, ChartType, IChart } from './chart/types';

export abstract class AgCharts {
    static create(options: AgChartOptions) {
        // first-time: check license
        return new ChartInstance(options);
    }

    static update(chartInstance: ChartInstance, options: object) {
        return chartInstance.update(options);
    }

    static remove(chartInstance: ChartInstance) {
        return chartInstance.remove();
    }

    static download(chartInstance: ChartInstance, options: object) {
        return chartInstance.download(options);
    }

    static getImageDataURL(chartInstance: ChartInstance, options: object) {
        return chartInstance.getImageDataURL(options);
    }
}

class ChartInstance {
    private chart: IChart;
    private options: ChartOptions<any>;
    private readonly scene: Scene;

    constructor(options: object) {
        // default size, big enough to prevent blurriness in Safari.
        this.scene = new Scene(1024, 768);
        this.options = new ChartOptions(options);
        this.chart = ChartInstance.create(this.scene, this.options);
    }

    update(options: object) {
        const outOfSync = this.chart.options !== this.options;
        this.options = new ChartOptions(options, this.options, outOfSync);
        if (this.options.chartType !== this.options.prevOptions?.chartType) {
            this.chart.remove();
            this.chart = ChartInstance.create(this.scene, this.options);
        } else {
            this.chart.setOptions(this.options);
        }
    }

    remove() {
        this.chart.remove();
    }

    download(_options: object) {}

    getImageDataURL(_options: object) {}

    private static create(scene: Scene, options: ChartOptions<any>) {
        const ChartConstructor = this.getConstructor(options);
        return new ChartConstructor(scene, options);
    }

    private static getConstructor(options: ChartOptions<any>) {
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
