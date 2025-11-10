import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

// Notable countries to label
const notableCountries = [
    'Singapore',
    'Luxembourg',
    'Costa Rica',
    'United States',
    'Switzerland',
    'Norway',
    'Japan',
    'China',
    'India',
    'Central African Republic',
    'Haiti',
    'Denmark',
    'Finland',
    'Australia',
    'Germany',
    'United Kingdom',
    'Brazil',
    'South Africa',
    'Saudi Arabia',
    'Hong Kong',
    'Ireland',
    'Canada',
    'Mexico',
    'Argentina',
    'Chile',
    'Israel',
    'Czech Republic',
    'Poland',
    'Spain',
    'Italy',
    'Greece',
    'Ukraine',
    'Russia',
    'Turkey',
    'Egypt',
    'Nigeria',
    'Kenya',
    'Tanzania',
    'Botswana',
    'New Zealand',
    'Guatemala',
    'Uruguay',
    'Kosovo',
    'Bulgaria',
    'Iraq',
    'Yemen',
    'Nepal',
    'Mauritius',
    'Macedonia',
    'Slovakia',
];

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'The Wealth-Happiness Paradox',
    },
    subtitle: {
        text: 'GDP per Capita vs Life Satisfaction across 163 countries',
    },
    footnote: {
        text: 'Source: World Happiness Report 2018',
    },
    series: Object.entries(getData()).map(([continent, data]) => {
        return {
            data,
            type: 'scatter',
            title: continent,
            xKey: 'gdpPerCapita',
            xName: 'GDP Per Capita',
            yKey: 'lifeSatisfaction',
            yName: 'Happiness Score',
            labelKey: 'country',
            labelName: 'Country',
            label: {
                enabled: true,
                formatter: ({ value }) => {
                    return notableCountries.includes(value) ? value : '';
                },
            },
            shape: 'star',
            size: 8,
            strokeWidth: 1.5,
            fillOpacity: 0.7,
            tooltip: {
                enabled: true,
                renderer: ({ datum, xKey, yKey }) => {
                    const gdp = datum[xKey as keyof typeof datum] as number;
                    const happiness = datum[yKey as keyof typeof datum] as number;
                    const gdpFormatted = new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        maximumFractionDigits: 0,
                    }).format(gdp);

                    // Calculate regional averages
                    const regionData = data;
                    const avgGdp = regionData.reduce((sum, d: any) => sum + d.gdpPerCapita, 0) / regionData.length;

                    return {
                        title: `${datum.country}`,
                        data: [
                            { label: 'GDP per Capita', value: gdpFormatted },
                            {
                                label: 'Regional Avg',
                                value: new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    maximumFractionDigits: 0,
                                }).format(avgGdp),
                            },
                            { label: 'Happiness Score', value: `${happiness.toFixed(2)}/10` },
                        ],
                    };
                },
            },
        };
    }),
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
            nice: false,
            title: {
                text: 'GDP per Capita (USD)',
                spacing: 10,
            },
            label: {
                formatter: ({ value }) => {
                    if (value >= 1000) {
                        return `$${(value / 1000).toFixed(0)}K`;
                    }
                    return `$${value}`;
                },
            },
            gridLine: {
                style: [
                    {
                        lineDash: [2, 2],
                    },
                ],
            },
            crossLines: [
                {
                    type: 'range',
                    range: [0, 10000],
                    fill: '#ff6b6b',
                    fillOpacity: 0.2,
                    label: {
                        text: 'Low',
                        position: 'inside-bottom-right',
                    },
                },
                {
                    type: 'range',
                    range: [10000, 30000],
                    fill: '#feca57',
                    fillOpacity: 0.2,
                    label: {
                        text: 'Middle',
                        position: 'inside-bottom-right',
                    },
                },
                {
                    type: 'range',
                    range: [30000, 100000],
                    fill: '#48dbfb',
                    fillOpacity: 0.2,
                    label: {
                        text: 'High',
                        position: 'inside-bottom-right',
                    },
                },
            ],
        },
        y: {
            position: 'left',
            type: 'number',
            nice: false,
            min: 2.5,
            max: 8,
            title: {
                text: 'Happiness Score',
            },
            label: {
                formatter: ({ value }) => value.toFixed(1),
            },
            gridLine: {
                style: [
                    {
                        lineDash: [2, 2],
                    },
                ],
            },
            crossLines: [
                {
                    type: 'line',
                    value: 5.4,
                    strokeWidth: 1,
                    strokeOpacity: 0.5,
                    lineDash: [6, 3],
                    label: {
                        text: 'Global Average',
                        position: 'right',
                        padding: 5,
                    },
                },
            ],
        },
    },
    legend: {
        spacing: 10,
        item: {
            marker: {
                size: 10,
                strokeWidth: 2,
            },
        },
    },
    formatter: {
        x: (params) => {
            if (params.type !== 'number') return;
            let fractionDigits = params.fractionDigits ?? 0;
            fractionDigits = Math.max(fractionDigits - 1, 0);
            return `${(params.value / 1000).toFixed(fractionDigits)}K`;
        },
    },
};

AgCharts.create(options);
