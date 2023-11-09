import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const numFormatter = new Intl.NumberFormat('en-US');
const usdFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const usdShortOptions: any = { style: 'currency', currency: 'USD', notation: 'compact' };
const usdShortFormatter = new Intl.NumberFormat('en-US', usdShortOptions);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'The GDP of Baltic States',
    },
    subtitle: {
        text: 'Population (Angle) & GDP per Capita (Radius)',
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
                formatter: ({ datum }) => {
                    return usdShortFormatter.format(datum['population'] * datum['gdpPerCapita']);
                },
            },
            tooltip: {
                renderer: ({ datum, color }) => {
                    return [
                        `<div style="background-color: ${color}; padding: 4px 8px; border-top-left-radius: 5px; border-top-right-radius: 5px; font-weight: bold; color: white;">${datum['country']}</div>`,
                        `<div style="padding: 4px 8px"><strong>Population:</strong> ${numFormatter.format(
                            datum['population']
                        )}</div>`,
                        `<div style="padding: 4px 8px"><strong>GDP per Capita:</strong> ${usdFormatter.format(
                            datum['gdpPerCapita']
                        )}</div>`,
                    ].join('\n');
                },
            },
        },
    ],
    legend: {
        enabled: false,
    },
};

AgEnterpriseCharts.create(options);
