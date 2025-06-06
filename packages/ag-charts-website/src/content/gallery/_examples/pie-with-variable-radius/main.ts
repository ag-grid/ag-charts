import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const usdShortOptions: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD', notation: 'compact' };
const usdShortFormatter = new Intl.NumberFormat('en-US', usdShortOptions);

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'The GDP of Baltic States',
    },
    subtitle: {
        text: 'Population & GDP per Capita',
    },
    series: [
        {
            data: getData(),
            type: 'pie',
            calloutLabelKey: 'country',
            sectorLabelKey: 'gdpPerCapita',
            angleKey: 'population',
            radiusKey: 'gdpPerCapita',
            sectorLabel: {
                formatter: ({ datum }) => {
                    return usdShortFormatter.format(datum.population * datum.gdpPerCapita);
                },
            },
            tooltip: {
                renderer: ({ datum }) => {
                    return {
                        data: [
                            { label: 'GDP Per Capita', value: `$${datum.gdpPerCapita.toLocaleString()}` },
                            { label: 'Population', value: `${datum.population.toLocaleString()}` },
                        ],
                    };
                },
            },
        },
    ],
    legend: {
        enabled: false,
    },
};

AgCharts.create(options);
