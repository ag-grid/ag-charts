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
            colorName: 'GDP',
            labelKey: 'code',
            labelName: 'State Code',
        },
    ],
    gradientLegend: {
        enabled: true,
        scale: {
            label: {
                fontSize: 9,
            },
        },
    },
    formatter: {
        color: (params) => {
            const value = params.value as number;
            console.log(params);
            return params.source === 'tooltip'
                ? `${numberFormatter.format(value)} million`
                : `$${Math.floor(value / 1e6)}T`;
        },
    },
};

AgCharts.create(options);
