import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import { getData } from './data';

const usdShortOptions: any = { style: 'currency', currency: 'USD', notation: 'compact' };
const usdShortFormatter = new Intl.NumberFormat('en-US', usdShortOptions);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'The GDP of Baltic States',
        fontSize: 18,
    },
    subtitle: {
        text: 'Population (Angle) & GDP per Capita (Radius)',
    },
    padding: {
        top: 32,
        right: 20,
        bottom: 32,
        left: 20,
    },
    series: [
        {
            data: getData(),
            type: 'pie',
            calloutLabelKey: 'country',
            sectorLabelKey: 'gdpPerCapita',
            angleKey: 'population',
            radiusKey: 'gdpPerCapita',
            calloutLabel: {
                minAngle: 0,
            },
            sectorLabel: {
                color: 'white',
                fontWeight: 'bold',
                formatter: ({ datum }) => {
                    return usdShortFormatter.format(datum['population'] * datum['gdpPerCapita']);
                },
            },
            calloutLine: {
                strokeWidth: 1,
                colors: ['black'],
            },
            fills: [
                '#fb7451',
                '#f4b944',
                '#49afda',
            ],
            strokeWidth: 0,
            highlightStyle: {
                item: {
                    fillOpacity: 0,
                    stroke: '#535455',
                    strokeWidth: 1,
                },
            },
        },
    ],
    legend: {
        enabled: false,
    },
};

const chart = AgCharts.create(options);
