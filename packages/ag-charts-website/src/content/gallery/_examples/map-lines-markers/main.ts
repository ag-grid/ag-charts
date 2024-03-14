import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { cycleCounterData, cycleRouteData, yorkData } from './data';
import { cycleCounterTopology, cycleRouteTopology, yorkTopology } from './topology';

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
