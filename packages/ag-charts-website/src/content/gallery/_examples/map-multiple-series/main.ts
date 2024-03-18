import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { ferryData } from './ferryData';
import { ferryTopology } from './ferryTopology';
import { flightData } from './flightData';
import { flightTopology } from './flightTopology';
import { islandData } from './islandData';
import { islandTopology } from './islandTopology';

const sizeDomain = [500, 0];

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Traveling to Greek Islands',
    },
    series: [
        {
            type: 'map-shape-background',
            topology: backgroundTopology,
        },
        {
            type: 'map-marker',
            title: 'Islands',
            data: islandData,
            topology: islandTopology,
            idKey: 'name',
            sizeKey: 'population',
            shape: 'pin',
            size: 8,
            maxSize: 32,
        },
        {
            type: 'map-line',
            title: 'Ferries',
            legendItemName: 'Ferries',
            data: ferryData,
            topology: ferryTopology,
            idKey: '@id',
            topologyIdKey: '@id',
            sizeKey: 'duration',
            sizeName: 'Duration',
            sizeDomain,
            tooltip: {
                renderer: ({ datum }) => ({
                    content: `${datum.int_name}<br>Duration: ${datum.duration}`,
                }),
            },
        },
        {
            type: 'map-line',
            title: 'Flights',
            legendItemName: 'Flights',
            data: flightData,
            topology: flightTopology,
            idKey: 'name',
            sizeKey: 'duration',
            sizeName: 'Duration',
            sizeDomain,
            lineDash: [1, 4],
        },
    ],
    legend: {
        enabled: true,
    },
};

AgCharts.create(options);
