import type { PolarAxis } from '../axes/baseAxis';
import type { PolarChartOptions } from '../types/agChartsTypes';
import { type PolarChartAxes, PolarCoordinate } from '../types/axisTypes';
import { BaseChart } from './baseChart';

export class PolarChart extends BaseChart<PolarChartOptions> {
    static override DefaultAxes: PolarChartAxes[] = [{ type: 'angle-category' }, { type: 'radius-category' }];

    static override DefaultKeysMap: { [K in PolarCoordinate]: string[] } = {
        [PolarCoordinate.Radial]: ['radius'],
        [PolarCoordinate.Angular]: ['angle'],
    };

    protected axes?: PolarAxis[];
}
