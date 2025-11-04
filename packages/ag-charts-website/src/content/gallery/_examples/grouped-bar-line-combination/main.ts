import { AgCartesianChartOptions, AgCharts, AgMarkerShapeFnParams } from 'ag-charts-enterprise';

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
        text: 'Global Technology Ecosystem Overview',
    },
    subtitle: {
        text: 'Regional comparison of tech infrastructure and investment metrics',
    },
    tooltip: {
        enabled: true,
        mode: 'shared',
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    theme: {
        overrides: {
            common: {
                legend: {
                    position: 'bottom',
                    spacing: 40,
                    item: {
                        marker: {
                            size: 12,
                            shape: bar,
                        },
                    },
                },
                axes: {
                    'grouped-category': {
                        groupPaddingInner: 0.2,
                        paddingInner: 0.3,
                        label: {
                            //formatter is used here for the series tooltip
                            formatter: (params) => {
                                const parts = params.value;
                                if (Array.isArray(parts) && parts.length === 3) {
                                    // Display all parts: Continent, Country, City
                                    return `${parts[2]}, ${parts[1]}`;
                                }
                                return String(params.value);
                            },
                        },
                    },
                    number: {
                        gridLine: {
                            style: [
                                {
                                    strokeWidth: 1,
                                    lineDash: [2, 2],
                                },
                                {
                                    strokeWidth: 0,
                                },
                            ],
                        },
                        label: {
                            formatter: (params) => {
                                const value = params.value;
                                if (value >= 1000000) {
                                    return `${(value / 1000000).toFixed(1)}M`;
                                } else if (value >= 1000) {
                                    return `${(value / 1000).toFixed(0)}K`;
                                }
                                return value.toFixed(0);
                            },
                        },
                    },
                },
            },
            bar: {
                series: {
                    fillOpacity: 0.85,
                },
            },
            line: {
                series: {
                    strokeWidth: 3,
                    marker: {
                        enabled: true,
                        size: 7,
                        strokeWidth: 2,
                        shape: bar,
                    },
                    highlight: {
                        highlightedItem: {
                            strokeWidth: 4,
                        },
                    },
                },
            },
        },
    },
    series: [
        // Bar series - Infrastructure metrics
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
            yKey: 'incubators',
            yName: 'Incubators',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'accelerators',
            yName: 'Accelerators',
        },
        {
            type: 'bar',
            xKey: 'location',
            xName: 'Location',
            yKey: 'coWorkingSpaces',
            yName: 'Co-working Spaces',
        },
        // Line series - Growth metrics
        {
            type: 'line',
            xKey: 'location',
            xName: 'Location',
            yKey: 'startups',
            yName: 'Startups (Count)',
            yKeyAxis: 'ySecondary',
        },
        {
            type: 'line',
            xKey: 'location',
            xName: 'Location',
            yKey: 'funding',
            yName: 'Funding ($M)',
            yKeyAxis: 'ySecondary',
        },
    ],
    axes: {
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Infrastructure Count',
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
        ySecondary: {
            position: 'right',
            type: 'number',
            title: {
                text: 'Startups & Funding',
            },
            min: 0,
            label: {
                formatter: (params) => {
                    const value = params.value;
                    if (value >= 10000) {
                        return `${(value / 1000).toFixed(0)}K`;
                    }
                    return value.toFixed(0);
                },
            },
        },
        x: {
            position: 'bottom',
            type: 'grouped-category',
            bandHighlight: {
                enabled: true,
            },
        },
    },
    legend: {
        item: {
            paddingX: 12,
            paddingY: 8,
        },
    },
};

AgCharts.create(options);
