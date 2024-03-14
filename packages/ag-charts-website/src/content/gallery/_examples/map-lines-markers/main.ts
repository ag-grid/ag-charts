import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { cycleCounterData } from './cycleCounterData';
import { cycleCounterTopology } from './cycleCounterTopology';
import { cycleRouteData } from './cycleRouteData';
import { cycleRouteTopology } from './cycleRouteTopology';
import { yorkData } from './yorkData';
import { yorkTopology } from './yorkTopology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'UK Motorways',
    },
    series: [
        {
            type: 'map-line',
            topologyIdKey: 'ROUTE_NAME',
            idKey: 'ROUTE_NAME',
            topology: cycleRouteTopology,
            data: cycleRouteData,
        },
        {
            type: 'map-line',
            topologyIdKey: 'id',
            idKey: 'id',
            topology: yorkTopology,
            data: yorkData,
        },
        {
            type: 'map-marker',
            idKey: 'RoadName',
            topologyIdKey: 'RoadName',
            topology: cycleCounterTopology,
            data: cycleCounterData,
        },
    ],
};

AgCharts.create(options);
