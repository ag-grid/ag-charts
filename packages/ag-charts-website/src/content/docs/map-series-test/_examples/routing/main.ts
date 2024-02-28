import { AgChartOptions, AgCharts } from 'ag-charts-community';

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
    ],
};

AgCharts.create(options);
