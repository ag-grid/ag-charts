import { getDocument } from '../../util/dom';
import { AgCharts } from '../agCharts';
import type { AgChartOptions } from '../types/agChartsTypes';
import type { TestInstance } from '../types/testTypes';

export function createTestInstance<T extends AgChartOptions>(options: T) {
    options.container ??= getDocument('body');
    options.width ??= 800;
    options.height ??= 600;

    return AgCharts.create(options) as unknown as TestInstance<T>;
}
