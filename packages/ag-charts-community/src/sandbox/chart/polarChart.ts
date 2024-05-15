import { PolarCoordinate } from '../axes/axesEnums';
import type { PolarChartAxes } from '../axes/axesTypes';
import type { PolarCoordinator } from '../axes/polarCoordinator';
import { BaseChart } from './baseChart';
import type { PolarChartOptions } from './chartTypes';

export class PolarChart extends BaseChart<PolarChartOptions> {
    static override DefaultAxes: PolarChartAxes[] = [{ type: 'angle-category' }, { type: 'radius-category' }];

    static override DefaultKeysMap: { [K in PolarCoordinate]: string[] } = {
        [PolarCoordinate.Radial]: ['radius'],
        [PolarCoordinate.Angular]: ['angle'],
    };

    protected axes?: PolarCoordinator[];
}
