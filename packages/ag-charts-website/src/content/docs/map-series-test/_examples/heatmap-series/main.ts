import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';
import { topology } from './topology';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Population of Ireland',
    },
    data,
    series: [
        {
            // @ts-ignore
            type: 'map',
            topology,
            data,
            idKey: 'name',
            colorKey: 'population',
            colorRange: ['#badc58', '#6ab04c'],
        },
    ],
    gradientLegend: {
        enabled: true,
        scale: {
            interval: {
                minSpacing: 1,
                // @ts-ignore
                values: [0, 0.5e6, 1e6],
            },
            label: {
                formatter: ({ value }) => {
                    value = +value;
                    if (value === 0) {
                        return '0';
                    } else if (value < 1e6) {
                        return `${Math.floor(+value / 1e3)}K`;
                    } else {
                        return `${Math.floor(+value / 1e6)}M`;
                    }
                },
            },
        },
    },
};

AgCharts.create(options);
