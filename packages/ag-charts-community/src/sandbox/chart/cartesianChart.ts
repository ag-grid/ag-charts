import type { CartesianAxis } from '../axes/baseAxis';
import type { CartesianChartOptions } from '../types/agChartsTypes';
import { type CartesianChartAxes, CartesianCoordinate } from '../types/axisTypes';
import { Direction } from '../types/enums';
import { BaseChart } from './baseChart';

export class CartesianChart extends BaseChart<CartesianChartOptions> {
    static override DefaultAxes: CartesianChartAxes[] = [
        { type: 'number', position: Direction.Left },
        { type: 'category', position: Direction.Bottom },
    ];

    static override DefaultKeysMap: { [K in CartesianCoordinate]: string[] } = {
        [CartesianCoordinate.Horizontal]: ['x'],
        [CartesianCoordinate.Vertical]: ['y'],
    };

    protected axes?: CartesianAxis[];

    // protected override createAxes(options: CartesianChartOptions) {
    //     for (const axisOptions of options.axes) {
    //         const DataProcessor = CartesianChart.getDataProcessorByAxisType(axisOptions.type);
    //     }
    // }
    //
    // private static getDataProcessorByAxisType(axisType: CartesianChartAxes['type']): new () => IDataProcessor {
    //     switch (axisType) {
    //         case 'category':
    //             return CategoryProcessor;
    //         case 'log':
    //             return LogProcessor;
    //         case 'number':
    //             return NumberProcessor;
    //         case 'ordinal-time':
    //             return CategoryProcessor;
    //         case 'time':
    //             return TimeProcessor;
    //         default:
    //             throw new TypeError(`Invalid axis type "${axisType}"`);
    //     }
    // }
}
