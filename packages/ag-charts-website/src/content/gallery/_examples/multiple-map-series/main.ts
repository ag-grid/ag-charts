import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { DataType, FerryDataType } from './data';
import { ferryData } from './ferryData';
import { ferryTopology } from './ferryTopology';
import { flightData } from './flightData';
import { flightTopology } from './flightTopology';
import { islandData } from './islandData';
import { islandTopology } from './islandTopology';

const sizeDomain = [500, 0];

function isFerryData(datum: DataType): datum is FerryDataType {
    return '@id' in datum;
}

const options: AgChartOptions<DataType> = {
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
            sizeName: 'Population',
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
                    heading: isFerryData(datum) ? datum.int_name : undefined,
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
