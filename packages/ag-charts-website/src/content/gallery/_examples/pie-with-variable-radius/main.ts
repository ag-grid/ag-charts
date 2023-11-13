import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const usdShortOptions: any = { style: 'currency', currency: 'USD', notation: 'compact' };
const usdShortFormatter = new Intl.NumberFormat('en-US', usdShortOptions);

const options: AgChartOptions = {
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
                    return usdShortFormatter.format(datum['population'] * datum['gdpPerCapita']);
                },
            },
            tooltip: {
                renderer: ({ datum }) => {
                    return {
                        title: `GDP Per Capita: $${datum['gdpPerCapita'].toLocaleString()}`,
                        content: `Population: ${datum['population'].toLocaleString()}`,
                    };
                },
            },
        },
    ],
    legend: {
        enabled: false,
    },
};

AgEnterpriseCharts.create(options);
