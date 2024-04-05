import { getWindow } from '../util/dom';
import { hasConstrainedCanvasMemory } from '../util/userAgent';
import { CartesianChart } from './chart/cartesianChart';
import { ChartOptions } from './chart/chartOptions';
import { HierarchyChart } from './chart/hierarchyChart';
import { PolarChart } from './chart/polarChart';
import { TopologyChart } from './chart/topologyChart';
import type { AgChartOptions } from './options/commonOptions';
import { Scene } from './render/scene';
import { ChartType, IChart } from './types';

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
        const pixelRatio = hasConstrainedCanvasMemory() ? 1 : getWindow('devicePixelRatio');
        // default size, big enough to prevent blurriness in Safari.
        this.scene = new Scene(1024, 768, pixelRatio);
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
