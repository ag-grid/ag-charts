// Source: https://www.nationalgrideso.com/data-portal
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'UK Power Generation',
    },
    subtitle: {
        text: '2023',
    },
    data: [
        { from: 'Wind', to: 'Renewables', size: 79 },
        { from: 'Nuclear', to: 'Renewables', size: 38 },
        { from: 'Biomass', to: 'Renewables', size: 14 },
        { from: 'Solar', to: 'Renewables', size: 13 },
        { from: 'Hydro', to: 'Renewables', size: 3 },
        { from: 'Natural Gas', to: 'Fossil Fuels', size: 86 },
        { from: 'Coal', to: 'Fossil Fuels', size: 3 },
        { from: 'Imports', to: 'Total', size: 33 },
        { from: 'Fossil Fuels', to: 'Total', size: 89 },
        { from: 'Renewables', to: 'Total', size: 147 },
    ],
    series: [
        {
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            sizeName: 'Total (GWh)',
            node: {
                fill: '#34495e',
                stroke: '#2c3e50',
                strokeWidth: 2,
            },
        },
    ],
};

AgCharts.create(options);
