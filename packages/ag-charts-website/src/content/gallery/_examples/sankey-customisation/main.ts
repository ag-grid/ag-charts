// Source: https://www.greencarcongress.com/2005/02/doe_cofunds_12_.html
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Combustion Engine Efficiency',
    },
    data: [
        { from: 'Chemical Energy', to: 'Losses', conversion: 0.75 },
        { from: 'Losses', to: 'Exhaust Gas', conversion: 0.4 },
        { from: 'Losses', to: 'Coolant', conversion: 0.3 },
        { from: 'Losses', to: 'Friction', conversion: 0.05 },
        { from: 'Chemical Energy', to: 'Kinetic Energy', conversion: 0.25 },
    ],
    series: [
        {
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'conversion',
            sizeName: 'Conversion',
            node: {
                width: 40,
                strokeWidth: 1,
                strokeOpacity: 0.6,
            },
            link: {
                fill: '#888',
                fillOpacity: 0.1,
                stroke: '#888',
                strokeOpacity: 0.5,
                strokeWidth: 1,
                lineDash: [0.5, 1.5],
            },
            label: {
                fontWeight: 'bold',
                color: '#888',
            },
        },
    ],
};

AgCharts.create(options);
