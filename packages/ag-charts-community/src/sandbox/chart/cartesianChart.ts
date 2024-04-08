import type { CartesianAxis } from '../axes/baseAxis';
import type { CartesianChartOptions } from '../types/agChartsTypes';
import type { CartesianChartAxes } from '../types/axisTypes';
import { Position } from '../types/commonTypes';
import { BaseChart } from './baseChart';

export class CartesianChart extends BaseChart<CartesianChartOptions> {
    static DefaultAxes: CartesianChartAxes[] = [
        { type: 'number', position: Position.Left },
        { type: 'category', position: Position.Bottom },
    ];

    protected axes?: CartesianAxis[];
}
