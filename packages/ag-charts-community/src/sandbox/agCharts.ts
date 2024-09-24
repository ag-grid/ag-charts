import { downloadUrl, getWindow } from '../util/dom';
import { hasConstrainedCanvasMemory } from '../util/userAgent';
import { CartesianChart } from './chart/cartesianChart';
import { ChartOptions } from './chart/chartOptions';
import type {
    AgChartOptions,
    DownloadOptions,
    IChart,
    IChartConstructor,
    IChartOptions,
    ImageUrlOptions,
} from './chart/chartTypes';
import { HierarchyChart } from './chart/hierarchyChart';
import { PolarChart } from './chart/polarChart';
import { TopologyChart } from './chart/topologyChart';
import { Stage } from './drawing/stage';
import { ChartType } from './types/enums';

export abstract class AgCharts {
    static create<T extends AgChartOptions>(options: T) {
        // TODO: first-time, check license
        return new ChartInstance<T>(options);
    }

    static update<T extends AgChartOptions>(chartInstance: ChartInstance<T>, options: Partial<T>) {
        return chartInstance.update(options);
    }

    static remove(chartInstance: ChartInstance<any>) {
        return chartInstance.remove();
    }
}

export class ChartInstance<T extends AgChartOptions> {
    private chart: IChart<T>;
    private options: IChartOptions<T>;
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
        if (this.options.chartType !== this.options.lastOptions?.chartType) {
            this.chart.remove();
            this.chart = ChartInstance.create(this.stage, this.options);
        } else {
            this.chart.setOptions(this.options);
        }
    }

    remove() {
        this.chart.remove();
    }

    download(options: DownloadOptions) {
        downloadUrl(this.getImageDataURL(options), options.fileName ?? 'TempFileName');
    }

    getImageDataURL(options: ImageUrlOptions) {
        return this.stage.toDataURL(options);
    }

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
            case ChartType.Gauge:
                return TopologyChart;
            default:
                throw new TypeError('Invalid chartType');
        }
    }
}
