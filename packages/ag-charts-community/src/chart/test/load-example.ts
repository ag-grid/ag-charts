import * as test from '_ag-charts-test';

import * as time from 'ag-charts-core';

import { AgCharts } from '../../api/agCharts';
// Undocumented APIs used by examples.
import { Marker } from '../marker/marker';

export function loadExampleOptions(name: string) {
    return test.loadExampleOptions({ time, AgCharts, Marker }, name);
}
