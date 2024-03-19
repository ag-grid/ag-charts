import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'US GDP By State',
    },
    data,
    topology,
    series: [
        {
            type: 'map-marker',
            idKey: 'name',
            labelKey: 'name',
            sizeKey: 'gdp',
            fillOpacity: 1,
            label: {
                color: 'gray',
            },
            size: 5,
            maxSize: 50,
            sizeName: 'GDP',
            tooltip: {
                renderer: ({ datum }) => ({
                    title: datum.name,
                    content: `GDP: ${numberFormatter.format(datum.gdp)}`,
                }),
            },
        },
        {
            type: 'map-shape-background',
            fillOpacity: 0,
            stroke: 'gray',
            strokeOpacity: 0.2,
        },
    ],
};

AgCharts.create(options);

const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    useGrouping: true,
});
