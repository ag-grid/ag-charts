import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const tooltip = {
    renderer: ({ datum, xKey, yKey }: AgCartesianSeriesTooltipRendererParams) => {
        const year = datum[xKey].toFixed(0);
        return {
            content: `${year}: ${Math.round(datum[yKey])}`,
        };
    },
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Life Expectancy In the UK',
    },
    subtitle: {
        text: 'Life expectancy from birth (1765 to 2023) &\nNumber of deaths registered in England and Wales (1838 to 2021)',
    },
    footnote: {
        text: 'Source: Office for National Statistics',
    },
    series: [
        {
            type: 'scatter',
            xKey: 'year',
            xName: 'Year',
            yKey: 'lifeExpectancy',
            yName: 'Life Expectancy',
            size: 4,
            label: {
                formatter: ({ xKey, datum }) => {
                    const year = datum[xKey];
                    return year === 2023 || year === 1768 ? `${year}` : '';
                },
            },
            tooltip,
        },
        {
            type: 'scatter',
            xKey: 'year',
            xName: 'Year',
            yKey: 'numberOfDeaths',
            yName: 'Number of Deaths',
            size: 4,
            tooltip,
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            gridLine: {
                enabled: false,
            },
            nice: false,
            min: 1762,
            max: 2030,
        },
        {
            position: 'right',
            type: 'number',
            keys: ['numberOfDeaths'],
            tick: {
                values: [338984, 715246],
            },
            label: {
                formatter: ({ value }) =>
                    `~${Math.round(value).toLocaleString('en-GB', {
                        maximumFractionDigits: 0,
                    })} Deaths`,
            },
            line: {
                width: 1,
            },
        },
        {
            position: 'left',
            type: 'number',
            nice: false,
            min: 25,
            max: 85,
            keys: ['lifeExpectancy'],
            line: {
                width: 1,
            },
            label: {
                formatter: ({ value }) =>
                    `~${Math.round(value).toLocaleString('en-GB', {
                        maximumFractionDigits: 0,
                    })} Years`,
            },
            tick: {
                values: [81.77, 29.22],
            },
        },
    ],
};

AgCharts.create(options);
