import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    useGrouping: true,
});

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Population of America',
    },
    data,
    series: [
        {
            // @ts-ignore
            type: 'map',
            topology,
            idKey: 'name',
            labelKey: 'code',
            colorKey: 'gdp',
            stroke: 'white',
            strokeWidth: 1,
            label: {
                enabled: true,
                fontWeight: 'bold',
            },
            tooltip: {
                // @ts-ignore
                renderer: ({ datum, title }) => ({
                    title,
                    content: `GDP: ${numberFormatter.format(datum?.gdp)}`,
                }),
            },
        },
    ],
    gradientLegend: {
        enabled: true,
        scale: {
            interval: {
                minSpacing: 1,
                // @ts-ignore
                values: [0, 1e6, 2e6, 3e6, 4e6],
            },
            label: {
                fontSize: 9,
                formatter: ({ value }) => `$${Math.floor(+value / 1e6)}M`,
            },
        },
    },
};

AgCharts.create(options);
