import type { CartesianAxis } from '../axes/baseAxis';
import type { CartesianChartOptions } from '../defs/commonOptions';
import { BaseChart } from './baseChart';

export class CartesianChart extends BaseChart<CartesianChartOptions> {
    protected axes?: CartesianAxis[];
}
