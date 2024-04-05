import type { CartesianAxis } from '../axes/baseAxis';
import type { CartesianChartOptions } from '../types/agChartsTypes';
import { BaseChart } from './baseChart';

export class CartesianChart extends BaseChart<CartesianChartOptions> {
    protected axes?: CartesianAxis[];
}
