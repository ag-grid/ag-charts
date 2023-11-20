import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const gdpFormatter = new Intl.NumberFormat('en-US', {
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            sizeKey: 'gdp',
            tooltip: {
                renderer: (params) => {
                    const { gdp } = params.datum;
                    if (gdp != null) {
                        const gdpFormat = gdpFormatter.format(gdp);

                        return {
                            content: `${gdpFormat} trillion USD`,
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
