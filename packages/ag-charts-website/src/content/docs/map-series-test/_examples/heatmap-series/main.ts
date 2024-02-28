import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

const numberFormatter = new Intl.NumberFormat('en-US', {
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
            data,
            idKey: 'name',
            labelKey: 'code',
            colorKey: 'population',
            stroke: 'white',
            strokeWidth: 1,
            label: {
                enabled: true,
            },
            tooltip: {
                renderer: ({ datum, title }) => ({
                    title,
                    content: `Population: ${numberFormatter.format(datum?.population)}`,
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
                values: [0, 10e6, 20e6, 30e6, 40e6],
            },
            label: {
                fontSize: 9,
                formatter: ({ value }) => `${Math.floor(+value / 1e6)}M`,
            },
        },
    },
};

AgCharts.create(options);
