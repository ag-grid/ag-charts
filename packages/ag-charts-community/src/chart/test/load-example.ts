import * as test from 'ag-charts-test';

import * as time from '../../util/time/index';
import { AgCharts } from '../agChartV2';
// Undocumented APIs used by examples.
import { Marker } from '../marker/marker';

export function loadExampleOptions(name: string) {
    return test.loadExampleOptions({ time, AgCharts, Marker }, name);
}
