import { AgMarkerShapeFnParams } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, ContextMenuModule } from 'ag-charts-enterprise';

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
                        line: {
                            enabled: true,
                        },
                        tick: {
                            enabled: true,
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
            type: 'scatter',
            xKey: 'location',
            xName: 'Location',
            yKey: 'funding',
            yName: 'Funding',
            yKeyAxis: 'yTertiary',
            fillOpacity: 1,
        },
        {
            type: 'scatter',
            xKey: 'location',
            xName: 'Location',
            yKey: 'employees',
            yName: 'Employees',
            yKeyAxis: 'ySecondary',
            fillOpacity: 1,
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'researchInstitutions',
            yName: 'Research Institutions',
            yKeyAxis: 'yQuaternary',
        },
    ],
    axes: {
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Startups and Tech Companies',
            },
        },
        ySecondary: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Number of Employees',
            },
        },
        yTertiary: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Funding',
            },
        },
        yQuaternary: {
            position: 'right',
            type: 'number',
            title: {
                text: 'Number of Institutions',
            },
        },
        x: {
            position: 'top',
            type: 'grouped-category',
        },
    },
    annotations: {
        enabled: true,
    },
};

AgCharts.create(options);
