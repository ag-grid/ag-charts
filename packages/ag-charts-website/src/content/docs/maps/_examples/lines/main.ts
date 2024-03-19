import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { backgroundTopologyNI } from './backgroundTopologyNI';
import { routeTopology } from './routeTopology';
import { stationData } from './stationData';
import { stationTopology } from './stationTopology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Ireland Railways',
    },
    series: [
        {
            type: 'map-shape-background',
            topology: backgroundTopologyNI,
            fill: '#badc58',
            fillOpacity: 0.2,
        },
        {
            type: 'map-shape-background',
            topology: backgroundTopology,
            fill: '#badc58',
        },
        {
            type: 'map-line',
            topology: routeTopology,
            data: [{ name: 'Railways' }],
            idKey: 'name',
            stroke: '#4834d4',
            strokeWidth: 2,
        },
        {
            type: 'map-marker',
            topology: stationTopology,
            data: stationData,
            idKey: 'name',
            labelKey: 'name',
            fill: '#4834d4',
            fillOpacity: 1,
            strokeWidth: 0,
            size: 5,
            label: {
                color: '#535c68',
                fontSize: 8,
            },
        },
    ],
};

AgCharts.create(options);
