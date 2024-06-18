import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    useGrouping: true,
    maximumFractionDigits: 0,
});

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'GDP of American States',
    },
    data,
    topology,
    series: [
        {
            type: 'map-shape',
            idKey: 'name',
            colorKey: 'gdp',
            labelKey: 'code',
            tooltip: {
                renderer: ({ datum, title }) => ({
                    title,
                    content: `GDP: ${numberFormatter.format(datum.gdp)} million`,
                }),
            },
        },
    ],
    gradientLegend: {
        enabled: true,
        scale: {
            interval: {
                minSpacing: 1,
                values: [0, 1e6, 2e6, 3e6, 4e6],
            },
            label: {
                fontSize: 9,
                formatter: ({ value }) => `$${Math.floor(+value / 1e6)}T`,
            },
        },
    },
};

AgCharts.create(options);
