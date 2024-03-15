import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'GDP by State',
    },
    data,
    topology,
    series: [
        {
            type: 'map-shape',
            idKey: 'name',
            colorKey: 'gdp',
            tooltip: {
                renderer: ({ datum, title }) => ({
                    title: datum.name,
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

const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    useGrouping: true,
});
