import type { PolarAxis } from '../axes/baseAxis';
import type { PolarChartOptions } from '../types/agChartsTypes';
import type { PolarChartAxes } from '../types/axisTypes';
import { BaseChart } from './baseChart';

export class PolarChart extends BaseChart<PolarChartOptions> {
    static DefaultAxes: PolarChartAxes[] = [{ type: 'angle-category' }, { type: 'radius-category' }];

    protected axes?: PolarAxis[];
}
