import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const gdpFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const percentageFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    signDisplay: 'always',
});

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            sizeKey: 'gdp',
            colorKey: 'gdpChange',
            colorRange: ['rgb(63, 145, 79)', 'rgb(253, 149, 63)'],
            tooltip: {
                renderer: (params) => {
                    const { gdp, gdpChange } = params.datum;
                    if (gdp != null && gdpChange != null) {
                        const gdpFormat = gdpFormatter.format(gdp);
                        const gdpChangeFormat = percentageFormatter.format(gdpChange);

                        return {
                            content: `${gdpFormat} trillion USD (${gdpChangeFormat} since 2023)`,
                        };
                    } else {
                        return {};
                    }
                },
            },
        },
    ],
    title: {
        text: 'Top 10 countries by GDP',
    },
    subtitle: {
        text: '2023',
    },
};

AgCharts.create(options);
