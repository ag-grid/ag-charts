import type { CartesianAxis } from '../axes/baseAxis';
import type { CartesianChartOptions } from '../types/agChartsTypes';
import { type CartesianChartAxes, CartesianCoordinate } from '../types/axisTypes';
import { Position } from '../types/commonTypes';
import { BaseChart } from './baseChart';

export class CartesianChart extends BaseChart<CartesianChartOptions> {
    static override DefaultAxes: CartesianChartAxes[] = [
        { type: 'number', position: Position.Left },
        { type: 'category', position: Position.Bottom },
    ];

    static override DefaultKeysMap: { [K in CartesianCoordinate]: string[] } = {
        [CartesianCoordinate.Horizontal]: ['x'],
        [CartesianCoordinate.Vertical]: ['y'],
    };

    protected axes?: CartesianAxis[];
}
