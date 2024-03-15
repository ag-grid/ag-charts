import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { cycleCounterData } from './cycleCounterData';
import { cycleCounterTopology } from './cycleCounterTopology';
import { cycleRouteData } from './cycleRouteData';
import { cycleRouteTopology } from './cycleRouteTopology';
import { yorkRoadsTopology } from './yorkRoadsTopology';
import { yorkTopology } from './yorkTopology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    footnote: {
        text: 'York Cycle Network',
    },
    series: [
        {
            type: 'map-shape-background',
            topology: yorkTopology,
        },
        {
            type: 'map-line-background',
            topology: yorkRoadsTopology,
            strokeWidth: 3,
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
            fillOpacity: 1,
            shape: 'pin',
            size: 15,
        },
    ],
};

AgCharts.create(options);
