import * as test from 'ag-charts-test';

import { AgCharts } from '../../api/agCharts';
import * as time from '../../util/time/index';
// Undocumented APIs used by examples.
import { Marker } from '../marker/marker';

export function loadExampleOptions(name: string) {
    return test.loadExampleOptions({ time, AgCharts, Marker }, name);
}
