import { AgMarkerShapeFnParams } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

const bar = ({ x, y, path, size }: AgMarkerShapeFnParams) => {
    const halfSize = size / 2;
    path.rect(x - halfSize / 2, y - halfSize, halfSize, size);
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'The Technology Industry',
    },
    padding: {
        left: 40,
        right: 40,
    },
    theme: {
        overrides: {
            common: {
                legend: {
                    item: {
                        marker: {
                            shape: bar,
                            strokeWidth: 0,
                        },
                        line: {
                            strokeWidth: 0,
                        },
                    },
                },
                axes: {
                    'grouped-category': {
                        groupPaddingInner: 0,
                        paddingInner: 0.4,
                    },
                    number: {
                        thickness: 0,
                        gridLine: {
                            enabled: false,
                        },
                        label: {
                            enabled: false,
                        },
                    },
                },
            },
            bar: {
                series: {
                    fillOpacity: 0.4,
                },
            },
            line: {
                series: {
                    marker: {
                        shape: bar,
                        size: 10,
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'location',
            xName: 'Location',
            yKey: 'startups',
            yName: 'Startups',
        },
        {
            type: 'line',
            xKey: 'location',
            xName: 'Location',
            yKey: 'techCompanies',
            yName: 'Tech Companies',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'funding',
            yName: 'Funding',
            fillOpacity: 1,
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'employees',
            yName: 'Employees',
            fillOpacity: 1,
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'researchInstitutions',
            yName: 'Research Institutions',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'ventureCapitalFunds',
            yName: 'Venture Capital Funds',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'incubators',
            yName: 'Incubators',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'coWorkingSpaces',
            yName: 'Co-working Spaces',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'innovationHubs',
            yName: 'Innovation Hubs',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'accelerators',
            yName: 'Accelerators',
        },
    ],
    axes: [
        {
            position: 'left',
            type: 'number',
            keys: ['startups', 'techCompanies'],
        },
        {
            position: 'left',
            type: 'number',
            keys: ['employees'],
        },
        {
            position: 'left',
            type: 'number',
            keys: ['funding'],
            title: {
                text: 'Number of Employees & Funding',
            },
        },
        {
            position: 'right',
            type: 'number',
            keys: [
                'researchInstitutions',
                'incubators',
                'accelerators',
                'ventureCapitalFunds',
                'coWorkingSpaces',
                'innovationHubs',
            ],
            title: {
                text: 'Number of Institutions',
            },
        },
        {
            position: 'top',
            type: 'grouped-category',
        },
    ],
};

AgCharts.create(options);
