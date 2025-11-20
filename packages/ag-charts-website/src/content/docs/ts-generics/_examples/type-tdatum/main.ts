import { AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
type MyDatumType = {
    country: string;
    gdp: number;
    region: 'AMER' | 'APAC' | 'EMEA';
};

function unreachable(_arg: never): never {
    throw new Error();
}

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
            type: 'bar',
            yKey: 'gdp',
            xKey: 'country',
            itemStyler: (params) => {
                switch (params.datum.region) {
                    case 'AMER':
                        return { fill: 'red' };
                    case 'APAC':
                        return { fill: 'blue' };
                    case 'EMEA':
                        return { fill: 'green' };
                    default:
                        unreachable(params.datum.region);
                }
            },
        },
    ],
};

AgCharts.create(options);
