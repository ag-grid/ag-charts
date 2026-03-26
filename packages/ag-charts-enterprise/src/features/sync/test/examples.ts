import type { AgCartesianChartOptions } from 'ag-charts-types';

export const historicalData = [
    {
        year: 2015,
        'Offshore wind': 1411,
        'Plant biomass': 3855,
        'Landfill gas': 1542,
    },
    {
        year: 2017,
        'Offshore wind': 1798,
        'Plant biomass': 4206,
        'Landfill gas': 1405,
    },
    {
        year: 2019,
        'Offshore wind': 2281,
        'Plant biomass': 4898,
        'Landfill gas': 1284,
    },
];
export const currentData = [
    {
        year: 2021,
        'Offshore wind': 3053,
        'Plant biomass': 5990,
        'Landfill gas': 791,
    },
];

const commonOptions: AgCartesianChartOptions = {
    sync: {
        axes: 'y',
        nodeInteraction: false,
    },
    title: {
        text: 'Renewable Fuel Sources',
    },
    axes: {
        y: {
            type: 'number',
            position: 'left',
            crosshair: { enabled: false },
        },
        x: {
            position: 'bottom',
            type: 'category',
            crosshair: { enabled: false },
            label: {
                autoRotate: false,
            },
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Offshore wind',
            yName: 'Offshore Wind',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Landfill gas',
            yName: 'Landfill Gas',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Plant biomass',
            yName: 'Plant Biomass',
        },
    ],
};

export const BAR_SHARED_Y_AXIS = [
    {
        ...commonOptions,
        subtitle: {
            text: 'Historical Data',
        },
        data: historicalData,
    },
    {
        ...commonOptions,
        subtitle: {
            text: 'Current Data',
        },
        data: currentData,
    },
];
