import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { cycleCounterData } from './cycleCounterData';
import { cycleCounterTopology } from './cycleCounterTopology';
import { cycleRouteData } from './cycleRouteData';
import { cycleRouteTopology } from './cycleRouteTopology';
import { yorkRoadsData } from './yorkRoadsData';
import { yorkRoadsTopology } from './yorkRoadsTopology';
import { yorkTopology } from './yorkTopology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'UK Motorways',
    },
    series: [
        {
            type: 'map-shape-background',
            topology: yorkTopology,
        },
        {
            type: 'map-line',
            topologyIdKey: 'name',
            idKey: 'name',
            topology: yorkRoadsTopology,
            data: yorkRoadsData,
            stroke: '#888',
            strokeWidth: 10,
            strokeOpacity: 0.1,
        },
        {
            type: 'map-line',
            topologyIdKey: 'name',
            idKey: 'name',
            topology: cycleRouteTopology,
            data: cycleRouteData,
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
