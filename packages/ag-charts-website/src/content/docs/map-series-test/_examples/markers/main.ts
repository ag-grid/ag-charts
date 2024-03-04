import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { backgroundTopology } from './backgroundTopology';
import { data } from './data';
import { topology } from './topology';

const numberFormatter = new Intl.NumberFormat('en-US', {
    useGrouping: true,
});

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Population of UK Cities',
    },
    data,
    series: [
        {
            // @ts-ignore
            type: 'map',
            topology,
            idKey: 'name',
            sizeKey: 'population',
            background: {
                topology: backgroundTopology,
                id: 'United Kingdom',
                fillOpacity: 0.2,
            },
            marker: {
                size: 3,
                maxSize: 30,
                fillOpacity: 0.5,
            },
            tooltip: {
                // @ts-ignore
                renderer: ({ datum, title }) => ({
                    title,
                    content: `Population: ${numberFormatter.format(datum?.population)}`,
                }),
            },
        },
    ],
};

AgCharts.create(options);
