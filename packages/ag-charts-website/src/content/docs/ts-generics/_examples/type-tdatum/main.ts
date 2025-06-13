import { AgChartOptions, AgCharts } from 'ag-charts-community';

type MyDatumType = {
    country: string;
    gdp: number;
    region: 'AMER' | 'APAC' | 'EMEA';
};

const options: AgChartOptions<MyDatumType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Country GDP by region (in USD)',
    },
    data: [
        { region: 'AMER', country: 'Brazil', gdp: 2200 },
        { region: 'AMER', country: 'Canada', gdp: 2000 },
        { region: 'AMER', country: 'United States', gdp: 25000 },
        { region: 'APAC', country: 'China', gdp: 17000 },
        { region: 'APAC', country: 'India', gdp: 3400 },
        { region: 'APAC', country: 'Japan', gdp: 5000 },
        { region: 'EMEA', country: 'France', gdp: 3000 },
        { region: 'EMEA', country: 'Germany', gdp: 4000 },
        { region: 'EMEA', country: 'South Africa', gdp: 900 },
        { region: 'EMEA', country: 'United Kingdom', gdp: 3200 },
    ],
    series: [
        {
            type: 'pie',
            angleKey: 'gdp',
            legendItemKey: 'country',
            itemStyler: (params) => {
                switch (params.datum.region) {
                    case 'AMER': return { fill: 'red' };
                    case 'APAC': return { fill: 'blue' };
                    case 'EMEA': return { fill: 'green' };
                    default:
                        // (unreachable code)
                        params.datum.region satisfies never;
                }
            },
        },
    ],
    legend: { position: 'left' },
};

AgCharts.create(options);
