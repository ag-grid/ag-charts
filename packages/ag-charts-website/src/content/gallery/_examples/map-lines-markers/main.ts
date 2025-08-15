import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { cycleCounterData } from './cycleCounterData';
import { cycleCounterTopology } from './cycleCounterTopology';
import { cycleRouteData } from './cycleRouteData';
import { cycleRouteTopology } from './cycleRouteTopology';
import { yorkRoadsTopology } from './yorkRoadsTopology';
import { yorkTopology } from './yorkTopology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'York Cycle Network Infrastructure',
    },
    subtitle: {
        text: 'Dedicated cycle lanes and traffic monitoring cameras',
    },
    footnote: {
        text: 'Data: York City Council',
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
            title: 'Cycle Lanes',
            topologyIdKey: 'name',
            idKey: 'name',
            topology: cycleRouteTopology,
            data: cycleRouteData,
            strokeWidth: 2.5,
            strokeOpacity: 0.9,
        },
        {
            type: 'map-marker',
            title: 'Cycle Traffic Cameras',
            idKey: 'RoadName',
            topologyIdKey: 'RoadName',
            topology: cycleCounterTopology,
            data: cycleCounterData,
            fillOpacity: 0.95,
            shape: 'pin',
            size: 18,
            strokeWidth: 1.5,
            strokeOpacity: 0.8,
        },
    ],
    legend: {
        enabled: true,
        position: 'bottom',
        spacing: 40,
    },
};

AgCharts.create(options);
