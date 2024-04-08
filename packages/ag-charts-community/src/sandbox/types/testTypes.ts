import type { ChartInstance } from '../agCharts';
import type { ChartOptions } from '../chart/chartOptions';
import type { Scene } from '../render/scene';
import type { IChart } from '../types';
import type { AgChartOptions } from './agChartsTypes';

export interface TestInstance<T extends AgChartOptions> extends Omit<ChartInstance<T>, 'chart' | 'options' | 'scene'> {
    chart: IChart;
    options: ChartOptions<T>;
    scene: Scene;
}
