import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { cityData } from './cityData';
import { cityTopology } from './cityTopology';
import { routeTopology } from './routeTopology';
import { topology } from './topology';

const data = topology.features.map((t) => {
    const { name } = t.properties;
    return { name };
});

const routeData = routeTopology.features.map((t) => {
    const { name } = t.properties;
    return { name };
});

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            // @ts-ignore
            type: 'map',
            topology,
            data: data,
            idKey: 'name',
            fill: '#badc58',
        },
        {
            // @ts-ignore
            type: 'map',
            topology: routeTopology,
            data: routeData,
            idKey: 'name',
            stroke: '#4834d4',
            strokeWidth: 5,
        },
        {
            // @ts-ignore
            type: 'map',
            topology: cityTopology,
            data: cityData,
            idKey: 'name',
            labelKey: 'name',
            sizeKey: 'population',
            sizeName: 'Population',
            label: {
                color: 'white',
                fontSize: 8,
            },
            marker: {
                enabled: true,
                fill: '#ff7979',
                fillOpacity: 0.5,
                stroke: '#eb4d4b',
                strokeWidth: 1,
                shape: 'circle',
                size: 48,
                maxSize: 72,
            },
        },
    ],
};

AgCharts.create(options);
