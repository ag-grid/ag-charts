import { AgCharts, AgPieSeriesOptions, AgPolarChartOptions } from 'ag-charts-enterprise';
import { PieSeriesModule, ModuleRegistry } from 'ag-charts-community';

import { DataType, getData } from './data';


ModuleRegistry.registerModules([PieSeriesModule]);
const usdShortOptions: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD', notation: 'compact' };
const usdShortFormatter = new Intl.NumberFormat('en-US', usdShortOptions);
const usdFullFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});

// Calculate total GDP for percentage calculations
const data = getData();
const totalGDP = data.reduce((sum, d) => sum + d.population * d.gdpPerCapita, 0);

const options: AgPolarChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Baltic States Economic Comparison',
    },
    subtitle: {
        text: 'Angle: Population • Radius: GDP per Capita',
    },
    series: [
        {
            data: data,
            type: 'pie',
            calloutLabelKey: 'country',
            sectorLabelKey: 'gdpPerCapita',
            angleKey: 'population',
            radiusKey: 'gdpPerCapita',
            sectorLabel: {
                formatter: ({ datum }) => {
                    const gdp = datum.population * datum.gdpPerCapita;
                    const percentage = ((gdp / totalGDP) * 100).toFixed(0);
                    return `${usdShortFormatter.format(gdp)}\n(${percentage}%)`;
                },
            },
            strokeWidth: 2,
            tooltip: {
                renderer: ({ datum }) => {
                    return {
                        title: datum.country,
                        data: [
                            { label: 'GDP Per Capita', value: usdFullFormatter.format(datum.gdpPerCapita) },
                            { label: 'Population', value: datum.population.toLocaleString('en-US') },
                        ],
                    };
                },
            },
        } as AgPieSeriesOptions<DataType>,
    ],
    legend: {
        enabled: false,
    },
};

AgCharts.create(options);
